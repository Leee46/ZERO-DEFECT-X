import React from 'react';
import { DemoBanner } from '../components/common/DemoBanner';
import { Badge } from '../components/common/Badge';
import { HardDrive } from 'lucide-react';

export const SystemStatusPage: React.FC = () => {
  const subsystems = [
    { name: 'Vision AI Provider Layer', provider: 'DemoVisionProvider (YOLOv8 Simulation)', status: 'ONLINE', latency: '42 ms' },
    { name: 'FastAPI Backend Service', provider: 'Python / Pydantic REST API Layer', status: 'READY (MOCKED)', latency: '3 ms' },
    { name: 'PostgreSQL Database', provider: 'PostgreSQL 15 Schema & Seed', status: 'SCHEMA READY', latency: '1 ms' },
    { name: 'ESP32 Industrial IoT Adapter', provider: 'REST / WebSocket / MQTT Bus', status: 'STANDBY (SIMULATED)', latency: 'N/A' },
    { name: 'Root-Cause Association Engine', provider: 'Deterministic Heuristic Rule Service', status: 'ACTIVE', latency: '8 ms' }
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
