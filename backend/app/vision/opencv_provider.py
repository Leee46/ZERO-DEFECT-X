import os
import uuid
import cv2
import numpy as np
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

            # 2. Basic image-quality / relevance gate before defect detection.
            gray = cv2.cvtColor(raw_bgr, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape[:2]
            if min(h, w) < 128:
                raise ValueError("IMAGE_NOT_ANALYZABLE: Image resolution is too low for component inspection.")
            gray_std = float(np.std(gray))
            if gray_std < 8.0:
                raise ValueError("IMAGE_NOT_ANALYZABLE: Image is nearly uniform or blank.")
            focus_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            if focus_score < 12.0:
                raise ValueError("IMAGE_NOT_ANALYZABLE: Image is too blurred for reliable inspection.")

            # Build the relevance mask in both polarities. Dark machined parts on a
            # light background and light parts on a dark background are both valid.
            # The previous single-polarity mask could mistake the background for the
            # foreground and then reject an otherwise clear component.
            normalized = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
            _, binary_dark = cv2.threshold(normalized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            binary_light = cv2.bitwise_not(binary_dark)

            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            masks = []
            for mask in (binary_dark, binary_light):
                mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
                mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
                masks.append(mask)

            image_area = float(w * h)
            largest_object_ratio = 0.0

            # A component is considered relevant when a sizable foreground region is
            # present. Boundary-touching contours are ignored because they are usually
            # the photo/background frame rather than the component itself.
            # Use a 5% minimum so ordinary UI/text fragments are not treated as products.
            for mask in masks:
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for cnt in contours:
                    area = cv2.contourArea(cnt)
                    if area < image_area * 0.015 or area > image_area * 0.90:
                        continue

                    x, y, cw, ch = cv2.boundingRect(cnt)
                    margin_x = max(5, int(w * 0.02))
                    margin_y = max(5, int(h * 0.02))
                    touches_frame = (
                        x <= margin_x or
                        y <= margin_y or
                        x + cw >= w - margin_x or
                        y + ch >= h - margin_y
                    )
                    if touches_frame:
                        continue

                    largest_object_ratio = max(largest_object_ratio, area / image_area)

            if largest_object_ratio < 0.05:
                # Some legitimate component images (especially the development
                # set) use a low-contrast plate where the component boundary is
                # drawn as an internal outline rather than a filled region. In
                # that case contour-area segmentation is intentionally weak.
                # Fall back to structural evidence: a reasonably smooth image
                # with multiple long internal edges is much more characteristic
                # of a photographed/illustrated component than a UI screenshot.
                central = gray[
                    int(h * 0.10):int(h * 0.90),
                    int(w * 0.10):int(w * 0.90)
                ]
                central_edges = cv2.Canny(central, 50, 150)
                edge_density = float(np.mean(central_edges > 0))
                lines = cv2.HoughLinesP(
                    central_edges,
                    1,
                    np.pi / 180,
                    threshold=max(30, int(min(central.shape) * 0.12)),
                    minLineLength=max(50, int(min(central.shape) * 0.25)),
                    maxLineGap=max(8, int(min(central.shape) * 0.03))
                )
                long_lines = 0
                if lines is not None:
                    for line in lines:
                        coords = np.asarray(line).reshape(-1)
                        if coords.size != 4:
                            continue
                        x1, y1, x2, y2 = [int(v) for v in coords]
                        length = float(np.hypot(x2 - x1, y2 - y1))
                        if length >= min(central.shape) * 0.25:
                            long_lines += 1

                structural_component = (
                    0.005 <= edge_density <= 0.035 and
                    long_lines >= 2
                )
                if not structural_component:
                    raise ValueError("IMAGE_NOT_ANALYZABLE: No clear foreground product/component was found. Upload a close, well-framed manufacturing component image.")

            # 3. Preprocess
            resized_bgr, blurred_gray, scale = Preprocessor.preprocess_for_detection(raw_bgr)

            # 4. Detect visual surface anomalies.
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

        except ValueError as e:
            message = str(e)
            if message.startswith("IMAGE_NOT_ANALYZABLE:"):
                reason = message.split(":", 1)[1].strip()
                return {
                    "inspection_id": insp_id,
                    "engine": engine_name,
                    "engine_type": "DEVELOPMENT_OPENCV",
                    "status": "NOT_ANALYZABLE",
                    "overall_confidence": 0.0,
                    "anomaly_score": 0.0,
                    "severity": "LOW",
                    "severity_reason": reason,
                    "location": "N/A",
                    "defects": [],
                    "annotated_image_url": None,
                    "is_demo_result": False,
                    "not_analyzable_reason": reason,
                    "disclaimer": "IMAGE RELEVANCE GATE: The upload did not contain a sufficiently clear, inspectable product/component image."
                }
            print(f"[OpenCVVisionProvider Error] {e}")
            raise
        except Exception as e:
            print(f"[OpenCVVisionProvider Error] {e}")
            raise ValueError(f"Vision processing failed: {str(e)}")
