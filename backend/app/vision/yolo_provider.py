from typing import Dict, Any
from app.vision.base import VisionProvider

class YOLOVisionProvider(VisionProvider):
    """
    Extensible YOLO Vision Provider Placeholder.
    Ready for loading PyTorch / ONNX trained model weights (e.g. models/defect_detector.pt).
    """

    def analyze_image(self, image_path: str, machine_id: str, inspection_id: str = None) -> Dict[str, Any]:
        return {
            "inspection_id": inspection_id or "INSP-YOLO-000",
            "engine": "YOLO Defect Model (Not Configured)",
            "engine_type": "YOLO_MODEL",
            "status": "UNCONFIGURED",
            "overall_confidence": 0.0,
            "anomaly_score": 0.0,
            "severity": "LOW",
            "severity_reason": "YOLO model weights not found at models/defect_detector.pt",
            "location": "N/A",
            "defects": [],
            "annotated_image_url": "",
            "is_demo_result": False,
            "disclaimer": "YOLO model weights not currently loaded. Switch provider to OpenCVVisionProvider or DemoVisionProvider."
        }
