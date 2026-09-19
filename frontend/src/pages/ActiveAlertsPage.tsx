import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import type { Alert, AlertStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { DemoBanner } from '../components/common/DemoBanner';
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react';

interface ActiveAlertsPageProps {
  onNavigate: (tabId: string, params?: any) => void;
}

export const ActiveAlertsPage: React.FC<ActiveAlertsPageProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<any[]>('/alerts')
      .then((rows) => {
        const mapped: Alert[] = (Array.isArray(rows) ? rows : []).map((a: any) => ({
          id: a.id,
          title: a.alert_type,
          severity: a.severity === 'WARNING' ? 'MEDIUM' : a.severity,
          status: a.status === 'ACTIVE' ? 'NEW' : a.status,
          message: a.message,
          machineId: a.machine_id,
          timestamp: a.created_at ? new Date(a.created_at).toLocaleString() : 'N/A',
          inspectionId: undefined
        })) as Alert[];
        setAlerts(mapped);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load alerts from backend.'));
  }, []);

  const handleUpdateStatus = async (alertId: string, newStatus: AlertStatus) => {
    try {
      const backendStatus = newStatus === 'NEW' ? 'ACTIVE' : newStatus === 'RESOLVED' ? 'RESOLVED' : 'ACKNOWLEDGED';
      const updated = await apiClient.patch<any>(`/alerts/${alertId}`, { status: backendStatus });
      setAlerts((prev) => prev.map((a) => a.id === alertId ? {
        ...a,
        status: updated.status === 'ACTIVE' ? 'NEW' : updated.status
      } : a));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update alert status.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="ACTIVE PRODUCTION ALERTS CENTER — Interactive SCADA Incident Escalation & Action State" />

      {error && <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}><p style={{ color: '#E55353', marginBottom: 0 }}>{error}</p></div>}

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
                    onClick={() => onNavigate('risk-monitor')}
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

                  {alert.status === 'ACKNOWLEDGED' && (
                    <button
                      className="scada-btn scada-btn-primary scada-btn-sm"
                      onClick={() => handleUpdateStatus(alert.id, 'RESOLVED')}
                      style={{ backgroundColor: '#22A06B', borderColor: '#22A06B' }}
                    >
                      <CheckCircle2 size={12} />
                      Resolve Alert
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
