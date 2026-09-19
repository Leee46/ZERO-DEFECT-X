from typing import Dict, Any

class DefectClassifier:
    """
    Explainable reference-free defect taxonomy classifier.

    Machine ID is never used to force a defect type. If visual evidence is not
    specific enough, the result remains a generic Surface Anomaly.
    """

    @classmethod
    def classify(cls, anomaly_data: Dict[str, Any], machine_id: str = None) -> Dict[str, Any]:
        bbox = anomaly_data.get("bounding_box", {})
        w = abs(bbox.get("x_max", 0) - bbox.get("x_min", 0))
        h = abs(bbox.get("y_max", 0) - bbox.get("y_min", 0))
        aspect_ratio = max(w, h) / float(min(w, h) + 1e-5)
        area_ratio = float(anomaly_data.get("area_ratio", 0.0))
        contrast_score = float(anomaly_data.get("contrast_score", 0.0))

        if aspect_ratio >= 5.0 and contrast_score >= 0.35:
            return {"defect_type": "Scratch", "description": "Thin elongated surface anomaly consistent with a scratch."}
        if aspect_ratio >= 3.5 and contrast_score >= 0.45:
            return {"defect_type": "Crack", "description": "Thin irregular elongated anomaly consistent with a crack; physical verification is required."}
        if area_ratio >= 0.025 and contrast_score >= 0.50:
            return {"defect_type": "Dent", "description": "Localized compact surface deformation/anomaly consistent with a dent."}
        if area_ratio >= 0.012 and contrast_score >= 0.40:
            return {"defect_type": "Surface Defect", "description": "Localized broad surface anomaly detected."}
        return {"defect_type": "Surface Anomaly", "description": "Surface anomaly detected, but evidence is insufficient for a specific defect class."}
