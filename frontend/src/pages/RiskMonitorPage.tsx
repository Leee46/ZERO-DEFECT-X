import React from 'react';
import { machineService } from '../services/machineService';
import { riskService } from '../services/riskService';
import { WorkflowStepper } from '../components/workflow/WorkflowStepper';
import { DemoBanner } from '../components/common/DemoBanner';
import { Badge } from '../components/common/Badge';
import { ShieldAlert, ArrowUpRight, Wrench } from 'lucide-react';

interface RiskMonitorPageProps {
  onNavigate: (tabId: string, params?: any) => void;
}

export const RiskMonitorPage: React.FC<RiskMonitorPageProps> = ({ onNavigate }) => {
  const machines = machineService.getAllMachines();

  const machineRisks = machines.map((machine) => ({
    machine,
    risk: riskService.calculateMachineRisk(machine)
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Stepper at Step 8 */}
      <WorkflowStepper currentStepIndex={7} onStepClick={(idx) => {
        if (idx === 0) onNavigate('dashboard');
        if (idx === 6) onNavigate('root-cause');
      }} />

      <DemoBanner message="DEFECT RISK MONITOR — Controlled Heuristic Predictive Risk Matrix" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
        {machineRisks.map(({ machine, risk }) => (
          <div
            key={machine.id}
            className="scada-card"
            style={{
              borderLeft: `4px solid ${
                risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL'
                  ? '#E55353'
                  : risk.riskLevel === 'MEDIUM'
                  ? '#D99A2B'
                  : '#22A06B'
              }`
            }}
          >
            <div className="scada-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert
                  size={18}
                  style={{
                    color:
                      risk.riskLevel === 'HIGH' ? '#E55353' : risk.riskLevel === 'MEDIUM' ? '#D99A2B' : '#22A06B'
                  }}
                />
                <span className="font-mono text-base font-bold text-text-primary">
                  STATION {machine.id} — {machine.name}
                </span>
              </div>
              <Badge status={risk.riskLevel} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#162235', padding: '1rem', borderRadius: '4px', textAlign: 'center' }}>
                <span className="scada-label">DEFECT RISK SCORE</span>
                <span
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: risk.riskLevel === 'HIGH' ? '#E55353' : '#E8EDF3'
                  }}
                >
                  {risk.riskScore}%
                </span>
                <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block' }}>
                  Trend: {risk.trend}
                </span>
              </div>

              <div>
                <span className="scada-label" style={{ marginBottom: '0.4rem' }}>CONTRIBUTING SIGNALS</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {risk.signals.map((sig, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '0.8rem',
                        color: '#E8EDF3',
                        backgroundColor: '#0B1220',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        border: '1px solid #26364A'
                      }}
                    >
                      <ArrowUpRight size={14} style={{ color: '#E55353' }} />
                      {sig}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #26364A' }}>
              <span style={{ fontSize: '0.75rem', color: '#8D9AAA' }}>Primary Defect Pattern: {machine.primaryDefectType}</span>
              <button
                className="scada-btn scada-btn-secondary scada-btn-sm"
                onClick={() => onNavigate('corrective-actions', { machineId: machine.id })}
              >
                <Wrench size={12} />
                Recommended Actions →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
