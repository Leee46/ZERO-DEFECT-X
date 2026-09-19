import React, { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const Laptop2ConnectionCard: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const data = await apiClient.get<any>('/factory/status');
      setTelemetry(data);
    } catch (err) {
      setTelemetry({
        connection_status: 'DISCONNECTED',
        factory_status: 'Virtual Factory Offline',
        source_label: 'OFFLINE'
      });
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = telemetry?.connection_status === 'CONNECTED';

  return (
    <div
      className="scada-card"
      style={{
        border: `1px solid ${isConnected ? '#4F7CAC' : '#D9383A'}`,
        backgroundColor: '#121C2C',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
      }}
    >
      <div className="scada-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Server className={`w-5 h-5 ${isConnected ? 'text-system-blue' : 'text-status-critical'}`} />
          <div>
            <span className="scada-title" style={{ fontSize: '1rem', letterSpacing: '0.04em' }}>
              LAPTOP 2 VIRTUAL FACTORY INTEGRATION
            </span>
            <span style={{ fontSize: '0.72rem', color: '#8D9AAA', display: 'block' }}>
              Node: <strong style={{ color: '#4F7CAC' }}>{telemetry?.laptop2_url || 'Configured via LAPTOP2_URL'}</strong> | Endpoint: <span style={{ fontFamily: 'var(--font-mono)' }}>/api/telemetry</span>
            </span>
          </div>
        </div>

        {/* Connection Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isConnected && (
            <span
              style={{
                fontSize: '0.68rem',
                padding: '0.2rem 0.5rem',
                backgroundColor: 'rgba(79, 124, 172, 0.15)',
                border: '1px solid #4F7CAC',
                borderRadius: '4px',
                color: '#4F7CAC',
                fontWeight: 700
              }}
            >
              SIMULATED FACTORY DATA
            </span>
          )}

          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.65rem',
              backgroundColor: isConnected ? 'rgba(34, 160, 107, 0.2)' : 'rgba(217, 56, 58, 0.2)',
              border: `1px solid ${isConnected ? '#22A06B' : '#D9383A'}`,
              borderRadius: '4px',
              color: isConnected ? '#22A06B' : '#F87171',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isConnected ? 'CONNECTED' : 'DISCONNECTED / VIRTUAL FACTORY OFFLINE'}
          </span>
        </div>
      </div>

      {isConnected && telemetry ? (
        <div style={{ marginTop: '0.85rem' }}>
          {/* Main Context Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <div style={{ backgroundColor: '#162235', padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid #26364A' }}>
              <span className="scada-label">MACHINE ID</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E8EDF3', fontFamily: 'var(--font-mono)' }}>
                {telemetry.machine_id || 'N/A'}
              </span>
            </div>
            <div style={{ backgroundColor: '#162235', padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid #26364A' }}>
              <span className="scada-label">PRODUCT ID</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4F7CAC', fontFamily: 'var(--font-mono)' }}>
                {telemetry.product_id || 'N/A'}
              </span>
            </div>
            <div style={{ backgroundColor: '#162235', padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid #26364A' }}>
              <span className="scada-label">BATCH ID</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E8EDF3', fontFamily: 'var(--font-mono)' }}>
                {telemetry.batch_id || 'N/A'}
              </span>
            </div>
            <div style={{ backgroundColor: '#162235', padding: '0.5rem 0.65rem', borderRadius: '4px', border: '1px solid #26364A' }}>
              <span className="scada-label">SHIFT</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E8EDF3', fontFamily: 'var(--font-mono)' }}>
                {telemetry.operator_shift || 'N/A'}
              </span>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.6rem' }}>
            {/* Temp */}
            <div style={{ backgroundColor: '#070B14', padding: '0.5rem 0.6rem', borderRadius: '4px', border: '1px solid #26364A' }}>
              <span className="scada-label" style={{ fontSize: '0.65rem' }}>TEMP (°C)</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: telemetry.temperature_c > 70 ? '#D99A2B' : '#E8EDF3' }}>
                {telemetry.temperature_c?.toFixed(1)}°C
              </span>
            </div>

            {/* Vibration */}
            <div style={{
              backgroundColor: telemetry.vibration_mm_s > 3.0 ? 'rgba(229, 83, 83, 0.15)' : '#070B14',
              padding: '0.5rem 0.6rem',
              borderRadius: '4px',
              border: `1px solid ${telemetry.vibration_mm_s > 3.0 ? '#E55353' : '#26364A'}`
            }}>
              <span className="scada-label" style={{ fontSize: '0.65rem', color: telemetry.vibration_mm_s > 3.0 ? '#E55353' : '#8D9AAA' }}>
                VIBRATION
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: telemetry.vibration_mm_s > 3.0 ? '#E55353' : '#22A06B' }}>
                {telemetry.vibration_mm_s?.toFixed(1)} mm/s
              </span>
            </div>

            {/* Pressure */}
            <div style={{ backgroundColor: '#070B14', padding: '0.5rem 0.6rem', borderRadius: '4px', border: '1px solid #26364A' }}>
              <span className="scada-label" style={{ fontSize: '0.65rem' }}>PRESSURE</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#E8EDF3' }}>
                {telemetry.pressure_bar?.toFixed(1)} bar
              </span>
            </div>

            {/* RPM */}
            <div style={{ backgroundColor: '#070B14', padding: '0.5rem 0.6rem', borderRadius: '4px', border: '1px solid #26364A' }}>
              <span className="scada-label" style={{ fontSize: '0.65rem' }}>RPM</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#E8EDF3' }}>
                {telemetry.spindle_rpm}
              </span>
            </div>

            {/* Env Temp */}
            <div style={{ backgroundColor: '#070B14', padding: '0.5rem 0.6rem', borderRadius: '4px', border: '1px solid #26364A' }}>
              <span className="scada-label" style={{ fontSize: '0.65rem' }}>ENV TEMP</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#E8EDF3' }}>
                {telemetry.environment_temp_c?.toFixed(1)}°C
              </span>
            </div>

            {/* Humidity */}
            <div style={{ backgroundColor: '#070B14', padding: '0.5rem 0.6rem', borderRadius: '4px', border: '1px solid #26364A' }}>
              <span className="scada-label" style={{ fontSize: '0.65rem' }}>HUMIDITY</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#E8EDF3' }}>
                {telemetry.humidity_pct}%
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', fontSize: '0.72rem', color: '#8D9AAA' }}>
            <div>
              Machine Status: <strong style={{ color: telemetry.machine_status === 'NORMAL' ? '#22A06B' : '#E55353' }}>{telemetry.machine_status}</strong> | Production Status: <strong style={{ color: '#4F7CAC' }}>{telemetry.production_status}</strong>
            </div>
            <div>
              Timestamp: <span style={{ fontFamily: 'var(--font-mono)', color: '#E8EDF3' }}>{new Date(telemetry.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: '#070B14', borderRadius: '4px', marginTop: '0.75rem', border: '1px solid #2C1B1F' }}>
          <WifiOff size={28} color="#F87171" style={{ margin: '0 auto 0.4rem auto' }} />
          <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#F87171' }}>
            VIRTUAL FACTORY OFFLINE — DISCONNECTED
          </span>
          <span style={{ fontSize: '0.75rem', color: '#8D9AAA' }}>
            Configured Laptop 2 telemetry endpoint is not reachable. Live connection is required for production context tracking.
          </span>
        </div>
      )}
    </div>
  );
};
