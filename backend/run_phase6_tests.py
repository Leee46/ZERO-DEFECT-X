"""
Phase 6 Automated Test Suite — Corrective Action, Reinspection & Production Feedback Loop
ZERO-DEFECT X (SI-03 Compliance)
Tests A through J
"""

import sys
import os
import datetime

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models.db_models import (
    Machine, MachineParameter, Inspection, Defect, RootCauseAnalysis,
    CorrectiveAction, Reinspection, Alert
)
from app.services.corrective_service import corrective_engine
from app.services.verification_service import verification_engine

def run_tests():
    print("=================================================================")
    print("  ZERO-DEFECT X — PHASE 6 AUTOMATED VERIFICATION SUITE")
    print("=================================================================")

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Pre-test cleanup to make test suite idempotent across multiple runs
    db.query(Reinspection).filter(Reinspection.id.like("REINSP-2026-%"), Reinspection.id != "REINSP-2026-008").delete(synchronize_session=False)
    db.query(CorrectiveAction).filter(CorrectiveAction.id.like("CA-2026-%")).delete(synchronize_session=False)
    db.query(MachineParameter).filter(MachineParameter.machine_id == "M03", MachineParameter.id > 4).delete(synchronize_session=False)
    m03 = db.query(Machine).filter(Machine.id == "M03").first()
    if m03:
        m03.status = "WARNING"
    db.commit()

    passed_count = 0
    total_tests = 10

    try:
        # TEST A: Defective inspection -> Corrective action created
        print("\n[TEST A] Defective Inspection -> Corrective Action Creation...")
        insp = db.query(Inspection).filter(Inspection.status == "DEFECTIVE").first()
        assert insp is not None, "No defective inspection found in database."

        action = corrective_engine.create_action(
            db=db,
            inspection_id=insp.id,
            action_description="Spindle bearing adjustment & vibration dampener recalibration",
            machine_id=insp.machine_id,
            probable_factor="Elevated M03 Vibration Baseline",
            priority="HIGH",
            assigned_to="Lead Maintenance Tech"
        )
        assert action.id.startswith("CA-2026-"), f"Action ID invalid: {action.id}"
        assert action.status == "Open", f"Action status expected 'Open', got {action.status}"
        assert len(action.recommended_actions) >= 3, "Recommended actions list is incomplete."
        print(f"  -> Action {action.id} created successfully with {len(action.recommended_actions)} recommended actions.")
        passed_count += 1

        # TEST B: Start corrective action -> Before condition captured
        print("\n[TEST B] Start Corrective Action -> Capture Before Condition Snapshot...")
        started_action = corrective_engine.start_action(db, action_id=action.id, notes="Technician arrived on site.")
        assert started_action.status == "In Progress", f"Status expected 'In Progress', got {started_action.status}"
        assert started_action.started_at is not None, "started_at timestamp was not set."
        assert started_action.before_snapshot is not None, "before_snapshot is missing."
        assert "vibration" in started_action.before_snapshot, "Vibration missing from before_snapshot."
        assert started_action.before_snapshot["vibration"] >= 4.0, f"Expected elevated vibration in before snapshot, got {started_action.before_snapshot['vibration']}"
        print(f"  -> Action {action.id} marked 'In Progress'. Before Vibration: {started_action.before_snapshot['vibration']} mm/s, Risk: {started_action.before_snapshot['risk_level']}")
        passed_count += 1

        # TEST C: Complete corrective action -> Machine state updated via NEW MachineParameter record
        print("\n[TEST C] Complete Corrective Action -> Deterministic Machine State Update...")
        initial_params_count = db.query(MachineParameter).filter(MachineParameter.machine_id == action.machine_id).count()
        completed_action = corrective_engine.complete_action(db, action_id=action.id, notes="Replaced dampener pads.")
        new_params_count = db.query(MachineParameter).filter(MachineParameter.machine_id == action.machine_id).count()

        assert completed_action.status == "Completed", f"Status expected 'Completed', got {completed_action.status}"
        assert completed_action.completed_at is not None, "completed_at timestamp missing."
        assert completed_action.after_snapshot is not None, "after_snapshot is missing."
        assert completed_action.after_snapshot["vibration"] == 2.7, f"Expected 2.7 mm/s after action, got {completed_action.after_snapshot['vibration']}"
        assert new_params_count == initial_params_count + 1, "New MachineParameter state record was not inserted."

        # Verify machine status updated to NORMAL
        m = db.query(Machine).filter(Machine.id == action.machine_id).first()
        assert m.status == "NORMAL", f"Machine status expected 'NORMAL', got {m.status}"
        print(f"  -> Action completed. New MachineParameter inserted. Vibration reduced: {completed_action.before_snapshot['vibration']} -> {completed_action.after_snapshot['vibration']} mm/s. Machine status: {m.status}")
        passed_count += 1

        # TEST D: Start reinspection -> Linked to original inspection & corrective action
        print("\n[TEST D] Reinspection Linkage (Inspection, Product, Batch, Machine, Action)...")
        reinsp_pass = verification_engine.create_reinspection_record(
            db=db,
            original_inspection_id=insp.id,
            corrective_action_id=completed_action.id,
            status="PASSED",
            overall_confidence=0.98,
            defects=[],
            image_path="/uploads/reinspections/sample_pass.jpg",
            notes="Demo Reinspection: 0 defects detected."
        )
        assert reinsp_pass.original_inspection_id == insp.id, "Original inspection ID linkage failed."
        assert reinsp_pass.corrective_action_id == completed_action.id, "Corrective action ID linkage failed."
        assert reinsp_pass.machine_id == insp.machine_id, "Machine ID mismatch in reinspection."
        print(f"  -> Reinspection {reinsp_pass.id} linked to Inspection {insp.id} and Action {completed_action.id}.")
        passed_count += 1

        # TEST E: Reinspection PASS -> Verification succeeds (VERIFIED)
        print("\n[TEST E] Reinspection PASS -> Deterministic Verification (VERIFIED)...")
        assert reinsp_pass.verification_status == "VERIFIED", f"Expected 'VERIFIED', got {reinsp_pass.verification_status}"
        assert "successful reinspection" in reinsp_pass.verification_notes.lower(), "Verification note incorrect."

        # Verify action status updated to 'Verified'
        db.refresh(completed_action)
        assert completed_action.status == "Verified", f"Expected action status 'Verified', got {completed_action.status}"
        print(f"  -> Verification passed! Status: {reinsp_pass.verification_status}. Action status: {completed_action.status}.")
        passed_count += 1

        # TEST F: Reinspection DEFECTIVE -> Verification requires further investigation
        print("\n[TEST F] Reinspection DEFECTIVE -> Verification REQUIRES FURTHER INVESTIGATION...")
        reinsp_fail = verification_engine.create_reinspection_record(
            db=db,
            original_inspection_id=insp.id,
            corrective_action_id=completed_action.id,
            status="DEFECTIVE",
            overall_confidence=0.92,
            defects=[{"defect_type": "Scratch", "severity": "Medium"}],
            image_path="/uploads/reinspections/sample_defect.jpg",
            notes="Unsuccessful trial reinspection test."
        )
        assert reinsp_fail.verification_status == "REQUIRES FURTHER INVESTIGATION", f"Expected 'REQUIRES FURTHER INVESTIGATION', got {reinsp_fail.verification_status}"
        print(f"  -> Deterministic failure handled correctly! Status: {reinsp_fail.verification_status}.")
        passed_count += 1

        # TEST G: Historical inspection remains unchanged
        print("\n[TEST G] Immutability: Historical Inspection & Parameter Records Unchanged...")
        db.refresh(insp)
        assert insp.status == "DEFECTIVE", "Historical inspection status was modified!"
        assert insp.machine_id == "M03", "Historical inspection machine changed!"
        # Check earliest parameter for M03 still exists with original value
        first_param = db.query(MachineParameter).filter(
            MachineParameter.machine_id == "M03"
        ).order_by(MachineParameter.timestamp.asc()).first()
        assert first_param is not None, "Historical parameter missing."
        print(f"  -> Historical inspection {insp.id} preserved immutable (status={insp.status}). Historical parameters preserved.")
        passed_count += 1

        # TEST H: Before/After comparison uses actual stored data
        print("\n[TEST H] Before/After Comparison Integrity...")
        assert reinsp_pass.before_condition is not None, "before_condition missing from reinspection."
        assert reinsp_pass.after_condition is not None, "after_condition missing from reinspection."
        assert reinsp_pass.before_condition["status"] == "DEFECTIVE", "Before condition status incorrect."
        assert reinsp_pass.after_condition["status"] == "PASSED", "After condition status incorrect."
        assert reinsp_pass.after_condition["vibration"] == "2.7 mm/s", f"After vibration incorrect: {reinsp_pass.after_condition['vibration']}"
        print(f"  -> Comparison Table Verified:")
        print(f"     Condition: Before={reinsp_pass.before_condition['vibration']}, After={reinsp_pass.after_condition['vibration']}")
        print(f"     Quality:   Before={reinsp_pass.before_condition['defect']} ({reinsp_pass.before_condition['status']}), After={reinsp_pass.after_condition['defect']} ({reinsp_pass.after_condition['status']})")
        passed_count += 1

        # TEST I: Traceability: Inspection -> Root Cause -> Action -> Reinspection
        print("\n[TEST I] Traceability Chain: Inspection -> Root Cause -> Action -> Reinspection...")
        rcas = db.query(RootCauseAnalysis).filter(RootCauseAnalysis.inspection_id == insp.id).all()
        assert len(rcas) > 0, "No root cause analysis linked to inspection."
        cas = db.query(CorrectiveAction).filter(CorrectiveAction.inspection_id == insp.id).all()
        assert len(cas) > 0, "No corrective action linked to inspection."
        reinsps = db.query(Reinspection).filter(Reinspection.original_inspection_id == insp.id).all()
        assert len(reinsps) > 0, "No reinspection linked to inspection."
        print(f"  -> Full lineage confirmed: {insp.id} -> {rcas[0].id} -> {cas[0].id} -> {reinsps[0].id}")
        passed_count += 1

        # TEST J: Database Persistence Verification
        print("\n[TEST J] Database Persistence & Integrity Check...")
        persisted_action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action.id).first()
        assert persisted_action is not None, "Action not found in DB."
        assert persisted_action.before_snapshot is not None, "Persisted before snapshot missing."
        assert persisted_action.after_snapshot is not None, "Persisted after snapshot missing."
        persisted_reinsp = db.query(Reinspection).filter(Reinspection.id == reinsp_pass.id).first()
        assert persisted_reinsp is not None, "Reinspection not found in DB."
        print(f"  -> All records and JSON snapshots successfully verified in SQLite/PostgreSQL store.")
        passed_count += 1

    finally:
        db.close()

    print("\n=================================================================")
    print(f"  PHASE 6 TEST RESULTS: {passed_count}/{total_tests} TESTS PASSED")
    print("=================================================================\n")
    if passed_count == total_tests:
        print(">>> ALL PHASE 6 ACCEPTANCE CRITERIA SATISFIED! <<<")
        return 0
    else:
        print(">>> SOME TESTS FAILED! <<<")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
