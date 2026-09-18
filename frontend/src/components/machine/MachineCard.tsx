import React from 'react';
import type { Machine } from '../../types';
import { Badge } from '../common/Badge';
import { Cpu } from 'lucide-react';

interface MachineCardProps {
  machine: Machine;
  onSelect: (machine: Machine) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onSelect }) => {
  return (
    <div
      className="scada-card"
      onClick={() => onSelect(machine)}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div className="scada-header" style={{ marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu className="w-4 h-4 text-system-blue" />
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#E8EDF3' }}>
            {machine.id}
          </span>
        </div>
        <Badge status={machine.status} />
      </div>

      <div style={{ fontSize: '0.8rem', color: '#8D9AAA', marginBottom: '0.75rem' }}>
        {machine.name}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{ backgroundColor: '#162235', padding: '0.4rem 0.6rem', borderRadius: '3px' }}>
          <span className="scada-label" style={{ fontSize: '0.65rem' }}>VIBRATION</span>
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: machine.currentVibration > 3.0 ? '#E55353' : '#E8EDF3'
            }}
          >
            {machine.currentVibration} mm/s
          </span>
        </div>

        <div style={{ backgroundColor: '#162235', padding: '0.4rem 0.6rem', borderRadius: '3px' }}>
          <span className="scada-label" style={{ fontSize: '0.65rem' }}>TEMP</span>
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: machine.currentTemp > 75 ? '#D99A2B' : '#E8EDF3'
            }}
          >
            {machine.currentTemp}°C
          </span>
        </div>

        <div style={{ backgroundColor: '#162235', padding: '0.4rem 0.6rem', borderRadius: '3px' }}>
          <span className="scada-label" style={{ fontSize: '0.65rem' }}>DEFECT RATE</span>
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: machine.defectRate > 5.0 ? '#E55353' : '#22A06B'
            }}
          >
            {machine.defectRate.toFixed(2)}%
          </span>
        </div>

        <div style={{ backgroundColor: '#162235', padding: '0.4rem 0.6rem', borderRadius: '3px' }}>
          <span className="scada-label" style={{ fontSize: '0.65rem' }}>DEFECT RISK</span>
          <div style={{ marginTop: '0.1rem' }}>
            <Badge status={machine.riskLevel} showDot={false} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#5C6B7E', borderTop: '1px solid #26364A', paddingTop: '0.4rem' }}>
        <span>Loc: {machine.location}</span>
        <span style={{ color: '#4F7CAC', fontWeight: 600 }}>Click for Telemetry →</span>
      </div>
    </div>
  );
};
