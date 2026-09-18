"""
ZeroDefect X — Laptop 2 Virtual Factory Simulator Server
Network-accessible API representing the physical manufacturing process line:
Raw Material -> M01 -> M02 -> M03 -> M04 -> Vision Inspection -> Quality Check -> Pass/Reject -> Finished Product

Listens on 0.0.0.0:8000 or 8001 (configurable via PORT env var).
Explicitly marks all emitted readings with: "SIMULATED FACTORY DATA"
"""

import os
import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="ZeroDefect X — Virtual Factory Node (Laptop 2)",
    description="Simulated Manufacturing Line & Industrial Sensor Telemetry Engine",
    version="3.0.0"
)

# Enable CORS for cross-device & Laptop 1 LAN communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulated Factory State Store
FACTORY_STATE = {
    "factory_status": "ONLINE",
    "production_status": "RUNNING",
    "factory_node_id": "LAPTOP2-VIRTUAL-FACTORY-NODE-01",
    "active_batch": "B1042",
    "active_product": "RING-001",
    "operator_shift": "Shift B",
    "process_flow": [
        "Raw Material Preparation",
        "M01 (Precision Milling)",
        "M02 (CNC Lathe Turning)",
        "M03 (High-Velocity Stamping Press)",
        "M04 (Automated Deburring & Polish)",
        "Vision Inspection Station",
        "Quality Quarantine Check",
        "PASS / REJECT Sorting",
        "Finished Product Packaging"
    ],
    "machines": {
        "M01": {"temperature": 62.5, "vibration": 1.2, "pressure": 5.8, "speed": 1600, "status": "NORMAL"},
        "M02": {"temperature": 66.8, "vibration": 1.8, "pressure": 6.0, "speed": 1550, "status": "NORMAL"},
        "M03": {"temperature": 72.0, "vibration": 4.8, "pressure": 6.2, "speed": 1480, "status": "WARNING"},
        "M04": {"temperature": 58.2, "vibration": 0.8, "pressure": 5.2, "speed": 1400, "status": "NORMAL"},
    },
    "environment": {
        "temperature": 29.0,
        "humidity": 68.0
    }
}

class ActionPayload(BaseModel):
    machine_id: str = "M03"
    action_type: str = "dampen_vibration"
    target_vibration: float = 2.7
    notes: Optional[str] = "Corrective maintenance applied to M03 drive spindle"


@app.get("/")
def read_root():
    return {
        "data_type": "SIMULATED FACTORY DATA",
        "source_label": "SIMULATED FACTORY DATA",
        "system": "ZeroDefect X Virtual Factory Simulator Node (Laptop 2)",
        "status": FACTORY_STATE["factory_status"],
        "node_id": FACTORY_STATE["factory_node_id"],
        "active_product": FACTORY_STATE["active_product"],
        "active_batch": FACTORY_STATE["active_batch"],
        "process_flow": FACTORY_STATE["process_flow"],
        "docs": "/docs"
    }


@app.get("/api/factory/status")
def get_factory_status():
    return {
        "data_type": "SIMULATED FACTORY DATA",
        "source_label": "SIMULATED FACTORY DATA",
        "is_simulated": True,
        "connection_status": "CONNECTED",
        "factory_status": FACTORY_STATE["factory_status"],
        "production_status": FACTORY_STATE["production_status"],
        "node_id": FACTORY_STATE["factory_node_id"],
        "active_batch": FACTORY_STATE["active_batch"],
        "active_product": FACTORY_STATE["active_product"],
        "operator_shift": FACTORY_STATE["operator_shift"],
        "process_flow": FACTORY_STATE["process_flow"],
        "machines": FACTORY_STATE["machines"],
        "environment": FACTORY_STATE["environment"],
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


@app.get("/api/telemetry")
@app.get("/api/factory/telemetry")
def get_telemetry(
    machine_id: str = Query("M03"),
    product_id: str = Query("RING-001"),
    batch_id: str = Query("B1042")
):
    m_id = machine_id if machine_id in FACTORY_STATE["machines"] else "M03"
    machine_data = FACTORY_STATE["machines"][m_id]
    now_iso = datetime.datetime.utcnow().isoformat()

    return {
        "data_type": "SIMULATED FACTORY DATA",
        "source_label": "SIMULATED FACTORY DATA",
        "is_simulated": True,
        "connection_status": "CONNECTED",
        "factory_status": FACTORY_STATE["factory_status"],
        "production_status": FACTORY_STATE["production_status"],
        "product_id": product_id or FACTORY_STATE["active_product"],
        "batch_id": batch_id or FACTORY_STATE["active_batch"],
        "machine_id": m_id,
        "operator_shift": FACTORY_STATE["operator_shift"],
        "temperature_c": float(machine_data["temperature"]),
        "vibration_mm_s": float(machine_data["vibration"]),
        "pressure_bar": float(machine_data["pressure"]),
        "spindle_rpm": int(machine_data["speed"]),
        "environment_temp_c": float(FACTORY_STATE["environment"]["temperature"]),
        "humidity_pct": float(FACTORY_STATE["environment"]["humidity"]),
        "machine_status": machine_data["status"],
        "timestamp": now_iso,
        # Legacy/nested fields for backwards compatibility
        "telemetry": {
            "temperature": machine_data["temperature"],
            "vibration": machine_data["vibration"],
            "pressure": machine_data["pressure"],
            "speed": machine_data["speed"],
            "status": machine_data["status"]
        },
        "environment": {
            "temperature": FACTORY_STATE["environment"]["temperature"],
            "humidity": FACTORY_STATE["environment"]["humidity"]
        }
    }


@app.post("/api/factory/corrective-action")
@app.post("/api/corrective-action")
def apply_corrective_action(payload: ActionPayload):
    m_id = payload.machine_id
    if m_id not in FACTORY_STATE["machines"]:
        m_id = "M03"

    old_vib = FACTORY_STATE["machines"][m_id]["vibration"]
    new_vib = payload.target_vibration
    
    # Update state
    FACTORY_STATE["machines"][m_id]["vibration"] = new_vib
    FACTORY_STATE["machines"][m_id]["temperature"] = 65.0
    FACTORY_STATE["machines"][m_id]["status"] = "NORMAL"

    return {
        "data_type": "SIMULATED FACTORY DATA",
        "source_label": "SIMULATED FACTORY DATA",
        "success": True,
        "machine_id": m_id,
        "previous_vibration": old_vib,
        "current_vibration": new_vib,
        "machine_status": "NORMAL",
        "message": f"Corrective action applied on {m_id}. Vibration reduced from {old_vib} mm/s to {new_vib} mm/s.",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }


@app.post("/api/factory/reset")
@app.post("/api/reset")
def reset_factory_state():
    FACTORY_STATE["machines"]["M03"] = {
        "temperature": 72.0,
        "vibration": 4.8,
        "pressure": 6.2,
        "speed": 1480,
        "status": "WARNING"
    }
    return {
        "data_type": "SIMULATED FACTORY DATA",
        "source_label": "SIMULATED FACTORY DATA",
        "success": True,
        "message": "Virtual Factory M03 state reset to elevated vibration (4.8 mm/s).",
        "m03_vibration": 4.8
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Laptop 2 Virtual Factory Simulator on 0.0.0.0:{port}...")
    uvicorn.run("simulator.virtual_factory_server:app", host="0.0.0.0", port=port, reload=True)
