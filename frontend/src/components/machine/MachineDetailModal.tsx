import React from 'react';
import type { Machine } from '../../types';
import { Badge } from '../common/Badge';
import { X, Cpu } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface MachineDetailModalProps {
  machine: Machine | null;
  onClose: () => void;
}

export const MachineDetailModal: React.FC<MachineDetailModalProps> = ({ machine, onClose }) => {
  if (!machine) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(7, 11, 20, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        className="scada-card"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#121C2C',
          border: '1px solid #4F7CAC'
        }}
      >
        {/* Header */}
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cpu style={{ width: '22px', height: '22px', color: '#4F7CAC' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#E8EDF3' }}>
                  STATION TELEMETRY: {machine.id}
                </span>
                <Badge status={machine.status} />
              </div>
              <span style={{ fontSize: '0.8rem', color: '#8D9AAA' }}>{machine.name} | {machine.location}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8D9AAA',
              cursor: 'pointer',
              padding: '0.2rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Telemetry Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: '#162235', padding: '0.6rem 0.75rem', borderRadius: '4px' }}>
            <span className="scada-label">TEMPERATURE</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: machine.currentTemp > 75 ? '#D99A2B' : '#E8EDF3' }}>
              {machine.currentTemp}°C
            </span>
            <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Baseline: {machine.baselineTemp}°C</span>
          </div>

          <div style={{ backgroundColor: '#162235', padding: '0.6rem 0.75rem', borderRadius: '4px' }}>
            <span className="scada-label">VIBRATION</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: machine.currentVibration > 3.0 ? '#E55353' : '#E8EDF3' }}>
              {machine.currentVibration} mm/s
            </span>
            <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Baseline: {machine.baselineVibration} mm/s</span>
          </div>

          <div style={{ backgroundColor: '#162235', padding: '0.6rem 0.75rem', borderRadius: '4px' }}>
            <span className="scada-label">PRESSURE</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#E8EDF3' }}>
              {machine.currentPressure} bar
            </span>
            <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Baseline: {machine.baselinePressure} bar</span>
          </div>

          <div style={{ backgroundColor: '#162235', padding: '0.6rem 0.75rem', borderRadius: '4px' }}>
            <span className="scada-label">SPINDLE SPEED</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#E8EDF3' }}>
              {machine.currentSpeed} RPM
            </span>
            <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Nominal</span>
          </div>
        </div>

        {/* Secondary KPI Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: '#162235', padding: '0.65rem', borderRadius: '4px', borderLeft: '3px solid #4F7CAC' }}>
            <span className="scada-label">PRODUCTION COUNT</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#E8EDF3' }}>
              {machine.productionCount} units
            </span>
          </div>

          <div style={{ backgroundColor: '#162235', padding: '0.65rem', borderRadius: '4px', borderLeft: '3px solid #E55353' }}>
            <span className="scada-label">DEFECT COUNT & RATE</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#E55353' }}>
              {machine.defectCount} ({machine.defectRate.toFixed(2)}%)
            </span>
          </div>

          <div style={{ backgroundColor: '#162235', padding: '0.65rem', borderRadius: '4px', borderLeft: '3px solid #D99A2B' }}>
            <span className="scada-label">RECENT ALERTS</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#D99A2B' }}>
              {machine.recentAlerts} active alerts
            </span>
          </div>
        </div>

        {/* Historical Defect & Vibration Trend Chart */}
        <div style={{ marginBottom: '1rem' }}>
          <span className="scada-title" style={{ marginBottom: '0.5rem', display: 'block' }}>
            TELEMETRY & DEFECT TREND
          </span>
          <div style={{ width: '100%', height: 180, backgroundColor: '#0B1220', padding: '0.5rem', borderRadius: '4px', border: '1px solid #26364A' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={machine.historicalTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26364A" />
                <XAxis dataKey="timestamp" stroke="#8D9AAA" fontSize={11} />
                <YAxis stroke="#8D9AAA" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121C2C', borderColor: '#26364A', color: '#E8EDF3' }}
                />
                <Line type="monotone" dataKey="defectRate" stroke="#E55353" name="Defect Rate %" strokeWidth={2} />
                <Line type="monotone" dataKey="vibration" stroke="#4F7CAC" name="Vibration mm/s" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="scada-btn scada-btn-secondary" onClick={onClose}>
            Close Telemetry View
          </button>
        </div>
      </div>
    </div>
  );
};
