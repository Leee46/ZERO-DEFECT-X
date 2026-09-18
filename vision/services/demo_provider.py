"""
ZeroDefect X — Vision Abstraction Layer
Supports DemoVisionProvider and future YOLOVisionProvider / OpenCV Providers.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any

class BaseVisionProvider(ABC):
    @abstractmethod
    def infer_image(self, image_data: Any) -> Dict[str, Any]:
        pass

class DemoVisionProvider(BaseVisionProvider):
    """
    Controlled demonstration model provider producing realistic defect detections,
    bounding box coordinates, and confidence metrics.
    """
    def __init__(self):
        self.provider_name = "DemoVisionProvider (YOLOv8 Optical Simulation)"

    def infer_image(self, image_data: Any) -> Dict[str, Any]:
        return {
            "status": "DEFECTIVE",
            "modelProvider": self.provider_name,
            "defects": [
                {
                    "id": "DEF-001",
                    "type": "Scratch",
                    "confidence": 94.2,
                    "severity": "HIGH",
                    "location": "UPPER-RIGHT SURFACE",
                    "boundingBox": {"x": 360, "y": 90, "width": 90, "height": 80, "label": "Scratch [94.2%]"},
                    "description": "Linear deep surface abrasion detected across metallic coating."
                }
            ],
            "inferenceTimeMs": 38.5
        }

class YOLOVisionProvider(BaseVisionProvider):
    """
    Placeholder for actual Ultralytics YOLOv8 PyTorch / ONNX model inference provider.
    """
    def __init__(self, weights_path: str = "weights/zerodefect_yolov8.onnx"):
        self.weights_path = weights_path
        self.provider_name = "YOLOVisionProvider (TensorRT/ONNX Runtime)"

    def infer_image(self, image_data: Any) -> Dict[str, Any]:
        # Connects to real OpenCV / ONNX Runtime session when model is trained
        raise NotImplementedError("ONNX Runtime weights not provided. Use DemoVisionProvider.")
