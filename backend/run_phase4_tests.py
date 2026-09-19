import os
import json
import urllib.request

BASE_URL = "http://localhost:8000/api"

def upload_image_test(file_path: str, machine_id: str = "M03") -> dict:
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    with open(file_path, "rb") as f:
        img_bytes = f.read()

    filename = os.path.basename(file_path)
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'.encode("utf-8"))
    body.extend(f"Content-Type: image/jpeg\r\n\r\n".encode("utf-8"))
    body.extend(img_bytes)
    body.extend(f"\r\n--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="machine_id"\r\n\r\n{machine_id}\r\n'.encode("utf-8"))
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(
        f"{BASE_URL}/vision/analyze",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )

    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode("utf-8"))

def run_tests():
    print("=" * 60)
    print("  ZERO-DEFECT X — PHASE 4 SUITE (TESTS A THROUGH F)")
    print("=" * 60)

    # TEST A: Development Scratch Component
    path_a = os.path.join("static", "demo_images", "scratch_component.jpg")
    res_a = upload_image_test(path_a, "M03")
    print("\n[TEST A] Development Scratch Component:")
    assert res_a["status"] == "DEFECTIVE", f"Scratch test returned {res_a['status']}"
    assert res_a.get("defects"), "Scratch test returned no defect"
    print(f"  - Status: {res_a['status']} (Expected: DEFECTIVE)")
    print(f"  - Defect Type: {res_a['defects'][0]['defect_type'] if res_a['defects'] else 'None'}")
    print(f"  - Bounding Box: {res_a['defects'][0]['bounding_box'] if res_a['defects'] else 'N/A'}")
    print(f"  - DB Inspection ID: {res_a['inspection_id']}")

    # TEST B: Development Surface Defect
    path_b = os.path.join("static", "demo_images", "surface_defect_component.jpg")
    res_b = upload_image_test(path_b, "M03")
    print("\n[TEST B] Development Surface Defect:")
    assert res_b["status"] == "DEFECTIVE", f"Surface defect test returned {res_b['status']}"
    assert res_b.get("defects"), "Surface defect test returned no defect"
    print(f"  - Status: {res_b['status']} (Expected: DEFECTIVE)")
    print(f"  - Location: {res_b['location']}")
    print(f"  - Severity: {res_b['severity']}")
    print(f"  - DB Inspection ID: {res_b['inspection_id']}")

    # TEST C: Development Normal Component
    path_c = os.path.join("static", "demo_images", "normal_component.jpg")
    res_c = upload_image_test(path_c, "M01")
    print("\n[TEST C] Development Normal Component:")
    assert res_c["status"] == "PASSED", f"Normal component test returned {res_c['status']}"
    assert len(res_c.get("defects", [])) == 0, "Normal component returned a defect"
    print(f"  - Status: {res_c['status']} (Expected: PASSED)")
    print(f"  - Defects Count: {len(res_c['defects'])} (Expected: 0)")
    print(f"  - DB Inspection ID: {res_c['inspection_id']}")

    # TEST D: Real Uploaded Image Processing
    print("\n[TEST D] Real Upload Processing:")
    print(f"  - OpenCV Engine Name: {res_a['engine']}")
    print(f"  - Raw Image URL: {res_a['raw_image_url']}")
    print(f"  - Annotated Image URL: {res_a['annotated_image_url']}")

    # TEST E: Refresh Inspection History
    history = fetch_json(f"{BASE_URL}/inspections")
    print("\n[TEST E] Inspection History Sync:")
    print(f"  - Total Database Inspection Records: {len(history)}")
    created_ids = {res_a['inspection_id'], res_b['inspection_id'], res_c['inspection_id']}
    found_in_history = [i['id'] for i in history if i['id'] in created_ids]
    assert len(found_in_history) == 3, f"Only {len(found_in_history)}/3 new inspections were found in history"
    print(f"  - Newly Created Inspections Found in DB API: {len(found_in_history)} / 3 ({found_in_history})")

    # TEST F: Saved Inspection Traceability & Production Context Linkage
    single_insp = fetch_json(f"{BASE_URL}/inspections/{res_a['inspection_id']}")
    print("\n[TEST F] Traceability & Production Context Linkage:")
    print(f"  - Inspection ID: {single_insp['id']}")
    print(f"  - Product SKU: {single_insp['product_id']}")
    print(f"  - Batch ID: {single_insp['batch_id']}")
    print(f"  - Machine Station: {single_insp['machine_id']}")
    print(f"  - Shift ID: {single_insp['shift_id']}")
    print(f"  - Status: {single_insp['status']}")
    print(f"  - Defects Count: {len(single_insp.get('defects', []))}")

    print("\n" + "=" * 60)
    print("  ALL TESTS (A - F) COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
