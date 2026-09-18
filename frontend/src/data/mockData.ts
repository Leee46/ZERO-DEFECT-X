import type { Machine, Inspection, Batch, Alert, TraceabilityRecord } from '../types';

// SVG canvas image generator helpers for clean industrial component visuals
const createMetalPlateSvg = (defectType: string, label: string) => {
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E293B"/>
        <stop offset="50%" stop-color="#334155"/>
        <stop offset="100%" stop-color="#0F172A"/>
      </linearGradient>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#26364A" stroke-width="0.5"/>
      </pattern>
    </defs>
    <!-- Background Plate -->
    <rect width="600" height="400" fill="url(#metal)"/>
    <rect width="600" height="400" fill="url(#grid)" opacity="0.6"/>
    
    <!-- Machined Component Outline -->
    <rect x="60" y="50" width="480" height="300" rx="12" fill="#1E2B3E" stroke="#475569" stroke-width="3"/>
    <circle cx="100" cy="90" r="16" fill="#0F172A" stroke="#334155" stroke-width="2"/>
    <circle cx="500" cy="90" r="16" fill="#0F172A" stroke="#334155" stroke-width="2"/>
    <circle cx="100" cy="310" r="16" fill="#0F172A" stroke="#334155" stroke-width="2"/>
    <circle cx="500" cy="310" r="16" fill="#0F172A" stroke="#334155" stroke-width="2"/>
    <rect x="220" y="140" width="160" height="120" rx="6" fill="#0F172A" stroke="#334155" stroke-width="2"/>
    
    <!-- Defect Visualizations -->
    ${defectType === 'Scratch' ? `
      <!-- Deep Scratch on Upper Right -->
      <path d="M 370 95 Q 410 120 435 155" stroke="#E55353" stroke-width="3" stroke-dasharray="2,2" fill="none"/>
      <path d="M 372 96 L 433 154" stroke="#F87171" stroke-width="2" fill="none"/>
      <circle cx="400" cy="125" r="4" fill="#EF4444"/>
    ` : ''}

    ${defectType === 'Crack' ? `
      <!-- Structural Crack -->
      <path d="M 140 220 L 155 240 L 150 260 L 170 275 L 165 295" stroke="#F59E0B" stroke-width="3" fill="none"/>
    ` : ''}

    ${defectType === 'Dent' ? `
      <!-- Surface Dent -->
      <ellipse cx="280" cy="200" rx="28" ry="18" fill="#111827" stroke="#D99A2B" stroke-width="2"/>
    ` : ''}

    <!-- Component Technical Stamp -->
    <text x="80" y="335" font-family="monospace" font-size="12" fill="#64748B">SER: ${label} | REF-ISO9001</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
};

export const INITIAL_MACHINES: Machine[] = [
  {
    id: 'M01',
    name: 'Precision Milling Unit 01',
    status: 'NORMAL',
    location: 'Bay A - Line 1',
    currentTemp: 64.2,
    baselineTemp: 65.0,
    currentVibration: 1.8,
    baselineVibration: 2.0,
    currentPressure: 6.1,
    baselinePressure: 6.0,
    currentSpeed: 1520,
    productionCount: 420,
    defectCount: 4,
    defectRate: 0.95,
    riskLevel: 'LOW',
    riskScore: 12,
    primaryDefectType: 'Normal',
    recentAlerts: 0,
    historicalTrend: [
      { timestamp: '08:00', defectRate: 0.8, vibration: 1.7, temp: 63.5 },
      { timestamp: '09:00', defectRate: 1.0, vibration: 1.8, temp: 64.0 },
      { timestamp: '10:00', defectRate: 0.9, vibration: 1.8, temp: 64.2 },
    ]
  },
  {
    id: 'M02',
    name: 'CNC Lathe Station 02',
    status: 'NORMAL',
    location: 'Bay A - Line 2',
    currentTemp: 68.5,
    baselineTemp: 67.0,
    currentVibration: 2.2,
    baselineVibration: 2.1,
    currentPressure: 5.9,
    baselinePressure: 6.0,
    currentSpeed: 1490,
    productionCount: 380,
    defectCount: 6,
    defectRate: 1.58,
    riskLevel: 'LOW',
    riskScore: 24,
    primaryDefectType: 'Surface Defect',
    recentAlerts: 0,
    historicalTrend: [
      { timestamp: '08:00', defectRate: 1.2, vibration: 2.0, temp: 66.8 },
      { timestamp: '09:00', defectRate: 1.5, vibration: 2.1, temp: 67.4 },
      { timestamp: '10:00', defectRate: 1.6, vibration: 2.2, temp: 68.5 },
    ]
  },
  {
    id: 'M03',
    name: 'High-Velocity Stamping Press 03',
    status: 'WARNING',
    location: 'Bay B - Line 1',
    currentTemp: 78.4,
    baselineTemp: 68.0,
    currentVibration: 4.8,
    baselineVibration: 2.1,
    currentPressure: 6.8,
    baselinePressure: 6.2,
    currentSpeed: 1480,
    productionCount: 310,
    defectCount: 27,
    defectRate: 8.71,
    riskLevel: 'HIGH',
    riskScore: 82,
    primaryDefectType: 'Scratch',
    recentAlerts: 3,
    historicalTrend: [
      { timestamp: '08:00', defectRate: 2.1, vibration: 2.3, temp: 69.0 },
      { timestamp: '09:00', defectRate: 5.4, vibration: 3.6, temp: 74.2 },
      { timestamp: '10:00', defectRate: 8.7, vibration: 4.8, temp: 78.4 },
    ]
  },
  {
    id: 'M04',
    name: 'Automated Assembly Station 04',
    status: 'NORMAL',
    location: 'Bay B - Line 2',
    currentTemp: 62.1,
    baselineTemp: 63.0,
    currentVibration: 1.6,
    baselineVibration: 1.8,
    currentPressure: 6.0,
    baselinePressure: 6.0,
    currentSpeed: 1600,
    productionCount: 440,
    defectCount: 2,
    defectRate: 0.45,
    riskLevel: 'LOW',
    riskScore: 8,
    primaryDefectType: 'Normal',
    recentAlerts: 0,
    historicalTrend: [
      { timestamp: '08:00', defectRate: 0.5, vibration: 1.6, temp: 61.8 },
      { timestamp: '09:00', defectRate: 0.4, vibration: 1.6, temp: 62.0 },
      { timestamp: '10:00', defectRate: 0.4, vibration: 1.6, temp: 62.1 },
    ]
  }
];

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'B1042',
    productId: 'P1042-087',
    targetQuantity: 500,
    producedQuantity: 310,
    defectCount: 27,
    machineId: 'M03',
    shift: 'Shift B',
    startTime: '2026-09-18 07:00:00',
    status: 'FLAGGED'
  },
  {
    id: 'B1041',
    productId: 'P1041-012',
    targetQuantity: 400,
    producedQuantity: 380,
    defectCount: 6,
    machineId: 'M02',
    shift: 'Shift A',
    startTime: '2026-09-17 23:00:00',
    status: 'ACTIVE'
  },
  {
    id: 'B1040',
    productId: 'P1040-001',
    targetQuantity: 500,
    producedQuantity: 500,
    defectCount: 4,
    machineId: 'M01',
    shift: 'Shift A',
    startTime: '2026-09-17 15:00:00',
    status: 'COMPLETED'
  }
];

export const INITIAL_INSPECTIONS: Inspection[] = [
  {
    id: 'INSP-2026-0842',
    productId: 'P1042-087',
    batchId: 'B1042',
    machineId: 'M03',
    shift: 'Shift B',
    timestamp: '2026-09-18 10:32:15',
    status: 'DEFECTIVE',
    defects: [
      {
        id: 'DEF-001',
        type: 'Scratch',
        confidence: 94.2,
        severity: 'HIGH',
        location: 'UPPER-RIGHT SURFACE',
        boundingBox: { x: 360, y: 90, width: 90, height: 80, label: 'Scratch [94.2%]' },
        description: 'Linear deep linear abrasion across outer metallic coating.'
      }
    ],
    imageUrl: createMetalPlateSvg('Scratch', 'P1042-087'),
    parameters: {
      temperature: 78.4,
      vibration: 4.8,
      pressure: 6.8,
      speed: 1480,
      envTemp: 29.5,
      envHumidity: 68
    },
    isControlledDemo: true,
    rootCause: {
      probableFactor: 'Elevated Machine Vibration (M03 Drive Shaft Anomaly)',
      evidenceScore: 84,
      analyzedAt: '2026-09-18 10:32:40',
      disclaimer: 'Statistical association based on rule-based heuristics & historical baseline deviations. Requires physical verification by maintenance team.',
      evidencePoints: [
        'Current vibration level (4.8 mm/s) exceeds operational threshold baseline (2.1 mm/s) by +128%.',
        'Historical defect logs correlate 78% of Scratch occurrences on M03 with vibration spikes above 4.0 mm/s.',
        'Batch B1042 was processed during peak thermal elevation (78.4°C vs baseline 68.0°C).'
      ],
      factors: [
        { factor: 'Vibration Deviation', score: 0.84, details: '4.8 mm/s vs baseline 2.1 mm/s (+128% anomaly)', isPrimary: true },
        { factor: 'Thermal Elevation', score: 0.38, details: '78.4°C vs baseline 68.0°C (+15% anomaly)' },
        { factor: 'Batch Material Lot', score: 0.18, details: 'Batch B1042 hardness within standard spec 42 HRC' },
        { factor: 'Shift / Operator Factor', score: 0.12, details: 'Shift B standard operating procedure compliance verified' }
      ]
    },
    riskAssessment: {
      machineId: 'M03',
      riskLevel: 'HIGH',
      riskScore: 82,
      signals: [
        'Vibration ↑ (+128% over baseline)',
        'Temperature ↑ (+15% over baseline)',
        'Scratch Defect Rate ↑ (8.71% vs target <2.0%)'
      ],
      trend: 'INCREASING'
    },
    correctiveAction: {
      id: 'ACT-9021',
      inspectionId: 'INSP-2026-0842',
      machineId: 'M03',
      batchId: 'B1042',
      defectType: 'Scratch',
      recommendedActions: [
        'Halt M03 production cycle and inspect main spindle bearing dampener',
        'Check tool alignment and die guide pins for mechanical play',
        'Quarantine Batch B1042 units produced between 10:00 - 10:35 AM',
        'Perform mandatory reinspection pass on 20 consecutive test samples',
        'Resume production after vibration level drops below 2.5 mm/s baseline'
      ],
      actualActionTaken: 'Replaced worn drive belt assembly and re-calibrated guide pins on Machine M03.',
      operator: 'Eng. R. Vance (Maint Lead)',
      status: 'IN_PROGRESS',
      createdAt: '2026-09-18 10:35:00',
      beforeDefectRate: 8.71,
      afterDefectRate: 1.20,
      verificationStatus: 'IMPROVED'
    }
  },
  {
    id: 'INSP-2026-0841',
    productId: 'P1042-086',
    batchId: 'B1042',
    machineId: 'M03',
    shift: 'Shift B',
    timestamp: '2026-09-18 10:28:40',
    status: 'DEFECTIVE',
    defects: [
      {
        id: 'DEF-002',
        type: 'Scratch',
        confidence: 91.5,
        severity: 'MEDIUM',
        location: 'UPPER-RIGHT SURFACE',
        boundingBox: { x: 350, y: 85, width: 80, height: 75, label: 'Scratch [91.5%]' },
        description: 'Minor surface scratch.'
      }
    ],
    imageUrl: createMetalPlateSvg('Scratch', 'P1042-086'),
    parameters: {
      temperature: 76.8,
      vibration: 4.5,
      pressure: 6.7,
      speed: 1480,
      envTemp: 29.2,
      envHumidity: 68
    },
    isControlledDemo: true
  },
  {
    id: 'INSP-2026-0840',
    productId: 'P1041-012',
    batchId: 'B1041',
    machineId: 'M02',
    shift: 'Shift A',
    timestamp: '2026-09-18 09:14:02',
    status: 'DEFECTIVE',
    defects: [
      {
        id: 'DEF-003',
        type: 'Crack',
        confidence: 88.0,
        severity: 'HIGH',
        location: 'LOWER-LEFT EDGE',
        boundingBox: { x: 130, y: 210, width: 60, height: 95, label: 'Crack [88.0%]' },
        description: 'Micro-fracture along flange radius.'
      }
    ],
    imageUrl: createMetalPlateSvg('Crack', 'P1041-012'),
    parameters: {
      temperature: 68.5,
      vibration: 2.2,
      pressure: 5.9,
      speed: 1490,
      envTemp: 28.0,
      envHumidity: 65
    },
    isControlledDemo: true
  },
  {
    id: 'INSP-2026-0839',
    productId: 'P1040-001',
    batchId: 'B1040',
    machineId: 'M01',
    shift: 'Shift A',
    timestamp: '2026-09-18 08:45:10',
    status: 'PASS',
    defects: [],
    imageUrl: createMetalPlateSvg('Normal', 'P1040-001'),
    parameters: {
      temperature: 64.2,
      vibration: 1.8,
      pressure: 6.1,
      speed: 1520,
      envTemp: 27.5,
      envHumidity: 64
    },
    isControlledDemo: true
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-1092',
    machineId: 'M03',
    title: 'ELEVATED SCRATCH RISK - HIGH VIBRATION ANOMALY',
    severity: 'HIGH',
    timestamp: '2026-09-18 10:32:45',
    status: 'IN_PROGRESS',
    message: 'Machine M03 vibration (4.8 mm/s) exceeded baseline threshold. Strong correlation with Scratch defect pattern.',
    associatedDefect: 'Scratch',
    inspectionId: 'INSP-2026-0842'
  },
  {
    id: 'ALT-1091',
    machineId: 'M03',
    title: 'THERMAL THRESHOLD EXCEEDED',
    severity: 'MEDIUM',
    timestamp: '2026-09-18 09:45:12',
    status: 'ACKNOWLEDGED',
    message: 'M03 spindle temperature reached 78.4°C (+15% deviation). Monitor cooling jacket pressure.',
    associatedDefect: 'Scratch',
    inspectionId: 'INSP-2026-0841'
  },
  {
    id: 'ALT-1090',
    machineId: 'M02',
    title: 'MINOR SURFACE ANOMALY TREND',
    severity: 'LOW',
    timestamp: '2026-09-18 08:12:00',
    status: 'RESOLVED',
    message: 'CNC tool wear indicator flagged scheduled blade replacement.',
    associatedDefect: 'Crack',
    inspectionId: 'INSP-2026-0840'
  }
];

export const MOCK_TRACEABILITY: TraceabilityRecord = {
  productId: 'P1042-087',
  batchId: 'B1042',
  machineId: 'M03',
  shift: 'Shift B',
  inspectionId: 'INSP-2026-0842',
  overallStatus: 'REINSPECTED_OK',
  timeline: [
    {
      stepNumber: 1,
      title: 'Raw Material Batch Released',
      description: 'Steel Lot B1042 released from warehouse to Bay B Stamping Line',
      timestamp: '2026-09-18 07:00:00',
      operatorOrSystem: 'MES Inventory System',
      status: 'COMPLETED'
    },
    {
      stepNumber: 2,
      title: 'Forming & Stamping Processed',
      description: 'Processed on Machine M03. Machine vibration registered at 4.8 mm/s during forming cycle.',
      timestamp: '2026-09-18 10:31:00',
      operatorOrSystem: 'Machine M03 PLC',
      status: 'WARNING',
      dataBadge: 'Vib: 4.8 mm/s'
    },
    {
      stepNumber: 3,
      title: 'Vision AI Quality Inspection',
      description: 'High-res industrial camera captured image. ZeroDefect-X Vision AI identified Scratch (94.2% confidence).',
      timestamp: '2026-09-18 10:32:15',
      operatorOrSystem: 'DemoVisionProvider (YOLO v8)',
      status: 'WARNING',
      dataBadge: 'DEFECT: SCRATCH'
    },
    {
      stepNumber: 4,
      title: 'Root-Cause Correlation Engine',
      description: 'Root-Cause service correlated elevated M03 vibration with Scratch pattern (Association Score 84%).',
      timestamp: '2026-09-18 10:32:40',
      operatorOrSystem: 'RootCauseEngine v1',
      status: 'INFO',
      dataBadge: 'Score: 84%'
    },
    {
      stepNumber: 5,
      title: 'Preventive Action Dispatch',
      description: 'Maintenance alert ALT-1092 logged. Maintenance replaced drive belt & re-aligned guide pins.',
      timestamp: '2026-09-18 10:45:00',
      operatorOrSystem: 'Eng. R. Vance',
      status: 'COMPLETED'
    },
    {
      stepNumber: 6,
      title: 'Reinspection & Verification',
      description: 'Reinspection pass performed. Defect rate dropped from 8.71% to 1.20%. Unit verified safe for shipment.',
      timestamp: '2026-09-18 11:15:00',
      operatorOrSystem: 'ZeroDefect-X Reinspection Engine',
      status: 'COMPLETED',
      dataBadge: 'VERIFIED OK'
    }
  ]
};

export const SAMPLE_PRODUCTS = [
  { id: 'P1042-087', name: 'Precision Gear Plate A4', batchId: 'B1042', machineId: 'M03', shift: 'Shift B', defectType: 'Scratch' },
  { id: 'P1042-091', name: 'Precision Gear Plate A4', batchId: 'B1042', machineId: 'M03', shift: 'Shift B', defectType: 'Crack' },
  { id: 'P1041-012', name: 'Alloy Flange Bracket B2', batchId: 'B1041', machineId: 'M02', shift: 'Shift A', defectType: 'Dent' },
  { id: 'P1040-001', name: 'Engine Mount Casting C1', batchId: 'B1040', machineId: 'M01', shift: 'Shift A', defectType: 'Normal' },
];
