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

        # Secondary scratch/crack pass. The primary Canny contour detector can miss
        # very thin diagonal marks on reflective machined metal. Hough line evidence is
        # therefore used as a conservative second signal, not as a forced defect result.
        linear_candidates = cls._detect_linear_surface_marks(blurred_gray, edges, cur_w, cur_h, orig_dim, scale)
        for candidate in linear_candidates:
            # Avoid duplicate boxes that substantially overlap an existing anomaly.
            cb = candidate["bounding_box"]
            duplicate = False
            for existing in detected_anomalies:
                eb = existing["bounding_box"]
                ix1 = max(cb["x_min"], eb["x_min"])
                iy1 = max(cb["y_min"], eb["y_min"])
                ix2 = min(cb["x_max"], eb["x_max"])
                iy2 = min(cb["y_max"], eb["y_max"])
                inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
                ca = max(1, (cb["x_max"] - cb["x_min"]) * (cb["y_max"] - cb["y_min"]))
                ea = max(1, (eb["x_max"] - eb["x_min"]) * (eb["y_max"] - eb["y_min"]))
                if inter / float(min(ca, ea)) > 0.45:
                    duplicate = True
                    break
            if not duplicate:
                detected_anomalies.append(candidate)

        detected_anomalies.sort(key=lambda a: a["anomaly_score"], reverse=True)
        return detected_anomalies

    @classmethod
    def _detect_linear_surface_marks(cls, gray: np.ndarray, edges: np.ndarray, cur_w: int, cur_h: int, orig_dim: Tuple[int, int], scale: float) -> List[Dict[str, Any]]:
        """Detect thin internal linear marks typical of scratches on machined surfaces."""
        min_dim = min(cur_w, cur_h)
        min_line_length = max(28, int(min_dim * 0.07))
        max_line_length = int(min_dim * 0.65)

        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180,
            threshold=max(22, int(min_dim * 0.035)),
            minLineLength=min_line_length,
            maxLineGap=max(6, int(min_dim * 0.015))
        )
        if lines is None:
            return []

        candidates = []
        for line in lines:
            coords = np.asarray(line).reshape(-1)
            if coords.size != 4:
                continue
            x1, y1, x2, y2 = [int(v) for v in coords]
            dx, dy = x2 - x1, y2 - y1
            length = float(np.hypot(dx, dy))
            if length < min_line_length or length > max_line_length:
                continue

            # Ignore marks too close to the image boundary, where ordinary object/background
            # edges dominate. The relevance gate already established a foreground object.
            margin = max(12, int(min_dim * 0.035))
            if min(x1, x2) <= margin or min(y1, y2) <= margin or max(x1, x2) >= cur_w - margin or max(y1, y2) >= cur_h - margin:
                continue

            angle = abs(np.degrees(np.arctan2(dy, dx)))
            if angle > 90:
                angle = 180 - angle

            pad = max(7, int(length * 0.10))
            bx1 = max(0, min(x1, x2) - pad)
            by1 = max(0, min(y1, y2) - pad)
            bx2 = min(cur_w, max(x1, x2) + pad)
            by2 = min(cur_h, max(y1, y2) + pad)
            roi = gray[by1:by2, bx1:bx2]
            if roi.size == 0:
                continue

            local_std = float(np.std(roi))
            local_contrast = min(1.0, local_std / 45.0)
            roi_edges = edges[by1:by2, bx1:bx2]
            edge_density = float(np.count_nonzero(roi_edges)) / float(max(1, roi_edges.size))

            # A scratch is expected to be long, thin, and locally high-contrast.
            slenderness = min(1.0, max(0.0, (length / float(max(1, 2 * pad))) - 1.0) / 8.0)
            signal = 0.50 * slenderness + 0.30 * min(1.0, edge_density / 0.20) + 0.20 * local_contrast
            if signal < 0.50:
                continue

            # Convert detector coordinates back to the original image space.
            orig_w, orig_h = orig_dim
            ox1 = max(0, min(orig_w, int(bx1 / scale)))
            oy1 = max(0, min(orig_h, int(by1 / scale)))
            ox2 = max(0, min(orig_w, int(bx2 / scale)))
            oy2 = max(0, min(orig_h, int(by2 / scale)))
            norm_x_min = round(ox1 / float(orig_w), 3)
            norm_y_min = round(oy1 / float(orig_h), 3)
            norm_x_max = round(ox2 / float(orig_w), 3)
            norm_y_max = round(oy2 / float(orig_h), 3)
            center_x = (ox1 + ox2) / 2.0
            center_y = (oy1 + oy2) / 2.0
            horiz = "Left" if center_x < orig_w / 3 else ("Right" if center_x > orig_w * 2 / 3 else "Center")
            vert = "Upper" if center_y < orig_h / 3 else ("Lower" if center_y > orig_h * 2 / 3 else "Middle")

            candidates.append({
                "bounding_box": {
                    "x_min": ox1, "y_min": oy1, "x_max": ox2, "y_max": oy2,
                    "norm_x_min": norm_x_min, "norm_y_min": norm_y_min,
                    "norm_x_max": norm_x_max, "norm_y_max": norm_y_max,
                },
                "area_px": int(max(1, (ox2 - ox1) * (oy2 - oy1)),),
                "area_ratio": round(((ox2 - ox1) * (oy2 - oy1)) / float(cur_w * cur_h), 4),
                "location": f"{vert}-{horiz} surface",
                "anomaly_score": round(min(0.95, max(0.55, signal)), 2),
                "aspect_ratio": round(length / float(max(1, 2 * pad)), 2),
                "edge_density": round(edge_density, 4),
                "contrast_score": round(local_contrast, 3),
                "linear_mark_angle": round(float(angle), 1),
            })

        # Keep only the strongest independent linear marks so texture does not flood the result.
        candidates.sort(key=lambda a: a["anomaly_score"], reverse=True)
        return candidates[:3]
