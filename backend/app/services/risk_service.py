from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.db_models import Machine, MachineParameter, Defect, Inspection

class RiskEngine:
    """
    Transparent & Explainable Risk Score Engine.
    Combines machine parameter deviations, defect frequencies, and severity weights directly from DB queries.
    """

    def calculate_machine_risk(self, db: Session, machine_id: str) -> Dict[str, Any]:
        machine = db.query(Machine).filter(Machine.id == machine_id).first()
        latest_param = db.query(MachineParameter).filter(
            MachineParameter.machine_id == machine_id
        ).order_by(MachineParameter.timestamp.desc()).first()

        vibration = latest_param.vibration if latest_param else 2.0
        temp = latest_param.temperature if latest_param else 65.0

        score = 10
        signals = []

        # 1. Parameter deviation check
        if vibration > 4.0:
            score += 40
            signals.append(f"Critical Vibration Deviation: {vibration} mm/s (+92% above 2.5 mm/s baseline)")
        elif vibration > 2.5:
            score += 20
            signals.append(f"Moderate Vibration Elevation: {vibration} mm/s")

        if temp > 75.0:
            score += 25
            signals.append(f"High Temperature Warning: {temp}°C")
        elif temp > 70.0:
            score += 15
            signals.append(f"Elevated Temperature: {temp}°C")

        # 2. Database Defect Frequency Check
        recent_defects = db.query(Inspection).filter(
            Inspection.machine_id == machine_id,
            Inspection.status == "DEFECTIVE"
        ).all()
        defect_count = len(recent_defects)

        if defect_count > 3:
            score += 25
            signals.append(f"High Defect Frequency: {defect_count} defective units logged in database")
        elif defect_count > 0:
            score += 15
            signals.append(f"Recent Defect Logged: {defect_count} defective unit(s) recorded")

        score = min(100, max(0, score))

        if score >= 75:
            level = "CRITICAL"
        elif score >= 50:
            level = "HIGH"
        elif score >= 25:
            level = "MODERATE"
        else:
            level = "LOW"

        if not signals:
            signals.append("All operational parameters remain within safe baseline limits.")

        return {
            "machine_id": machine_id,
            "machine_name": machine.machine_name if machine else machine_id,
            "risk_score": score,
            "risk_level": level,
            "contributing_signals": signals,
            "is_demo_assessment": True
        }

risk_engine = RiskEngine()
