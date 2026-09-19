import React, { useEffect, useState } from 'react';
import { inspectionService } from '../services/inspectionService';
import { apiClient } from '../services/apiClient';
import { WorkflowStepper } from '../components/workflow/WorkflowStepper';
import { VisionViewer } from '../components/inspection/VisionViewer';
import { DefectSummaryCard } from '../components/inspection/DefectSummaryCard';
import { ProductionContextCard } from '../components/inspection/ProductionContextCard';
import { DemoBanner } from '../components/common/DemoBanner';
import { Search, ShieldAlert } from 'lucide-react';

interface InspectionDetailsProps {
  inspectionId?: string;
  onNavigate: (tabId: string, params?: any) => void;
}

export const InspectionDetails: React.FC<InspectionDetailsProps> = ({ inspectionId, onNavigate }) => {
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setLoadError(null);
      try {
        if (!inspectionId) {
          throw new Error('No inspection ID was supplied.');
        }
        const remote = await apiClient.get<any>(`/inspections/${inspectionId}`);
        const normalized = {
          ...remote,
          status: remote.status,
          productId: remote.product_id || remote.productId,
          batchId: remote.batch_id || remote.batchId,
          machineId: remote.machine_id || remote.machineId,
          shift: remote.shift_id || remote.shift,
          imageUrl: remote.image_path || remote.imageUrl || '',
          defects: (remote.defects || []).map((d: any, idx: number) => ({
            ...d,
            id: d.id || `DEF-${idx}`,
            type: d.defect_type || d.type || 'Surface Anomaly',
            confidence: d.confidence ?? 0,
            boundingBox: d.x_min != null && d.y_min != null && d.x_max != null && d.y_max != null
              ? {
                  x: Number(d.x_min) * 800,
                  y: Number(d.y_min) * 600,
                  width: Math.max(0, Number(d.x_max) - Number(d.x_min)) * 800,
                  height: Math.max(0, Number(d.y_max) - Number(d.y_min)) * 600,
                  label: d.defect_type || 'DEFECT'
                }
              : undefined
          }))
        };
        if (isMounted) setInspection(normalized);
      } catch (e) {
        if (isMounted) {
          setLoadError(e instanceof Error ? e.message : 'Unable to load the inspection record from the backend.');
          setInspection(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [inspectionId]);

  const currentInspection = inspection;
  const isDefective = currentInspection?.status === 'DEFECTIVE' || currentInspection?.status === 'FLAGGED';
  const isNotAnalyzable = currentInspection?.status === 'NOT_ANALYZABLE';

  if (loading) {
    return (
      <div className="scada-card">
        <span className="scada-label">LOADING INSPECTION RECORD...</span>
      </div>
    );
  }

  if (!currentInspection) {
    return (
      <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}>
        <span className="scada-label" style={{ color: '#E55353' }}>INSPECTION RECORD UNAVAILABLE</span>
        <p style={{ color: '#8D9AAA' }}>{loadError || 'The backend did not return the requested inspection.'}</p>
        <button className="scada-btn scada-btn-primary" onClick={() => onNavigate('new-inspection')}>
          <Search size={16} /> RETURN TO NEW INSPECTION
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <WorkflowStepper currentStepIndex={3} onStepClick={(idx) => {
        if (idx === 0) onNavigate('dashboard');
        if (idx === 1) onNavigate('new-inspection');
      }} />

      <div
        className="scada-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.85rem 1rem',
          backgroundColor: '#101A2A',
          border: '1px solid #26364A'
        }}
      >
        <div style={{ fontSize: '0.8rem', color: '#8D9AAA' }}>
          Inspection complete. You can immediately submit another product image without reloading the application.
        </div>
        <button
          className="scada-btn scada-btn-primary"
          onClick={() => onNavigate('new-inspection')}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Search size={16} />
          ANALYZE ANOTHER IMAGE
        </button>
      </div>

      <DemoBanner message={`INSPECTION RECORD — ID: ${currentInspection.id} | Product: ${currentInspection.productId || currentInspection.product_id}`} />

      {isNotAnalyzable && (
        <div
          className="scada-card"
          style={{
            backgroundColor: '#2C2417',
            border: '1px solid #D99A2B',
            borderLeft: '5px solid #D99A2B',
            padding: '1.25rem'
          }}
        >
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F3C969', marginBottom: '0.4rem' }}>
            IMAGE CANNOT BE ANALYZED
          </div>
          <div style={{ fontSize: '0.85rem', color: '#D8D1C2' }}>
            {currentInspection.severity_reason || currentInspection.not_analyzable_reason || 'The upload did not contain a sufficiently clear, inspectable product/component image.'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9D9482', marginTop: '0.6rem' }}>
            Upload a clear, close image of the manufacturing component. No defect, root cause, or risk conclusion was generated from this image.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Left Column: Vision Canvas */}
        <div>
          <VisionViewer
            imageUrl={currentInspection.imageUrl || currentInspection.image_path || '/images/sample.jpg'}
            annotatedImageUrl={currentInspection.annotated_image_url || (currentInspection.image_path ? currentInspection.image_path.replace('/raw/', '/annotated/annotated_') : undefined)}
            defects={currentInspection.defects || []}
            status={isNotAnalyzable ? 'NOT_ANALYZABLE' : isDefective ? 'DEFECTIVE' : 'PASS'}
            modelProvider="OpenCV Anomaly Detector (Development-stage computer vision)"
            confidence={typeof currentInspection.overall_confidence === 'number' ? Math.round(currentInspection.overall_confidence * 100) : typeof currentInspection.anomaly_score === 'number' ? Math.round(currentInspection.anomaly_score * 100) : undefined}
          />
        </div>

        {/* Right Column: Defect Summary & Production Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <DefectSummaryCard inspection={currentInspection} />
          <ProductionContextCard inspection={currentInspection} />
        </div>
      </div>

      {/* Workflow Navigation Banner */}
      {isDefective && (
        <div
          className="scada-card"
          style={{
            backgroundColor: '#121C2C',
            border: '1px solid #E55353',
            borderLeft: '5px solid #E55353',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <Search className="w-5 h-5 text-status-critical" />
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#E8EDF3' }}>
                SURFACE ANOMALY DETECTED — INVESTIGATION REQUIRED
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#8D9AAA' }}>
              Correlate visual anomaly with Machine {currentInspection.machineId || currentInspection.machine_id} telemetry
              & historical baseline parameters.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="scada-btn scada-btn-danger"
              onClick={() => onNavigate('root-cause', { inspectionId: currentInspection.id })}
              style={{ padding: '0.65rem 1.2rem', fontSize: '0.9rem' }}
            >
              <Search size={16} />
              INVESTIGATE ROOT CAUSE
            </button>
            <button
              className="scada-btn scada-btn-secondary"
              onClick={() => onNavigate('risk-monitor')}
            >
              <ShieldAlert size={16} />
              Risk Monitor
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
