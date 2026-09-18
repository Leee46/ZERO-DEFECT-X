import os
import cv2
import numpy as np

def generate_test_images():
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static", "demo_images"))
    os.makedirs(output_dir, exist_ok=True)

    w, h = 800, 600

    # 1. Normal Component
    normal_img = np.full((h, w, 3), (180, 185, 190), dtype=np.uint8)
    noise = np.random.normal(0, 3, (h, w, 3)).astype(np.int16)
    normal_img = np.clip(normal_img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    cv2.rectangle(normal_img, (100, 80), (700, 520), (120, 125, 130), 4)
    for cx, cy in [(160, 140), (640, 140), (160, 460), (640, 460)]:
        cv2.circle(normal_img, (cx, cy), 25, (90, 95, 100), -1)
        cv2.circle(normal_img, (cx, cy), 25, (60, 65, 70), 3)

    normal_path = os.path.join(output_dir, "normal_component.jpg")
    cv2.imwrite(normal_path, normal_img)

    # 2. Scratch Component (Linear scratch in upper-right)
    scratch_img = normal_img.copy()
    cv2.line(scratch_img, (450, 120), (620, 240), (20, 20, 20), 6)
    cv2.line(scratch_img, (452, 122), (622, 242), (250, 250, 250), 2)
    scratch_path = os.path.join(output_dir, "scratch_component.jpg")
    cv2.imwrite(scratch_path, scratch_img)

    # 3. Surface Defect Component (Broad high-contrast dark surface patch)
    surface_img = normal_img.copy()
    patch = np.zeros((120, 160, 3), dtype=np.uint8)
    patch_noise = np.random.randint(20, 80, (120, 160, 3), dtype=np.uint8)
    surface_img[240:360, 320:480] = patch_noise
    cv2.rectangle(surface_img, (320, 240), (480, 360), (10, 10, 10), 3)

    surface_path = os.path.join(output_dir, "surface_defect_component.jpg")
    cv2.imwrite(surface_path, surface_img)

    print("[TEST IMAGES GENERATED CLEANLY]")

if __name__ == "__main__":
    generate_test_images()
