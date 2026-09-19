import cv2
import numpy as np
from typing import Dict, Any, List, Tuple

class OpenCVDetector:
    """
    Reference-free OpenCV surface anomaly detector.

    The detector filters ordinary component edges and only returns sufficiently
    strong internal surface anomalies. It does not use machine ID to force a
    defect result.
    """

    @classmethod
    def detect_anomalies(cls, resized_bgr: np.ndarray, blurred_gray: np.ndarray, orig_dim: Tuple[int, int], scale: float) -> List[Dict[str, Any]]:
        orig_w, orig_h = orig_dim
        cur_h, cur_w = blurred_gray.shape[:2]
        total_surface_area = float(cur_w * cur_h)

        median_val = np.median(blurred_gray)
        lower_thresh = int(max(0, (1.0 - 0.33) * median_val))
        upper_thresh = int(min(255, (1.0 + 0.33) * median_val))
        edges = cv2.Canny(blurred_gray, lower_thresh, upper_thresh)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        dilated = cv2.dilate(edges, kernel, iterations=2)
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        min_contour_area = total_surface_area * 0.00025
        max_contour_area = total_surface_area * 0.12
        detected_anomalies = []

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < min_contour_area or area > max_contour_area:
                continue

            x, y, w, h = cv2.boundingRect(cnt)
            margin_x = max(10, int(cur_w * 0.015))
            margin_y = max(10, int(cur_h * 0.015))
            if x <= margin_x or y <= margin_y or x + w >= cur_w - margin_x or y + h >= cur_h - margin_y:
                continue

            perimeter = cv2.arcLength(cnt, True)
            if perimeter <= 0:
                continue

            circularity = (4 * np.pi * area) / (perimeter * perimeter)
            aspect_ratio = float(max(w, h)) / float(max(1, min(w, h)))

            # Regular circular features such as bolt holes are not defects.
            if circularity > 0.82 and 0.85 <= (w / float(max(h, 1))) <= 1.15:
                continue

            roi = blurred_gray[y:y+h, x:x+w]
            roi_edges = edges[y:y+h, x:x+w]
            if roi.size == 0:
                continue

            local_std = float(np.std(roi))
            contrast_score = min(1.0, local_std / 55.0)
            edge_density = float(np.count_nonzero(roi_edges)) / float(max(roi_edges.size, 1))

            # Long/thin structures are stronger scratch/crack candidates.
            linearity = min(1.0, max(0.0, (aspect_ratio - 1.5) / 6.0))
            signal = (
                0.42 * linearity +
                0.28 * min(1.0, edge_density / 0.18) +
                0.30 * contrast_score
            )

            # Prevent normal texture/edges from becoming automatic defects.
            if signal < 0.42:
                continue

            orig_x_min = max(0, min(orig_w, int(x / scale)))
            orig_y_min = max(0, min(orig_h, int(y / scale)))
            orig_x_max = max(0, min(orig_w, int((x + w) / scale)))
            orig_y_max = max(0, min(orig_h, int((y + h) / scale)))

            norm_x_min = round(orig_x_min / float(orig_w), 3)
            norm_y_min = round(orig_y_min / float(orig_h), 3)
            norm_x_max = round(orig_x_max / float(orig_w), 3)
            norm_y_max = round(orig_y_max / float(orig_h), 3)

            center_x = (orig_x_min + orig_x_max) / 2.0
            center_y = (orig_y_min + orig_y_max) / 2.0
            horiz = "Left" if center_x < (orig_w / 3.0) else ("Right" if center_x > (orig_w * 2 / 3.0) else "Center")
            vert = "Upper" if center_y < (orig_h / 3.0) else ("Lower" if center_y > (orig_h * 2 / 3.0) else "Middle")

            detected_anomalies.append({
                "bounding_box": {
                    "x_min": orig_x_min, "y_min": orig_y_min,
                    "x_max": orig_x_max, "y_max": orig_y_max,
                    "norm_x_min": norm_x_min, "norm_y_min": norm_y_min,
                    "norm_x_max": norm_x_max, "norm_y_max": norm_y_max,
                },
                "area_px": int(area / (scale * scale)),
                "area_ratio": round(area / total_surface_area, 4),
                "location": f"{vert}-{horiz} surface",
                "anomaly_score": round(min(0.97, max(0.55, signal)), 2),
                "aspect_ratio": round(aspect_ratio, 2),
                "edge_density": round(edge_density, 4),
                "contrast_score": round(contrast_score, 3),
            })

        detected_anomalies.sort(key=lambda a: a["anomaly_score"], reverse=True)
        return detected_anomalies
