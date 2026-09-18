# ZERO-DEFECT X — Vision-Based Defect Intelligence & Preventive Manufacturing System

> **Detect. Diagnose. Correct. Verify.**

[![GitHub Repo](https://img.shields.io/badge/GitHub-ZERO--DEFECT--X-181717?style=for-the-badge&logo=github)](https://github.com/rithiks395-cmd/ZERO-DEFECT-X)
[![Frontend Live](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://zero-defect-x.netlify.app/)
[![Backend Live](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render)](https://zero-defect-x-backend.onrender.com)
[![Status](https://img.shields.io/badge/Status-Implemented_%26_Deployed-22A06B?style=for-the-badge)]()

---

## 1. Project Overview

**ZERO-DEFECT X** is a vision-based defect intelligence and preventive manufacturing decision-support system. It connects physical product image inspection with industrial process telemetry to correlate visual surface defects with machine parameter anomalies.

Instead of treating quality control as an isolated image classification task, ZERO-DEFECT X links computer vision inspection with production context (`SIMULATED FACTORY DATA`), performs statistical evidence-based root-cause correlation, tracks operator corrective maintenance actions, and executes closed-loop reinspection verification.

---

## 2. Problem Statement

In modern high-speed industrial manufacturing:
- **Siloed Quality Inspection**: Quality inspection stations detect surface defects after production, but lack immediate integration with machine sensor telemetry to explain why defects occur.
- **Unverified Maintenance**: Corrective actions are logged manually without deterministic verification that machine parameters were restored to nominal baselines.
- **Lack of End-to-End Traceability**: Historical quality records rarely link individual physical product SKU photos directly to specific machine stations, operator shifts, and environmental readings.

---

## 3. Solution

ZERO-DEFECT X addresses these challenges through a 4-phase closed-loop architecture:

1. **Detect**: Real product photo capture (via mobile phone camera or desktop SCADA upload) analyzed using an OpenCV computer vision engine generating an **explainable anomaly score**.
2. **Diagnose**: Automatic correlation of visual defect features (e.g., surface scratches) with industrial machine telemetry (e.g., elevated vibration on Machine Station M03).
3. **Correct**: Guided corrective maintenance dispatch, logging before-and-after machine parameter snapshots.
4. **Verify**: Reinspection of post-maintenance physical samples to deterministically confirm quality recovery (`VERIFIED` vs `REQUIRES FURTHER INVESTIGATION`).

---

## 4. Key Features

- **Real Product Photo Capture** `[IMPLEMENTED]`: Mobile QR code entry (`/mobile-inspection`) allowing physical camera capture of metal ring components on the shop floor.
- **OpenCV Computer Vision Engine** `[IMPLEMENTED]`: Adaptive thresholding, contour extraction, bounding box localization, and normalized **explainable anomaly score** for real product samples.
- **Dual-Laptop Virtual Factory Integration** `[DEMO / SIMULATION]`: Real-time polling client connecting Laptop 1 (SCADA Backend) to Laptop 2 Virtual Factory Telemetry API.
- **Live Connection Indicator** `[IMPLEMENTED]`: Dynamic SCADA dashboard badge showing `LAPTOP 2 VIRTUAL FACTORY: CONNECTED` when online and `DISCONNECTED / VIRTUAL FACTORY OFFLINE` when unreachable (no faked frontend metrics).
- **Evidence-Based Root Cause Correlation** `[IMPLEMENTED]`: Non-causal statistical correlation model outputting *Probable Contributing Factors* supported by historical evidence scores.
- **Risk Monitor & Heatmap** `[IMPLEMENTED]`: Multi-signal risk assessment engine categorizing machine risk levels (`CRITICAL`, `HIGH`, `MODERATE`, `LOW`).
- **Closed-Loop Reinspection** `[IMPLEMENTED]`: Before/After condition comparison matrix validating that maintenance reduced machine vibration to nominal thresholds (`2.7 mm/s`).
- **Deep Learning Inference** `[FUTURE SCOPE]`: Extension stub prepared for future custom YOLOv8 object detection model weights.

---

## 5. Complete Workflow

```
[ Product Image ]
        │
        ▼
[ Vision Inspection (OpenCV Anomaly Detector) ]
        │
        ├─► Defect Detection (PASSED / DEFECTIVE)
        ├─► Classification (Scratch, Surface Defect)
        ├─► Localization (Bounding Box Normalization)
        └─► Severity Estimation & Explainable Anomaly Score
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
[ Recommended Maintenance Action ]
        │
        ▼
[ Corrective Action Execution (M03 Vibration: 4.8 mm/s ──► 2.7 mm/s) ]
        │
        ▼
[ Reinspection Sample Processing ]
        │
        ▼
[ Verification Engine (VERIFIED / REQUIRES FURTHER INVESTIGATION) ]
        │
        ▼
[ Production Feedback Loop & KPI Update ]
```

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      LAPTOP 2: VIRTUAL FACTORY (SIMULATION)                     │
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

| Layer | Component | Technologies | Implementation Status |
| :--- | :--- | :--- | :---: |
| **Frontend** | SCADA UI Dashboard | React 18, TypeScript, Vite, SCADA SCSS/CSS, Lucide Icons | **IMPLEMENTED** |
| **Backend** | Intelligence Server | Python 3.10+, FastAPI, Uvicorn, Pydantic v2 | **IMPLEMENTED** |
| **Vision** | Anomaly Detection | OpenCV (`opencv-python-headless`), NumPy | **IMPLEMENTED** |
| **Database** | Traceability Store | SQLAlchemy ORM, SQLite (`zerodefect.db`), PostgreSQL schema | **IMPLEMENTED** |
| **Simulator** | Virtual Factory | Python FastAPI (Port 8000) | **DEMO / SIMULATION** |
| **Deep Learning** | Object Detection | YOLOv8 ONNX / PyTorch Integration Stub | **FUTURE SCOPE** |

---

## 8. Core Implementation

The backend and vision processing pipeline is structured across clean modular packages:

- `backend/app/main.py`: Main FastAPI application entry point, CORS configuration, and route registration.
- `backend/app/routers/api_router.py`: REST API routes for vision analysis, live Laptop 2 telemetry polling proxy (`get_live_factory_telemetry`), root-cause queries, risk assessment, corrective actions, and reinspections.
- `backend/app/vision/opencv_provider.py`: OpenCV computer vision implementation extracting anomaly regions, bounding boxes, defect severities, and rendering annotated overlay images.
- `backend/app/services/root_cause_service.py`: Statistical correlation engine matching defect types against historical machine parameter distributions.
- `backend/app/services/verification_service.py`: Closed-loop verification engine evaluating before-and-after machine parameter snapshots.
- `simulator/virtual_factory_server.py`: Network-accessible Virtual Factory server emitting simulated manufacturing line readings.

---

## 9. SI-03 Requirement Alignment

| SI-03 Requirement | Implemented Feature in ZERO-DEFECT X | Implementation Status |
| :--- | :--- | :---: |
| **Defect Detection** | OpenCV Anomaly Detector calculating Anomaly Score (`app/vision/opencv_provider.py`) | **IMPLEMENTED** |
| **Classification** | Multi-class defect categorization (Scratch, Surface Defect, Normal Component) | **IMPLEMENTED** |
| **Localization** | Bounding box normalization (`norm_x_min`, `norm_y_min`, `norm_x_max`, `norm_y_max`) | **IMPLEMENTED** |
| **Severity Estimation** | Rule-based severity rating (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) based on contour metrics | **IMPLEMENTED** |
| **Machine Parameters** | Telemetry ingestion: temperature (°C), vibration (mm/s), pressure (bar), spindle RPM | **DEMO / SIMULATION** |
| **Batch Information** | Active production batch tracking (`batch_id`, e.g., `B1042`) | **IMPLEMENTED** |
| **Operator Shift** | Shift metadata association (`shift_id`, e.g., `Shift B`) | **IMPLEMENTED** |
| **Environmental Conditions** | Shop floor environmental monitoring: ambient temperature (°C) and humidity (%) | **DEMO / SIMULATION** |
| **Product Images** | Real product image upload and mobile camera capture (`/mobile-inspection`) | **IMPLEMENTED** |
| **Probable-Cause Analysis** | Statistical correlation engine generating non-causal *Probable Contributing Factors* | **IMPLEMENTED** |
| **Feedback to Production** | Corrective maintenance action logging and closed-loop reinspection verification | **IMPLEMENTED** |

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

## 11. Development History

The project evolution is recorded in the repository Git commit history:

- **Commit `acda748`**: `Configure production backend API URL https://zero-defect-x-backend.onrender.com and fix build types`
  - Configured production API URL resolution fallback in `apiClient.ts` and `.env.production`.
  - Resolved strict TypeScript compilation types and verified clean `npm run build` bundle output.
- **Commit `7400924`**: `Add opencv-python-headless to backend requirements.txt for Render cloud deployment`
  - Added headless OpenCV dependency for GUI-less cloud server deployment on Render.
  - Verified backend package imports (`from app.vision.opencv_provider import OpenCVVisionProvider`).
- **Commit `f039ab1`**: `Complete ZERO-DEFECT X prototype with vision, root cause, corrective action and virtual factory`
  - Initialized complete project repository containing React SCADA frontend, FastAPI backend, OpenCV vision engine, Laptop 2 simulator, database schemas, and documentation.

---

## 12. Screenshots / Working Prototype

> [!NOTE]
> The image placeholders below represent the actual user interface of the ZERO-DEFECT X system.
> *To view rendered screenshot previews in the repository, place PNG/JPG image files into the `docs/assets/` directory.*

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

### Step 2: Start Virtual Factory Simulator (Local Port 8000)
```bash
python -m uvicorn simulator.virtual_factory_server:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Start Backend Server (Local Port 8001)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Step 4: Start Frontend Development Server (Local Port 5173)
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

## 16. Virtual Factory / Simulation & Local Demonstration

The industrial process line telemetry used in ZERO-DEFECT X is generated by a network-accessible Virtual Factory server (`simulator/virtual_factory_server.py`).

### Local Network Demonstration Setup:
- **Laptop 1 (SCADA & Backend)**: IP `10.10.56.134` (FastAPI on Port `8001`, React on Port `5173`)
- **Laptop 2 (Virtual Factory Node)**: IP `10.10.56.118` (Telemetry API on Port `8000`)
- **Laptop 2 Telemetry Endpoint**: `http://10.10.56.118:8000/api/telemetry`

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

- **Current Active Vision Implementation**: Classical computer vision powered by OpenCV (`opencv-python-headless`) in `app/vision/opencv_provider.py`.
- **Methodology**: Grayscale conversion, Gaussian blurring, adaptive thresholding, contour extraction, bounding box normalization, and deterministic calculation of an **explainable anomaly score**.
- **Nature of Algorithm**: OpenCV processing is an algorithmic image analysis technique, not a deep-learning neural network or black-box AI model.
- **Deep Learning Model Extension**: Extension stubs (`vision/services/demo_provider.py` & `app/vision/yolo_provider.py`) are prepared for future YOLOv8 ONNX/PyTorch model weight integration `[FUTURE SCOPE]`.

---

## 18. Data Integrity and Explainability

ZERO-DEFECT X adheres strictly to industrial explainability standards:
- **Non-Causal Terminology**: The root cause correlation engine never claims definite physical causation. It identifies **Probable Contributing Factors**, **Observed Associations**, and **Supporting Evidence**.
- **Verification Requirement**: All probable factors are flagged with `REQUIRES VERIFICATION: YES` until an authorized operator performs maintenance and submits a reinspection sample.
- **Honest Connection Dynamics**: If Laptop 2 is offline or unreachable, the SCADA card updates dynamically to `DISCONNECTED / VIRTUAL FACTORY OFFLINE`. Telemetry values are never silently fabricated when the network connection is lost.

---

## 19. Future Scope

1. **Deep Learning Object Detection** `[FUTURE SCOPE]`: Integrating custom-trained YOLOv8 ONNX model weights for multi-class industrial defect segmentation.
2. **OPC UA / Modbus Protocol Integration** `[FUTURE SCOPE]`: Replacing HTTP simulation endpoints with direct OPC UA / MQTT industrial PLC connectivity.
3. **Automated Closed-Loop PLC Control** `[FUTURE SCOPE]`: Direct feedback loops issuing automated speed reduction signals to PLC drive controllers upon detecting critical vibration anomalies.

---

## 20. Project Status

- **Core Functionality**: **100% IMPLEMENTED & VERIFIED**
- **Automated Test Suite**: **PASSED (Phase 4, Phase 5, Phase 6 Suites 100% Passed)**
- **Cloud Deployments**: **LIVE**
  - Frontend: [https://zero-defect-x.netlify.app/](https://zero-defect-x.netlify.app/)
  - Backend: [https://zero-defect-x-backend.onrender.com](https://zero-defect-x-backend.onrender.com)
