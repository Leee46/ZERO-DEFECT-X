import os
from app.vision.base import VisionProvider
from app.vision.demo_provider import DemoVisionProvider
from app.vision.opencv_provider import OpenCVVisionProvider
from app.vision.yolo_provider import YOLOVisionProvider

def get_vision_provider() -> VisionProvider:
    """
    Factory function returning active computer vision provider.
    Defaults to OpenCVVisionProvider for real image analysis.
    """
    provider_type = os.getenv("VISION_PROVIDER", "OPENCV").upper()
    if provider_type == "DEMO":
        return DemoVisionProvider()
    elif provider_type == "YOLO":
        return YOLOVisionProvider()
    else:
        return OpenCVVisionProvider()
