import datetime
from sqlalchemy.orm import Session
from app.database import Base, engine, SessionLocal
from app.models.db_models import (
    Product, Shift, Machine, Batch, MachineParameter,
    EnvironmentReading, Inspection, Defect, RootCauseAnalysis,
    RiskAssessment, CorrectiveAction, Reinspection, Alert
)

def seed_db(db: Session):
    """Populate initial controlled demonstration dataset if tables are empty."""

    if db.query(Machine).count() > 0:
        print("[SEED] Database already contains records. Skipping seed.")
        return

    print("[SEED] Initializing ZeroDefect X Controlled Demonstration Dataset...")

    # 1. Products
    products = [
        Product(id="P1042-087", product_code="P1042-087", product_name="Aerospace Turbine Blade - Alloy 718", product_type="Aerospace"),
        Product(id="P1090-012", product_code="P1090-012", product_name="Automotive Engine Block - Cast Aluminum", product_type="Automotive"),
        Product(id="P2040-005", product_code="P2040-005", product_name="Industrial Hydraulic Valve Body", product_type="Industrial"),
    ]
    db.add_all(products)

    # 2. Shifts
    shifts = [
        Shift(id="S1", shift_name="Shift A (Morning)", operator_name="Alex Rivera", start_time="06:00", end_time="14:00"),
        Shift(id="S2", shift_name="Shift B (Afternoon)", operator_name="Sarah Chen", start_time="14:00", end_time="22:00"),
        Shift(id="S3", shift_name="Shift C (Night)", operator_name="Marcus Vance", start_time="22:00", end_time="06:00"),
    ]
    db.add_all(shifts)

    # 3. Machines
    machines = [
        Machine(id="M01", machine_code="M01", machine_name="Precision Milling Unit 01", machine_type="Milling", location="Bay A - Line 1", status="NORMAL"),
        Machine(id="M02", machine_code="M02", machine_name="CNC Lathe Station 02", machine_type="CNC Lathe", location="Bay A - Line 2", status="NORMAL"),
        Machine(id="M03", machine_code="M03", machine_name="Precision Machining Station 03", machine_type="Stamping/Machining", location="Bay B - Line 1", status="WARNING"),
        Machine(id="M04", machine_code="M04", machine_name="CNC Finishing Unit 04", machine_type="Finishing", location="Bay B - Line 2", status="NORMAL"),
    ]
    db.add_all(machines)
    db.flush()

    # 4. Batches
    batches = [
        Batch(id="B1042", batch_code="BATCH-2026-1042", product_id="P1042-087", machine_id="M03", shift_id="S2", status="ACTIVE"),
        Batch(id="B1090", batch_code="BATCH-2026-1090", product_id="P1090-012", machine_id="M01", shift_id="S1", status="COMPLETED"),
        Batch(id="B2040", batch_code="BATCH-2026-2040", product_id="P2040-005", machine_id="M02", shift_id="S3", status="ACTIVE"),
    ]
    db.add_all(batches)

    # 5. Machine Parameters History (Current + Historical)
    now = datetime.datetime.now(datetime.timezone.utc)
    params = [
        MachineParameter(machine_id="M01", temperature=64.2, vibration=1.8, pressure=6.1, speed=1520, timestamp=now),
        MachineParameter(machine_id="M02", temperature=68.5, vibration=2.2, pressure=5.9, speed=1490, timestamp=now),
        MachineParameter(machine_id="M03", temperature=72.0, vibration=4.8, pressure=6.2, speed=1480, timestamp=now),
        MachineParameter(machine_id="M04", temperature=62.1, vibration=1.6, pressure=6.0, speed=1600, timestamp=now),
        # Historical parameter spikes
        MachineParameter(machine_id="M03", temperature=74.5, vibration=4.6, pressure=6.3, speed=1475, timestamp=now - datetime.timedelta(hours=4)),
        MachineParameter(machine_id="M03", temperature=67.0, vibration=2.1, pressure=6.0, speed=1500, timestamp=now - datetime.timedelta(days=1)),
        MachineParameter(machine_id="M01", temperature=79.0, vibration=2.0, pressure=6.1, speed=1510, timestamp=now - datetime.timedelta(hours=6)),
    ]
    db.add_all(params)

    # 6. Environment Readings
    envs = [
        EnvironmentReading(temperature=29.0, humidity=68.0, timestamp=now)
    ]
    db.add_all(envs)

    # 7. Inspections (Historical Distribution)
    insp_defective = Inspection(
        id="INSP-2026-0842",
        product_id="P1042-087",
        batch_id="B1042",
        machine_id="M03",
        shift_id="S2",
        image_path="/uploads/inspections/raw/sample_scratch_01.jpg",
        inspection_time=now - datetime.timedelta(minutes=15),
        status="DEFECTIVE",
        overall_confidence=0.94
    )

    insp_passed1 = Inspection(
        id="INSP-2026-0841",
        product_id="P1042-087",
        batch_id="B1042",
        machine_id="M03",
        shift_id="S2",
        image_path="/uploads/inspections/raw/sample_pass_01.jpg",
        inspection_time=now - datetime.timedelta(minutes=30),
        status="PASSED",
        overall_confidence=0.99
    )

    insp_passed2 = Inspection(
        id="INSP-2026-0840",
        product_id="P1090-012",
        batch_id="B1090",
        machine_id="M01",
        shift_id="S1",
        image_path="/uploads/inspections/raw/sample_pass_02.jpg",
        inspection_time=now - datetime.timedelta(hours=2),
        status="PASSED",
        overall_confidence=0.98
    )

    # Historical inspections under normal & elevated conditions
    hist_inspections = [
        Inspection(id="INSP-2026-0701", product_id="P1042-087", batch_id="B1042", machine_id="M03", shift_id="S2", image_path="/uploads/inspections/raw/h1.jpg", inspection_time=now - datetime.timedelta(days=1), status="DEFECTIVE", overall_confidence=0.91),
        Inspection(id="INSP-2026-0702", product_id="P1042-087", batch_id="B1042", machine_id="M03", shift_id="S2", image_path="/uploads/inspections/raw/h2.jpg", inspection_time=now - datetime.timedelta(days=1, hours=2), status="DEFECTIVE", overall_confidence=0.89),
        Inspection(id="INSP-2026-0703", product_id="P1042-087", batch_id="B1042", machine_id="M03", shift_id="S1", image_path="/uploads/inspections/raw/h3.jpg", inspection_time=now - datetime.timedelta(days=2), status="PASSED", overall_confidence=0.97),
        Inspection(id="INSP-2026-0704", product_id="P1090-012", batch_id="B1090", machine_id="M01", shift_id="S1", image_path="/uploads/inspections/raw/h4.jpg", inspection_time=now - datetime.timedelta(days=2, hours=3), status="PASSED", overall_confidence=0.99),
        Inspection(id="INSP-2026-0705", product_id="P2040-005", batch_id="B2040", machine_id="M02", shift_id="S3", image_path="/uploads/inspections/raw/h5.jpg", inspection_time=now - datetime.timedelta(days=3), status="PASSED", overall_confidence=0.98),
    ]

    db.add_all([insp_defective, insp_passed1, insp_passed2] + hist_inspections)
    db.flush()

    # 8. Defects
    defects = [
        Defect(id="DEF-2026-001", inspection_id="INSP-2026-0842", defect_type="Scratch", confidence=0.94, severity="High", location="Upper-right surface", x_min=0.62, y_min=0.15, x_max=0.88, y_max=0.35),
        Defect(id="DEF-2026-701", inspection_id="INSP-2026-0701", defect_type="Scratch", confidence=0.91, severity="High", location="Upper-right surface", x_min=0.60, y_min=0.14, x_max=0.85, y_max=0.32),
        Defect(id="DEF-2026-702", inspection_id="INSP-2026-0702", defect_type="Scratch", confidence=0.89, severity="Medium", location="Middle-right surface", x_min=0.55, y_min=0.20, x_max=0.80, y_max=0.40),
    ]
    db.add_all(defects)

    # 9. Root Cause Analysis
    rca = RootCauseAnalysis(
        id="RCA-2026-012",
        inspection_id="INSP-2026-0842",
        machine_id="M03",
        probable_factor="Elevated M03 Vibration Baseline",
        evidence=[
            "Observed Association: Machine vibration (4.8 mm/s) exceeds operational threshold baseline (2.5 mm/s).",
            "Historical Pattern: 75% of Scratch defects on M03 correlate with vibration spikes > 3.5 mm/s.",
            "Batch Context: Current batch B1042 executed during elevated vibration window."
        ],
        confidence=0.84,
        verification_required=True,
        created_at=now - datetime.timedelta(minutes=14)
    )
    db.add_all([rca])

    # 10. Risk Assessments
    risk = RiskAssessment(
        id="RISK-2026-003",
        machine_id="M03",
        defect_type="Scratch",
        risk_score=82,
        risk_level="HIGH",
        contributing_signals=[
            "Critical Vibration Deviation: 4.8 mm/s (+92% above 2.5 mm/s threshold)",
            "Elevated Temperature: 72.0°C",
            "Defect Presence: Defective unit logged on current batch"
        ],
        created_at=now
    )
    db.add_all([risk])

    # 11. Corrective Actions
    action = CorrectiveAction(
        id="ACT-2026-045",
        inspection_id="INSP-2026-0842",
        action_description="Perform spindle bearing alignment & dampener recalibration on M03",
        priority="HIGH",
        status="PENDING",
        assigned_to="Maintenance Tech (Lead)",
        created_at=now - datetime.timedelta(minutes=10)
    )
    db.add_all([action])

    # 12. Reinspections
    reinsp = Reinspection(
        id="REINSP-2026-008",
        original_inspection_id="INSP-2026-0842",
        reinspection_time=now - datetime.timedelta(minutes=5),
        status="PASSED",
        defect_detected=False,
        notes="Post-calibration manual sample check passed dimensional tolerance."
    )
    db.add_all([reinsp])

    # 13. Alerts
    alerts = [
        Alert(
            id="ALT-2026-101",
            machine_id="M03",
            alert_type="Vibration Anomaly",
            severity="HIGH",
            message="Machine M03 vibration spiked to 4.8 mm/s during Batch B1042 execution.",
            status="ACTIVE",
            created_at=now - datetime.timedelta(minutes=20)
        ),
        Alert(
            id="ALT-2026-102",
            machine_id="M03",
            alert_type="Thermal Elevation",
            severity="WARNING",
            message="Machine M03 operating temperature reached 72.0°C.",
            status="ACTIVE",
            created_at=now - datetime.timedelta(minutes=18)
        )
    ]
    db.add_all(alerts)

    db.commit()
    print("[SEED] Enriched demonstration dataset inserted successfully!")

def init_and_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()

if __name__ == "__main__":
    init_and_seed()
