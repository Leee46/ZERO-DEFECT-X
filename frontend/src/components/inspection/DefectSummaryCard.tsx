import React from 'react';
import type { Inspection } from '../../types';
import { Badge } from '../common/Badge';
import { AlertOctagon, CheckCircle2, MapPin } from 'lucide-react';

interface DefectSummaryCardProps {
  inspection: Inspection;
}

export const DefectSummaryCard: React.FC<DefectSummaryCardProps> = ({ inspection }) => {
  const primaryDefect = inspection.defects?.[0] || null;

  const rootCauseFactor = inspection.root_cause?.probable_factor || 'Pending telemetry correlation';
  const requiresVerification = inspection.root_cause?.verification_required ?? true;

  return (
    <div className="scada-card">
      <div className="scada-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {inspection.status === 'DEFECTIVE' ? (
            <AlertOctagon className="w-4 h-4 text-status-critical" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-status-safe" />
          )}
          <span className="scada-title">VISION CLASSIFICATION RESULT</span>
        </div>
        <Badge status={inspection.status} />
      </div>

      {inspection.status === 'NOT_ANALYZABLE' ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#2C2417', border: '1px solid #D99A2B', borderRadius: '4px' }}>
          <AlertOctagon style={{ width: '36px', height: '36px', color: '#D99A2B', margin: '0 auto 0.5rem auto' }} />
          <span style={{ display: 'block', fontWeight: 700, color: '#F3C969', fontSize: '1rem' }}>
            ANALYSIS NOT AVAILABLE
          </span>
          <span style={{ fontSize: '0.8rem', color: '#B9B0A0', display: 'block', marginTop: '0.35rem' }}>
            This image did not provide enough usable product/component evidence for inspection.
          </span>
          <span style={{ fontSize: '0.72rem', color: '#8D8372', display: 'block', marginTop: '0.5rem' }}>
            Defect classification, confidence, root cause, and risk are intentionally not reported.
          </span>
        </div>
      ) : inspection.status === 'DEFECTIVE' && primaryDefect ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#162235', padding: '0.6rem 0.8rem', borderRadius: '4px' }}>
              <span className="scada-label">DEFECT TYPE</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#E55353', fontFamily: 'var(--font-mono)' }}>
                {primaryDefect.type || primaryDefect.defect_type || 'Surface Scratch'}
              </span>
            </div>

            <div style={{ backgroundColor: '#162235', padding: '0.6rem 0.8rem', borderRadius: '4px' }}>
              <span className="scada-label">SEVERITY LEVEL</span>
              <div style={{ marginTop: '0.2rem' }}>
                <Badge status={primaryDefect.severity} />
              </div>
            </div>

            <div style={{ backgroundColor: '#162235', padding: '0.6rem 0.8rem', borderRadius: '4px' }}>
              <span className="scada-label">LOCALIZATION</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E8EDF3', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={13} style={{ color: '#4F7CAC' }} />
                {primaryDefect.location || 'Upper Right'}
              </span>
            </div>

            <div style={{ backgroundColor: '#162235', padding: '0.6rem 0.8rem', borderRadius: '4px' }}>
              <span className="scada-label">ANOMALY SCORE</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#4F7CAC', fontFamily: 'var(--font-mono)' }}>
                {typeof primaryDefect.confidence === 'number'
                  ? (primaryDefect.confidence > 1 ? primaryDefect.confidence.toFixed(1) : (primaryDefect.confidence * 100).toFixed(1))
                  : 'N/A'}%
              </span>
            </div>
          </div>

          {/* Probable Cause & Verification Badges */}
          <div style={{ backgroundColor: '#121C2C', border: '1px solid #E55353', borderRadius: '4px', padding: '0.65rem 0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span className="scada-label" style={{ color: '#E55353', margin: 0 }}>
                PROBABLE CONTRIBUTING FACTOR
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.45rem',
                  backgroundColor: 'rgba(217, 154, 43, 0.2)',
                  border: '1px solid #D99A2B',
                  borderRadius: '3px',
                  color: '#D99A2B',
                  fontWeight: 700
                }}
              >
                REQUIRES VERIFICATION: {requiresVerification ? 'YES' : 'NO'}
              </span>
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#E8EDF3', display: 'block' }}>
              {rootCauseFactor}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#8D9AAA', marginTop: '0.2rem', display: 'block' }}>
              {inspection.root_cause?.evidence?.[0] || 'Visual defect detected; correlate with machine telemetry and historical baseline before assigning cause.'}
            </span>
          </div>
        </div>
      ) : inspection.status === 'DEFECTIVE' ? (
        <div style={{ padding: '1.25rem', backgroundColor: '#162235', border: '1px solid #E55353', borderRadius: '4px' }}>
          <span style={{ display: 'block', fontWeight: 700, color: '#E55353', fontSize: '1rem' }}>
            DEFECT DETECTED — LOCALIZATION PENDING
          </span>
          <span style={{ fontSize: '0.8rem', color: '#8D9AAA', display: 'block', marginTop: '0.4rem' }}>
            The vision engine returned a defective result but did not provide a usable bounding box.
          </span>
        </div>
      ) : (
        <div style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#162235', borderRadius: '4px' }}>
          <CheckCircle2 style={{ width: '36px', height: '36px', color: '#22A06B', margin: '0 auto 0.5rem auto' }} />
          <span style={{ display: 'block', fontWeight: 700, color: '#22A06B', fontSize: '1rem' }}>
            SURFACE QUALITY VERIFIED — ZERO DEFECTS DETECTED
          </span>
          <span style={{ fontSize: '0.8rem', color: '#8D9AAA' }}>
            OpenCV confidence: {typeof inspection.overall_confidence === 'number'
              ? (inspection.overall_confidence * 100).toFixed(1)
              : typeof inspection.anomaly_score === 'number'
                ? (inspection.anomaly_score * 100).toFixed(1)
                : 'N/A'}%
          </span>
        </div>
      )}
    </div>
  );
};
