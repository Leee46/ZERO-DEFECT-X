# ZERODEFECT X

## Vision-Based Defect Intelligence & Preventive Manufacturing System

> **TAGLINE**: *"Detect. Diagnose. Predict. Prevent."*

---

## 1. Executive Summary

**ZeroDefect X** is an intelligent manufacturing quality-inspection platform designed to solve a fundamental industrial challenge:

> *"Visual inspection can identify manufacturing defects, but knowing that a defect exists is only part of the problem. Manufacturing teams also need to understand the nature, severity and possible operational causes of the defect."*

The platform connects:
- Product images & bounding box defect localization
- Machine telemetry parameters (vibration, temperature, pressure, speed)
- Batch & Shift metadata
- Environmental conditions (temperature, humidity)
- Historical baseline associations

---

## 2. Differentiating Vision Architecture

Unlike generic image classification landing pages or AI mockups, ZeroDefect X enforces a continuous manufacturing feedback loop:

```
PRODUCT APPEARANCE + MANUFACTURING CONTEXT → PROBABLE CONTRIBUTING FACTOR → ACTION → VERIFICATION
```

### Complete System Loop:
`DETECT` → `CLASSIFY` → `LOCALIZE` → `ASSESS` → `CORRELATE` → `DIAGNOSE` → `PREDICT` → `ACT` → `REINSPECT` → `LEARN`

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, React Router, Recharts, Lucide Icons, Modern SCADA CSS
- **Backend Architecture**: Python 3.14, FastAPI, REST APIs, Pydantic Schemas
- **Database Architecture**: PostgreSQL 15 (Schema & Seed SQL scripts provided)
- **Computer Vision Abstraction**: `DemoVisionProvider` (swappable with `YOLOVisionProvider` or ONNX TensorRT model)
- **Analytics Engine**: Deterministic Heuristic Evidence Scoring Engine

---

## 4. How to Run the Application

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

### Backend (Python FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m app.main
```

FastAPI server runs at `http://localhost:8000`.
API Docs available at `http://localhost:8000/docs`.

---

## 5. Controlled Demonstration Dataset

Machine **M03** contains a deliberate historical association between elevated drive spindle vibration (**4.8 mm/s** vs **2.1 mm/s** baseline) and **Scratch** defects on Batch **B1042**.
