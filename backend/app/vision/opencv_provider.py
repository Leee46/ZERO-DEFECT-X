import os
import uuid
import cv2
from typing import Dict, Any

from app.vision.base import VisionProvider
from app.vision.preprocessing import Preprocessor
from app.vision.detector import OpenCVDetector
from app.vision.classifier import DefectClassifier
from app.vision.severity import SeverityEstimator
from app.vision.annotator import ImageAnnotator

class OpenCVVisionProvider(VisionProvider):
    """
    Production-Quality OpenCV Computer Vision Defect Provider.
    Implements preprocessing, adaptive threshold anomaly detection, bounding box localization,
    explainable severity estimation, and quality-control image annotation.
    """

    def analyze_image(self, image_path: str, machine_id: str, inspection_id: str = None) -> Dict[str, Any]:
        engine_name = "OpenCV Anomaly Detector"
        insp_id = inspection_id or f"INSP-2026-{uuid.uuid4().hex[:4].upper()}"

        try:
            # 1. Validate & Load Raw Image
            raw_bgr, orig_dim = Preprocessor.validate_and_load(image_path)
            orig_w, orig_h = orig_dim

            # 2. Preprocess
            resized_bgr, blurred_gray, scale = Preprocessor.preprocess_for_detection(raw_bgr)

            # 3. Detect Anomalies & Calculate Bounding Boxes
            raw_anomalies = OpenCVDetector.detect_anomalies(resized_bgr, blurred_gray, orig_dim, scale)

            defects = []
            overall_status = "PASSED"
            max_score = 0.98
            primary_severity = "LOW"
            severity_reason = "No surface structural anomalies detected across component scan."
            primary_location = "Center surface"

            if raw_anomalies:
                overall_status = "DEFECTIVE"
                for item in raw_anomalies:
                    classified = DefectClassifier.classify(item, machine_id)
                    severity, reason = SeverityEstimator.estimate_severity(item)
                    item["defect_type"] = classified["defect_type"]
                    item["description"] = classified["description"]
                    item["severity"] = severity
                    item["severity_reason"] = reason

                    defects.append({
                        "defect_type": item["defect_type"],
                        "confidence": item["anomaly_score"],
                        "anomaly_score": item["anomaly_score"],
                        "severity": severity,
                        "location": item["location"],
                        "bounding_box": item["bounding_box"],
                        "description": item["description"]
                    })

                primary_anomaly = raw_anomalies[0]
                max_score = primary_anomaly["anomaly_score"]
                primary_severity = primary_anomaly["severity"]
                severity_reason = primary_anomaly["severity_reason"]
                primary_location = primary_anomaly["location"]

            # 4. Save Annotated Image
            annotated_filename = f"annotated_{os.path.basename(image_path)}"
            annotated_path = os.path.join(os.path.dirname(image_path), "annotated", annotated_filename)
            if not os.path.exists(os.path.dirname(annotated_path)):
                os.makedirs(os.path.dirname(annotated_path), exist_ok=True)

            ImageAnnotator.annotate(
                raw_bgr if overall_status == "DEFECTIVE" else raw_bgr,
                raw_anomalies,
                insp_id,
                engine_name,
                annotated_path
            )

            rel_annotated_url = f"/uploads/inspections/annotated/{annotated_filename}"

            return {
                "inspection_id": insp_id,
                "engine": engine_name,
                "engine_type": "DEVELOPMENT_OPENCV",
                "status": overall_status,
                "overall_confidence": max_score,
                "anomaly_score": max_score,
                "severity": primary_severity,
                "severity_reason": severity_reason,
                "location": primary_location,
                "defects": defects,
                "annotated_image_url": rel_annotated_url,
                "is_demo_result": False,
                "disclaimer": "DEVELOPMENT COMPUTER VISION: Detection score represents OpenCV surface anomaly gradient metric. ML model classification required for production deployment."
            }

        except Exception as e:
            print(f"[OpenCVVisionProvider Error] {e}")
            raise ValueError(f"Vision processing failed: {str(e)}")
