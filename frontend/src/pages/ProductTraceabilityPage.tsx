import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { DemoBanner } from '../components/common/DemoBanner';
import { Badge } from '../components/common/Badge';
import { GitPullRequest } from 'lucide-react';
import type { TraceabilityStep } from '../types';

interface ProductTraceabilityPageProps {
  onNavigate?: (tabId: string) => void;
}

export const ProductTraceabilityPage: React.FC<ProductTraceabilityPageProps> = () => {
  const [record, setRecord] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTraceability = async () => {
      try {
        const inspections = await apiClient.get<any[]>('/inspections');
        const latest = Array.isArray(inspections) ? inspections[0] : null;
        if (!latest?.id) throw new Error('No inspection record is available for traceability.');
        const data = await apiClient.get<any>(`/traceability/${latest.id}`);
        setRecord(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load product traceability.');
      }
    };
    loadTraceability();
  }, []);

  if (error) {
    return (
      <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}>
        <span className="scada-label" style={{ color: '#E55353' }}>TRACEABILITY UNAVAILABLE</span>
        <p style={{ color: '#8D9AAA', marginBottom: 0 }}>{error}</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="scada-card">
        <span className="scada-label">LOADING PRODUCT TRACEABILITY...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="PRODUCT TRACEABILITY AUDIT TRAIL — End-to-End Manufacturing Lifecycle Timeline" />

      <div className="scada-card">
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitPullRequest className="w-4 h-4 text-system-blue" />
            <span className="scada-title">PRODUCT TRACEABILITY: {record.productId}</span>
          </div>
          <Badge status={record.overallStatus || "NO VERIFICATION"} />
        </div>

        {/* Product Metadata Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#162235', padding: '1rem', borderRadius: '4px' }}>
          <div>
            <span className="scada-label">PRODUCT SKU</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#E8EDF3', fontFamily: 'var(--font-mono)' }}>
              {record.productId}
            </span>
          </div>
          <div>
            <span className="scada-label">BATCH ID</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#4F7CAC', fontFamily: 'var(--font-mono)' }}>
              {record.batchId}
            </span>
          </div>
          <div>
            <span className="scada-label">STATION ID</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#E8EDF3', fontFamily: 'var(--font-mono)' }}>
              {record.machineId}
            </span>
          </div>
          <div>
            <span className="scada-label">SHIFT</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#E8EDF3', fontFamily: 'var(--font-mono)' }}>
              {record.shift}
            </span>
          </div>
          <div>
            <span className="scada-label">OVERALL STATUS</span>
            <div style={{ marginTop: '0.2rem' }}>
              <Badge status={record.overallStatus} />
            </div>
          </div>
        </div>

        {/* Timeline Visualization */}
        <span className="scada-title" style={{ marginBottom: '1rem', display: 'block' }}>
          MANUFACTURING & QUALITY TIMELINE STEPS
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #26364A' }}>
          {(record.timeline as TraceabilityStep[]).map((step) => {
            const isWarn = step.status === 'WARNING';
            const isComp = step.status === 'COMPLETED';

            return (
              <div
                key={step.stepNumber}
                style={{
                  backgroundColor: '#162235',
                  border: '1px solid #26364A',
                  borderLeft: `4px solid ${isWarn ? '#D99A2B' : isComp ? '#22A06B' : '#4F7CAC'}`,
                  borderRadius: '4px',
                  padding: '1rem',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: '#0B1220',
                        color: '#4F7CAC',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '3px'
                      }}
                    >
                      STEP {step.stepNumber}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E8EDF3' }}>
                      {step.title}
                    </span>
                    {step.dataBadge && <Badge status={step.dataBadge} showDot={false} />}
                  </div>

                  <span className="font-mono text-xs text-text-secondary">{step.timestamp}</span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#8D9AAA', marginBottom: '0.4rem' }}>
                  {step.description}
                </p>

                <span style={{ fontSize: '0.725rem', color: '#5C6B7E' }}>
                  Actor / Engine: <strong style={{ color: '#4F7CAC' }}>{step.operatorOrSystem}</strong>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
