import React, { useState } from 'react';
import { StatCard } from '../components/common/StatCard';
import { MachineCard } from '../components/machine/MachineCard';
import { MachineDetailModal } from '../components/machine/MachineDetailModal';
import { Badge } from '../components/common/Badge';
import { DemoBanner } from '../components/common/DemoBanner';
import { machineService } from '../services/machineService';
import { inspectionService } from '../services/inspectionService';
import { Laptop2ConnectionCard } from '../components/machine/Laptop2ConnectionCard';
import type { Machine } from '../types';
import { Activity, ShieldAlert, AlertTriangle, Layers, PlusCircle, Search, Eye } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface CommandCenterProps {
  onNavigate: (tabId: string, params?: any) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onNavigate }) => {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const machines = machineService.getAllMachines();
  const inspections = inspectionService.getAllInspections();

  const totalInspected = 1248;
  const defectiveCount = 37;
  const defectRate = ((defectiveCount / totalInspected) * 100).toFixed(2);

  // Machine Defect Rate Bar Chart Data
  const machineChartData = machines.map((m) => ({
    name: m.id,
    rate: m.defectRate,
    vibration: m.currentVibration
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner */}
      <DemoBanner message="COMMAND CENTER — Real-time Quality Inspection & Predictive Manufacturing Intelligence Node" />

      {/* Laptop 2 Virtual Factory Integration Connection Card */}
      <Laptop2ConnectionCard />

      {/* Top KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard
          title="TOTAL INSPECTED"
          value={totalInspected.toLocaleString()}
          subtext="Shift A & B cumulative total"
          icon={Layers}
          iconColor="#4F7CAC"
        />
        <StatCard
          title="DEFECTIVE UNITS"
          value={defectiveCount}
          subtext="Requires quality quarantine"
          badgeText="37 UNITS"
          badgeStatus="HIGH"
          icon={AlertTriangle}
          iconColor="#E55353"
        />
        <StatCard
          title="DEFECT RATE"
          value={`${defectRate}%`}
          subtext="Target threshold < 2.00%"
          badgeText="ELEVATED"
          badgeStatus="HIGH"
          icon={Activity}
          iconColor="#D99A2B"
        />
        <StatCard
          title="CURRENT SYSTEM RISK"
          value="HIGH"
          subtext="Machine M03 Vibration Spike"
          badgeText="SCORE 82"
          badgeStatus="CRITICAL"
          icon={ShieldAlert}
          iconColor="#E55353"
        />
      </div>

      {/* Quick Action Workflow Banner */}
      <div
        className="scada-card"
        style={{
          background: 'linear-gradient(90deg, #121C2C 0%, #162235 100%)',
          border: '1px solid #4F7CAC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem'
        }}
      >
        <div>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#E8EDF3', display: 'block' }}>
            START NEW PRODUCT VISION INSPECTION
          </span>
          <span style={{ fontSize: '0.8rem', color: '#8D9AAA' }}>
            Upload or capture part image to trigger visual defect classification, context correlation, & root-cause analysis.
          </span>
        </div>
        <button
          className="scada-btn scada-btn-primary"
          onClick={() => onNavigate('new-inspection')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <PlusCircle size={16} />
          New Inspection Workflow
        </button>
      </div>

      {/* Two Column Grid: Live Machines & Defect Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem' }}>
        {/* Machine Telemetry Grid */}
        <div className="scada-card">
          <div className="scada-header">
            <span className="scada-title">STATION STATUS (LIVE TELEMETRY)</span>
            <button className="scada-btn scada-btn-secondary scada-btn-sm" onClick={() => onNavigate('machines')}>
              View All Machines →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {machines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} onSelect={(m) => setSelectedMachine(m)} />
            ))}
          </div>
        </div>

        {/* Machine Defect Rate Chart */}
        <div className="scada-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="scada-header">
            <span className="scada-title">DEFECT RATE BY MACHINE (%)</span>
            <span className="font-mono text-xs text-text-secondary">M03 ANOMALY</span>
          </div>
          <div style={{ flex: 1, minHeight: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26364A" />
                <XAxis dataKey="name" stroke="#8D9AAA" fontSize={11} />
                <YAxis stroke="#8D9AAA" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#121C2C', borderColor: '#26364A', color: '#E8EDF3' }} />
                <Bar dataKey="rate" fill="#4F7CAC" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Root Cause Intelligence Highlight Card */}
      <div
        className="scada-card"
        style={{
          borderLeft: '4px solid #E55353',
          backgroundColor: '#121C2C'
        }}
      >
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search className="w-4 h-4 text-status-critical" />
            <span className="scada-title" style={{ color: '#E8EDF3' }}>
              PROBABLE ROOT-CAUSE HIGHLIGHT — STATION M03
            </span>
          </div>
          <Badge status="HIGH" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E55353', display: 'block', marginBottom: '0.3rem' }}>
              PRIMARY FACTOR: Elevated Machine Vibration (4.8 mm/s vs baseline 2.1 mm/s)
            </span>
            <p style={{ fontSize: '0.8rem', color: '#8D9AAA', lineHeight: 1.5 }}>
              ZeroDefect-X root-cause engine identified a 84% evidence association score connecting recent Scratch defects on
              Batch B1042 with drive spindle vibration spikes on Machine M03.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button className="scada-btn scada-btn-secondary" onClick={() => onNavigate('root-cause')}>
              Investigate Root Cause →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Inspections Data Table */}
      <div className="scada-card">
        <div className="scada-header">
          <span className="scada-title">RECENT INSPECTIONS FEED</span>
          <button className="scada-btn scada-btn-secondary scada-btn-sm" onClick={() => onNavigate('inspection-history')}>
            Full History →
          </button>
        </div>

        <div className="scada-table-wrapper">
          <table className="scada-table">
            <thead>
              <tr>
                <th>Inspection ID</th>
                <th>Product ID</th>
                <th>Batch</th>
                <th>Machine</th>
                <th>Status</th>
                <th>Defect Type</th>
                <th>Severity</th>
                <th>Confidence</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {inspections.slice(0, 5).map((insp) => (
                <tr key={insp.id} onClick={() => onNavigate('inspection-details', { id: insp.id })}>
                  <td className="font-mono" style={{ color: '#4F7CAC', fontWeight: 600 }}>
                    {insp.id}
                  </td>
                  <td className="font-mono">{insp.productId}</td>
                  <td className="font-mono">{insp.batchId}</td>
                  <td className="font-mono">{insp.machineId}</td>
                  <td>
                    <Badge status={insp.status} />
                  </td>
                  <td style={{ color: insp.status === 'DEFECTIVE' ? '#E55353' : '#22A06B', fontWeight: 600 }}>
                    {insp.defects[0]?.type || 'Normal'}
                  </td>
                  <td>
                    {insp.defects[0] ? <Badge status={insp.defects[0].severity} showDot={false} /> : <span style={{ color: '#5C6B7E' }}>—</span>}
                  </td>
                  <td className="font-mono">
                    {insp.defects[0] ? `${insp.defects[0].confidence.toFixed(1)}%` : '99.4%'}
                  </td>
                  <td className="font-mono" style={{ color: '#8D9AAA' }}>
                    {insp.timestamp}
                  </td>
                  <td>
                    <button className="scada-btn scada-btn-secondary scada-btn-sm">
                      <Eye size={12} />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Machine Telemetry Modal */}
      <MachineDetailModal machine={selectedMachine} onClose={() => setSelectedMachine(null)} />
    </div>
  );
};
