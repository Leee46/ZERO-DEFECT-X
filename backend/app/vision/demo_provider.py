from typing import Dict, Any
from app.vision.base import VisionProvider

class DemoVisionProvider(VisionProvider):
    """
    Controlled Demonstration Vision Engine.
    Returns benchmark simulated results for instant offline demo scenarios.
    """

    def analyze_image(self, image_path: str, machine_id: str, inspection_id: str = None) -> Dict[str, Any]:
        if machine_id == "M03":
            return {
                "inspection_id": inspection_id or "INSP-DEMO-001",
                "engine": "Controlled Demo Engine",
                "engine_type": "DEMO_SIMULATED",
                "status": "DEFECTIVE",
                "overall_confidence": 0.94,
                "anomaly_score": 0.94,
                "severity": "HIGH",
                "severity_reason": "Simulated scratch anomaly occupies 4.2% of component surface area.",
                "location": "Upper-right surface",
                "is_demo_result": True,
                "disclaimer": "CONTROLLED DEMO DATA: Benchmark simulated analysis for prototyping.",
                "defects": [
                    {
                        "defect_type": "Scratch",
                        "confidence": 0.94,
                        "anomaly_score": 0.94,
                        "severity": "HIGH",
                        "location": "Upper-right surface",
                        "bounding_box": {
                            "x_min": 420, "y_min": 80, "x_max": 610, "y_max": 210,
                            "norm_x_min": 0.62, "norm_y_min": 0.15, "norm_x_max": 0.88, "norm_y_max": 0.35
                        },
                        "description": "Linear deep surface scratch along high-vibration axis"
                    }
                ],
                "annotated_image_url": "/images/sample_scratch_annotated.jpg"
            }
        else:
            return {
                "inspection_id": inspection_id or "INSP-DEMO-002",
                "engine": "Controlled Demo Engine",
                "engine_type": "DEMO_SIMULATED",
                "status": "PASSED",
                "overall_confidence": 0.98,
                "anomaly_score": 0.05,
                "severity": "LOW",
                "severity_reason": "No anomalies detected.",
                "location": "Center surface",
                "is_demo_result": True,
                "disclaimer": "CONTROLLED DEMO DATA: Benchmark simulated analysis for prototyping.",
                "defects": [],
                "annotated_image_url": "/images/sample_pass_01.jpg"
            }
