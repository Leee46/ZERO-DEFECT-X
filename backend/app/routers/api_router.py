import os
import uuid
import datetime
import shutil
import json
import urllib.request
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import (
    Product, Shift, Machine, Batch, MachineParameter,
    EnvironmentReading, Inspection, Defect, RootCauseAnalysis,
    RiskAssessment, CorrectiveAction, Reinspection, Alert
)
from app.schemas.schemas import (
    ProductOut, ShiftOut, MachineOut, BatchOut, InspectionOut, InspectionCreate,
    DefectOut, RootCauseOut, RootCauseRequest, RiskAssessmentOut, CorrectiveActionOut,
    CorrectiveActionCreate, CorrectiveActionUpdate, ReinspectionOut, ReinspectionCreate,
    ReinspectionVerifyRequest, VerificationResultOut, AlertOut, AlertUpdate,
    DashboardOut
)
from app.services.vision_service import get_vision_provider, VisionProvider
from app.services.root_cause_service import root_cause_engine
from app.services.risk_service import risk_engine
from app.services.corrective_service import corrective_engine
from app.services.verification_service import verification_engine
from app.vision.opencv_provider import OpenCVVisionProvider

router = APIRouter(prefix="/api", tags=["ZeroDefect X API"])

# Vision Upload & Analyze Endpoint
@router.post("/vision/analyze")
async def analyze_uploaded_image(
    image: UploadFile = File(...),
    machine_id: str = Form("M03"),
    product_id: str = Form("RING-001"),
    batch_id: str = Form("B1042"),
    shift_id: str = Form("S2"),
    db: Session = Depends(get_db)
):
    # Validate format
    ext = os.path.splitext(image.filename)[1].lower() if image.filename else ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image extension '{ext}'. Allowed: .jpg, .jpeg, .png, .webp"
        )

    # Sanitize filename & save raw file
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    raw_dir = os.path.join(base_dir, "uploads", "inspections", "raw")
    os.makedirs(raw_dir, exist_ok=True)

    insp_id = f"INSP-2026-{uuid.uuid4().hex[:4].upper()}"
    raw_filename = f"{insp_id}_{uuid.uuid4().hex[:6]}{ext}"
    raw_save_path = os.path.join(raw_dir, raw_filename)

    with open(raw_save_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    now = datetime.datetime.now(datetime.timezone.utc)

    # Ensure Product and Batch exist in DB for end-to-end traceability
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        prod = Product(
            id=product_id,
            product_code=product_id,
            product_name=f"Precision Real Metal Ring ({product_id})",
            product_type="Metal Ring Component"
        )
        db.add(prod)
        db.flush()

    actual_shift_id = shift_id if shift_id in ["S1", "S2", "S3"] else ("S1" if "A" in shift_id else ("S2" if "B" in shift_id else "S3"))

    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        batch = Batch(
            id=batch_id,
            batch_code=batch_id,
            product_id=product_id,
            machine_id=machine_id,
            shift_id=actual_shift_id,
            status="ACTIVE"
        )
        db.add(batch)
        db.flush()

    # Query Laptop 2 Virtual Factory API
    factory_telemetry = None
    factory_status = "Virtual Factory Offline"
    factory_source_label = "OFFLINE"
    telemetry_data = None
    environment_data = None

    raw_env_url = os.environ.get("LAPTOP2_URL", "http://10.10.56.118:8000").strip()
    urls_to_try = []

    if raw_env_url:
        urls_to_try.append(raw_env_url)
        if "/api/telemetry" in raw_env_url:
            base_url = raw_env_url.split("/api/telemetry")[0]
            urls_to_try.append(f"{base_url}/api/factory/telemetry")
        elif "/api/factory/telemetry" in raw_env_url:
            base_url = raw_env_url.split("/api/factory/telemetry")[0]
            urls_to_try.append(f"{base_url}/api/telemetry")
        else:
            base_url = raw_env_url.rstrip("/")
            urls_to_try.append(f"{base_url}/api/telemetry")
            urls_to_try.append(f"{base_url}/api/factory/telemetry")

    urls_to_try.extend([
        "http://10.10.56.118:8000/api/telemetry",
        "http://10.10.56.118:8000/api/factory/telemetry",
        "http://127.0.0.1:8000/api/telemetry",
        "http://localhost:8000/api/telemetry"
    ])

    # Remove duplicates preserving order
    seen = set()
    unique_urls = [u for u in urls_to_try if u and not (u in seen or seen.add(u))]

    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for target_url in unique_urls:
        try:
            sep = "&" if "?" in target_url else "?"
            telemetry_endpoint = f"{target_url}{sep}machine_id={machine_id}&product_id={product_id}&batch_id={batch_id}"
            req = urllib.request.Request(telemetry_endpoint, headers={"User-Agent": "ZeroDefectX/3.0"})
            with opener.open(req, timeout=2.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode())
                    factory_telemetry = data
                    factory_status = "ONLINE"
                    factory_source_label = data.get("source_label", "SIMULATED FACTORY DATA")

                    if "telemetry" in data and isinstance(data["telemetry"], dict):
                        telemetry_data = data["telemetry"]
                    elif "temperature" in data or "vibration" in data:
                        telemetry_data = {
                            "temperature": data.get("temperature"),
                            "vibration": data.get("vibration"),
                            "pressure": data.get("pressure"),
                            "speed": data.get("speed"),
                            "status": data.get("status", "UNKNOWN")
                        }

                    if "environment" in data and isinstance(data["environment"], dict):
                        environment_data = data["environment"]
                    else:
                        environment_data = {
                            "temperature": data.get("env_temp", data.get("environment_temperature")),
                            "humidity": data.get("env_humidity", data.get("humidity"))
                        }

                    # Persist telemetry in MachineParameter table
                    new_param = MachineParameter(
                        machine_id=machine_id,
                        timestamp=now,
                        temperature=float(telemetry_data["temperature"]),
                        vibration=float(telemetry_data["vibration"]),
                        pressure=float(telemetry_data["pressure"]),
                        speed=int(telemetry_data["speed"])
                    )
                    db.add(new_param)

                    new_env = EnvironmentReading(
                        timestamp=now,
                        temperature=float(environment_data["temperature"]),
                        humidity=float(environment_data["humidity"])
                    )
                    db.add(new_env)
                    db.flush()
                    break
        except Exception as err:
            pass

    # Analyze real metal ring photo with OpenCV Vision Engine
    cv_provider = OpenCVVisionProvider()
    vision_result = cv_provider.analyze_image(
        image_path=raw_save_path,
        machine_id=machine_id,
        inspection_id=insp_id
    )

    rel_raw_url = f"/uploads/inspections/raw/{raw_filename}"

    # Save Inspection DB record
    new_insp = Inspection(
        id=insp_id,
        product_id=product_id,
        batch_id=batch_id,
        machine_id=machine_id,
        shift_id=actual_shift_id,
        image_path=rel_raw_url,
        inspection_time=now,
        status=vision_result["status"],
        overall_confidence=vision_result["overall_confidence"]
    )
    db.add(new_insp)
    db.flush()

    # Save Defect DB records
    saved_defects = []
    for item in vision_result.get("defects", []):
        d_id = f"DEF-2026-{uuid.uuid4().hex[:4].upper()}"
        bbox = item.get("bounding_box", {})
        defect = Defect(
            id=d_id,
            inspection_id=insp_id,
            defect_type=item["defect_type"],
            confidence=item["confidence"],
            severity=item["severity"],
            location=item["location"],
            x_min=bbox.get("norm_x_min"),
            y_min=bbox.get("norm_y_min"),
            x_max=bbox.get("norm_x_max"),
            y_max=bbox.get("norm_y_max")
        )
        db.add(defect)
        saved_defects.append(item)

    # Trigger Root Cause Analysis automatically
    rc_data = root_cause_engine.analyze(db, inspection_id=insp_id, machine_id=machine_id)
    rca_id = f"RCA-2026-{uuid.uuid4().hex[:4].upper()}"
    rca = RootCauseAnalysis(
        id=rca_id,
        inspection_id=insp_id,
        machine_id=machine_id,
        probable_factor=rc_data["probable_factor"],
        evidence=rc_data["evidence"],
        confidence=rc_data["confidence"],
        verification_required=rc_data["verification_required"],
        created_at=now
    )
    db.add(rca)

    db.commit()

    return {
        "inspection_id": insp_id,
        "product_id": product_id,
        "batch_id": batch_id,
        "machine_id": machine_id,
        "shift_id": shift_id,
        "image_source_label": "REAL PRODUCT IMAGE",
        "factory_source_label": factory_source_label,
        "factory_status": factory_status,
        "engine": vision_result["engine"],
        "status": vision_result["status"],
        "overall_confidence": vision_result["overall_confidence"],
        "anomaly_score": vision_result["anomaly_score"],
        "severity": vision_result["severity"],
        "severity_reason": vision_result["severity_reason"],
        "location": vision_result["location"],
        "raw_image_url": rel_raw_url,
        "annotated_image_url": vision_result["annotated_image_url"],
        "defects": saved_defects,
        "telemetry": telemetry_data or {"status": "UNAVAILABLE", "message": "Virtual Factory telemetry unavailable; no synthetic telemetry substituted."},
        "environment": environment_data or {"status": "UNAVAILABLE", "message": "Virtual Factory environment data unavailable."},
        "root_cause": {
            "probable_factor": rc_data["probable_factor"],
            "evidence": rc_data["evidence"],
            "confidence": rc_data["confidence"],
            "verification_required": rc_data["verification_required"]
        },
        "disclaimer": vision_result["disclaimer"]
    }


# 1. Health Check
@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ZERO-DEFECT X backend",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }


# 2. Dashboard KPI Endpoint
@router.get("/dashboard", response_model=DashboardOut)
def get_dashboard(db: Session = Depends(get_db)):
    total_inspected = db.query(Inspection).count()
    defective_units = db.query(Inspection).filter(Inspection.status == "DEFECTIVE").count()
    defect_rate = round((defective_units / total_inspected * 100), 2) if total_inspected > 0 else 0.0
    active_alerts_count = db.query(Alert).filter(Alert.status == "ACTIVE").count()

    machine_rows = []
    for machine in db.query(Machine).all():
        inspected = db.query(Inspection).filter(Inspection.machine_id == machine.id).count()
        defective = db.query(Inspection).filter(
            Inspection.machine_id == machine.id,
            Inspection.status == "DEFECTIVE"
        ).count()
        machine_risk = risk_engine.calculate_machine_risk(db, machine.id)
        machine_rows.append({
            "machine": machine.id,
            "rate": round((defective / inspected) * 100, 2) if inspected else 0.0,
            "inspected": inspected,
            "risk_score": machine_risk["risk_score"],
            "risk_level": machine_risk["risk_level"],
        })

    machine_rows.sort(
        key=lambda row: (row["risk_score"], row["rate"], row["inspected"]),
        reverse=True
    )
    high_risk_machine = machine_rows[0]["machine"] if machine_rows else "N/A"
    highest_risk_level = machine_rows[0]["risk_level"] if machine_rows else "LOW"
    current_system_risk = highest_risk_level

    defect_rows = (
        db.query(Defect.defect_type, Defect.severity)
        .order_by(Defect.defect_type.asc())
        .all()
    )
    distribution = {}
    severity_by_type = {}
    for defect_type, severity in defect_rows:
        distribution[defect_type] = distribution.get(defect_type, 0) + 1
        severity_by_type.setdefault(defect_type, severity)

    defect_distribution = [
        {"name": name, "value": count, "severity": severity_by_type.get(name, "Unknown")}
        for name, count in sorted(distribution.items(), key=lambda item: (-item[1], item[0]))
    ]

    recent_insps = db.query(Inspection).order_by(Inspection.inspection_time.desc()).limit(5).all()
    recent_inspections_list = []
    for insp in recent_insps:
        defect_type = insp.defects[0].defect_type if insp.defects else "None"
        recent_inspections_list.append({
            "id": insp.id,
            "product": insp.product_id,
            "batch": insp.batch_id,
            "machine": insp.machine_id,
            "shift": insp.shift_id,
            "status": insp.status,
            "defectType": defect_type,
            "timestamp": insp.inspection_time.isoformat() if insp.inspection_time else ""
        })

    return {
        "total_inspected": total_inspected,
        "defective_units": defective_units,
        "defect_rate": defect_rate,
        "current_system_risk": current_system_risk,
        "high_risk_machine": high_risk_machine,
        "active_alerts_count": active_alerts_count,
        "recent_inspections": recent_inspections_list,
        "defect_distribution": defect_distribution,
        "machine_defect_rates": [
            {
                "machine": row["machine"],
                "rate": row["rate"],
                "inspected": row["inspected"]
            }
            for row in machine_rows
        ]
    }


# 3. Machines API
@router.get("/machines", response_model=List[MachineOut])
def get_machines(db: Session = Depends(get_db)):
    machines = db.query(Machine).all()
    result = []
    for m in machines:
        param = db.query(MachineParameter).filter(
            MachineParameter.machine_id == m.id
        ).order_by(MachineParameter.timestamp.desc()).first()

        risk_res = risk_engine.calculate_machine_risk(db, m.id)
        
        result.append(MachineOut(
            id=m.id,
            machine_code=m.machine_code,
            machine_name=m.machine_name,
            machine_type=m.machine_type,
            location=m.location,
            status=m.status,
            temperature=param.temperature if param else 65.0,
            vibration=param.vibration if param else 2.0,
            pressure=param.pressure if param else 6.0,
            speed=param.speed if param else 1500,
            defect_rate=8.71 if m.id == "M03" else (1.58 if m.id == "M02" else 0.95),
            risk_score=risk_res["risk_score"],
            created_at=m.created_at
        ))
    return result


@router.get("/machines/{machine_id}", response_model=MachineOut)
def get_machine(machine_id: str, db: Session = Depends(get_db)):
    m = db.query(Machine).filter(Machine.id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found")

    param = db.query(MachineParameter).filter(
        MachineParameter.machine_id == m.id
    ).order_by(MachineParameter.timestamp.desc()).first()

    risk_res = risk_engine.calculate_machine_risk(db, m.id)

    return MachineOut(
        id=m.id,
        machine_code=m.machine_code,
        machine_name=m.machine_name,
        machine_type=m.machine_type,
        location=m.location,
        status=m.status,
        temperature=param.temperature if param else 65.0,
        vibration=param.vibration if param else 2.0,
        pressure=param.pressure if param else 6.0,
        speed=param.speed if param else 1500,
        defect_rate=8.71 if m.id == "M03" else 0.95,
        risk_score=risk_res["risk_score"],
        created_at=m.created_at
    )


# 4. Batches API
@router.get("/batches", response_model=List[BatchOut])
def get_batches(db: Session = Depends(get_db)):
    return db.query(Batch).all()


# 5. Shifts API
@router.get("/shifts", response_model=List[ShiftOut])
def get_shifts(db: Session = Depends(get_db)):
    return db.query(Shift).all()


# 6. Products API
@router.get("/products", response_model=List[ProductOut])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()


# 7. Inspections API
@router.get("/inspections", response_model=List[InspectionOut])
def get_inspections(db: Session = Depends(get_db)):
    return db.query(Inspection).all()


@router.get("/inspections/{inspection_id}", response_model=InspectionOut)
def get_inspection(inspection_id: str, db: Session = Depends(get_db)):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail=f"Inspection {inspection_id} not found")
    return insp


@router.post("/inspections", response_model=InspectionOut)
def create_inspection(
    payload: InspectionCreate,
    db: Session = Depends(get_db),
    vision: VisionProvider = Depends(get_vision_provider)
):
    insp_id = f"INSP-2026-{uuid.uuid4().hex[:4].upper()}"
    
    # Process image with DemoVisionProvider
    vision_result = vision.analyze_image(
        image_path=payload.image_path or "/images/sample.jpg",
        machine_id=payload.machine_id
    )

    new_insp = Inspection(
        id=insp_id,
        product_id=payload.product_id,
        batch_id=payload.batch_id,
        machine_id=payload.machine_id,
        shift_id=payload.shift_id,
        image_path=payload.image_path,
        inspection_time=datetime.datetime.utcnow(),
        status=vision_result["status"],
        overall_confidence=vision_result["overall_confidence"]
    )
    db.add(new_insp)
    db.flush()

    # Save defects if any returned by vision provider
    for item in vision_result.get("defects", []):
        d_id = f"DEF-2026-{uuid.uuid4().hex[:4].upper()}"
        defect = Defect(
            id=d_id,
            inspection_id=insp_id,
            defect_type=item["defect_type"],
            confidence=item["confidence"],
            severity=item["severity"],
            location=item["location"],
            x_min=item.get("x_min"),
            y_min=item.get("y_min"),
            x_max=item.get("x_max"),
            y_max=item.get("y_max")
        )
        db.add(defect)

    db.commit()
    db.refresh(new_insp)
    return new_insp


# 8. Defects API
@router.get("/defects", response_model=List[DefectOut])
def get_defects(db: Session = Depends(get_db)):
    return db.query(Defect).all()


# 9. Analytics API
@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    return {
        "monthly_trend": [
            {"month": "May", "inspected": 1100, "defects": 22, "rate": 2.0},
            {"month": "Jun", "inspected": 1180, "defects": 28, "rate": 2.37},
            {"month": "Jul", "inspected": 1250, "defects": 31, "rate": 2.48},
            {"month": "Aug", "inspected": 1290, "defects": 35, "rate": 2.71},
            {"month": "Sep", "inspected": 1248, "defects": 37, "rate": 2.96},
        ],
        "machine_breakdown": [
            {"machine": "M01", "normal": 416, "defective": 4},
            {"machine": "M02", "normal": 374, "defective": 6},
            {"machine": "M03", "normal": 283, "defective": 27},
            {"machine": "M04", "normal": 138, "defective": 0},
        ]
    }


# 10. Root Cause API
@router.get("/root-cause", response_model=List[RootCauseOut])
def get_root_causes(db: Session = Depends(get_db)):
    return db.query(RootCauseAnalysis).all()


@router.get("/root-cause/{inspection_id}")
def get_root_cause_by_inspection(inspection_id: str, db: Session = Depends(get_db)):
    res = root_cause_engine.analyze(db, inspection_id=inspection_id)
    return res


@router.post("/root-cause/analyze", response_model=RootCauseOut)
def analyze_root_cause(payload: RootCauseRequest, db: Session = Depends(get_db)):
    rc_data = root_cause_engine.analyze(
        db,
        inspection_id=payload.inspection_id,
        machine_id=payload.machine_id or "M03"
    )

    rca_id = f"RCA-2026-{uuid.uuid4().hex[:4].upper()}"
    rca = RootCauseAnalysis(
        id=rca_id,
        inspection_id=payload.inspection_id,
        machine_id=payload.machine_id or "M03",
        probable_factor=rc_data["probable_factor"],
        evidence=rc_data["evidence"],
        confidence=rc_data["confidence"],
        verification_required=rc_data["verification_required"]
    )
    db.add(rca)
    db.commit()
    db.refresh(rca)
    return rca


# Analytics Endpoints (DB Driven)
@router.get("/analytics/defects")
def get_analytics_defects(db: Session = Depends(get_db)):
    total = db.query(Inspection).count()
    defective = db.query(Inspection).filter(Inspection.status == "DEFECTIVE").count()
    
    # Calculate machine defect breakdown directly from database records
    machines = db.query(Machine).all()
    machine_breakdown = []
    for m in machines:
        m_total = db.query(Inspection).filter(Inspection.machine_id == m.id).count()
        m_def = db.query(Inspection).filter(Inspection.machine_id == m.id, Inspection.status == "DEFECTIVE").count()
        m_rate = round((m_def / float(m_total) * 100), 1) if m_total > 0 else 0.0
        machine_breakdown.append({
            "machine": m.id,
            "machine_name": m.machine_name,
            "total_inspected": m_total,
            "defective_count": m_def,
            "defect_rate": m_rate
        })

    # Defect type breakdown
    defects = db.query(Defect).all()
    type_counts: Dict[str, int] = {}
    for d in defects:
        t = d.defect_type or "Surface Anomaly"
        type_counts[t] = type_counts.get(t, 0) + 1

    type_distribution = [{"type": k, "count": v} for k, v in type_counts.items()]

    return {
        "summary": {
            "total_inspected": total,
            "total_defects": defective,
            "defect_rate": round((defective / float(total) * 100), 2) if total > 0 else 0.0
        },
        "total_inspected": total,
        "defective_units": defective,
        "defect_rate": round((defective / float(total) * 100), 2) if total > 0 else 0.0,
        "machine_breakdown": machine_breakdown,
        "by_machine": machine_breakdown,
        "defect_distribution": type_distribution,
        "by_defect_type": type_distribution
    }


@router.get("/analytics/machines")
def get_analytics_machines(db: Session = Depends(get_db)):
    machines = db.query(Machine).all()
    res = []
    for m in machines:
        risk_res = risk_engine.calculate_machine_risk(db, m.id)
        m_total = db.query(Inspection).filter(Inspection.machine_id == m.id).count()
        m_def = db.query(Inspection).filter(Inspection.machine_id == m.id, Inspection.status == "DEFECTIVE").count()
        res.append({
            "id": m.id,
            "name": m.machine_name,
            "status": m.status,
            "inspected": m_total,
            "defective": m_def,
            "defect_rate": round((m_def / float(m_total) * 100), 1) if m_total > 0 else 0.0,
            "risk_score": risk_res["risk_score"],
            "risk_level": risk_res["risk_level"]
        })
    return res



# 11. Risk API
@router.get("/risk")
def get_risk(db: Session = Depends(get_db)):
    machines = db.query(Machine).all()
    res = []
    for m in machines:
        calc = risk_engine.calculate_machine_risk(db, m.id)
        res.append({
            "id": f"RISK-{m.id}",
            "machine_id": m.id,
            "defect_type": "Scratch" if m.id == "M03" else "None",
            "risk_score": calc["risk_score"],
            "risk_level": calc["risk_level"],
            "signals": calc["contributing_signals"],
            "contributing_signals": calc["contributing_signals"],
            "created_at": datetime.datetime.utcnow().isoformat()
        })
    return {
        "machines": res,
        "items": res
    }


# 12. Corrective Actions API
@router.get("/corrective-actions", response_model=List[CorrectiveActionOut])
@router.get("/actions", response_model=List[CorrectiveActionOut])
def get_corrective_actions(db: Session = Depends(get_db)):
    return db.query(CorrectiveAction).order_by(CorrectiveAction.created_at.desc()).all()


@router.post("/corrective-actions", response_model=CorrectiveActionOut)
@router.post("/actions", response_model=CorrectiveActionOut)
def create_corrective_action(payload: CorrectiveActionCreate, db: Session = Depends(get_db)):
    action = corrective_engine.create_action(
        db=db,
        inspection_id=payload.inspection_id,
        action_description=payload.action_description,
        priority=payload.priority,
        assigned_to=payload.assigned_to,
        machine_id=payload.machine_id,
        probable_factor=payload.probable_factor,
        recommended_actions=payload.recommended_actions,
        notes=payload.notes
    )
    return action


@router.get("/corrective-actions/{action_id}", response_model=CorrectiveActionOut)
def get_corrective_action_by_id(action_id: str, db: Session = Depends(get_db)):
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail=f"Corrective action {action_id} not found")
    return action


@router.patch("/corrective-actions/{action_id}", response_model=CorrectiveActionOut)
def update_corrective_action(action_id: str, payload: CorrectiveActionUpdate, db: Session = Depends(get_db)):
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail=f"Corrective action {action_id} not found")

    if payload.status:
        action.status = payload.status
    if payload.notes:
        action.notes = payload.notes
    if payload.assigned_to:
        action.assigned_to = payload.assigned_to
    if payload.action_description:
        action.action_description = payload.action_description

    db.commit()
    db.refresh(action)
    return action


@router.post("/corrective-actions/{action_id}/start", response_model=CorrectiveActionOut)
def start_corrective_action(action_id: str, payload: Optional[CorrectiveActionUpdate] = None, db: Session = Depends(get_db)):
    notes = payload.notes if payload else None
    try:
        action = corrective_engine.start_action(db, action_id=action_id, notes=notes)
        return action
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


@router.post("/corrective-actions/{action_id}/complete", response_model=CorrectiveActionOut)
def complete_corrective_action(action_id: str, payload: Optional[CorrectiveActionUpdate] = None, db: Session = Depends(get_db)):
    notes = payload.notes if payload else None
    try:
        action = corrective_engine.complete_action(db, action_id=action_id, notes=notes)
        return action
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))


# 13. Alerts API
@router.get("/alerts", response_model=List[AlertOut])
def get_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).all()


@router.patch("/alerts/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: str, payload: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")
    
    alert.status = payload.status
    if payload.status == "RESOLVED":
        alert.resolved_at = datetime.datetime.utcnow()
    
    db.commit()
    db.refresh(alert)
    return alert


# 14. Reinspection API
@router.get("/reinspections", response_model=List[ReinspectionOut])
def list_reinspections(db: Session = Depends(get_db)):
    return db.query(Reinspection).order_by(Reinspection.reinspection_time.desc()).all()


@router.get("/reinspections/{reinspection_id}", response_model=ReinspectionOut)
def get_reinspection(reinspection_id: str, db: Session = Depends(get_db)):
    reinsp = db.query(Reinspection).filter(Reinspection.id == reinspection_id).first()
    if not reinsp:
        raise HTTPException(status_code=404, detail=f"Reinspection {reinspection_id} not found")
    return reinsp


@router.post("/reinspections", response_model=ReinspectionOut)
@router.post("/reinspection", response_model=ReinspectionOut)
def create_reinspection(payload: ReinspectionCreate, db: Session = Depends(get_db)):
    reinsp = verification_engine.create_reinspection_record(
        db=db,
        original_inspection_id=payload.original_inspection_id,
        corrective_action_id=payload.corrective_action_id,
        status=payload.status,
        overall_confidence=payload.overall_confidence or 0.95,
        defects=payload.defects,
        image_path=payload.image_path,
        notes=payload.notes
    )
    return reinsp


@router.post("/reinspections/{reinspection_id}/verify", response_model=VerificationResultOut)
def verify_reinspection_endpoint(
    reinspection_id: str,
    payload: Optional[ReinspectionVerifyRequest] = None,
    db: Session = Depends(get_db)
):
    reinsp = db.query(Reinspection).filter(Reinspection.id == reinspection_id).first()
    if not reinsp:
        raise HTTPException(status_code=404, detail=f"Reinspection {reinspection_id} not found")

    ca = db.query(CorrectiveAction).filter(CorrectiveAction.id == reinsp.corrective_action_id).first() if reinsp.corrective_action_id else None
    verif = verification_engine.evaluate_verification(db, reinsp.status, ca, reinsp.machine_id or "M03")

    reinsp.verification_status = verif["verification_status"]
    reinsp.verification_notes = f"{verif['verification_message']} | Follow-up: {verif['follow_up_recommendation']}"
    if payload and payload.notes:
        reinsp.notes = f"{reinsp.notes}\n{payload.notes}".strip() if reinsp.notes else payload.notes

    if ca and verif["is_verified"]:
        ca.status = "Verified"

    db.commit()
    db.refresh(reinsp)

    return {
        "reinspection_id": reinsp.id,
        "verification_status": verif["verification_status"],
        "verification_message": verif["verification_message"],
        "follow_up_recommendation": verif["follow_up_recommendation"],
        "before_condition": reinsp.before_condition or {},
        "after_condition": reinsp.after_condition or {}
    }


@router.post("/reinspections/analyze")
async def analyze_and_reinspect(
    image: Optional[UploadFile] = File(None),
    original_inspection_id: str = Form(...),
    corrective_action_id: Optional[str] = Form(None),
    machine_id: str = Form("M03"),
    simulate_defect: bool = Form(False),
    db: Session = Depends(get_db)
):
    """
    Closed-loop Reinspection Vision Endpoint:
    Processes the reinspection image with OpenCV Vision Provider, records before/after state,
    and runs deterministic verification engine.
    """
    rel_raw_url = None
    if image and image.filename:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        raw_dir = os.path.join(base_dir, "uploads", "reinspections")
        os.makedirs(raw_dir, exist_ok=True)
        ext = os.path.splitext(image.filename)[1].lower() or ".jpg"
        save_name = f"REINSP_{uuid.uuid4().hex[:6]}{ext}"
        save_path = os.path.join(raw_dir, save_name)
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        rel_raw_url = f"/uploads/reinspections/{save_name}"

        # Run vision analysis
        cv_provider = OpenCVVisionProvider()
        vision_res = cv_provider.analyze_image(save_path, machine_id=machine_id)
        status = vision_res["status"]
        confidence = vision_res["overall_confidence"]
        defects = vision_res.get("defects", [])
    else:
        # If simulated demo mode
        if simulate_defect:
            status = "DEFECTIVE"
            confidence = 0.91
            defects = [{"defect_type": "Scratch", "severity": "Medium", "confidence": 0.91, "location": "Upper-right"}]
            rel_raw_url = "/uploads/inspections/raw/sample_scratch_01.jpg"
        else:
            status = "PASSED"
            confidence = 0.98
            defects = []
            rel_raw_url = "/uploads/inspections/raw/sample_pass_01.jpg"

    reinsp = verification_engine.create_reinspection_record(
        db=db,
        original_inspection_id=original_inspection_id,
        corrective_action_id=corrective_action_id,
        status=status,
        overall_confidence=confidence,
        defects=defects,
        image_path=rel_raw_url
    )

    return {
        "reinspection": reinsp,
        "verification_status": reinsp.verification_status,
        "verification_notes": reinsp.verification_notes,
        "before_condition": reinsp.before_condition,
        "after_condition": reinsp.after_condition
    }


# 15. System Network Info for Mobile Device Inspection
@router.get("/system/network-info")
def get_system_network_info():
    import socket
    ips = []
    primary_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.2)
        s.connect(("8.8.8.8", 80))
        primary_ip = s.getsockname()[0]
        s.close()
        if primary_ip and not primary_ip.startswith("127."):
            ips.append(primary_ip)
    except Exception:
        pass

    try:
        hostname = socket.gethostname()
        for ip in socket.gethostbyname_ex(hostname)[2]:
            if not ip.startswith("127.") and ip not in ips:
                ips.append(ip)
    except Exception:
        pass

    if not ips:
        ips.append("127.0.0.1")
    if primary_ip == "127.0.0.1" and ips:
        primary_ip = ips[0]

    return {
        "primary_ip": primary_ip,
        "available_ips": ips,
        "frontend_port": 5173,
        "backend_port": 8001,
        "mobile_url": f"http://{primary_ip}:5173/mobile-inspection"
    }


# 16. Live Laptop 2 Telemetry & Connection Status Proxy
@router.get("/factory/status")
@router.get("/factory/telemetry")
def get_live_factory_telemetry(machine_id: str = "M03", product_id: str = "RING-001", batch_id: str = "B1042"):
    raw_env_url = os.environ.get("LAPTOP2_URL", "http://10.10.56.118:8000").strip()
    urls_to_try = []

    if raw_env_url:
        urls_to_try.append(raw_env_url)
        if "/api/telemetry" in raw_env_url:
            base_url = raw_env_url.split("/api/telemetry")[0]
            urls_to_try.append(f"{base_url}/api/factory/telemetry")
        elif "/api/factory/telemetry" in raw_env_url:
            base_url = raw_env_url.split("/api/factory/telemetry")[0]
            urls_to_try.append(f"{base_url}/api/telemetry")
        else:
            base_url = raw_env_url.rstrip("/")
            urls_to_try.append(f"{base_url}/api/telemetry")
            urls_to_try.append(f"{base_url}/api/factory/telemetry")

    urls_to_try.extend([
        "http://10.10.56.118:8000/api/telemetry",
        "http://10.10.56.118:8000/api/factory/telemetry",
        "http://127.0.0.1:8000/api/telemetry",
        "http://localhost:8000/api/telemetry"
    ])

    seen = set()
    unique_urls = [u for u in urls_to_try if u and not (u in seen or seen.add(u))]

    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for target_url in unique_urls:
        try:
            sep = "&" if "?" in target_url else "?"
            telemetry_endpoint = f"{target_url}{sep}machine_id={machine_id}&product_id={product_id}&batch_id={batch_id}"
            req = urllib.request.Request(telemetry_endpoint, headers={"User-Agent": "ZeroDefectX/3.0"})
            with opener.open(req, timeout=2.0) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode())

                    vib = data.get("vibration_mm_s") if data.get("vibration_mm_s") is not None else (data.get("telemetry", {}).get("vibration") if isinstance(data.get("telemetry"), dict) else data.get("vibration", 2.7))
                    temp = data.get("temperature_c") if data.get("temperature_c") is not None else (data.get("telemetry", {}).get("temperature") if isinstance(data.get("telemetry"), dict) else data.get("temperature", 65.0))
                    press = data.get("pressure_bar") if data.get("pressure_bar") is not None else (data.get("telemetry", {}).get("pressure") if isinstance(data.get("telemetry"), dict) else data.get("pressure", 6.0))
                    rpm = data.get("spindle_rpm") if data.get("spindle_rpm") is not None else (data.get("telemetry", {}).get("speed") if isinstance(data.get("telemetry"), dict) else data.get("speed", 1500))
                    env_t = data.get("environment_temp_c") if data.get("environment_temp_c") is not None else (data.get("environment", {}).get("temperature") if isinstance(data.get("environment"), dict) else data.get("env_temp", 29.0))
                    env_h = data.get("humidity_pct") if data.get("humidity_pct") is not None else (data.get("environment", {}).get("humidity") if isinstance(data.get("environment"), dict) else data.get("humidity", 68.0))

                    return {
                        "connection_status": "CONNECTED",
                        "factory_status": "ONLINE",
                        "data_type": "SIMULATED FACTORY DATA",
                        "source_label": "SIMULATED FACTORY DATA",
                        "laptop2_url": target_url,
                        "machine_id": data.get("machine_id", machine_id),
                        "product_id": data.get("product_id", product_id),
                        "batch_id": data.get("batch_id", batch_id),
                        "operator_shift": data.get("operator_shift", "Shift B"),
                        "vibration_mm_s": float(vib if vib is not None else 2.7),
                        "temperature_c": float(temp if temp is not None else 65.0),
                        "pressure_bar": float(press if press is not None else 6.0),
                        "spindle_rpm": int(rpm if rpm is not None else 1500),
                        "environment_temp_c": float(env_t if env_t is not None else 29.0),
                        "humidity_pct": float(env_h if env_h is not None else 68.0),
                        "machine_status": data.get("machine_status", "NORMAL"),
                        "production_status": data.get("production_status", "RUNNING"),
                        "timestamp": data.get("timestamp", datetime.datetime.utcnow().isoformat())
                    }
        except Exception:
            pass

    return {
        "connection_status": "DISCONNECTED",
        "factory_status": "Virtual Factory Offline",
        "data_type": "OFFLINE",
        "source_label": "OFFLINE",
        "message": "Laptop 2 Virtual Factory unreachable at 10.10.56.118:8000"
    }


