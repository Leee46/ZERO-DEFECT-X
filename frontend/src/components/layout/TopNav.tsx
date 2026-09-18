import React, { useState, useEffect } from 'react';
import { Bell, Activity, Cpu } from 'lucide-react';

interface TopNavProps {
  alertCount?: number;
  onAlertClick?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ alertCount = 3, onAlertClick }) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' | ' + now.toLocaleDateString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        backgroundColor: '#121C2C',
        borderBottom: '1px solid #26364A',
        height: '60px',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      {/* Brand Title & Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(79, 124, 172, 0.15)',
            border: '1px solid #4F7CAC',
            padding: '0.3rem 0.6rem',
            borderRadius: '4px'
          }}
        >
          <Cpu style={{ color: '#4F7CAC', width: '18px', height: '18px' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: '#E8EDF3', letterSpacing: '0.05em' }}>
            ZERODEFECT X
          </span>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#8D9AAA', borderLeft: '1px solid #26364A', paddingLeft: '1rem' }}>
          Vision-Based Manufacturing Intelligence
        </span>
      </div>

      {/* Live System Telemetry Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* System Online Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'rgba(34, 160, 107, 0.12)',
            border: '1px solid rgba(34, 160, 107, 0.3)',
            padding: '0.25rem 0.6rem',
            borderRadius: '3px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: '#22A06B',
            fontWeight: 600
          }}
        >
          <span className="status-dot status-dot-safe" />
          SYSTEM ONLINE
        </div>

        {/* Date / Time */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: '#8D9AAA',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Activity style={{ width: '14px', height: '14px', color: '#4F7CAC' }} />
          {timeStr}
        </div>

        {/* Notification Alert Bell */}
        <button
          onClick={onAlertClick}
          style={{
            position: 'relative',
            background: '#162235',
            border: '1px solid #26364A',
            color: '#E8EDF3',
            padding: '0.4rem',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="View Active Production Alerts"
        >
          <Bell style={{ width: '18px', height: '18px', color: alertCount > 0 ? '#D99A2B' : '#8D9AAA' }} />
          {alertCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#E55353',
                color: '#FFF',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #121C2C'
              }}
            >
              {alertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
