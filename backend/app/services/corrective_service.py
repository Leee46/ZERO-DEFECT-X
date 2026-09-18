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
    - Completed (creates NEW MachineParameter record with deterministic adjustment)
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
        m_id = machine_id or (insp.machine_id if insp else "M03")

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
            created_at=datetime.datetime.utcnow(),
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
        action.started_at = datetime.datetime.utcnow()
        if notes:
            action.notes = f"{action.notes}\n{notes}".strip() if action.notes else notes

        # Update snapshot to current before state if not set
        if not action.before_snapshot:
            action.before_snapshot = self._get_machine_snapshot(db, action.machine_id or "M03")

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

        m_id = action.machine_id or "M03"
        machine = db.query(Machine).filter(Machine.id == m_id).first()
        now = datetime.datetime.utcnow()

        # Deterministic machine condition update:
        # Instead of modifying historical records, create a NEW MachineParameter record
        # M03 vibration drops from elevated (e.g. 4.8 mm/s) to normal baseline (2.7 mm/s)
        # Temperature stabilizes to normal range (68.0 °C)
        new_param = MachineParameter(
            machine_id=m_id,
            timestamp=now,
            temperature=68.0,
            vibration=2.7,
            pressure=6.0,
            speed=1500
        )
        db.add(new_param)

        # Update machine status to NORMAL
        if machine:
            machine.status = "NORMAL"

        # Resolve any active vibration alerts on this machine
        alerts = db.query(Alert).filter(
            Alert.machine_id == m_id,
            Alert.status == "ACTIVE"
        ).all()
        for alt in alerts:
            alt.status = "RESOLVED"
            alt.resolved_at = now

        db.flush()

        # Capture AFTER snapshot
        after_snap = self._get_machine_snapshot(db, m_id)

        action.status = "Completed"
        action.completed_at = now
        action.after_snapshot = after_snap
        if notes:
            action.notes = f"{action.notes}\n{notes}".strip() if action.notes else notes

        # Notify Laptop 2 Virtual Factory API if reachable
        laptop2_url = os.environ.get("LAPTOP2_URL", "http://127.0.0.1:8000").strip().rstrip("/")
        try:
            import urllib.request
            import json
            req_data = json.dumps({
                "machine_id": m_id,
                "action_type": "dampen_vibration",
                "target_vibration": 2.7,
                "notes": "Corrective maintenance applied via Laptop 1"
            }).encode('utf-8')
            req = urllib.request.Request(
                f"{laptop2_url}/api/factory/corrective-action",
                data=req_data,
                headers={"Content-Type": "application/json", "User-Agent": "ZeroDefectX/3.0"}
            )
            urllib.request.urlopen(req, timeout=1.5)
        except Exception as err:
            print(f"[Corrective Action Sync] Could not notify Laptop 2 Virtual Factory at {laptop2_url}: {err}")

        db.commit()
        db.refresh(action)
        return action

corrective_engine = CorrectiveActionService()

