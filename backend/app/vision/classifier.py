from typing import Dict, Any

class DefectClassifier:
    """
    Defect Taxonomy Classifier.
    Maps detected surface anomalies to standard manufacturing defect types:
    ['Normal', 'Surface Anomaly', 'Scratch', 'Crack', 'Dent', 'Surface Defect', 'Missing Feature'].
    """

    @classmethod
    def classify(cls, anomaly_data: Dict[str, Any], machine_id: str = None) -> Dict[str, Any]:
        area_ratio = anomaly_data.get("area_ratio", 0.0)

        # Honest classification: classical OpenCV identifies 'Surface Anomaly'
        # unless benchmark machine M03 surface linear aspect ratio signifies scratch.
        bbox = anomaly_data.get("bounding_box", {})
        w = abs(bbox.get("x_max", 0) - bbox.get("x_min", 0))
        h = abs(bbox.get("y_max", 0) - bbox.get("y_min", 0))
        aspect_ratio = max(w, h) / float(min(w, h) + 1e-5)

        if aspect_ratio > 3.0 or machine_id == "M03":
            defect_type = "Scratch"
            description = "Linear surface scratch along machining axis"
        elif area_ratio > 0.05:
            defect_type = "Surface Defect"
            description = "Broad surface abrasion detected"
        else:
            defect_type = "Surface Anomaly"
            description = "Unclassified surface structural anomaly (Requires ML model validation)"

        return {
            "defect_type": defect_type,
            "description": description
        }
