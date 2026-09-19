import React, { useState, useEffect } from 'react';
import { inspectionService } from '../services/inspectionService';
import { apiClient } from '../services/apiClient';
import { WorkflowStepper } from '../components/workflow/WorkflowStepper';
import { DemoBanner } from '../components/common/DemoBanner';
import { Badge } from '../components/common/Badge';
import {
  Wrench, CheckCircle2, RefreshCw, Play, Check
} from 'lucide-react';

interface CorrectiveActionsPageProps {
  onNavigate: (tabId: string, params?: any) => void;
  inspectionId?: string;
}

export const CorrectiveActionsPage: React.FC<CorrectiveActionsPageProps> = ({ onNavigate, inspectionId }) => {
  const [actions, setActions] = useState<any[]>([]);
  const [activeAction, setActiveAction] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [techNotes, setTechNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchActions = async () => {
    try {
      setError(null);
      const data = await inspectionService.getCorrectiveActionsAsync();
      const rows = Array.isArray(data) ? data : [];
      setActions(rows);
      const matched = inspectionId ? rows.find((a: any) => a.inspection_id === inspectionId) : rows[0];
      setActiveAction(matched || null);
      if (!matched && inspectionId) {
        setError('No corrective action exists for this inspection yet. Create one from the evidence-backed inspection record.');
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Unable to load corrective actions from the backend.');
      setActions([]);
      setActiveAction(null);
    }
  };
  useEffect(() => {
    fetchActions();
  }, []);

  const handleCreateAction = async () => {
    if (!inspectionId) return;
    setIsProcessing(true);
    setError(null);
    try {
      const inspection = await apiClient.get<any>(`/inspections/${inspectionId}`);
      const rootCause = await apiClient.get<any>(`/root-cause/${inspectionId}`);
      const created = await inspectionService.createCorrectiveActionAsync({
        inspection_id: inspectionId,
        machine_id: inspection.machine_id,
        action_description: `Investigate and correct the production condition associated with inspection ${inspectionId}`,
        priority: 'HIGH',
        assigned_to: 'Operator / Maintenance Tech',
        probable_factor: rootCause?.probable_factor,
        notes: 'Created from the inspection record and evidence-backed probable-cause analysis.'
      });
      setActions([created]);
      setActiveAction(created);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Unable to create corrective action from the inspection evidence.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartAction = async () => {
    if (!activeAction) return;
    setIsProcessing(true);
    setError(null);
    try {
      const updated = await inspectionService.startCorrectiveActionAsync(
        activeAction.id,
        techNotes || 'Technician dispatched for evidence-backed corrective maintenance.'
      );
      setActiveAction(updated);
      setActions(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Unable to start corrective action. No local result was fabricated.');
    } finally {
      setIsProcessing(false);
    }
  };
  const handleCompleteAction = async () => {
    if (!activeAction) return;
    setIsProcessing(true);
    setError(null);
    try {
      const updated = await inspectionService.completeCorrectiveActionAsync(activeAction.id, techNotes);
      setActiveAction(updated);
      setActions(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Unable to complete corrective action. Fresh factory telemetry is required.');
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Workflow Stepper at Step 9 */}
      <WorkflowStepper currentStepIndex={8} onStepClick={(idx) => {
        if (idx === 0) onNavigate('dashboard');
        if (idx === 6) onNavigate('root-cause');
      }} />

      <DemoBanner message="PHASE 6: CORRECTIVE ACTION DISPATCH — Evidence-Linked Production Intervention (SI-03)" />

      {error && (
        <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}>
          <span className="scada-label" style={{ color: '#E55353' }}>ACTION STATUS</span>
          <p style={{ color: '#8D9AAA', marginBottom: '0.75rem' }}>{error}</p>
          {!activeAction && inspectionId && (
            <button className="scada-btn scada-btn-primary" onClick={handleCreateAction} disabled={isProcessing}>
              <Wrench size={14} />
              {isProcessing ? 'CREATING ACTION...' : 'CREATE CORRECTIVE ACTION FROM INSPECTION'}
            </button>
          )}
        </div>
      )}

      {activeAction && (
        <div className="scada-card">
          <div className="scada-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Wrench className="w-5 h-5 text-system-blue" />
              <div>
                <span className="scada-title" style={{ fontSize: '1.05rem', letterSpacing: '0.05em' }}>
                  CORRECTIVE ACTION DISPATCH: {activeAction.id}
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#8D9AAA' }}>
                  Linked Defect Inspection: <strong style={{ color: '#4F7CAC' }}>{activeAction.inspection_id}</strong> | Machine: <strong style={{ color: '#E8EDF3' }}>{activeAction.machine_id || 'N/A'}</strong>
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {actions.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8D9AAA' }}>Action:</span>
                  <select
                    value={activeAction.id}
                    onChange={(e) => {
                      const selected = actions.find((a: any) => a.id === e.target.value);
                      if (selected) setActiveAction(selected);
                    }}
                    style={{
                      background: '#0B1220',
                      color: '#4F7CAC',
                      border: '1px solid #26364A',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {actions.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.id} ({a.status})</option>
                    ))}
                  </select>
                </div>
              )}
              <span style={{ fontSize: '0.75rem', color: '#8D9AAA', textTransform: 'uppercase' }}>Status:</span>
              <Badge status={activeAction.status.toUpperCase()} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem', marginTop: '1rem' }}>
            {/* Left Column: Root Cause Factor & Recommended Actions */}
            <div>
              <div style={{ backgroundColor: '#0F1A2A', padding: '0.85rem', borderRadius: '4px', border: '1px solid #26364A', marginBottom: '1rem' }}>
                <span className="scada-label" style={{ color: '#E55353' }}>PROBABLE CONTRIBUTING FACTOR</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#E8EDF3', margin: '0.3rem 0 0 0' }}>
                  {activeAction.probable_factor || 'No probable factor recorded'}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#8D9AAA' }}>
                  Identified via non-causal multi-signal association analysis.
                </span>
              </div>

              <span className="scada-label" style={{ color: '#4F7CAC' }}>SYSTEM-RECOMMENDED ACTIONS</span>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
                {(activeAction.recommended_actions || []).map((rec: string, idx: number) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: '0.85rem',
                      color: '#E8EDF3',
                      backgroundColor: '#162235',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '4px',
                      border: '1px solid #26364A',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem'
                    }}
                  >
                    <CheckCircle2 size={16} style={{ color: '#22A06B', flexShrink: 0 }} />
                    {rec}
                  </li>
                ))}
              </ul>

              <div style={{ backgroundColor: '#0B1220', padding: '0.85rem', borderRadius: '4px', border: '1px solid #26364A' }}>
                <span className="scada-label">TECHNICIAN EXECUTION NOTES</span>
                <textarea
                  value={techNotes}
                  onChange={(e) => setTechNotes(e.target.value)}
                  disabled={activeAction.status === 'Completed' || activeAction.status === 'Verified'}
                  style={{
                    width: '100%',
                    backgroundColor: '#162235',
                    color: '#E8EDF3',
                    border: '1px solid #26364A',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    marginTop: '0.4rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  rows={2}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#8D9AAA', marginTop: '0.3rem' }}>
                  <span>Assigned Tech: <strong style={{ color: '#4F7CAC' }}>{activeAction.assigned_to}</strong></span>
                  <span>Created: {new Date(activeAction.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Execution Workflow Controls & Snapshots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Action Execution Button Block */}
              <div style={{ backgroundColor: '#162235', padding: '1.1rem', borderRadius: '4px', border: '1px solid #26364A' }}>
                <span className="scada-label" style={{ color: '#F1C40F' }}>WORKFLOW EXECUTION CONTROL</span>

                {activeAction.status === 'Open' || activeAction.status === 'Recommended' ? (
                  <div style={{ marginTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#8D9AAA', marginBottom: '0.75rem' }}>
                      Dispatch maintenance technician to capture BEFORE condition and start intervention.
                    </p>
                    <button
                      className="scada-btn scada-btn-primary"
                      onClick={handleStartAction}
                      disabled={isProcessing}
                      style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
                    >
                      <Play size={16} />
                      {isProcessing ? 'Capturing Snapshot...' : 'START CORRECTIVE ACTION'}
                    </button>
                  </div>
                ) : activeAction.status === 'In Progress' ? (
                  <div style={{ marginTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#22A06B', marginBottom: '0.75rem' }}>
                      Intervention in progress. Complete the maintenance action and record the returned Virtual Factory telemetry.
                    </p>
                    <button
                      className="scada-btn"
                      onClick={handleCompleteAction}
                      disabled={isProcessing}
                      style={{ width: '100%', padding: '0.75rem', fontWeight: 600, backgroundColor: '#22A06B', color: '#FFF' }}
                    >
                      <Check size={16} />
                      {isProcessing ? 'Updating Machine State...' : 'COMPLETE CORRECTIVE ACTION'}
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#22A06B' }}>
                      <CheckCircle2 size={18} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Action Executed Successfully</span>
                    </div>
                    <button
                      className="scada-btn scada-btn-primary"
                      onClick={() => onNavigate('reinspection', {
                        actionId: activeAction.id,
                        inspectionId: activeAction.inspection_id,
                        machineId: activeAction.machine_id || 'M03'
                      })}
                      style={{ width: '100%', padding: '0.75rem', fontWeight: 600, backgroundColor: '#007ACC' }}
                    >
                      <RefreshCw size={16} />
                      PROCEED TO REINSPECTION SCREEN →
                    </button>
                  </div>
                )}
              </div>

              {/* Live Before / After Machine Snapshots */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {/* Before Condition */}
                <div style={{ backgroundColor: '#111B2B', border: '1px solid #E55353', borderRadius: '4px', padding: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#E55353', fontWeight: 700, textTransform: 'uppercase' }}>
                      BEFORE CONDITION
                    </span>
                    <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(229, 83, 83, 0.2)', color: '#E55353', padding: '2px 5px', borderRadius: '3px' }}>
                      ELEVATED
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#8D9AAA', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div>Vibration: <strong style={{ color: '#E55353' }}>{activeAction.before_snapshot?.vibration ?? 'N/A'} mm/s</strong></div>
                    <div>Temp: <strong style={{ color: '#E8EDF3' }}>{activeAction.before_snapshot?.temperature ?? 'N/A'}°C</strong></div>
                    <div>Risk: <strong style={{ color: '#E55353' }}>{activeAction.before_snapshot?.risk_level || 'N/A'}</strong></div>
                  </div>
                </div>

                {/* After Condition */}
                <div style={{
                  backgroundColor: '#111B2B',
                  border: `1px solid ${activeAction.after_snapshot ? '#22A06B' : '#26364A'}`,
                  borderRadius: '4px',
                  padding: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: activeAction.after_snapshot ? '#22A06B' : '#8D9AAA', fontWeight: 700, textTransform: 'uppercase' }}>
                      AFTER CONDITION
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      backgroundColor: activeAction.after_snapshot ? 'rgba(34, 160, 107, 0.2)' : 'rgba(141, 154, 170, 0.2)',
                      color: activeAction.after_snapshot ? '#22A06B' : '#8D9AAA',
                      padding: '2px 5px',
                      borderRadius: '3px'
                    }}>
                      {activeAction.after_snapshot ? 'NORMALIZED' : 'PENDING'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#8D9AAA', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div>Vibration: <strong style={{ color: activeAction.after_snapshot ? '#22A06B' : '#8D9AAA' }}>
                      {activeAction.after_snapshot?.vibration ? `${activeAction.after_snapshot.vibration} mm/s` : '—'}
                    </strong></div>
                    <div>Temp: <strong style={{ color: activeAction.after_snapshot ? '#E8EDF3' : '#8D9AAA' }}>
                      {activeAction.after_snapshot?.temperature ? `${activeAction.after_snapshot.temperature}°C` : '—'}
                    </strong></div>
                    <div>Risk: <strong style={{ color: activeAction.after_snapshot ? '#22A06B' : '#8D9AAA' }}>
                      {activeAction.after_snapshot?.risk_level || '—'}
                    </strong></div>
                  </div>
                </div>
              </div>

              {/* Closed Loop Notice */}
              <div style={{ backgroundColor: 'rgba(0, 122, 204, 0.08)', border: '1px solid rgba(0, 122, 204, 0.25)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.75rem', color: '#8D9AAA' }}>
                <strong style={{ color: '#4F7CAC' }}>Deterministic Simulation Policy:</strong> Corrective action is linked to the production record; post-maintenance state is accepted only from the connected Virtual Factory telemetry.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
