from abc import ABC, abstractmethod
from typing import Dict, Any, List

class VisionProvider(ABC):
    """Abstract interface for computer vision defect detection engines."""
    
    @abstractmethod
    def analyze_image(self, image_path: str, machine_id: str) -> Dict[str, Any]:
        """Process an image and return defect detection payload."""
        pass


class DemoVisionProvider(VisionProvider):
    """
    Controlled Demonstration Vision Engine.
    Returns realistic benchmark inspection outputs for prototyping.
    """
    
    def analyze_image(self, image_path: str, machine_id: str) -> Dict[str, Any]:
        # Machine M03 triggers deliberate demonstration defect (Surface Scratch)
        if machine_id == "M03":
            return {
                "status": "DEFECTIVE",
                "overall_confidence": 0.94,
                "is_demo_result": True,
                "disclaimer": "DEMONSTRATION ANALYSIS: Simulated vision result for evaluation purposes.",
                "defects": [
                    {
                        "defect_type": "Scratch",
                        "confidence": 0.94,
                        "severity": "Medium",
                        "location": "Upper-right surface",
                        "x_min": 0.62,
                        "y_min": 0.15,
                        "x_max": 0.88,
                        "y_max": 0.35,
                        "description": "Linear surface abrasion detected along high-vibration axis"
                    }
                ]
            }
        else:
            return {
                "status": "PASSED",
                "overall_confidence": 0.98,
                "is_demo_result": True,
                "disclaimer": "DEMONSTRATION ANALYSIS: Simulated vision result for evaluation purposes.",
                "defects": []
            }


class YOLOVisionProvider(VisionProvider):
    """Placeholder for future real YOLO PyTorch/ONNX model inferencing."""
    
    def analyze_image(self, image_path: str, machine_id: str) -> Dict[str, Any]:
        raise NotImplementedError("YOLO model integration planned for Phase 3.")


def get_vision_provider() -> VisionProvider:
    """Factory dependency for the real inspection provider."""
    from app.vision.opencv_provider import OpenCVVisionProvider
    return OpenCVVisionProvider()
