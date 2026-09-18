# ZERODEFECT X — System Architecture Specification

## 1. System Overview & Modular Separation

ZeroDefect X is decoupled into modular layers to facilitate swapping simulated hardware with real industrial cameras, ESP32 IoT sensors, and trained YOLO object-detection models:

```
+-------------------------------------------------------------------+
|                        React App Shell (UI)                       |
|           Command Center | Inspection | Intelligence | SCADA      |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                         Service Layer                             |
|    visionService | machineService | rootCauseService | riskService |
+-------------------------------------------------------------------+
                                  |
        +-------------------------+-------------------------+
        |                                                   |
        v                                                   v
+------------------------------------+   +------------------------------------+
|       Vision Model Abstraction     |   |      FastAPI Backend & Database    |
| DemoVisionProvider | YOLOProvider  |   | PostgreSQL Schema | Sensor Ingest |
+------------------------------------+   +------------------------------------+
```

## 2. Vision Abstraction Layer
The frontend connects to `VisionModelProvider` interface:
- `DemoVisionProvider`: Default simulation provider.
- `YOLOVisionProvider`: Future hardware endpoint driver for PyTorch / TensorRT inference servers.

## 3. Root-Cause Engine Scoring Logic
Formula for evidence scoring:
- Vibration Anomaly Score ($S_{vib}$): Weight = 0.84 if vibration exceeds baseline by $>+100\%$.
- Thermal Elevation Score ($S_{temp}$): Weight = 0.38 if temperature exceeds baseline by $>+10\%$.
- Evidence Score = $\max(S_{vib}, S_{temp}) \times 100$.

## 4. Hardware Integration Architecture (ESP32 / MQTT)
Future ESP32 sensors emit telemetry payload via MQTT / HTTP:
```json
{
  "machine_id": "M03",
  "temperature": 78.4,
  "vibration": 4.8,
  "pressure": 6.8,
  "speed": 1480,
  "timestamp": "2026-09-18T10:32:15Z"
}
```
FastAPI ingests and broadcasts via WebSockets to updating SCADA cards.
