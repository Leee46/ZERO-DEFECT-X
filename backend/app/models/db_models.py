import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    product_code = Column(String, nullable=False, unique=True, index=True)
    product_name = Column(String, nullable=False)
    product_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    batches = relationship("Batch", back_populates="product")
    inspections = relationship("Inspection", back_populates="product")


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(String, primary_key=True, index=True)
    shift_name = Column(String, nullable=False)
    operator_name = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)

    # Relationships
    batches = relationship("Batch", back_populates="shift")
    inspections = relationship("Inspection", back_populates="shift")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(String, primary_key=True, index=True)
    machine_code = Column(String, nullable=False, unique=True, index=True)
    machine_name = Column(String, nullable=False)
    machine_type = Column(String, nullable=False)
    location = Column(String, nullable=False)
    status = Column(String, nullable=False, default="NORMAL") # NORMAL, WARNING, CRITICAL, OFFLINE
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    batches = relationship("Batch", back_populates="machine")
    inspections = relationship("Inspection", back_populates="machine")
    parameters = relationship("MachineParameter", back_populates="machine")
    risk_assessments = relationship("RiskAssessment", back_populates="machine")
    alerts = relationship("Alert", back_populates="machine")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(String, primary_key=True, index=True)
    batch_code = Column(String, nullable=False, unique=True, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False)
    shift_id = Column(String, ForeignKey("shifts.id"), nullable=False)
    production_start = Column(DateTime, default=datetime.datetime.utcnow)
    production_end = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="ACTIVE") # ACTIVE, COMPLETED, PAUSED

    # Relationships
    product = relationship("Product", back_populates="batches")
    machine = relationship("Machine", back_populates="batches")
    shift = relationship("Shift", back_populates="batches")
    inspections = relationship("Inspection", back_populates="batch")


class MachineParameter(Base):
    __tablename__ = "machine_parameters"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    temperature = Column(Float, nullable=False) # °C
    vibration = Column(Float, nullable=False)   # mm/s
    pressure = Column(Float, nullable=False)    # bar
    speed = Column(Integer, nullable=False)     # RPM

    # Relationships
    machine = relationship("Machine", back_populates="parameters")


class EnvironmentReading(Base):
    __tablename__ = "environment_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    temperature = Column(Float, nullable=False) # °C
    humidity = Column(Float, nullable=False)    # %


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False)
    shift_id = Column(String, ForeignKey("shifts.id"), nullable=False)
    image_path = Column(String, nullable=True)
    inspection_time = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, nullable=False, default="PASSED") # PASSED, DEFECTIVE, FLAGGED
    overall_confidence = Column(Float, nullable=True, default=None)

    # Relationships
    product = relationship("Product", back_populates="inspections")
    batch = relationship("Batch", back_populates="inspections")
    machine = relationship("Machine", back_populates="inspections")
    shift = relationship("Shift", back_populates="inspections")
    defects = relationship("Defect", back_populates="inspection")
    root_cause_analyses = relationship("RootCauseAnalysis", back_populates="inspection")
    corrective_actions = relationship("CorrectiveAction", back_populates="inspection")
    reinspections = relationship("Reinspection", back_populates="original_inspection")


class Defect(Base):
    __tablename__ = "defects"

    id = Column(String, primary_key=True, index=True)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)
    defect_type = Column(String, nullable=False) # Scratch, Crack, Dent, Surface Defect, Missing Feature
    confidence = Column(Float, nullable=False)
    severity = Column(String, nullable=False) # Low, Medium, High, Critical
    location = Column(String, nullable=False)
    x_min = Column(Float, nullable=True)
    y_min = Column(Float, nullable=True)
    x_max = Column(Float, nullable=True)
    y_max = Column(Float, nullable=True)

    # Relationships
    inspection = relationship("Inspection", back_populates="defects")


class RootCauseAnalysis(Base):
    __tablename__ = "root_cause_analysis"

    id = Column(String, primary_key=True, index=True)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False)
    probable_factor = Column(String, nullable=False)
    evidence = Column(JSON, nullable=False) # List of evidence string statements
    confidence = Column(Float, nullable=False)
    verification_required = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    inspection = relationship("Inspection", back_populates="root_cause_analyses")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String, primary_key=True, index=True)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False)
    defect_type = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=False) # 0-100
    risk_level = Column(String, nullable=False) # LOW, MODERATE, HIGH, CRITICAL
    contributing_signals = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    machine = relationship("Machine", back_populates="risk_assessments")


class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(String, primary_key=True, index=True)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=True)
    probable_factor = Column(String, nullable=True)
    action_description = Column(String, nullable=False)
    recommended_actions = Column(JSON, nullable=True)
    priority = Column(String, nullable=False, default="HIGH") # LOW, MEDIUM, HIGH, URGENT
    status = Column(String, nullable=False, default="Open") # Recommended, Open, In Progress, Completed, Verified, Rejected
    assigned_to = Column(String, nullable=False, default="Operator / Maintenance Tech")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    before_snapshot = Column(JSON, nullable=True)
    after_snapshot = Column(JSON, nullable=True)

    # Relationships
    inspection = relationship("Inspection", back_populates="corrective_actions")
    reinspections = relationship("Reinspection", back_populates="corrective_action")


class Reinspection(Base):
    __tablename__ = "reinspections"

    id = Column(String, primary_key=True, index=True)
    original_inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)
    corrective_action_id = Column(String, ForeignKey("corrective_actions.id"), nullable=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=True)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=True)
    image_path = Column(String, nullable=True)
    reinspection_time = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, nullable=False, default="PASSED") # PASSED, DEFECTIVE
    overall_confidence = Column(Float, nullable=True, default=None)
    defect_detected = Column(Boolean, default=False)
    defects = Column(JSON, nullable=True)
    verification_status = Column(String, nullable=True, default="PENDING") # VERIFIED, REQUIRES FURTHER INVESTIGATION
    verification_notes = Column(Text, nullable=True)
    before_condition = Column(JSON, nullable=True)
    after_condition = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    original_inspection = relationship("Inspection", back_populates="reinspections")
    corrective_action = relationship("CorrectiveAction", back_populates="reinspections")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    machine_id = Column(String, ForeignKey("machines.id"), nullable=False)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=False) # WARNING, HIGH, CRITICAL
    message = Column(String, nullable=False)
    status = Column(String, nullable=False, default="ACTIVE") # ACTIVE, ACKNOWLEDGED, RESOLVED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    machine = relationship("Machine", back_populates="alerts")
