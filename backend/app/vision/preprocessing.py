import os
import cv2
import numpy as np
from typing import Tuple, Optional

class Preprocessor:
    """OpenCV Image Preprocessing Pipeline for Manufacturing Inspection."""

    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

    @classmethod
    def validate_and_load(cls, image_path: str) -> Tuple[np.ndarray, Tuple[int, int]]:
        """
        Validates file existence, format, and loads raw OpenCV image matrix.
        Returns (bgr_image, (original_width, original_height)).
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Inspection image file not found: {image_path}")

        ext = os.path.splitext(image_path)[1].lower()
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported image format '{ext}'. Allowed: {cls.ALLOWED_EXTENSIONS}")

        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Corrupted or unreadable image file.")

        h, w = image.shape[:2]
        return image, (w, h)

    @classmethod
    def preprocess_for_detection(cls, image: np.ndarray, max_dim: int = 1024) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Resizes image preserving aspect ratio if larger than max_dim,
        converts to grayscale, and applies Gaussian blur noise reduction.
        Returns (resized_bgr, preprocessed_gray, scale_factor).
        """
        h, w = image.shape[:2]
        scale = 1.0

        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            new_w, new_h = int(w * scale), int(h * scale)
            resized_bgr = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        else:
            resized_bgr = image.copy()

        gray = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2GRAY)
        # 5x5 Gaussian blur noise reduction
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        return resized_bgr, blurred, scale
