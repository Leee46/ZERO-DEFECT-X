import uuid
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.db_models import (
    Reinspection, CorrectiveAction, Inspection, Machine, MachineParameter
)
from app.services.risk_service import risk_engine

class VerificationService:
    """
    Deterministic Verification Engine for Phase 6:
    Validates closed-loop feedback from Corrective Action to Reinspection.
    """

    def evaluate_verification(
        self,
        db: Session,
        reinsp_status: str,
        corrective_action: Optional[CorrectiveAction],
        machine_id: str
    ) -> Dict[str, Any]:
        """
        Deterministic verification logic:
        VERIFIED when:
        1. Corrective action is completed.
        2. Reinspection result is PASS / PASSED.
        3. Relevant production condition (e.g. vibration <= 3.0 mm/s) has normalized.
        Otherwise: REQUIRES FURTHER INVESTIGATION.
        """
        # Fetch latest machine parameter
        latest_param = db.query(MachineParameter).filter(
            MachineParameter.machine_id == machine_id
        ).order_by(MachineParameter.timestamp.desc()).first()

        if latest_param is None:
            return {
                "verification_status": "REQUIRES FURTHER INVESTIGATION",
                "verification_message": "Verification cannot be confirmed because no post-maintenance machine telemetry is available.",
                "follow_up_recommendation": f"Capture a fresh machine parameter reading for {machine_id} and repeat verification.",
                "is_verified": False
            }

        vibration = latest_param.vibration
        temp = latest_param.temperature

        is_action_completed = corrective_action is not None and corrective_action.status in ["Completed", "Verified"]
        is_vision_passed = (reinsp_status or "").upper() in ["PASSED", "PASS"]
        is_condition_normalized = vibration <= 3.2 and temp <= 70.0

        if is_action_completed and is_vision_passed and is_condition_normalized:
            return {
                "verification_status": "VERIFIED",
                "verification_message": "Corrective action was followed by a successful reinspection. Machine parameters returned to configured normal range.",
                "follow_up_recommendation": f"Continue monitoring {machine_id}. Secondary inspection window open.",
                "is_verified": True
            }
        else:
            reasons = []
            if not is_action_completed:
                reasons.append("Corrective action has not been completed")
            if not is_vision_passed:
                reasons.append("Reinspection vision analysis detected defects")
            if not is_condition_normalized:
                reasons.append(f"Machine vibration ({vibration} mm/s) remains elevated above 3.2 mm/s threshold")

            return {
                "verification_status": "REQUIRES FURTHER INVESTIGATION",
                "verification_message": f"Verification unconfirmed: {'; '.join(reasons)}.",
                "follow_up_recommendation": f"Perform in-depth mechanical diagnostics on {machine_id} and audit batch tolerances.",
                "is_verified": False
            }

    def create_reinspection_record(
        self,
        db: Session,
        original_inspection_id: str,
        corrective_action_id: Optional[str] = None,
        status: str = "PASSED",
        overall_confidence: float = 0.95,
        defects: Optional[list] = None,
        image_path: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Reinspection:
        orig_insp = db.query(Inspection).filter(Inspection.id == original_inspection_id).first()
        ca = db.query(CorrectiveAction).filter(CorrectiveAction.id == corrective_action_id).first() if corrective_action_id else None

        machine_id = orig_insp.machine_id if orig_insp else (ca.machine_id if ca else "M03")
        product_id = orig_insp.product_id if orig_insp else "P1042-087"
        batch_id = orig_insp.batch_id if orig_insp else "B1042"

        # Evaluate verification deterministically
        verif_eval = self.evaluate_verification(db, status, ca, machine_id)

        # Build BEFORE condition from the captured action snapshot.
        before_snapshot = ca.before_snapshot if ca and ca.before_snapshot else {}
        before_vibe = before_snapshot.get("vibration")
        before_temp = before_snapshot.get("temperature")
        before_risk = before_snapshot.get("risk_level", "UNKNOWN")

        orig_defect = orig_insp.defects[0].defect_type if orig_insp and orig_insp.defects else "Scratch"
        orig_severity = orig_insp.defects[0].severity if orig_insp and orig_insp.defects else "Medium"

        before_cond = {
            "vibration": f"{before_vibe} mm/s" if before_vibe is not None else "N/A",
            "temperature": f"{before_temp}°C" if before_temp is not None else "N/A",
            "risk": before_risk,
            "defect": orig_defect,
            "severity": orig_severity,
            "status": orig_insp.status if orig_insp else "DEFECTIVE"
        }

        # Build AFTER condition
        latest_param = db.query(MachineParameter).filter(
            MachineParameter.machine_id == machine_id
        ).order_by(MachineParameter.timestamp.desc()).first()

        risk_res = risk_engine.calculate_machine_risk(db, machine_id)

        after_cond = {
            "vibration": f"{latest_param.vibration} mm/s" if latest_param else "N/A",
            "temperature": f"{latest_param.temperature}°C" if latest_param else "N/A",
            "risk": risk_res.get("risk_level", "NORMAL"),
            "defect": defects[0].get("defect_type", "None") if defects else "None",
            "severity": defects[0].get("severity", "None") if defects else "None",
            "status": status
        }

        re_id = f"REINSP-2026-{uuid.uuid4().hex[:4].upper()}"
        reinspection = Reinspection(
            id=re_id,
            original_inspection_id=original_inspection_id,
            corrective_action_id=corrective_action_id,
            product_id=product_id,
            batch_id=batch_id,
            machine_id=machine_id,
            image_path=image_path,
            reinspection_time=datetime.datetime.now(datetime.timezone.utc),
            status=status,
            overall_confidence=overall_confidence,
            defect_detected=(status.upper() != "PASSED"),
            defects=defects or [],
            verification_status=verif_eval["verification_status"],
            verification_notes=f"{verif_eval['verification_message']} | Follow-up: {verif_eval['follow_up_recommendation']}",
            before_condition=before_cond,
            after_condition=after_cond,
            notes=notes
        )

        # If verified, update the corrective action status to 'Verified'
        if ca and verif_eval["is_verified"]:
            ca.status = "Verified"

        db.add(reinspection)
        db.commit()
        db.refresh(reinspection)
        return reinspection

verification_engine = VerificationService()
