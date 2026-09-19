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

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (inspectionId) {
        try {
          const remote = await apiClient.get<any>(`/inspections/${inspectionId}`);
          if (remote && isMounted) {
            setInspection(remote);
            return;
          }
        } catch (e) {
          // fallback
        }
      }
      const all = inspectionService.getAllInspections();
      const fallback = inspectionId ? inspectionService.getInspectionById(inspectionId) || all[0] : all[0];
      if (isMounted) setInspection(fallback);
    }
    loadData();
    return () => { isMounted = false; };
  }, [inspectionId]);

  const currentInspection = inspection || inspectionService.getAllInspections()[0];
  const isDefective = currentInspection.status === 'DEFECTIVE' || currentInspection.status === 'FLAGGED';
  const isNotAnalyzable = currentInspection.status === 'NOT_ANALYZABLE';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <WorkflowStepper currentStepIndex={3} onStepClick={(idx) => {
        if (idx === 0) onNavigate('dashboard');
        if (idx === 1) onNavigate('new-inspection');
      }} />

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
            confidence={Math.round((currentInspection.overall_confidence || currentInspection.anomaly_score || 0.88) * 100)}
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
