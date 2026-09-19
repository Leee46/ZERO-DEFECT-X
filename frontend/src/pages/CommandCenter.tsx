import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/common/StatCard';
import { MachineCard } from '../components/machine/MachineCard';
import { MachineDetailModal } from '../components/machine/MachineDetailModal';
import { Badge } from '../components/common/Badge';
import { DemoBanner } from '../components/common/DemoBanner';
import { apiClient } from '../services/apiClient';
import { Laptop2ConnectionCard } from '../components/machine/Laptop2ConnectionCard';
import type { Machine } from '../types';
import { Activity, ShieldAlert, AlertTriangle, Layers, PlusCircle, Search, Eye } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface CommandCenterProps {
  onNavigate: (tabId: string, params?: any) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onNavigate }) => {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [rootCause, setRootCause] = useState<any | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        const [dashboardData, machineData, inspectionData] = await Promise.all([
          apiClient.get<any>('/dashboard'),
          apiClient.get<any[]>('/machines'),
          apiClient.get<any[]>('/inspections')
        ]);
        const rows: Machine[] = (Array.isArray(machineData) ? machineData : []).map((m: any) => ({
          id: m.id,
          name: m.machine_name || m.name || m.id,
          status: m.status || 'NORMAL',
          location: m.location || 'N/A',
          currentTemp: m.temperature,
          currentVibration: m.vibration,
          currentPressure: m.pressure,
          currentSpeed: m.speed,
          defectRate: Number(m.defect_rate || 0),
          riskLevel: Number(m.risk_score || 0) >= 75 ? 'CRITICAL' : Number(m.risk_score || 0) >= 50 ? 'HIGH' : Number(m.risk_score || 0) >= 25 ? 'MEDIUM' : 'LOW',
          riskScore: Number(m.risk_score || 0),
          baselineTemp: 70,
          baselineVibration: 2.5,
          primaryDefectType: 'Normal',
          baselinePressure: 6.0,
          productionCount: 0,
          defectCount: 0,
          recentAlerts: 0,
          historicalTrend: []
        } as Machine));
        const records = Array.isArray(inspectionData) ? inspectionData : [];
        const latestDefect = records.find((item: any) => item.status === 'DEFECTIVE');
        let rc = null;
        if (latestDefect) {
          try { rc = await apiClient.get<any>(`/root-cause/${latestDefect.id}`); } catch { rc = null; }
        }
        if (mounted) {
          setDashboard(dashboardData);
          setMachines(rows);
          setInspections(records);
          setRootCause(rc);
        }
      } catch (err) {
        if (mounted) setLoadError(err instanceof Error ? err.message : 'Unable to load live command-center data.');
      }
    };
    loadDashboard();
    return () => { mounted = false; };
  }, []);

  const totalInspected = Number(dashboard?.total_inspected ?? 0);
  const defectiveCount = Number(dashboard?.defective_units ?? 0);
  const defectRate = Number(dashboard?.defect_rate ?? 0).toFixed(2);

  const machineChartData = machines.map((m) => ({
    name: m.id,
    rate: m.defectRate,
    vibration: m.currentVibration
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {loadError && (
        <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}>
          <span className="scada-label" style={{ color: '#E55353' }}>COMMAND CENTER DATA UNAVAILABLE</span>
          <p style={{ color: '#8D9AAA', marginBottom: 0 }}>{loadError}</p>
        </div>
      )}

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
          value={dashboard?.current_system_risk || 'N/A'}
          subtext={dashboard?.high_risk_machine ? `Highest recorded risk: ${dashboard.high_risk_machine}` : 'Awaiting machine risk data'}
          badgeText={dashboard?.high_risk_machine ? `MACHINE ${dashboard.high_risk_machine}` : 'N/A'}
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
          <Badge status={rootCause?.is_insufficient_evidence ? 'INSUFFICIENT EVIDENCE' : rootCause ? 'EVIDENCE REVIEW' : 'N/A'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E55353', display: 'block', marginBottom: '0.3rem' }}>
              PRIMARY FACTOR: {rootCause?.probable_factor || 'No current probable factor available'}
            </span>
            <p style={{ fontSize: '0.8rem', color: '#8D9AAA', lineHeight: 1.5 }}>
              {rootCause?.disclaimer || 'Probable-cause analysis is generated from synchronized production records and is not proof of physical causation.'}
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
                    {insp.defects[0] ? `${Number(insp.defects[0].confidence || 0).toFixed(1)}%` : 'N/A'}
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
