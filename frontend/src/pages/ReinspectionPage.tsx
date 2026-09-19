import React, { useState, useEffect } from 'react';
import { inspectionService } from '../services/inspectionService';
import { WorkflowStepper } from '../components/workflow/WorkflowStepper';
import { DemoBanner } from '../components/common/DemoBanner';
import { Badge } from '../components/common/Badge';
import {
  RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck,
  UploadCloud, GitPullRequest, Activity
} from 'lucide-react';

interface ReinspectionPageProps {
  onNavigate: (tabId: string, params?: any) => void;
  inspectionId?: string;
  actionId?: string;
}

export const ReinspectionPage: React.FC<ReinspectionPageProps> = ({ onNavigate, inspectionId, actionId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [reinspectionResult, setReinspectionResult] = useState<any | null>(null);
  const [activeAction, setActiveAction] = useState<any | null>(null);
  const [activeInspection, setActiveInspection] = useState<any | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const actions = await inspectionService.getCorrectiveActionsAsync();
        if (!inspectionId) {
          throw new Error('An original inspection ID is required to start a reinspection.');
        }

        const actions = await inspectionService.getCorrectiveActionsAsync();
        if (actionId) {
          setActiveAction(actions.find(a => a.id === actionId) || null);
        }

        const inspections = await inspectionService.getAllInspectionsAsync();
        const foundInsp = inspections.find(i => i.id === inspectionId);
        if (!foundInsp) {
          throw new Error(`Original inspection ${inspectionId} was not found.`);
        }
        setActiveInspection(foundInsp);

        const reinspections = await inspectionService.getReinspectionsAsync();
        if (reinspections && reinspections.length > 0) {
          setReinspectionResult(reinspections[0]);
        }
      } catch (e) {
        console.error('Failed to load reinspection context', e);
        setError(e instanceof Error ? e.message : 'Unable to load the linked inspection context.');
      }
    };
    initData();
  }, [actionId, inspectionId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRunReinspection = async () => {
    setError(null);

    if (!selectedFile) {
      setError('Upload the actual post-maintenance product image before running reinspection.');
      return;
    }
    if (!activeInspection?.id) {
      setError('No original inspection is selected. Reinspection cannot be linked to a production record.');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('original_inspection_id', activeInspection.id);
      if (activeAction?.id) {
        formData.append('corrective_action_id', activeAction.id);
      }
      formData.append('machine_id', activeAction?.machine_id || activeInspection.machineId);

      const response = await inspectionService.analyzeAndReinspectAsync(formData);
      setReinspectionResult(response.reinspection);
      if (response.reinspection?.image_path) {
        setPreviewUrl(response.reinspection.image_path);
      }
    } catch (e) {
      console.error('Reinspection API error', e);
      setError(e instanceof Error ? e.message : 'Reinspection analysis failed. No result was recorded.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isVerified = reinspectionResult?.verification_status === 'VERIFIED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stepper at Step 10 */}
      <WorkflowStepper currentStepIndex={9} onStepClick={(idx) => {
        if (idx === 0) onNavigate('dashboard');
        if (idx === 8) onNavigate('corrective-actions');
      }} />

      <DemoBanner message="PHASE 6: REINSPECTION, VERIFICATION & PRODUCTION FEEDBACK LOOP (SI-03)" />

      {error && (
        <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}>
          <span className="scada-label" style={{ color: '#E55353' }}>REINSPECTION ERROR</span>
          <p style={{ color: '#8D9AAA', marginBottom: 0 }}>{error}</p>
        </div>
      )}

      {/* Top Grid: Reinspection Launch & Image Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.25rem' }}>
        {/* Left: Reinspection Input & Trigger */}
        <div className="scada-card">
          <div className="scada-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw className="w-4 h-4 text-system-blue" />
              <span className="scada-title">TRIGGER REINSPECTION</span>
            </div>
            <Badge status="CLOSED-LOOP" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ backgroundColor: '#0B1220', padding: '0.75rem', borderRadius: '4px', border: '1px solid #26364A', fontSize: '0.8rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#8D9AAA' }}>
                <div>Original Insp: <strong style={{ color: '#4F7CAC' }}>{activeInspection?.id || 'N/A'}</strong></div>
                <div>Action ID: <strong style={{ color: '#4F7CAC' }}>{activeAction?.id || 'N/A'}</strong></div>
                <div>Product: <strong style={{ color: '#E8EDF3' }}>{activeInspection?.productId || 'N/A'}</strong></div>
                <div>Station: <strong style={{ color: '#E8EDF3' }}>{activeAction?.machine_id || activeInspection?.machineId || 'N/A'}</strong></div>
              </div>
            </div>

            {/* Image Preview & Upload */}
            <div style={{
              backgroundColor: '#0F1A2A',
              border: '1px dashed #26364A',
              borderRadius: '4px',
              padding: '0.75rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Reinspection Target"
                  style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px', border: '1px solid #26364A' }}
                />
              ) : (
                <div style={{ height: '140px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8D9AAA', fontSize: '0.8rem' }}>
                  Upload the post-maintenance product image
                </div>
              )}
              <label style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#4F7CAC', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <UploadCloud size={14} />
                <span>Upload Post-Maintenance Product Image (Required)</span>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Run Button */}
            <button
              className="scada-btn scada-btn-primary"
              onClick={handleRunReinspection}
              disabled={isProcessing}
              style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
            >
              <RefreshCw size={16} className={isProcessing ? 'animate-spin' : ''} />
              {isProcessing ? 'Analyzing Image & Evaluating...' : 'EXECUTE REINSPECTION'}
            </button>
          </div>
        </div>

        {/* Right: Verification Engine & Closed Loop Result */}
        {reinspectionResult && (
          <div className="scada-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="scada-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck className={`w-5 h-5 ${isVerified ? 'text-status-safe' : 'text-status-alarm'}`} />
                  <span className="scada-title">DETERMINISTIC VERIFICATION ENGINE</span>
                </div>
                <Badge status={reinspectionResult.verification_status} />
              </div>

              {/* Status Banner */}
              <div style={{
                backgroundColor: isVerified ? 'rgba(34, 160, 107, 0.12)' : 'rgba(229, 83, 83, 0.12)',
                border: `1px solid ${isVerified ? 'rgba(34, 160, 107, 0.4)' : 'rgba(229, 83, 83, 0.4)'}`,
                padding: '1rem',
                borderRadius: '4px',
                marginTop: '0.75rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem'
              }}>
                {isVerified ? (
                  <CheckCircle2 size={32} style={{ color: '#22A06B', flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={32} style={{ color: '#E55353', flexShrink: 0 }} />
                )}
                <div>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#E8EDF3', display: 'block' }}>
                    {isVerified ? 'VERIFICATION STATUS: VERIFIED' : 'VERIFICATION STATUS: REQUIRES FURTHER INVESTIGATION'}
                  </span>
                  <p style={{ fontSize: '0.82rem', color: '#8D9AAA', margin: '0.2rem 0 0 0' }}>
                    {reinspectionResult.verification_notes ||
                      (isVerified
                        ? 'Corrective action was followed by a successful reinspection. Further monitoring is recommended.'
                        : 'Defect persisted upon reinspection. Secondary mechanical inspection required.')}
                  </p>
                </div>
              </div>

              {/* Closed-Loop Production Feedback Summary (SI-03 Requirement) */}
              <div style={{ backgroundColor: '#0B1220', border: '1px solid #26364A', borderRadius: '4px', padding: '0.85rem' }}>
                <span className="scada-label" style={{ color: '#4F7CAC' }}>CORRECTIVE ACTION FEEDBACK (SI-03 CLOSED LOOP)</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginTop: '0.5rem', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#162235', padding: '0.5rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Station</span>
                    <strong style={{ fontSize: '0.9rem', color: '#E8EDF3' }}>M03</strong>
                  </div>
                  <div style={{ backgroundColor: '#162235', padding: '0.5rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Observed Issue</span>
                    <strong style={{ fontSize: '0.85rem', color: '#E55353' }}>Elevated Vibration</strong>
                  </div>
                  <div style={{ backgroundColor: '#162235', padding: '0.5rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Vibration Drop</span>
                    <strong style={{ fontSize: '0.9rem', color: isVerified ? '#22A06B' : '#E55353' }}>
                      {reinspectionResult.before_condition?.vibration || 'N/A'} → {reinspectionResult.after_condition?.vibration || 'N/A'}
                    </strong>
                  </div>
                  <div style={{ backgroundColor: '#162235', padding: '0.5rem', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>Reinspection</span>
                    <strong style={{ fontSize: '0.9rem', color: reinspectionResult.status === 'PASSED' ? '#22A06B' : '#E55353' }}>
                      {reinspectionResult.status}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                className="scada-btn scada-btn-primary"
                onClick={() => onNavigate('product-traceability')}
                style={{ whiteSpace: 'nowrap' }}
              >
                <GitPullRequest size={16} />
                View Full Traceability Audit Trail →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side BEFORE vs AFTER Comparison Card */}
      {reinspectionResult && (
        <div className="scada-card">
          <div className="scada-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity className="w-4 h-4 text-system-blue" />
              <span className="scada-title">BEFORE / AFTER COMPARISON AUDIT MATRIX</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#8D9AAA' }}>
              Reinspection ID: <strong style={{ color: '#4F7CAC' }}>{reinspectionResult.id}</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
            {/* Table 1: Production Condition */}
            <div>
              <span className="scada-label" style={{ color: '#4F7CAC', marginBottom: '0.5rem', display: 'block' }}>
                1. PRODUCTION OPERATING CONDITIONS
              </span>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0B1220', color: '#8D9AAA', borderBottom: '1px solid #26364A', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Parameter</th>
                    <th style={{ padding: '0.6rem 0.8rem', color: '#E55353' }}>BEFORE ACTION</th>
                    <th style={{ padding: '0.6rem 0.8rem', color: '#22A06B' }}>AFTER ACTION</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Evaluation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #162235' }}>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E8EDF3' }}>Vibration</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E55353', fontWeight: 600 }}>
                      {reinspectionResult.before_condition?.vibration || '4.8 mm/s'}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: isVerified ? '#22A06B' : '#E55353', fontWeight: 600 }}>
                      {reinspectionResult.after_condition?.vibration || (isVerified ? '2.7 mm/s' : '4.8 mm/s')}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span style={{ fontSize: '0.7rem', color: isVerified ? '#22A06B' : '#E55353' }}>
                        {isVerified ? 'NORMALIZED' : 'ELEVATED'}
                      </span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #162235' }}>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E8EDF3' }}>Temperature</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E55353', fontWeight: 600 }}>
                      {reinspectionResult.before_condition?.temperature || 'N/A'}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: isVerified ? '#22A06B' : '#E55353', fontWeight: 600 }}>
                      {reinspectionResult.after_condition?.temperature || 'N/A'}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span style={{ fontSize: '0.7rem', color: isVerified ? '#22A06B' : '#E55353' }}>
                        {isVerified ? 'STABLE' : 'ELEVATED'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E8EDF3' }}>Machine Risk</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E55353', fontWeight: 600 }}>
                      {reinspectionResult.before_condition?.risk || 'N/A'}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: isVerified ? '#22A06B' : '#E55353', fontWeight: 600 }}>
                      {reinspectionResult.after_condition?.risk || 'N/A'}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span style={{ fontSize: '0.7rem', color: isVerified ? '#22A06B' : '#E55353' }}>
                        {isVerified ? 'DOWNGRADED' : 'UNRESOLVED'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 2: Quality Inspection Result */}
            <div>
              <span className="scada-label" style={{ color: '#4F7CAC', marginBottom: '0.5rem', display: 'block' }}>
                2. QUALITY INSPECTION RESULT
              </span>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0B1220', color: '#8D9AAA', borderBottom: '1px solid #26364A', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Quality Metric</th>
                    <th style={{ padding: '0.6rem 0.8rem', color: '#E55353' }}>BEFORE ACTION</th>
                    <th style={{ padding: '0.6rem 0.8rem', color: '#22A06B' }}>AFTER ACTION</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Evaluation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #162235' }}>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E8EDF3' }}>Defect Detected</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E55353', fontWeight: 600 }}>
                      {reinspectionResult.before_condition?.defect || 'N/A'}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: reinspectionResult.status === 'PASSED' ? '#22A06B' : '#E55353', fontWeight: 600 }}>
                      {reinspectionResult.after_condition?.defect || 'N/A'}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span style={{ fontSize: '0.7rem', color: reinspectionResult.status === 'PASSED' ? '#22A06B' : '#E55353' }}>
                        {reinspectionResult.status === 'PASSED' ? 'CLEARED' : 'PERSISTENT'}
                      </span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #162235' }}>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E8EDF3' }}>Severity</td>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E55353', fontWeight: 600 }}>
                      {reinspectionResult.before_condition?.severity || 'N/A'}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: reinspectionResult.status === 'PASSED' ? '#22A06B' : '#E55353', fontWeight: 600 }}>
                      {reinspectionResult.after_condition?.severity || 'N/A'}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span style={{ fontSize: '0.7rem', color: reinspectionResult.status === 'PASSED' ? '#22A06B' : '#E55353' }}>
                        {reinspectionResult.status === 'PASSED' ? 'CLEARED' : 'UNRESOLVED'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.6rem 0.8rem', color: '#E8EDF3' }}>Overall Status</td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <Badge status="DEFECTIVE" />
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <Badge status={reinspectionResult.status === 'PASSED' ? 'PASSED' : 'DEFECTIVE'} />
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span style={{ fontSize: '0.7rem', color: reinspectionResult.status === 'PASSED' ? '#22A06B' : '#E55353' }}>
                        {reinspectionResult.status === 'PASSED' ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
