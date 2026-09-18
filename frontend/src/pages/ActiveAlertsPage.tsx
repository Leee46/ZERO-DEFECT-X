import React, { useState } from 'react';
import { INITIAL_ALERTS } from '../data/mockData';
import type { Alert, AlertStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { DemoBanner } from '../components/common/DemoBanner';
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react';

interface ActiveAlertsPageProps {
  onNavigate: (tabId: string, params?: any) => void;
}

export const ActiveAlertsPage: React.FC<ActiveAlertsPageProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);

  const handleUpdateStatus = (alertId: string, newStatus: AlertStatus) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="ACTIVE PRODUCTION ALERTS CENTER — Interactive SCADA Incident Escalation & Action State" />

      <div className="scada-card">
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            <span className="scada-title">ACTIVE QUALITY ALERTS & INCIDENTS</span>
          </div>
          <span className="font-mono text-xs text-text-secondary">
            {alerts.filter((a) => a.status !== 'RESOLVED').length} UNRESOLVED INCIDENTS
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                backgroundColor: '#162235',
                border: '1px solid #26364A',
                borderLeft: `4px solid ${
                  alert.severity === 'HIGH' ? '#E55353' : alert.severity === 'MEDIUM' ? '#D99A2B' : '#4F7CAC'
                }`,
                borderRadius: '4px',
                padding: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#4F7CAC' }}>
                    [{alert.id}]
                  </span>
                  <span style={{ fontWeight: 700, color: '#E8EDF3', fontSize: '0.95rem' }}>
                    {alert.title}
                  </span>
                  <Badge status={alert.severity} />
                </div>
                <Badge status={alert.status} />
              </div>

              <p style={{ fontSize: '0.85rem', color: '#8D9AAA', marginBottom: '0.75rem' }}>
                {alert.message}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #26364A', paddingTop: '0.6rem' }}>
                <span className="font-mono text-xs text-text-secondary">
                  Machine Station: {alert.machineId} | Triggered: {alert.timestamp}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="scada-btn scada-btn-secondary scada-btn-sm"
                    onClick={() => onNavigate('root-cause', { inspectionId: alert.inspectionId })}
                  >
                    <Search size={12} />
                    Investigate
                  </button>

                  {alert.status === 'NEW' && (
                    <button
                      className="scada-btn scada-btn-secondary scada-btn-sm"
                      onClick={() => handleUpdateStatus(alert.id, 'ACKNOWLEDGED')}
                    >
                      Acknowledge
                    </button>
                  )}

                  {(alert.status === 'NEW' || alert.status === 'ACKNOWLEDGED') && (
                    <button
                      className="scada-btn scada-btn-primary scada-btn-sm"
                      onClick={() => handleUpdateStatus(alert.id, 'IN_PROGRESS')}
                    >
                      Mark In Progress
                    </button>
                  )}

                  {alert.status === 'IN_PROGRESS' && (
                    <button
                      className="scada-btn scada-btn-primary scada-btn-sm"
                      onClick={() => {
                        handleUpdateStatus(alert.id, 'RESOLVED');
                        onNavigate('reinspection');
                      }}
                      style={{ backgroundColor: '#22A06B', borderColor: '#22A06B' }}
                    >
                      <CheckCircle2 size={12} />
                      Resolve Alert & Reinspect
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
