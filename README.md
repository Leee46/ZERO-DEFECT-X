# ZERO-DEFECT X — AI-Driven Industrial Quality Control & Virtual Factory SCADA System

ZERO-DEFECT X is an end-to-end closed-loop SCADA quality inspection and industrial decision-support system. It integrates computer vision (OpenCV Anomaly Detection), live production line telemetry (Laptop 2 Virtual Factory), statistical root-cause analytics, real-time risk monitoring, corrective action tracking, and mobile QR photo capture.

---

## 🏗️ System Architecture & Subsystems

```
                                +-----------------------------------+
                                |    Laptop 2: Virtual Factory      |
                                |       Telemetry API Server        |
                                |     (http://10.10.56.118:8000)    |
                                +-----------------+-----------------+
                                                  |
                                                  | GET /api/telemetry (14 fields)
                                                  v
+-----------------------------------+   +---------+-------------------------+
|     Mobile Phone Camera Client    |   |     Laptop 1: ZERO-DEFECT X       |
| (http://10.10.56.134:5173/mobile) |-->|           FastAPI Backend         |
|      Real Metal Ring Capture      |   |       (http://10.10.56.134:8001)   |
+-----------------------------------+   +---------+-------------------------+
                                                  |
                                                  | REST API & WebSockets
                                                  v
                                        +---------+-------------------------+
                                        |     Laptop 1: ZERO-DEFECT X       |
                                        |           React SCADA             |
                                        |    Dashboard (0.0.0.0:5173)       |
                                        +-----------------------------------+
```

### Key Subsystems:
1. **Frontend (`/frontend`)**: React + Vite SCADA Command Center displaying real-time inspection status, live Laptop 2 telemetry indicators (`CONNECTED` / `DISCONNECTED`), risk heatmaps, root cause trees, and corrective action workflows.
2. **Backend (`/backend`)**: FastAPI Python backend running on port `8001`. Manages SQLite/PostgreSQL persistence, telemetry polling client, analytics endpoints, and verification engine.
3. **Vision Engine (`/vision`)**: OpenCV-based image analysis module running multi-class surface anomaly detection, bounding box extraction, and confidence scoring for real product photos.
4. **Virtual Factory Simulator (`/simulator`)**: Network-accessible FastAPI server running on port `8000` (Laptop 2), exporting 14 industrial telemetry metrics (`product_id`, `batch_id`, `machine_id`, `operator_shift`, `vibration_mm_s`, `temperature_c`, `pressure_bar`, `spindle_rpm`, `environment_temp_c`, `humidity_pct`, `machine_status`, `production_status`, `timestamp`, `data_type="SIMULATED FACTORY DATA"`).
5. **Analytics (`/analytics`)**: Risk assessment engine, root-cause correlation model, and statistical defect distribution modules.
6. **Documentation (`/docs`)**: Architecture guides, API reference specs, and step-by-step hackathon demonstration flows.

---

## 🚀 Quick Startup Guide

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Laptop 2 — Virtual Factory Simulator
```bash
python -m uvicorn simulator.virtual_factory_server:app --host 0.0.0.0 --port 8000 --reload
```
- **Telemetry Endpoint**: `http://10.10.56.118:8000/api/telemetry`
- **Interactive UI**: `http://10.10.56.118:8000/factory/`

### 2. Laptop 1 — Backend Intelligence Server
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
- **Backend API URL**: `http://10.10.56.134:8001/api`
- **Swagger Docs**: `http://10.10.56.134:8001/docs`

### 3. Laptop 1 — React SCADA Dashboard
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```
- **Dashboard URL**: `http://10.10.56.134:5173`
- **Mobile QR Capture URL**: `http://10.10.56.134:5173/mobile-inspection`

---

## 🧪 Automated Testing

Run the automated test runner verifying Phase 4, Phase 5, and Phase 6 workflows:
```bash
python backend/run_all_tests.py
```

---

## 🔒 Security & Exclusions

Sensitive local configuration files (`.env`), SQLite database storage (`*.db`), Python cache files (`__pycache__`), and `node_modules/` are excluded via `.gitignore`.
