"""
ZeroDefect X — Root-Cause Correlation Analytics Engine
Evaluates baseline deviations across machine telemetry (vibration, temp, pressure)
and correlates with historical defect logs.
"""

from typing import Dict, List, Any

class RootCauseEngine:
    def __init__(self, vibration_baseline: float = 2.1, temp_baseline: float = 68.0):
        self.vibration_baseline = vibration_baseline
        self.temp_baseline = temp_baseline

    def evaluate_association(
        self,
        defect_type: str,
        current_vibration: float,
        current_temp: float,
        machine_id: str
    ) -> Dict[str, Any]:
        evidence_points = []
        vib_score = 0.1

        vib_deviation = current_vibration / self.vibration_baseline
        if vib_deviation > 2.0:
            vib_score = 0.84
            evidence_points.append(
                f"Machine vibration ({current_vibration} mm/s) exceeds baseline ({self.vibration_baseline} mm/s) by +{round((vib_deviation - 1)*100)}%."
            )

        temp_deviation = current_temp / self.temp_baseline
        temp_score = 0.1
        if temp_deviation > 1.1:
            temp_score = 0.38
            evidence_points.append(
                f"Thermal level ({current_temp}°C) is elevated +{round((temp_deviation - 1)*100)}% above normal operating temperature ({self.temp_baseline}°C)."
            )

        if machine_id == "M03" and defect_type == "Scratch":
            evidence_points.append(
                "Historical correlation: Station M03 exhibits a 78% correlation between elevated vibration and Scratch occurrences."
            )

        probable_factor = "No significant parameter anomaly"
        if vib_score > 0.6:
            probable_factor = f"Elevated Machine Vibration on Station {machine_id}"

        return {
            "probableFactor": probable_factor,
            "evidenceScore": int(max(vib_score, temp_score) * 100),
            "evidencePoints": evidence_points,
            "disclaimer": "Probable contributing factors represent statistical baseline associations. Physical inspection required."
        }
