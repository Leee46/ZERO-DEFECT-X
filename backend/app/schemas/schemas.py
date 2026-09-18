from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Product ---
class ProductBase(BaseModel):
    product_code: str
    product_name: str
    product_type: str

class ProductCreate(ProductBase):
    id: str

class ProductOut(ProductBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Shift ---
class ShiftBase(BaseModel):
    shift_name: str
    operator_name: str
    start_time: str
    end_time: str

class ShiftCreate(ShiftBase):
    id: str

class ShiftOut(ShiftBase):
    id: str

    class Config:
        from_attributes = True


# --- Machine & Machine Parameters ---
class MachineParameterOut(BaseModel):
    id: int
    machine_id: str
    timestamp: Optional[datetime] = None
    temperature: float
    vibration: float
    pressure: float
    speed: int

    class Config:
        from_attributes = True

class MachineBase(BaseModel):
    machine_code: str
    machine_name: str
    machine_type: str
    location: str
    status: str = "NORMAL"

class MachineCreate(MachineBase):
    id: str

class MachineOut(MachineBase):
    id: str
    temperature: Optional[float] = None
    vibration: Optional[float] = None
    pressure: Optional[float] = None
    speed: Optional[int] = None
    defect_rate: Optional[float] = None
    risk_score: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Batch ---
class BatchBase(BaseModel):
    batch_code: str
    product_id: str
    machine_id: str
    shift_id: str
    status: str = "ACTIVE"

class BatchCreate(BatchBase):
    id: str

class BatchOut(BatchBase):
    id: str
    production_start: Optional[datetime] = None
    production_end: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Environment Readings ---
class EnvironmentReadingOut(BaseModel):
    id: int
    timestamp: Optional[datetime] = None
    temperature: float
    humidity: float

    class Config:
        from_attributes = True


# --- Defect ---
class DefectBase(BaseModel):
    defect_type: str
    confidence: float
    severity: str
    location: str
    x_min: Optional[float] = None
    y_min: Optional[float] = None
    x_max: Optional[float] = None
    y_max: Optional[float] = None

class DefectCreate(DefectBase):
    id: str
    inspection_id: str

class DefectOut(DefectBase):
    id: str
    inspection_id: str

    class Config:
        from_attributes = True


# --- Inspection ---
class InspectionCreate(BaseModel):
    product_id: str
    batch_id: str
    machine_id: str
    shift_id: str
    image_path: Optional[str] = None

class InspectionOut(BaseModel):
    id: str
    product_id: str
    batch_id: str
    machine_id: str
    shift_id: str
    image_path: Optional[str] = None
    annotated_image_url: Optional[str] = None
    inspection_time: Optional[datetime] = None
    status: str
    overall_confidence: float
    defects: List[DefectOut] = []

    class Config:
        from_attributes = True


# --- Root Cause Analysis ---
class RootCauseRequest(BaseModel):
    inspection_id: str
    machine_id: Optional[str] = None

class RootCauseOut(BaseModel):
    id: str
    inspection_id: str
    machine_id: str
    probable_factor: str
    evidence: List[str]
    confidence: float
    verification_required: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Risk Assessment ---
class RiskAssessmentOut(BaseModel):
    id: str
    machine_id: str
    defect_type: str
    risk_score: int
    risk_level: str
    contributing_signals: List[str]
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Corrective Actions ---
class CorrectiveActionCreate(BaseModel):
    inspection_id: str
    action_description: str
    priority: str = "HIGH"
    assigned_to: str = "Operator / Maintenance Tech"
    machine_id: Optional[str] = None
    probable_factor: Optional[str] = None
    recommended_actions: Optional[List[str]] = None
    notes: Optional[str] = None

class CorrectiveActionUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None
    action_description: Optional[str] = None

class CorrectiveActionOut(BaseModel):
    id: str
    inspection_id: str
    machine_id: Optional[str] = None
    probable_factor: Optional[str] = None
    action_description: str
    recommended_actions: Optional[List[str]] = None
    priority: str
    status: str
    assigned_to: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    before_snapshot: Optional[Dict[str, Any]] = None
    after_snapshot: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# --- Reinspection ---
class ReinspectionCreate(BaseModel):
    original_inspection_id: str
    corrective_action_id: Optional[str] = None
    product_id: Optional[str] = None
    batch_id: Optional[str] = None
    machine_id: Optional[str] = None
    image_path: Optional[str] = None
    status: str = "PASSED"
    defect_detected: bool = False
    overall_confidence: Optional[float] = None
    defects: Optional[List[Dict[str, Any]]] = None
    verification_status: Optional[str] = "PENDING"
    verification_notes: Optional[str] = None
    notes: Optional[str] = None

class ReinspectionVerifyRequest(BaseModel):
    notes: Optional[str] = None

class VerificationResultOut(BaseModel):
    reinspection_id: str
    verification_status: str # VERIFIED, REQUIRES FURTHER INVESTIGATION
    verification_message: str
    follow_up_recommendation: str
    before_condition: Dict[str, Any]
    after_condition: Dict[str, Any]

class ReinspectionOut(BaseModel):
    id: str
    original_inspection_id: str
    corrective_action_id: Optional[str] = None
    product_id: Optional[str] = None
    batch_id: Optional[str] = None
    machine_id: Optional[str] = None
    image_path: Optional[str] = None
    reinspection_time: Optional[datetime] = None
    status: str
    overall_confidence: Optional[float] = 0.95
    defect_detected: bool
    defects: Optional[List[Dict[str, Any]]] = None
    verification_status: Optional[str] = "PENDING"
    verification_notes: Optional[str] = None
    before_condition: Optional[Dict[str, Any]] = None
    after_condition: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# --- Alert ---
class AlertOut(BaseModel):
    id: str
    machine_id: str
    alert_type: str
    severity: str
    message: str
    status: str
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: str # ACKNOWLEDGED, RESOLVED


# --- Dashboard KPI Response ---
class DashboardOut(BaseModel):
    total_inspected: int
    defective_units: int
    defect_rate: float
    current_system_risk: str
    high_risk_machine: str
    active_alerts_count: int
    recent_inspections: List[Dict[str, Any]]
    defect_distribution: List[Dict[str, Any]]
    machine_defect_rates: List[Dict[str, Any]]
