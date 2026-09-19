import os
import uuid
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.db_models import (
    CorrectiveAction, Inspection, Machine, MachineParameter, Alert
)
from app.services.risk_service import risk_engine

class CorrectiveActionService:
    """
    Manages the closed-loop Corrective Action lifecycle:
    - Recommended / Open
    - In Progress (captures BEFORE condition snapshot)
    - Completed (syncs the corrective action to the virtual factory and records returned telemetry)
    - Verified (linked to reinspection result)
    """

    def _get_machine_snapshot(self, db: Session, machine_id: str) -> Dict[str, Any]:
        """Captures machine parameters, risk level, and defect rate."""
        machine = db.query(Machine).filter(Machine.id == machine_id).first()
        latest_param = db.query(MachineParameter).filter(
            MachineParameter.machine_id == machine_id
        ).order_by(MachineParameter.timestamp.desc()).first()

        risk_res = risk_engine.calculate_machine_risk(db, machine_id)

        # Defect rate calculation
        total = db.query(Inspection).filter(Inspection.machine_id == machine_id).count()
        defective = db.query(Inspection).filter(
            Inspection.machine_id == machine_id,
            Inspection.status == "DEFECTIVE"
        ).count()
        defect_rate = round((defective / float(total) * 100), 2) if total > 0 else 0.0

        return {
            "machine_id": machine_id,
            "machine_name": machine.machine_name if machine else f"Station {machine_id}",
            "machine_status": machine.status if machine else "NORMAL",
            "temperature": latest_param.temperature if latest_param else None,
            "vibration": latest_param.vibration if latest_param else None,
            "pressure": latest_param.pressure if latest_param else None,
            "speed": latest_param.speed if latest_param else None,
            "risk_score": risk_res.get("risk_score", 15),
            "risk_level": risk_res.get("risk_level", "LOW"),
            "defect_rate": defect_rate,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

    def _generate_recommended_actions(self, probable_factor: Optional[str], machine_id: str) -> List[str]:
        factor_lower = (probable_factor or "").lower()
        if "vibration" in factor_lower:
            return [
                f"Inspect {machine_id} vibration dampeners and spindle mountings",
                "Check tool chuck wear and mechanical alignment",
                "Perform dynamic spindle balancing adjustment",
                "Verify affected batch tolerances and reinspect subsequent products"
            ]
        elif "thermal" in factor_lower or "temp" in factor_lower:
            return [
                f"Inspect {machine_id} coolant flow rate and heat exchanger status",
                "Verify spindle lubrication and temperature sensor calibration",
                "Check for friction anomalies along linear guide rails",
                "Reinspect subsequent products after thermal stabilization"
            ]
        else:
            return [
                f"Inspect {machine_id} mechanical tooling and clamp pressure",
                "Check workpiece orientation and guide pins",
                "Verify station calibration against quality baseline",
                "Reinspect subsequent product samples"
            ]

    def create_action(
        self,
        db: Session,
        inspection_id: str,
        action_description: Optional[str] = None,
        priority: str = "HIGH",
        assigned_to: str = "Operator / Maintenance Tech",
        machine_id: Optional[str] = None,
        probable_factor: Optional[str] = None,
        recommended_actions: Optional[List[str]] = None,
        notes: Optional[str] = None
    ) -> CorrectiveAction:
        insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not insp and not machine_id:
            raise ValueError(f"Inspection {inspection_id} not found")
        m_id = machine_id or insp.machine_id

        # Snapshot before conditions
        before_snap = self._get_machine_snapshot(db, m_id)

        if not recommended_actions:
            recommended_actions = self._generate_recommended_actions(probable_factor, m_id)

        desc = action_description or f"Corrective Action: Inspect and recalibrate {m_id} following defect notification"
        act_id = f"CA-2026-{uuid.uuid4().hex[:4].upper()}"

        action = CorrectiveAction(
            id=act_id,
            inspection_id=inspection_id,
            machine_id=m_id,
            probable_factor=probable_factor or "Elevated Vibration / Tool Wear",
            action_description=desc,
            recommended_actions=recommended_actions,
            priority=priority,
            status="Open",
            assigned_to=assigned_to,
            notes=notes,
            created_at=datetime.datetime.now(datetime.timezone.utc),
            before_snapshot=before_snap
        )
        db.add(action)
        db.commit()
        db.refresh(action)
        return action

    def start_action(
        self,
        db: Session,
        action_id: str,
        notes: Optional[str] = None
    ) -> CorrectiveAction:
        action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
        if not action:
            raise ValueError(f"Corrective action {action_id} not found")

        action.status = "In Progress"
        action.started_at = datetime.datetime.now(datetime.timezone.utc)
        if notes:
            action.notes = f"{action.notes}\n{notes}".strip() if action.notes else notes

        # Update snapshot to current before state if not set
        if not action.before_snapshot:
            if not action.machine_id:
                raise ValueError(f"Corrective action {action_id} has no machine association")
            action.before_snapshot = self._get_machine_snapshot(db, action.machine_id)

        db.commit()
        db.refresh(action)
        return action

    def complete_action(
        self,
        db: Session,
        action_id: str,
        notes: Optional[str] = None
    ) -> CorrectiveAction:
        action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
        if not action:
            raise ValueError(f"Corrective action {action_id} not found")

        if not action.machine_id:
            raise ValueError(f"Corrective action {action_id} has no machine association")
        m_id = action.machine_id
        machine = db.query(Machine).filter(Machine.id == m_id).first()
        if not machine:
            raise ValueError(f"Machine {m_id} not found")
        now = datetime.datetime.now(datetime.timezone.utc)

        # Apply maintenance to the connected Virtual Factory first. We only persist
        # telemetry returned by that node; never manufacture a post-maintenance reading.
        laptop2_url = os.environ.get("LAPTOP2_URL", "http://127.0.0.1:8001").strip().rstrip("/")
        sync_success = False
        telemetry = None
        telemetry_data = {}
        sync_error = None
        try:
            import urllib.request
            import json
            req_data = json.dumps({
                "machine_id": m_id,
                "action_type": "dampen_vibration",
                "target_vibration": 2.7,
                "notes": "Corrective maintenance applied via Laptop 1"
            }).encode("utf-8")
            req = urllib.request.Request(
                f"{laptop2_url}/api/factory/corrective-action",
                data=req_data,
                headers={"Content-Type": "application/json", "User-Agent": "ZeroDefectX/3.0"}
            )
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                response_data = json.loads(resp.read().decode("utf-8"))
                sync_success = bool(response_data.get("success"))

            if sync_success:
                telemetry_req = urllib.request.Request(
                    f"{laptop2_url}/api/telemetry?machine_id={m_id}",
                    headers={"User-Agent": "ZeroDefectX/3.0"}
                )
                with urllib.request.urlopen(telemetry_req, timeout=1.5) as resp:
                    telemetry = json.loads(resp.read().decode("utf-8"))
        except Exception as err:
            sync_error = str(err)

        if sync_success and telemetry:
            telemetry_data = telemetry.get("telemetry", telemetry)
            required = ("temperature", "vibration", "pressure", "speed")
            if not all(telemetry_data.get(key) is not None for key in required):
                sync_success = False
                sync_error = "Virtual Factory returned incomplete telemetry"
            else:
                db.add(MachineParameter(
                    machine_id=m_id,
                    timestamp=now,
                    temperature=float(telemetry_data["temperature"]),
                    vibration=float(telemetry_data["vibration"]),
                    pressure=float(telemetry_data["pressure"]),
                    speed=int(telemetry_data["speed"])
                ))
                machine.status = telemetry_data.get("status", machine.status)
                db.flush()

        # Capture the actual state after the attempted action. If the factory is offline,
        # the snapshot retains the latest measured DB values and verification remains pending.
        after_snap = self._get_machine_snapshot(db, m_id)
        after_snap["telemetry_source"] = "VIRTUAL FACTORY" if sync_success else "NO FRESH TELEMETRY"
        if sync_error:
            after_snap["telemetry_error"] = sync_error

        action.status = "Completed"
        action.completed_at = now
        action.after_snapshot = after_snap
        if notes:
            action.notes = f"{action.notes}\n{notes}".strip() if action.notes else notes
        if not sync_success:
            action.notes = f"{action.notes}\nPost-maintenance telemetry unavailable; verification requires a fresh machine reading.".strip()

        # Only resolve machine alarms when the connected factory confirmed a normal state.
        if sync_success and telemetry_data.get("status", "").upper() == "NORMAL":
            alerts = db.query(Alert).filter(
                Alert.machine_id == m_id,
                Alert.status == "ACTIVE"
            ).all()
            for alt in alerts:
                alt.status = "RESOLVED"
                alt.resolved_at = now

        db.commit()
        db.refresh(action)
        return action

corrective_engine = CorrectiveActionService()

