import React from 'react';
import { ChevronRight } from 'lucide-react';

interface WorkflowStepperProps {
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
}

export const WORKFLOW_STEPS = [
  { id: 'COMMAND_CENTER', label: 'Command Center', phase: 1 },
  { id: 'NEW_INSPECTION', label: 'New Inspection', phase: 2 },
  { id: 'PRODUCT_IMAGE', label: 'Product Image', phase: 3 },
  { id: 'VISION_INSPECTION', label: 'Vision Inspection', phase: 4 },
  { id: 'DEFECT_RESULT', label: 'Defect Result', phase: 5 },
  { id: 'PRODUCTION_CONTEXT', label: 'Production Context', phase: 6 },
  { id: 'ROOT_CAUSE', label: 'Root Cause', phase: 7 },
  { id: 'RISK_PREDICTION', label: 'Risk Prediction', phase: 8 },
  { id: 'ACTION_RECOMMENDED', label: 'Recommended Action', phase: 9 },
  { id: 'REINSPECT_VERIFY', label: 'Reinspection & History', phase: 10 }
];

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStepIndex, onStepClick }) => {
  return (
    <div
      style={{
        backgroundColor: '#121C2C',
        border: '1px solid #26364A',
        borderRadius: '4px',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
        overflowX: 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', minWidth: '900px', justifyContent: 'space-between' }}>
        {WORKFLOW_STEPS.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;

          let color = '#5C6B7E';
          let bgColor = 'transparent';
          let borderColor = '#26364A';

          if (isActive) {
            color = '#FFFFFF';
            bgColor = '#2F6F9F';
            borderColor = '#4F7CAC';
          } else if (isCompleted) {
            color = '#22A06B';
            bgColor = 'rgba(34, 160, 107, 0.1)';
            borderColor = 'rgba(34, 160, 107, 0.3)';
          }

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onStepClick && onStepClick(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '3px',
                  backgroundColor: bgColor,
                  border: `1px solid ${borderColor}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#FFFFFF' : isCompleted ? '#22A06B' : '#162235',
                    color: isActive ? '#0B1220' : isCompleted ? '#0B1220' : '#8D9AAA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {idx + 1}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 600 : 400,
                    color: color,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {step.label}
                </span>
              </button>
              {idx < WORKFLOW_STEPS.length - 1 && (
                <ChevronRight size={14} style={{ color: isCompleted ? '#22A06B' : '#26364A', flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
