export type DefectType = 'Scratch' | 'Crack' | 'Dent' | 'Surface Defect' | 'Missing Feature' | 'Normal';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type MachineStatus = 'NORMAL' | 'WARNING' | 'FAULT' | 'MAINTENANCE';

export type ActionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';

export type AlertStatus = 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface DefectItem {
  id: string;
  type: DefectType;
  defect_type?: string;
  confidence: number;
  severity: SeverityLevel;
  location: string;
  boundingBox: BoundingBox;
  description: string;
}

export interface MachineParameters {
  temperature: number; // °C
  vibration: number;   // mm/s
  pressure: number;    // bar
  speed: number;       // RPM
  envTemp: number;     // °C
  envHumidity: number; // %
}

export interface FactorBreakdown {
  factor: string;
  score: number; // 0 to 1
  details: string;
  isPrimary?: boolean;
}

export interface RootCauseResult {
  probableFactor: string;
  evidenceScore: number; // 0 to 100
  factors: FactorBreakdown[];
  evidencePoints: string[];
  disclaimer: string;
  analyzedAt: string;
}

export interface RiskAssessment {
  machineId: string;
  riskLevel: SeverityLevel;
  riskScore: number; // 0 to 100
  signals: string[];
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
}

export interface CorrectiveActionItem {
  id: string;
  inspectionId: string;
  machineId: string;
  batchId?: string;
  defectType?: DefectType;
  probableFactor?: string;
  actionDescription?: string;
  recommendedActions: string[];
  actualActionTaken?: string | null;
  operator?: string | null;
  status: ActionStatus | string;
  priority?: string;
  notes?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  resolvedAt?: string;
  beforeSnapshot?: {
    machine_id: string;
    temperature: number;
    vibration: number;
    pressure: number;
    speed: number;
    risk_level: string;
    defect_rate: number;
  };
  afterSnapshot?: {
    machine_id: string;
    temperature: number;
    vibration: number;
    pressure: number;
    speed: number;
    risk_level: string;
    defect_rate: number;
  };
  beforeDefectRate?: number;
  afterDefectRate?: number;
  verificationStatus?: 'IMPROVED' | 'UNRESOLVED' | 'PENDING' | 'VERIFIED' | 'REQUIRES FURTHER INVESTIGATION';
}

export interface ReinspectionRecord {
  id: string;
  original_inspection_id: string;
  corrective_action_id?: string;
  product_id?: string;
  batch_id?: string;
  machine_id?: string;
  image_path?: string;
  reinspection_time?: string;
  status: 'PASSED' | 'DEFECTIVE' | string;
  overall_confidence?: number;
  defect_detected: boolean;
  defects?: any[];
  verification_status?: 'VERIFIED' | 'REQUIRES FURTHER INVESTIGATION' | 'PENDING' | string;
  verification_notes?: string;
  before_condition?: {
    vibration: string;
    temperature: string;
    risk: string;
    defect: string;
    severity: string;
    status: string;
  };
  after_condition?: {
    vibration: string;
    temperature: string;
    risk: string;
    defect: string;
    severity: string;
    status: string;
  };
  notes?: string;
}

export interface Inspection {
  id: string;
  productId: string;
  product_id?: string;
  batchId: string;
  batch_id?: string;
  machineId: string;
  machine_id?: string;
  shift: string;
  shift_id?: string;
  timestamp: string;
  status: 'PASS' | 'DEFECTIVE' | string;
  defects: DefectItem[];
  imageUrl: string;
  imageThumbnail?: string;
  parameters: MachineParameters;
  rootCause?: RootCauseResult | null;
  root_cause?: any;
  riskAssessment?: RiskAssessment | null;
  correctiveAction?: CorrectiveActionItem | null;
  isControlledDemo?: boolean;
  overall_confidence?: number;
  anomaly_score?: number;
  factory_status?: string;
  factory_source_label?: string;
}

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  location: string;
  currentTemp: number;
  baselineTemp: number;
  currentVibration: number;
  baselineVibration: number;
  currentPressure: number;
  baselinePressure: number;
  currentSpeed: number;
  productionCount: number;
  defectCount: number;
  defectRate: number;
  riskLevel: SeverityLevel;
  riskScore: number;
  primaryDefectType: DefectType;
  recentAlerts: number;
  historicalTrend: { timestamp: string; defectRate: number; vibration: number; temp: number }[];
}

export interface Batch {
  id: string;
  productId: string;
  targetQuantity: number;
  producedQuantity: number;
  defectCount: number;
  machineId: string;
  shift: string;
  startTime: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FLAGGED';
}

export interface Alert {
  id: string;
  machineId: string;
  title: string;
  severity: SeverityLevel;
  timestamp: string;
  status: AlertStatus;
  message: string;
  associatedDefect: DefectType;
  inspectionId?: string;
}

export interface TraceabilityStep {
  stepNumber: number;
  title: string;
  description: string;
  timestamp: string;
  operatorOrSystem: string;
  status: 'COMPLETED' | 'WARNING' | 'INFO';
  dataBadge?: string;
}

export interface TraceabilityRecord {
  productId: string;
  batchId: string;
  machineId: string;
  shift: string;
  inspectionId: string;
  overallStatus: 'VERIFIED_SAFE' | 'QUARANTINED' | 'REINSPECTED_OK';
  timeline: TraceabilityStep[];
}
