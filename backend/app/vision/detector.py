import cv2
import numpy as np
from typing import Dict, Any, List, Tuple

class OpenCVDetector:
    """
    OpenCV Anomaly Detector.
    Uses multi-stage Canny edge detection, adaptive thresholding, and contour feature filtering.
    Ignores symmetrical circular design cutouts (bolt holes) to isolate true surface anomalies.
    """

    @classmethod
    def detect_anomalies(cls, resized_bgr: np.ndarray, blurred_gray: np.ndarray, orig_dim: Tuple[int, int], scale: float) -> List[Dict[str, Any]]:
        orig_w, orig_h = orig_dim
        cur_h, cur_w = blurred_gray.shape[:2]
        total_surface_area = float(cur_w * cur_h)

        # 1. Edge & Contrast Anomaly Detection
        median_val = np.median(blurred_gray)
        lower_thresh = int(max(0, (1.0 - 0.33) * median_val))
        upper_thresh = int(min(255, (1.0 + 0.33) * median_val))
        edges = cv2.Canny(blurred_gray, lower_thresh, upper_thresh)

        # Morphological Dilate to connect nearby edge fragments
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        dilated = cv2.dilate(edges, kernel, iterations=2)

        contours, _ = cv2.findContours(dilated, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        min_contour_area = total_surface_area * 0.0004
        max_contour_area = total_surface_area * 0.30

        detected_anomalies = []

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < min_contour_area or area > max_contour_area:
                continue

            x, y, w, h = cv2.boundingRect(cnt)

            # Skip outer frame border edges
            if x <= 10 or y <= 10 or (x + w) >= cur_w - 10 or (y + h) >= cur_h - 10:
                continue

            perimeter = cv2.arcLength(cnt, True)
            if perimeter == 0:
                continue
            
            # Circularity metric: 4 * pi * area / (perimeter^2)
            circularity = (4 * np.pi * area) / (perimeter * perimeter)
            aspect_ratio = float(w) / float(h) if h > 0 else 1.0

            # Filter out true circular bolt holes (high circularity > 0.82 and tight aspect ratio 0.85 - 1.15)
            if circularity > 0.82 and (0.85 <= aspect_ratio <= 1.15):
                continue

            # Map coordinates back to original image dimensions
            orig_x_min = int(x / scale)
            orig_y_min = int(y / scale)
            orig_x_max = int((x + w) / scale)
            orig_y_max = int((y + h) / scale)

            orig_x_min = max(0, min(orig_w, orig_x_min))
            orig_y_min = max(0, min(orig_h, orig_y_min))
            orig_x_max = max(0, min(orig_w, orig_x_max))
            orig_y_max = max(0, min(orig_h, orig_y_max))

            norm_x_min = round(orig_x_min / float(orig_w), 3)
            norm_y_min = round(orig_y_min / float(orig_h), 3)
            norm_x_max = round(orig_x_max / float(orig_w), 3)
            norm_y_max = round(orig_y_max / float(orig_h), 3)

            # Relative quadrant location
            center_x = (orig_x_min + orig_x_max) / 2.0
            center_y = (orig_y_min + orig_y_max) / 2.0

            horiz = "Left" if center_x < (orig_w / 3.0) else ("Right" if center_x > (orig_w * 2 / 3.0) else "Center")
            vert = "Upper" if center_y < (orig_h / 3.0) else ("Lower" if center_y > (orig_h * 2 / 3.0) else "Middle")
            location_label = f"{vert}-{horiz} surface"

            # Anomaly Score
            anomaly_score = min(0.96, max(0.68, round(0.72 + (area / total_surface_area) * 4.0, 2)))

            detected_anomalies.append({
                "bounding_box": {
                    "x_min": orig_x_min,
                    "y_min": orig_y_min,
                    "x_max": orig_x_max,
                    "y_max": orig_y_max,
                    "norm_x_min": norm_x_min,
                    "norm_y_min": norm_y_min,
                    "norm_x_max": norm_x_max,
                    "norm_y_max": norm_y_max,
                },
                "area_px": int(area / (scale * scale)),
                "area_ratio": round(area / total_surface_area, 4),
                "location": location_label,
                "anomaly_score": anomaly_score
            })

        # Sort anomalies by area descending
        detected_anomalies.sort(key=lambda a: a["area_px"], reverse=True)
        return detected_anomalies
