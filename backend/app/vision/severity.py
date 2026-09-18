from typing import Dict, Any, Tuple

class SeverityEstimator:
    """
    Transparent & Explainable Severity Estimation Engine.
    Levels: LOW, MEDIUM, HIGH, CRITICAL.
    Evaluates measurable physical properties (anomaly surface ratio & location).
    """

    @classmethod
    def estimate_severity(cls, anomaly_data: Dict[str, Any]) -> Tuple[str, str]:
        area_ratio = anomaly_data.get("area_ratio", 0.0)
        location = anomaly_data.get("location", "")

        if area_ratio > 0.08:
            severity = "CRITICAL"
            reason = f"Detected anomaly occupies {round(area_ratio * 100, 1)}% of total surface area, exceeding critical tolerance limits."
        elif area_ratio > 0.03:
            severity = "HIGH"
            reason = f"Detected anomaly occupies {round(area_ratio * 100, 1)}% of inspected component surface."
        elif area_ratio > 0.01:
            severity = "MEDIUM"
            reason = f"Detected anomaly occupies moderate surface portion ({round(area_ratio * 100, 1)}%)."
        else:
            severity = "LOW"
            reason = f"Localized minor surface anomaly ({round(area_ratio * 100, 2)}% area ratio)."

        return severity, reason
