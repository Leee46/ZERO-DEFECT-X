# SI-03 Requirement Traceability — ZERO-DEFECT X

## Problem statement

ZERO-DEFECT X connects what a manufactured product looks like with what was happening during production. The workflow is:

**Product Image → Vision Inspection → Defect Analysis → Production Context → Probable-Cause Analysis → Risk Assessment → Corrective Action → Reinspection → Verification → Production Feedback**

The system distinguishes real inspection evidence from simulated factory telemetry.

## Requirement coverage

| SI-03 requirement | ZERO-DEFECT X implementation | Evidence source |
|---|---|---|
| Machine parameters | Temperature, vibration, pressure and spindle speed are captured from the Virtual Factory and stored as MachineParameter records. | /api/vision/analyze, /api/factory/telemetry, database |
| Batch information | Every inspection is linked to batch_id; batches are stored and queryable. | Batch, Inspection, /api/batches |
| Operator shifts | Every inspection carries shift_id; simulator emits operator shift context. | Shift, Inspection, telemetry payload |
| Environmental conditions | Ambient temperature and humidity are captured and stored as EnvironmentReading records when telemetry is available. | /api/vision/analyze, database |
| Product images | Desktop upload, drag/drop, development test images, and mobile camera capture are supported. | /api/vision/analyze, /mobile-inspection |
| Defect detection | OpenCV image-quality/relevance gating and surface anomaly detection determine PASSED, DEFECTIVE, or NOT_ANALYZABLE. | backend/app/vision/ |
| Defect classification | Detected anomalies are classified into categories such as Scratch, Crack, Dent and Surface Defect using transparent image features. | classifier.py |
| Defect localization | Defects include normalized bounding-box coordinates and are displayed as overlays. | Defect, VisionViewer |
| Severity estimation | Severity is calculated from anomaly/surface metrics and stored with each defect. | severity.py, Defect |
| Probable-cause analysis | Inspection-time telemetry is matched to historical inspections. Normal/elevated parameter windows are compared using observed defect rates. | root_cause_service.py, /api/root-cause/{inspection_id} |
| Risk assessment | Machine risk combines recorded parameter deviations and recorded defect frequency. | risk_service.py, /api/risk |
| Feedback to production | Corrective actions capture before-state, send an intervention to the Virtual Factory, record returned telemetry, and support reinspection verification. | corrective_service.py |
| Closed-loop verification | Verification requires completed corrective action, a PASS/PASSED reinspection, and post-maintenance telemetry within configured normal limits. | verification_service.py |

## Evidence integrity rules

1. A missing or irrelevant product image is returned as NOT_ANALYZABLE; the system does not invent a defect.
2. First-pass inspection requires an actual image upload.
3. Reinspection requires an actual post-maintenance image.
4. Corrective-action completion uses telemetry returned by the connected Virtual Factory; the frontend does not fabricate an after-state when the API fails.
5. Root-cause analysis is described as statistical association, not physical causation.
6. If synchronized telemetry evidence is insufficient, the result explicitly reports insufficient evidence.
7. Simulated factory readings are explicitly labelled SIMULATED FACTORY DATA.
8. Development/demo datasets remain explicitly identifiable and are not used as hidden substitutes for a failed real inspection.

## Local service topology

- React frontend: 5173
- ZERO-DEFECT X FastAPI backend: 8000
- Virtual Factory simulator: 8001
- Backend environment variable: LAPTOP2_URL=http://127.0.0.1:8001

## Current computer-vision scope

The active detector is a development-stage classical computer-vision engine using OpenCV and NumPy. It is explainable and deterministic, but it is not a trained industrial deep-learning model.

For production deployment on a real manufacturing line, the vision layer should be validated against a labelled dataset for each product family and camera/lighting configuration. The repository contains a YOLO integration extension point for that future model.

## Productization roadmap

Before commercial deployment, the following should be added and validated:

- authenticated users and role-based access control;
- multi-factory / multi-tenant data isolation;
- configurable machine/product/baseline administration;
- durable production database and migrations;
- object storage for inspection images;
- audit logging for corrective actions;
- HTTPS and secure secrets management;
- monitoring, backups and retention policies;
- labelled validation datasets and measured vision precision/recall;
- factory-specific calibration and acceptance testing;
- hardware/PLC/OPC-UA/MQTT connectors where required by the customer.

These are productization requirements, not claims that the current hackathon prototype already provides industrial certification or guaranteed defect-detection accuracy.