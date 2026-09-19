import datetime
from typing import Dict, Any, List, Optional, Tuple
from statistics import median
from sqlalchemy.orm import Session
from app.models.db_models import Inspection, Machine, MachineParameter, EnvironmentReading, Defect

# Configured operational limits used as transparent engineering guardrails.
# Historical association is calculated from recorded telemetry matched to inspection time.
MACHINE_BASELINES = {
    "M01": {"vibration_max": 2.5, "temp_max": 70.0, "name": "Precision Milling Unit 01"},
    "M02": {"vibration_max": 2.5, "temp_max": 72.0, "name": "CNC Lathe Station 02"},
    "M03": {"vibration_max": 2.5, "temp_max": 70.0, "name": "Precision Machining Station 03"},
    "M04": {"vibration_max": 2.2, "temp_max": 68.0, "name": "CNC Finishing Unit 04"},
}

MATCH_WINDOW = datetime.timedelta(hours=6)


class ProbableCauseEngine:
    """
    Evidence-backed production-context analysis.

    The engine does not claim physical causation. It:
    1. Matches recorded machine telemetry to inspection timestamps.
    2. Separates historical inspections into normal/elevated parameter windows.
    3. Calculates observed defect rates for those groups.
    4. Reports parameter deviations and batch patterns as probable contributing factors.
    """

    @staticmethod
    def _nearest_parameter(
        parameters: List[MachineParameter],
        timestamp: Optional[datetime.datetime]
    ) -> Optional[MachineParameter]:
        if not timestamp or not parameters:
            return None

        def distance(item: MachineParameter) -> float:
            item_ts = item.timestamp
            target_ts = timestamp
            if item_ts is None or target_ts is None:
                return float("inf")
            if item_ts.tzinfo is None and target_ts.tzinfo is not None:
                item_ts = item_ts.replace(tzinfo=target_ts.tzinfo)
            elif item_ts.tzinfo is not None and target_ts.tzinfo is None:
                target_ts = target_ts.replace(tzinfo=item_ts.tzinfo)
            return abs((item_ts - target_ts).total_seconds())

        nearest = min(parameters, key=distance)
        return nearest if distance(nearest) <= MATCH_WINDOW.total_seconds() else None

    @staticmethod
    def _rate(rows: List[Tuple[Inspection, MachineParameter]]) -> Optional[float]:
        if not rows:
            return None
        defective = sum(1 for inspection, _ in rows if inspection.status == "DEFECTIVE")
        return round(defective / len(rows) * 100, 1)

    @staticmethod
    def _association_score(
        elevated_rate: Optional[float],
        normal_rate: Optional[float],
        sample_count: int
    ) -> float:
        if elevated_rate is None or normal_rate is None or sample_count < 2:
            return 0.0
        lift = abs(elevated_rate - normal_rate)
        # Transparent evidence score: effect size plus a small sample-size adjustment.
        score = 0.30 + min(0.50, lift / 100.0) + min(0.15, sample_count / 40.0)
        return round(min(0.95, score), 2)

    def analyze(self, db: Session, inspection_id: str, machine_id: str = None) -> Dict[str, Any]:
        insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not insp:
            raise ValueError(f"Inspection {inspection_id} not found")

        target_machine_id = machine_id or insp.machine_id
        machine = db.query(Machine).filter(Machine.id == target_machine_id).first()
        baseline = MACHINE_BASELINES.get(
            target_machine_id,
            {"vibration_max": 2.5, "temp_max": 70.0, "name": target_machine_id}
        )

        parameters = db.query(MachineParameter).filter(
            MachineParameter.machine_id == target_machine_id
        ).order_by(MachineParameter.timestamp.asc()).all()

        # Never substitute an unrelated latest reading for the inspection-time state.
        # If synchronized telemetry is unavailable, current-condition fields remain unknown.
        current_param = self._nearest_parameter(parameters, insp.inspection_time)

        latest_env = db.query(EnvironmentReading).order_by(
            EnvironmentReading.timestamp.desc()
        ).first()

        defects = db.query(Defect).filter(Defect.inspection_id == inspection_id).all()
        primary_defect_type = defects[0].defect_type if defects else "None"
        defect_severity = defects[0].severity if defects else "N/A"

        vib = current_param.vibration if current_param else None
        temp = current_param.temperature if current_param else None
        pressure = current_param.pressure if current_param else None
        speed = current_param.speed if current_param else None

        production_context = {
            "machine_id": target_machine_id,
            "machine_name": machine.machine_name if machine else target_machine_id,
            "batch_id": insp.batch_id,
            "shift": insp.shift_id,
            "vibration": vib,
            "temperature": temp,
            "pressure": pressure,
            "speed": speed,
            "environment_temperature": latest_env.temperature if latest_env else None,
            "environment_humidity": latest_env.humidity if latest_env else None,
            "telemetry_timestamp": current_param.timestamp.isoformat() if current_param and current_param.timestamp else None,
        }

        total_inspections = db.query(Inspection).filter(
            Inspection.machine_id == target_machine_id
        ).order_by(Inspection.inspection_time.asc()).all()

        matched_rows: List[Tuple[Inspection, MachineParameter]] = []
        for historical in total_inspections:
            matched = self._nearest_parameter(parameters, historical.inspection_time)
            if matched is not None:
                matched_rows.append((historical, matched))

        if insp.status == "PASSED":
            return {
                "inspection_id": inspection_id,
                "machine_id": target_machine_id,
                "status": "PASSED",
                "probable_factor": "No defect-associated factor required",
                "candidate_factors": [],
                "evidence": ["The inspected product passed visual quality analysis."],
                "supporting_records_count": len(matched_rows),
                "current_condition": f"Vibration {vib} mm/s | Temp {temp}°C | Pressure {pressure} bar",
                "production_context": production_context,
                "historical_comparison": {
                    "normal_vibration_defect_rate": None,
                    "elevated_vibration_defect_rate": None,
                    "normal_sample_count": 0,
                    "elevated_sample_count": 0,
                    "matching_historical_count": len(matched_rows)
                },
                "confidence": 0.0,
                "verification_required": False,
                "requires_verification": False,
                "factors": [],
                "is_insufficient_evidence": False,
                "disclaimer": "No probable-cause inference is required for a product that passed visual inspection."
            }

        if len(matched_rows) < 2:
            factor = {
                "factor": "Insufficient Telemetry-Linked Historical Evidence",
                "evidence_level": "LOW",
                "score": 0.0,
                "details": "Fewer than two historical inspections could be matched to recorded machine telemetry within the configured time window."
            }
            return {
                "inspection_id": inspection_id,
                "machine_id": target_machine_id,
                "status": "DEFECTIVE",
                "defect_type": primary_defect_type,
                "defect_severity": defect_severity,
                "probable_factor": factor["factor"],
                "candidate_factors": [factor],
                "factors": [factor],
                "evidence": [factor["details"]],
                "supporting_records_count": len(matched_rows),
                "current_condition": f"Vibration {vib} mm/s | Temp {temp}°C | Pressure {pressure} bar | Speed {speed} RPM",
                "production_context": production_context,
                "historical_comparison": {
                    "normal_vibration_defect_rate": None,
                    "elevated_vibration_defect_rate": None,
                    "normal_sample_count": 0,
                    "elevated_sample_count": 0,
                    "matching_historical_count": len(matched_rows)
                },
                "confidence": 0.0,
                "verification_required": True,
                "requires_verification": True,
                "is_insufficient_evidence": True,
                "disclaimer": "INSUFFICIENT EVIDENCE: Additional inspection samples with synchronized telemetry are required before attributing a production factor."
            }

        vib_normal = [row for row in matched_rows if row[1].vibration <= baseline["vibration_max"]]
        vib_elevated = [row for row in matched_rows if row[1].vibration > baseline["vibration_max"]]
        temp_normal = [row for row in matched_rows if row[1].temperature <= baseline["temp_max"]]
        temp_elevated = [row for row in matched_rows if row[1].temperature > baseline["temp_max"]]

        vib_normal_rate = self._rate(vib_normal)
        vib_elevated_rate = self._rate(vib_elevated)
        temp_normal_rate = self._rate(temp_normal)
        temp_elevated_rate = self._rate(temp_elevated)

        candidate_factors: List[Dict[str, Any]] = []
        evidence_points: List[str] = []

        if vib is not None and vib > baseline["vibration_max"]:
            score = self._association_score(vib_elevated_rate, vib_normal_rate, len(vib_elevated) + len(vib_normal))
            if score > 0:
                lift = round(vib_elevated_rate - vib_normal_rate, 1)
                level = "STRONG" if score >= 0.70 else "MODERATE"
                details = (
                    f"Current vibration {vib} mm/s exceeds the configured {baseline['vibration_max']} mm/s limit. "
                    f"Historical defect rate was {vib_elevated_rate}% during elevated-vibration windows versus "
                    f"{vib_normal_rate}% during normal-vibration windows (lift {lift} percentage points)."
                )
            else:
                level = "MODERATE"
                score = round(min(0.60, 0.35 + max(0.0, vib - baseline["vibration_max"]) * 0.08), 2)
                details = (
                    f"Current vibration {vib} mm/s exceeds the configured {baseline['vibration_max']} mm/s limit. "
                    "Historical telemetry-linked sample size is insufficient to quantify an association."
                )
            candidate_factors.append({
                "factor": f"Elevated Vibration on {target_machine_id}",
                "evidence_level": level,
                "score": score,
                "details": details
            })
            evidence_points.append(details)

        if temp is not None and temp > baseline["temp_max"]:
            score = self._association_score(temp_elevated_rate, temp_normal_rate, len(temp_elevated) + len(temp_normal))
            if score > 0:
                lift = round(temp_elevated_rate - temp_normal_rate, 1)
                level = "STRONG" if score >= 0.70 else "MODERATE"
                details = (
                    f"Current temperature {temp}°C exceeds the configured {baseline['temp_max']}°C limit. "
                    f"Historical defect rate was {temp_elevated_rate}% during elevated-temperature windows versus "
                    f"{temp_normal_rate}% during normal-temperature windows (lift {lift} percentage points)."
                )
            else:
                level = "MODERATE"
                score = 0.35
                details = (
                    f"Current temperature {temp}°C exceeds the configured {baseline['temp_max']}°C limit. "
                    "Historical telemetry-linked sample size is insufficient to quantify an association."
                )
            candidate_factors.append({
                "factor": f"Elevated Temperature on {target_machine_id}",
                "evidence_level": level,
                "score": score,
                "details": details
            })
            evidence_points.append(details)

        if insp.batch_id:
            batch_rows = [row[0] for row in matched_rows if row[0].batch_id == insp.batch_id]
            if len(batch_rows) >= 2:
                batch_defect_rate = round(
                    sum(1 for item in batch_rows if item.status == "DEFECTIVE") / len(batch_rows) * 100, 1
                )
                overall_rate = round(
                    sum(1 for item, _ in matched_rows if item.status == "DEFECTIVE") / len(matched_rows) * 100, 1
                )
                if batch_defect_rate > overall_rate:
                    score = round(min(0.75, 0.30 + abs(batch_defect_rate - overall_rate) / 100), 2)
                    candidate_factors.append({
                        "factor": f"Batch {insp.batch_id} Recurring Defect Pattern",
                        "evidence_level": "MODERATE",
                        "score": score,
                        "details": f"Telemetry-linked inspections in batch {insp.batch_id} show a {batch_defect_rate}% defect rate versus {overall_rate}% across matched machine inspections."
                    })
                    evidence_points.append(candidate_factors[-1]["details"])

        if not candidate_factors:
            candidate_factors.append({
                "factor": "No Specific Production Deviation Identified",
                "evidence_level": "LOW",
                "score": 0.0,
                "details": "Available telemetry at the inspection timestamp did not show a configured parameter deviation."
            })
            evidence_points.append(candidate_factors[0]["details"])

        candidate_factors.sort(key=lambda item: item.get("score", 0.0), reverse=True)
        primary = candidate_factors[0]

        return {
            "inspection_id": inspection_id,
            "machine_id": target_machine_id,
            "status": "DEFECTIVE",
            "defect_type": primary_defect_type,
            "defect_severity": defect_severity,
            "probable_factor": primary["factor"],
            "candidate_factors": candidate_factors,
            "evidence": evidence_points,
            "supporting_records_count": len(matched_rows),
            "current_condition": f"Vibration {vib} mm/s | Temp {temp}°C | Pressure {pressure} bar | Speed {speed} RPM",
            "production_context": production_context,
            "historical_comparison": {
                "normal_vibration_defect_rate": vib_normal_rate,
                "elevated_vibration_defect_rate": vib_elevated_rate,
                "normal_vibration_sample_count": len(vib_normal),
                "elevated_vibration_sample_count": len(vib_elevated),
                "normal_temperature_defect_rate": temp_normal_rate,
                "elevated_temperature_defect_rate": temp_elevated_rate,
                "matching_historical_count": len(matched_rows)
            },
            "confidence": primary.get("score", 0.0),
            "verification_required": True,
            "requires_verification": True,
            "factors": candidate_factors,
            "is_insufficient_evidence": False,
            "disclaimer": "PROBABLE CONTRIBUTING FACTOR: Statistical association from synchronized production records, not proof of physical causation. Engineering verification is required."
        }


root_cause_engine = ProbableCauseEngine()
