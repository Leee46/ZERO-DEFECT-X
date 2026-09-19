import React, { useEffect, useState } from 'react';
import { inspectionService } from '../services/inspectionService';
import { apiClient } from '../services/apiClient';
import { WorkflowStepper } from '../components/workflow/WorkflowStepper';
import { DemoBanner } from '../components/common/DemoBanner';
import { Badge } from '../components/common/Badge';
import { Search, ShieldAlert, Info, Wrench, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface RootCausePageProps {
  inspectionId?: string;
  onNavigate: (tabId: string, params?: any) => void;
}

export const RootCausePage: React.FC<RootCausePageProps> = ({ inspectionId, onNavigate }) => {
  const [rootCauseData, setRootCauseData] = useState<any>(null);
  const [targetInspection, setTargetInspection] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadBackendAnalysis() {
      try {
        setLoading(true);
        setError(null);
        const inspections = await inspectionService.getAllInspectionsAsync();
        const target = inspectionId
          ? inspections.find((item) => item.id === inspectionId)
          : inspections[0];

        if (!target) {
          throw new Error('No inspection record is available for probable-cause analysis.');
        }

        const res = await apiClient.get<any>(`/root-cause/${target.id}`);
        if (isMounted) {
          setTargetInspection(target);
          setRootCauseData(res);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'Unable to load evidence-backed probable-cause analysis.');
          setTargetInspection(null);
          setRootCauseData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBackendAnalysis();
    return () => { isMounted = false; };
  }, [inspectionId]);

  const probableFactor = rootCauseData?.probable_factor || 'Analysis unavailable';
  const candidates = rootCauseData?.candidate_factors || [];
  const currentCondition = rootCauseData?.current_condition || 'Telemetry unavailable';
  const histComp = rootCauseData?.historical_comparison || { normal_vibration_defect_rate: null, elevated_vibration_defect_rate: null, matching_historical_count: 0 };
  const isNormal = targetInspection.status === 'PASS' || rootCauseData?.status === 'PASSED';

  const chartData = candidates.map((c: any) => ({
    factor: c.factor,
    score: Math.round((c.score || 0.70) * 100)
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <WorkflowStepper currentStepIndex={6} onStepClick={(idx) => {
        if (idx === 0) onNavigate('dashboard');
        if (idx === 3) onNavigate('inspection-details', { id: targetInspection.id });
      }} />

      <DemoBanner message="PRODUCTION CONTEXT INTELLIGENCE & PROBABLE-CAUSE ENGINE — Evidence-Backed Statistical Association" />

      {loading && (
        <div className="scada-card">
          <span className="scada-label">LOADING PROBABLE-CAUSE ANALYSIS...</span>
        </div>
      )}

      {!loading && error && (
        <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}>
          <span className="scada-label" style={{ color: '#E55353' }}>ANALYSIS UNAVAILABLE</span>
          <p style={{ color: '#8D9AAA', marginBottom: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && targetInspection && (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Left Column: Analysis Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="scada-card" style={{ borderLeft: isNormal ? '4px solid #22A06B' : '4px solid #E55353' }}>
            <div className="scada-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search className="w-5 h-5 text-system-blue" />
                <span className="scada-title">PROBABLE CONTRIBUTING FACTOR REPORT</span>
              </div>
              <Badge status={isNormal ? 'PASSED' : (rootCauseData?.is_insufficient_evidence ? 'INSUFFICIENT EVIDENCE' : 'EVIDENCE REVIEW')} />
            </div>

            <div style={{ backgroundColor: '#162235', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
              <span className="scada-label" style={{ color: '#8D9AAA' }}>PROBABLE CONTRIBUTING FACTOR</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: isNormal ? '#22A06B' : '#E55353', fontFamily: 'var(--font-mono)', display: 'block', margin: '0.3rem 0' }}>
                {probableFactor}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#8D9AAA' }}>
                Requires Physical Verification: <strong style={{ color: '#D99A2B' }}>TRUE</strong> | Supporting DB Records: <strong style={{ color: '#E8EDF3' }}>{rootCauseData?.supporting_records_count ?? 0}</strong>
              </span>
            </div>

            {/* Current Production Parameters Banner */}
            <div style={{ backgroundColor: '#0B1220', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #26364A', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <Activity size={16} color="#4F7CAC" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E8EDF3' }}>PRODUCTION TELEMETRY CONTEXT AT INSPECTION TIMESTAMP</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#8D9AAA' }}>
                {currentCondition}
              </span>
            </div>

            {/* Candidate Factors Breakdown */}
            <span className="scada-label" style={{ marginBottom: '0.5rem' }}>EVIDENCE & CANDIDATE FACTORS (ORDERED BY STRENGTH)</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {candidates.map((item: any, idx: number) => (
                <div key={idx} style={{ backgroundColor: '#0B1220', padding: '0.65rem 0.85rem', borderRadius: '4px', border: '1px solid #26364A' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E8EDF3' }}>
                      {idx + 1}. {item.factor}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '2px', backgroundColor: item.evidence_level === 'STRONG' ? 'rgba(229, 83, 83, 0.2)' : 'rgba(217, 154, 43, 0.2)', color: item.evidence_level === 'STRONG' ? '#F87171' : '#D99A2B' }}>
                      {item.evidence_level} ASSOCIATION
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#8D9AAA', margin: 0 }}>{item.details || item.evidence_points}</p>
                </div>
              ))}
            </div>

            {/* Historical Statistics Comparison */}
            {!isNormal && (
              <div style={{ backgroundColor: '#070B14', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #26364A', marginBottom: '1rem' }}>
                <span className="scada-label" style={{ color: '#4F7CAC', marginBottom: '0.4rem' }}>HISTORICAL DEFECT RATE COMPARISON</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#121C2C', padding: '0.5rem', borderRadius: '3px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Normal Baseline Defect Rate</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#22A06B', fontFamily: 'var(--font-mono)' }}>{histComp.normal_vibration_defect_rate == null ? 'N/A' : `${histComp.normal_vibration_defect_rate}%`}</span>
                  </div>
                  <div style={{ backgroundColor: '#121C2C', padding: '0.5rem', borderRadius: '3px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Elevated Parameter Rate</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#E55353', fontFamily: 'var(--font-mono)' }}>{histComp.elevated_vibration_defect_rate == null ? 'N/A' : `${histComp.elevated_vibration_defect_rate}%`}</span>
                  </div>
                  <div style={{ backgroundColor: '#121C2C', padding: '0.5rem', borderRadius: '3px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Matching Historical Inspections</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#4F7CAC', fontFamily: 'var(--font-mono)' }}>{histComp.matching_historical_count} records</span>
                  </div>
                </div>
              </div>
            )}

            {/* Strict Scientific Disclaimers */}
            <div style={{ backgroundColor: 'rgba(79, 124, 172, 0.1)', border: '1px solid rgba(79, 124, 172, 0.3)', padding: '0.75rem', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4F7CAC', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <Info size={14} />
                IMPORTANT TECHNICAL & SCIENTIFIC DISCLAIMER
              </div>
              <p style={{ fontSize: '0.75rem', color: '#8D9AAA', lineHeight: 1.4, margin: 0 }}>
                {rootCauseData?.disclaimer || 'Represent statistical associations based on baseline deviations. Never claim correlation as proven physical causation without manual engineering inspection.'}
              </p>
            </div>
          </div>

          {/* Factor Breakdown Chart */}
          <div className="scada-card">
            <div className="scada-header">
              <span className="scada-title">ASSOCIATION EVIDENCE SCORE BY FACTOR</span>
            </div>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#26364A" />
                  <XAxis type="number" domain={[0, 100]} stroke="#8D9AAA" fontSize={11} />
                  <YAxis type="category" dataKey="factor" stroke="#8D9AAA" fontSize={11} width={200} />
                  <Tooltip contentStyle={{ backgroundColor: '#121C2C', borderColor: '#26364A', color: '#E8EDF3' }} />
                  <Bar dataKey="score" fill="#4F7CAC" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Inspected Unit Meta & Next Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="scada-card">
            <div className="scada-header">
              <span className="scada-title">INSPECTED UNIT DATA</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8D9AAA' }}>Inspection ID:</span>
                <span className="font-mono" style={{ color: '#4F7CAC' }}>{targetInspection.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8D9AAA' }}>Product SKU:</span>
                <span className="font-mono">{targetInspection.productId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8D9AAA' }}>Station:</span>
                <span className="font-mono">{targetInspection.machineId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8D9AAA' }}>Batch:</span>
                <span className="font-mono">{targetInspection.batchId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8D9AAA' }}>Shift:</span>
                <span className="font-mono">{targetInspection.shift}</span>
              </div>
            </div>
          </div>

          <div className="scada-card" style={{ border: '1px solid #2F6F9F' }}>
            <div className="scada-header">
              <span className="scada-title">RECOMMENDED NEXT STEPS</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#8D9AAA', marginBottom: '1rem' }}>
              Based on the identified candidate factors on Station {targetInspection.machineId}, review the automated risk monitor and dispatch corrective maintenance.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                className="scada-btn scada-btn-primary"
                onClick={() => onNavigate('risk-monitor')}
                style={{ width: '100%' }}
              >
                <ShieldAlert size={16} />
                View Machine Risk Monitor
              </button>

              <button
                className="scada-btn scada-btn-secondary"
                onClick={() => onNavigate('corrective-actions', { inspectionId: targetInspection.id, machineId: targetInspection.machineId })}
                style={{ width: '100%' }}
              >
                <Wrench size={16} />
                Dispatch Corrective Action
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
