import React, { useState, useEffect } from 'react';
import { inspectionService } from '../services/inspectionService';
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
  const [techNotes, setTechNotes] = useState<string>('Spindle alignment and dampener pad recalibration performed according to spec.');

  const fetchActions = async () => {
    try {
      const data = await inspectionService.getCorrectiveActionsAsync();
      if (data && data.length > 0) {
        setActions(data);
        const matched = inspectionId ? data.find((a: any) => a.inspection_id === inspectionId) : data[0];
        setActiveAction(matched || data[0]);
      } else {
        // Fallback default demo action
        const defaultAction = {
          id: 'CA-2026-0842',
          inspection_id: 'INSP-2026-0842',
          machine_id: 'M03',
          probable_factor: 'Elevated M03 Vibration Baseline',
          action_description: 'Perform spindle bearing alignment & dampener recalibration on M03',
          recommended_actions: [
            'Inspect M03 vibration dampeners and spindle mountings',
            'Check tool chuck wear and mechanical alignment',
            'Perform dynamic spindle balancing adjustment',
            'Verify affected batch tolerances and reinspect subsequent products'
          ],
          priority: 'HIGH',
          status: 'Open',
          assigned_to: 'Sarah Chen (Lead Tech)',
          created_at: new Date().toISOString(),
          before_snapshot: {
            machine_id: 'M03',
            temperature: 72.0,
            vibration: 4.8,
            pressure: 6.2,
            speed: 1480,
            risk_level: 'HIGH',
            defect_rate: 8.71
          }
        };
        setActions([defaultAction]);
        setActiveAction(defaultAction);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleStartAction = async () => {
    if (!activeAction) return;
    setIsProcessing(true);
    try {
      const updated = await inspectionService.startCorrectiveActionAsync(activeAction.id, 'Technician dispatched to station M03.');
      setActiveAction(updated);
      setActions(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch (e) {
      console.error(e);
      // Fallback local update
      const updated = {
        ...activeAction,
        status: 'In Progress',
        started_at: new Date().toISOString(),
        before_snapshot: activeAction.before_snapshot || {
          machine_id: activeAction.machine_id || 'M03',
          temperature: 72.0,
          vibration: 4.8,
          pressure: 6.2,
          speed: 1480,
          risk_level: 'HIGH',
          defect_rate: 8.71
        }
      };
      setActiveAction(updated);
      setActions(prev => prev.map(a => a.id === updated.id ? updated : a));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteAction = async () => {
    if (!activeAction) return;
    setIsProcessing(true);
    try {
      const updated = await inspectionService.completeCorrectiveActionAsync(activeAction.id, techNotes);
      setActiveAction(updated);
      setActions(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch (e) {
      console.error(e);
      // Fallback local update
      const updated = {
        ...activeAction,
        status: 'Completed',
        completed_at: new Date().toISOString(),
        after_snapshot: {
          machine_id: activeAction.machine_id || 'M03',
          temperature: 68.0,
          vibration: 2.7,
          pressure: 6.0,
          speed: 1500,
          risk_level: 'NORMAL',
          defect_rate: 1.20
        }
      };
      setActiveAction(updated);
      setActions(prev => prev.map(a => a.id === updated.id ? updated : a));
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

      <DemoBanner message="PHASE 6: CORRECTIVE ACTION DISPATCH — Closed-Loop Production Intervention (SI-03)" />

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
                  Linked Defect Inspection: <strong style={{ color: '#4F7CAC' }}>{activeAction.inspection_id}</strong> | Machine: <strong style={{ color: '#E8EDF3' }}>{activeAction.machine_id || 'M03'}</strong>
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
                  {activeAction.probable_factor || 'Elevated M03 Vibration Baseline'}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#8D9AAA' }}>
                  Identified via non-causal multi-signal association analysis.
                </span>
              </div>

              <span className="scada-label" style={{ color: '#4F7CAC' }}>SYSTEM-RECOMMENDED ACTIONS</span>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
                {(activeAction.recommended_actions || [
                  'Inspect M03 vibration source & spindle dampeners',
                  'Check tool chuck wear and mechanical alignment',
                  'Verify affected batch tolerances',
                  'Reinspect subsequent product samples'
                ]).map((rec: string, idx: number) => (
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
                      Intervention in progress. Complete demo action to deterministically normalize machine parameters.
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
                    <div>Vibration: <strong style={{ color: '#E55353' }}>{activeAction.before_snapshot?.vibration || 4.8} mm/s</strong></div>
                    <div>Temp: <strong style={{ color: '#E8EDF3' }}>{activeAction.before_snapshot?.temperature || 72.0}°C</strong></div>
                    <div>Risk: <strong style={{ color: '#E55353' }}>{activeAction.before_snapshot?.risk_level || 'HIGH'}</strong></div>
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
                <strong style={{ color: '#4F7CAC' }}>Deterministic Simulation Policy:</strong> Corrective action updates controlled machine parameters toward normal baseline while strictly preserving all historical defect records.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
