import os
import cv2
import numpy as np
from typing import Dict, Any, List

class ImageAnnotator:
    """
    Quality-Control Image Annotator.
    Renders professional industrial SCADA bounding boxes, label badges, and inspection metadata.
    """

    @classmethod
    def annotate(
        cls,
        image: np.ndarray,
        anomalies: List[Dict[str, Any]],
        inspection_id: str,
        engine_name: str,
        save_path: str
    ) -> str:
        annotated = image.copy()
        h, w = annotated.shape[:2]

        # Colors (BGR) matching SCADA theme
        box_color = (43, 154, 217)    # Warning amber/orange (RGB: 217, 154, 43 -> BGR: 43, 154, 217)
        badge_bg = (38, 28, 18)      # Dark SCADA blue #121C2C
        text_color = (243, 237, 232)  # Light SCADA text #E8EDF3

        for idx, item in enumerate(anomalies):
            bbox = item["bounding_box"]
            x_min, y_min = bbox["x_min"], bbox["y_min"]
            x_max, y_max = bbox["x_max"], bbox["y_max"]
            label = item.get("defect_type", "Surface Anomaly")
            score = item.get("anomaly_score", 0.85)

            # Draw bounding box rectangle
            cv2.rectangle(annotated, (x_min, y_min), (x_max, y_max), box_color, 2)

            # Draw corner accents for SCADA industrial style
            corner_len = min(15, int(min(x_max - x_min, y_max - y_min) * 0.2))
            if corner_len > 3:
                cv2.line(annotated, (x_min, y_min), (x_min + corner_len, y_min), (172, 124, 79), 4)
                cv2.line(annotated, (x_min, y_min), (x_min, y_min + corner_len), (172, 124, 79), 4)
                cv2.line(annotated, (x_max, y_max), (x_max - corner_len, y_max), (172, 124, 79), 4)
                cv2.line(annotated, (x_max, y_max), (x_max, y_max - corner_len), (172, 124, 79), 4)

            # Draw label badge background
            badge_text = f"[{label}] Score: {int(score * 100)}%"
            (text_w, text_h), baseline = cv2.getTextSize(badge_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)

            badge_y = max(y_min - 10, text_h + 10)
            cv2.rectangle(
                annotated,
                (x_min, badge_y - text_h - 6),
                (x_min + text_w + 12, badge_y + 4),
                badge_bg,
                -1
            )
            cv2.rectangle(
                annotated,
                (x_min, badge_y - text_h - 6),
                (x_min + text_w + 12, badge_y + 4),
                box_color,
                1
            )
            cv2.putText(
                annotated,
                badge_text,
                (x_min + 6, badge_y - 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                text_color,
                1,
                cv2.LINE_AA
            )

        # Header Watermark
        watermark = f"ZERO-DEFECT X | {inspection_id} | ENGINE: {engine_name}"
        cv2.putText(
            annotated,
            watermark,
            (15, h - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (170, 154, 141),
            1,
            cv2.LINE_AA
        )

        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        cv2.imwrite(save_path, annotated)
        return save_path
