import urllib.request
import json
import os

def test(filename="normal_component.jpg", machine="M01"):
    file_path = os.path.join("static", "demo_images", filename)
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    with open(file_path, "rb") as f:
        img_bytes = f.read()

    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="image"; filename="{filename}"\r\n'.encode("utf-8"))
    body.extend(f"Content-Type: image/jpeg\r\n\r\n".encode("utf-8"))
    body.extend(img_bytes)
    body.extend(f"\r\n--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="machine_id"\r\n\r\n{machine}\r\n'.encode("utf-8"))
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(
        "http://localhost:8000/api/vision/analyze",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )

    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode("utf-8"))
        print(f"[{filename} TEST]")
        print(f"  Status: {res.get('status')}")
        print(f"  Defects Count: {len(res.get('defects', []))}")
        print(f"  Annotated URL: {res.get('annotated_image_url')}")

if __name__ == "__main__":
    test("normal_component.jpg", "M01")
    test("scratch_component.jpg", "M03")
