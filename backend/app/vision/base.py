from abc import ABC, abstractmethod
from typing import Dict, Any

class VisionProvider(ABC):
    """Abstract interface for computer vision defect detection engines."""

    @abstractmethod
    def analyze_image(self, image_path: str, machine_id: str, inspection_id: str = None) -> Dict[str, Any]:
        """
        Process an input product image and return structured vision defect findings.
        
        Returns:
            Dict containing status, engine_name, defects list, anomaly_score,
            annotated_image_url, severity, location, and metadata.
        """
        pass
