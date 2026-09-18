# ZERO-DEFECT X
### Vision-Based Defect Intelligence & Preventive Manufacturing System

> **Detect. Diagnose. Correct. Verify.**

[![GitHub Repo](https://img.shields.io/badge/GitHub-ZERO--DEFECT--X-181717?style=for-the-badge&logo=github)](https://github.com/rithiks395-cmd/ZERO-DEFECT-X)
[![Frontend Live](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://zero-defect-x.netlify.app/)
[![Backend Live](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://zero-defect-x-backend.onrender.com)
[![Status](https://img.shields.io/badge/Status-Implemented_%26_Deployed-22A06B?style=for-the-badge)]()

---

## 1. Project Overview

**ZERO-DEFECT X** is a closed-loop, vision-integrated SCADA quality control and industrial decision-support system. It connects real-time physical product image inspection with industrial process telemetry to correlate visual surface defects with machine parameter anomalies.

Instead of treating defect detection as an isolated image classification task, ZERO-DEFECT X links computer vision inspection with production context (`SIMULATED FACTORY DATA`), performs statistical evidence-based root-cause correlation, tracks operator corrective maintenance actions, and executes closed-loop reinspection verification.

---

## 2. SI-03 Problem Statement

In modern high-speed industrial manufacturing:
- **Siloed Inspection**: Quality inspection stations detect surface defects after production, but lack immediate integration with machine sensor telemetry to explain why defects occur.
- **Unverified Maintenance**: Corrective actions are logged manually without deterministic verification that machine parameters were restored to nominal baselines.
- **Lack of Traceability**: Historical quality records rarely link individual physical product SKU photos directly to specific machine stations, operator shifts, and environmental readings.

---

## 3. Our Solution

ZERO-DEFECT X addresses these challenges through a 4-phase closed-loop intelligence architecture:

1. **Detect**: Real product photo capture (via mobile phone camera or desktop SCADA upload) analyzed using an OpenCV Computer Vision anomaly detection engine.
2. **Diagnose**: Automatic correlation of visual defect features (e.g., surface scratches) with live industrial machine telemetry (e.g., elevated vibration on Machine Station M03).
3. **Correct**: Guided corrective maintenance dispatch, logging before-and-after machine parameter snapshots.
4. **Verify**: Reinspection of post-maintenance physical samples to deterministically confirm quality recovery (`VERIFIED` vs `REQUIRES FURTHER INVESTIGATION`).

---

## 4. Key Features

- **Real Product Photo Capture**: Mobile QR code entry (`/mobile-inspection`) allowing physical camera capture of metal ring components on the shop floor.
- **OpenCV Vision Engine**: Adaptive thresholding, contour extraction, bounding box localization, and normalized **Anomaly Scoring** for real product samples.
- **Dual-Laptop Virtual Factory Integration**: Real-time polling client connecting Laptop 1 (SCADA Backend) to Laptop 2 (`10.10.56.118:8000`) Virtual Factory Telemetry API.
- **Live Connection Indicator**: Dynamic SCADA dashboard badge showing `LAPTOP 2 VIRTUAL FACTORY: CONNECTED` when online and `DISCONNECTED / VIRTUAL FACTORY OFFLINE` when unreachable (no faked frontend metrics).
- **Evidence-Based Root Cause Correlation**: Non-causal statistical correlation model outputting *Probable Contributing Factors* supported by historical evidence scores.
- **Risk Monitor & Heatmap**: Multi-signal risk assessment engine categorizing machine risk levels (`CRITICAL`, `HIGH`, `MODERATE`, `LOW`).
- **Closed-Loop Reinspection**: Before/After condition comparison matrix validating that maintenance reduced machine vibration to nominal thresholds (`2.7 mm/s`).

---

## 5. Complete Workflow

```
[ Physical Product Image ]
            │
            ▼
[ Vision Inspection (OpenCV Anomaly Detector) ]
            │
            ├─► Defect Detection (PASSED / DEFECTIVE)
            ├─► Classification (Scratch, Surface Anomaly)
            ├─► Localization (Bounding Box Normalization)
            └─► Anomaly Score (88.5%)
            │
            ▼
[ Production Context Linkage (Laptop 2 SIMULATED FACTORY DATA) ]
            │
            ▼
[ Historical Analysis & Evidence Matching ]
            │
            ▼
[ Probable Contributing Factor Analysis ]
 (e.g., "Elevated Machine Vibration on M03" — Requires Verification)
            │
            ▼
[ Recommended Maintenance Action Dispatch ]
            │
            ▼
[ Corrective Action Execution (M03 Vibration: 4.8 mm/s ──► 2.7 mm/s) ]
            │
            ▼
[ Physical Reinspection Sample Processing ]
            │
            ▼
[ Deterministic Verification Engine (VERIFIED / REQUIRES FURTHER INVESTIGATION) ]
            │
            ▼
[ Closed-Loop Production Feedback & KPI Update ]
```

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LAPTOP 2: VIRTUAL FACTORY                             │
│                  FastAPI Telemetry Node (0.0.0.0:8000)                          │
│         Emits 14 Fields Labeled: "SIMULATED FACTORY DATA"                      │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         │ HTTP GET /api/telemetry
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LAPTOP 1: ZERO-DEFECT X BACKEND                       │
│                        FastAPI Intelligence Server (0.0.0.0:8001)                │
│                                                                                 │
│   ┌───────────────────┐    ┌────────────────────┐    ┌──────────────────────┐   │
│   │  OpenCV Vision    │    │  Root Cause Engine │    │ Verification Engine  │   │
│   │ Anomaly Detector  │    │ (Non-Causal Score) │    │  (Closed-Loop Check) │   │
│   └───────────────────┘    └────────────────────┘    └──────────────────────┘   │
│                                                                                 │
│                        SQLAlchemy / SQLite & PostgreSQL Store                   │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         │ REST API & WebSockets
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LAPTOP 1: REACT SCADA FRONTEND                        │
│                 Vite + TypeScript Custom SCADA UI (0.0.0.0:5173)                │
│                                                                                 │
│   ┌───────────────────┐    ┌────────────────────┐    ┌──────────────────────┐   │
│   │  SCADA Command    │    │ Mobile QR Capture  │    │  Reinspection Matrix │   │
│   │    Center UI      │    │  (/mobile-inspect) │    │   (Before / After)   │   │
│   └───────────────────┘    └────────────────────┘    └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Technical Stack

| Layer | Component | Technologies | Implementation Details |
| :--- | :--- | :--- | :--- |
| **Frontend** | SCADA UI Dashboard | React 18, TypeScript, Vite, Vanilla SCADA CSS, Lucide Icons | Responsive dark SCADA design, dynamic connection badge, mobile QR workflow |
| **Backend** | Intelligence Server | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 | Port 8001, CORS middleware, REST endpoints, telemetry poller |
| **Vision** | Anomaly Detection | OpenCV (`opencv-python-headless`), NumPy | Adaptive thresholding, contour detection, bounding box normalization |
| **Database** | Traceability Store | SQLAlchemy ORM, SQLite (`zerodefect.db`), PostgreSQL schema | Relational models for Inspections, Defects, MachineParameters, Actions, Reinspections |
| **Simulator** | Virtual Factory | Python FastAPI (Port 8000) | 14-field industrial telemetry generator, fault injection & reset endpoints |
| **Deployment** | Cloud Hosting | Render (Backend), Netlify (Frontend), GitHub | Automated CI/CD build scripts, environment variable resolution |

---

## 8. Core Implementation

The core backend and vision processing pipeline is structured across clean modular packages:

- `backend/app/main.py`: Main FastAPI application entry point, CORS configuration, and route registration.
- `backend/app/routers/api_router.py`: REST API routes for vision analysis, live Laptop 2 telemetry polling proxy (`get_live_factory_telemetry`), root-cause queries, risk assessment, corrective actions, and reinspections.
- `backend/app/vision/opencv_provider.py`: OpenCV computer vision implementation extracting anomaly regions, bounding boxes, defect severities, and rendering annotated overlay images.
- `backend/app/services/root_cause_service.py`: Statistical correlation engine matching defect types against historical machine parameter distributions.
- `backend/app/services/verification_service.py`: Closed-loop verification engine evaluating before-and-after machine parameter snapshots.
- `simulator/virtual_factory_server.py`: Network-accessible Virtual Factory server emitting simulated manufacturing line readings.

---

## 9. SI-03 Requirement Alignment

| SI-03 Problem Requirement | Implemented Feature in ZERO-DEFECT X | Implementation Status |
| :--- | :--- | :---: |
| **Visual Surface Defect Detection** | OpenCV Anomaly Detector calculating Anomaly Score and bounding box localization | **IMPLEMENTED** |
| **Shop Floor Image Capture** | Mobile QR Code generator + Mobile Web UI (`/mobile-inspection`) for camera photo capture | **IMPLEMENTED** |
| **Machine Telemetry Linkage** | Automatic linkage of real metal ring photos to Laptop 2 industrial telemetry metrics | **IMPLEMENTED** |
| **Root Cause Analysis** | Statistical correlation engine generating *Probable Contributing Factors* backed by historical evidence | **IMPLEMENTED** |
| **Preventive Action Tracking** | Corrective maintenance action lifecycle management (`PENDING` ──► `VERIFIED`) | **IMPLEMENTED** |
| **Closed-Loop Reinspection** | Reinspection sample evaluation with deterministic before/after comparison matrix | **IMPLEMENTED** |
| **Industrial Telemetry Simulation** | Laptop 2 Virtual Factory Simulator exporting 14 readings labeled `"SIMULATED FACTORY DATA"` | **DEMO / SIMULATION** |
| **Deep Learning YOLOv8 Model** | Extension stub ready for custom model weights integration (`vision/services/demo_provider.py`) | **FUTURE / EXTENSION** |

---

## 10. Development Progress

```
[Phase 1: Project Setup & Database Schema] ───────────────► COMPLETED (100%)
[Phase 2: React SCADA Dashboard & Components] ────────────► COMPLETED (100%)
[Phase 3: OpenCV Computer Vision Engine] ─────────────────► COMPLETED (100%)
[Phase 4: Telemetry Client & Laptop 2 Integration] ───────► COMPLETED (100%)
[Phase 5: Root Cause Engine & Risk Monitor] ──────────────► COMPLETED (100%)
[Phase 6: Closed-Loop Reinspection & Verification] ───────► COMPLETED (100%)
[Phase 7: Cloud Deployment (Render & Netlify)] ───────────► COMPLETED (100%)
```

---

## 11. Development History (Based on Actual Git Commits)

- **Commit `acda748`**: `Configure production backend API URL https://zero-defect-x-backend.onrender.com and fix build types`
  - Added production API resolution fallback in `apiClient.ts` and `.env.production`.
  - Fixed strict TypeScript build types and verified clean `npm run build` bundle output.
- **Commit `7400924`**: `Add opencv-python-headless to backend requirements.txt for Render cloud deployment`
  - Added headless OpenCV dependency for GUI-less cloud server deployment on Render.
  - Verified backend package imports (`from app.vision.opencv_provider import OpenCVVisionProvider`).
- **Commit `f039ab1`**: `Complete ZERO-DEFECT X prototype with vision, root cause, corrective action and virtual factory`
  - Initialized complete project repository containing React SCADA frontend, FastAPI backend, OpenCV vision engine, Laptop 2 simulator, database schemas, and documentation.

---

## 12. Screenshots / Working Prototype

> [!NOTE]
> The screenshots below illustrate the actual working user interface of the ZERO-DEFECT X system.
> *To view rendered screenshot previews in the repository, add real PNG/JPG image files into the `docs/assets/` folder.*

1. **SCADA Command Center Dashboard**:
   `![SCADA Command Center](docs/assets/command_center.png)`
   *Displays live Laptop 2 connection status, KPI metrics, recent inspection records, defect distribution, and high-risk machine alerts.*

2. **Laptop 2 Telemetry & Connection Status Card**:
   `![Laptop 2 Telemetry Card](docs/assets/laptop2_connection.png)`
   *Renders live telemetry fields (vibration, temperature, pressure, RPM, humidity) with explicit `SIMULATED FACTORY DATA` badge.*

3. **Mobile QR Code Photo Capture**:
   `![Mobile Inspection QR](docs/assets/mobile_inspection.png)`
   *Displays mobile inspection QR code linking phone camera uploads directly to Laptop 1 backend.*

4. **Vision Analysis & Bounding Box Overlay**:
   `![Vision Analysis Details](docs/assets/vision_details.png)`
   *Displays raw product image, OpenCV annotated image, anomaly score, defect type, and localization.*

5. **Closed-Loop Reinspection & Verification Matrix**:
   `![Reinspection Matrix](docs/assets/reinspection_matrix.png)`
   *Compares BEFORE vs AFTER machine parameters and quality status, confirming deterministic verification.*

---

## 13. Live Demo Links

- **GitHub Repository**: [https://github.com/rithiks395-cmd/ZERO-DEFECT-X](https://github.com/rithiks395-cmd/ZERO-DEFECT-X)
- **Live React Frontend**: [https://zero-defect-x.netlify.app/](https://zero-defect-x.netlify.app/)
- **Live FastAPI Backend**: [https://zero-defect-x-backend.onrender.com](https://zero-defect-x-backend.onrender.com)
- **Backend API Health Check**: [https://zero-defect-x-backend.onrender.com/api/health](https://zero-defect-x-backend.onrender.com/api/health)
- **Backend OpenAPI Docs**: [https://zero-defect-x-backend.onrender.com/docs](https://zero-defect-x-backend.onrender.com/docs)

---

## 14. Installation and Setup

### Local Prerequisites
- **Python 3.10** or higher
- **Node.js 18** or higher

### Step 1: Clone Repository
```bash
git clone https://github.com/rithiks395-cmd/ZERO-DEFECT-X.git
cd ZERO-DEFECT-X
```

### Step 2: Start Virtual Factory Simulator (Laptop 2 / Local Port 8000)
```bash
python -m uvicorn simulator.virtual_factory_server:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Start Backend Server (Laptop 1 / Local Port 8001)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Step 4: Start Frontend Development Server (Laptop 1 / Local Port 5173)
```bash
cd ../frontend
npm install
npm run dev -- --host 0.0.0.0
```

---

## 15. Environment Variables

### Backend Environment (`backend/.env`)
```ini
# Server Execution Port & Host
PORT=8001
HOST=0.0.0.0

# Laptop 2 Telemetry Endpoint
LAPTOP2_URL=http://10.10.56.118:8000/api/telemetry

# Database URL (SQLite default for zero-config execution, or PostgreSQL)
DATABASE_URL=sqlite:///./zerodefect.db

# CORS Configuration
CORS_ORIGINS=*
```

### Frontend Environment (`frontend/.env.production`)
```ini
# Production API URL (Render cloud deployment)
VITE_API_URL=https://zero-defect-x-backend.onrender.com/api
```

---

## 16. Virtual Factory / Simulation

The industrial process line telemetry used in ZERO-DEFECT X is generated by the network-accessible Virtual Factory server (`simulator/virtual_factory_server.py`).

### Emitted Telemetry Metrics:
- `product_id`: Active product SKU (`RING-001`)
- `batch_id`: Active production batch (`B1042`)
- `machine_id`: Machine station (`M01`, `M02`, `M03`, `M04`)
- `operator_shift`: Active shift (`Shift A`, `Shift B`, `Shift C`)
- `temperature_c`: Machine station temperature (°C)
- `vibration_mm_s`: Drive spindle vibration (mm/s)
- `pressure_bar`: Hydraulic pressure (bar)
- `spindle_rpm`: Spindle rotation speed (RPM)
- `environment_temp_c`: Ambient shop floor temperature (°C)
- `humidity_pct`: Ambient relative humidity (%)
- `machine_status`: Station status (`NORMAL`, `WARNING`, `FAULT`)
- `production_status`: Line status (`RUNNING`, `PAUSED`, `STOPPED`)
- `timestamp`: ISO-8601 UTC timestamp
- `data_type`: Explicitly marked `"SIMULATED FACTORY DATA"`

> [!IMPORTANT]
> All Virtual Factory readings are explicitly labeled **`SIMULATED FACTORY DATA`** across the SCADA UI and API responses to maintain complete transparency during live demonstrations.

---

## 17. Vision / AI Transparency

- **Current Active Vision Engine**: OpenCV (`cv2`) image processing module (`app/vision/opencv_provider.py`).
- **Vision Metric Output**: The confidence score produced by the OpenCV detector represents a mathematical **Anomaly Score** based on thresholded contour area, perimeter ratio, and pixel intensity variance.
- **Deep Learning Model Extension**: Deep learning models (e.g. YOLOv8) are included as extension stubs (`vision/services/demo_provider.py`) for future custom model weight training. In the current release, primary inspection is executed by the OpenCV engine.

---

## 18. Data Integrity and Explainability

ZERO-DEFECT X adheres strictly to industrial explainability standards:
- **Non-Causal Language**: The root cause correlation engine never claims definite physical causation. It identifies **Probable Contributing Factors**, **Observed Associations**, and **Supporting Evidence**.
- **Verification Requirement**: All probable factors are flagged with `REQUIRES VERIFICATION: YES` until an authorized operator performs maintenance and submits a reinspection sample.
- **Honest Connection Dynamics**: If Laptop 2 is offline or unreachable, the SCADA card updates dynamically to `DISCONNECTED / VIRTUAL FACTORY OFFLINE`. Telemetry values are never silently fabricated when the network connection is lost.

---

## 19. Future Scope

1. **Edge AI Deployment**: Exporting trained YOLOv8 ONNX models to edge hardware (e.g., NVIDIA Jetson Orin Nano) for sub-10ms inference.
2. **OPC UA / Modbus Protocol Integration**: Replacing HTTP simulation endpoints with direct OPC UA / MQTT industrial PLC connectivity.
3. **Automated Closed-Loop PLC Control**: Direct feedback loops issuing automated speed reduction signals to PLC drive controllers upon detecting critical vibration anomalies.

---

## 20. Project Status

- **Core Functionality**: **100% IMPLEMENTED & VERIFIED**
- **Automated Test Suite**: **PASSED (Phase 4, Phase 5, Phase 6 Suites 100% Passed)**
- **Cloud Deployments**: **LIVE**
  - Frontend: [https://zero-defect-x.netlify.app/](https://zero-defect-x.netlify.app/)
  - Backend: [https://zero-defect-x-backend.onrender.com](https://zero-defect-x-backend.onrender.com)
