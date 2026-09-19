import type { Machine, RiskAssessment, SeverityLevel } from '../types';

export class RiskService {
  public calculateMachineRisk(machine: Machine): RiskAssessment {
    let score = 10; // Baseline
    const signals: string[] = [];

    // Vibration contribution
    const vibRatio = machine.currentVibration / machine.baselineVibration;
    if (vibRatio > 2.0) {
      score += 45;
      signals.push(`Vibration ↑ (+${Math.round((vibRatio - 1) * 100)}% over baseline)`);
    } else if (vibRatio > 1.3) {
      score += 20;
      signals.push('Vibration elevated (+30% over baseline)');
    }

    // Temperature contribution
    const tempRatio = machine.currentTemp / machine.baselineTemp;
    if (tempRatio > 1.1) {
      score += 20;
      signals.push(`Temperature ↑ (+${Math.round((tempRatio - 1) * 100)}% over baseline)`);
    }

    // Defect rate contribution
    if (machine.defectRate > 5.0) {
      score += 25;
      signals.push(`Recent Defect Rate ↑ (${machine.defectRate.toFixed(2)}%)`);
    } else if (machine.defectRate > 2.0) {
      score += 10;
      signals.push(`Defect Rate elevated (${machine.defectRate.toFixed(2)}%)`);
    }

    let riskLevel: SeverityLevel = 'LOW';
    if (score >= 85) riskLevel = 'CRITICAL';
    else if (score >= 70) riskLevel = 'HIGH';
    else if (score >= 40) riskLevel = 'MEDIUM';

    return {
      machineId: machine.id,
      riskLevel,
      riskScore: Math.min(score, 99),
      signals: signals.length > 0 ? signals : ['Normal operational signals'],
      trend: vibRatio > 1.5 || machine.defectRate > 4.0 ? 'INCREASING' : 'STABLE'
    };
  }
}

export const riskService = new RiskService();
