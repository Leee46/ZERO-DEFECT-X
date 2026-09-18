# ZERODEFECT X — REST API Specification

## Endpoints Summary

### 1. Dashboard
- `GET /api/dashboard`
  - Returns top KPIs (total inspected, defect count, defect rate, current risk score).

### 2. Machines Telemetry
- `GET /api/machines`
  - Returns list of machine stations (M01..M04) with live vibration, temp, pressure, and risk level.
- `GET /api/machines/{id}`
  - Returns detailed telemetry and historical defect trend for machine.

### 3. Inspections
- `GET /api/inspections`
  - Searchable list of inspection records.
- `POST /api/inspections`
  - Trigger new optical vision inspection. Accepts product SKU, batch, machine ID, and image file.

### 4. Root-Cause Analysis
- `POST /api/root-cause/analyze`
  - Correlates vision result with machine telemetry & historical rules. Returns evidence points & association score.

### 5. Risk Monitor
- `GET /api/risk`
  - Machine defect risk matrix & contributing signals.
