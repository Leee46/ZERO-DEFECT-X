import React from 'react';
import { DemoBanner } from '../components/common/DemoBanner';
import { Badge } from '../components/common/Badge';
import { HardDrive } from 'lucide-react';

export const SystemStatusPage: React.FC = () => {
  const subsystems = [
    { name: 'Vision Inspection Engine', provider: 'OpenCV Anomaly Detector (development-stage)', status: 'ACTIVE', latency: 'Measured per request' },
    { name: 'FastAPI Backend Service', provider: 'Python / FastAPI REST API', status: 'ACTIVE', latency: 'Measured per request' },
    { name: 'Database', provider: 'SQLite local / PostgreSQL configurable', status: 'CONFIGURED', latency: 'Database dependent' },
    { name: 'Virtual Factory Adapter', provider: 'HTTP telemetry / corrective-action bridge', status: 'SIMULATED', latency: 'Network dependent' },
    { name: 'Probable-Cause Engine', provider: 'Synchronized telemetry + historical association', status: 'ACTIVE', latency: 'Measured per request' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="SYSTEM STATUS & HARDWARE ADAPTER DIAGNOSTICS — Vision & Sensor Connectivity" />

      <div className="scada-card">
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDrive className="w-4 h-4 text-system-blue" />
            <span className="scada-title">INFRASTRUCTURE MODULE STATUS</span>
          </div>
        </div>

        <div className="scada-table-wrapper">
          <table className="scada-table">
            <thead>
              <tr>
                <th>Subsystem Module</th>
                <th>Active Driver / Provider</th>
                <th>Status</th>
                <th>Inference / Sync Latency</th>
              </tr>
            </thead>
            <tbody>
              {subsystems.map((s, idx) => (
                <tr key={idx}>
                  <td className="font-mono" style={{ fontWeight: 600, color: '#E8EDF3' }}>{s.name}</td>
                  <td style={{ color: '#4F7CAC' }}>{s.provider}</td>
                  <td><Badge status={s.status} /></td>
                  <td className="font-mono" style={{ color: '#8D9AAA' }}>{s.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
