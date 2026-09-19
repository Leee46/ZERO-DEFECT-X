import type { Inspection, Machine, RootCauseResult, FactorBreakdown } from '../types';

/**
 * Legacy synchronous client-side helper.
 *
 * Production screens use /api/root-cause/{inspection_id}, which has access to
 * synchronized telemetry and historical inspection records. This helper is
 * retained only for compatibility and deliberately does not invent historical
 * correlations, material certifications, operator compliance, or fixed scores.
 */
export class RootCauseService {
  public analyzeRootCause(inspection: Inspection, machine: Machine): RootCauseResult {
    const factors: FactorBreakdown[] = [];
    const evidencePoints: string[] = [];

    const currentVib = inspection.parameters?.vibration;
    const baseVib = machine.baselineVibration;
    const currentTemp = inspection.parameters?.temperature;
    const baseTemp = machine.baselineTemp;

    if (typeof currentVib === 'number' && typeof baseVib === 'number' && baseVib > 0) {
      const ratio = currentVib / baseVib;
      const score = Math.min(0.95, Math.max(0, (ratio - 1) / 2));
      if (currentVib > baseVib) {
        evidencePoints.push(
          `Recorded vibration (${currentVib} mm/s) is above the configured machine baseline (${baseVib} mm/s).`
        );
      }
      factors.push({
        factor: 'Machine Vibration Deviation',
        score,
        details: `${currentVib} mm/s recorded vs ${baseVib} mm/s configured baseline`,
        isPrimary: score >= 0.5
      });
    }

    if (typeof currentTemp === 'number' && typeof baseTemp === 'number' && baseTemp > 0) {
      const ratio = currentTemp / baseTemp;
      const score = Math.min(0.80, Math.max(0, (ratio - 1) / 2));
      if (currentTemp > baseTemp) {
        evidencePoints.push(
          `Recorded temperature (${currentTemp}°C) is above the configured machine baseline (${baseTemp}°C).`
        );
      }
      factors.push({
        factor: 'Temperature Deviation',
        score,
        details: `${currentTemp}°C recorded vs ${baseTemp}°C configured baseline`
      });
    }

    factors.sort((a, b) => b.score - a.score);
    const topFactor = factors[0];
    const probableFactor = topFactor
      ? topFactor.factor
      : 'Insufficient client-side telemetry evidence';

    return {
      probableFactor,
      evidenceScore: topFactor ? Math.round(topFactor.score * 100) : 0,
      factors,
      evidencePoints,
      disclaimer: 'Client-side baseline comparison only. Production probable-cause analysis is provided by the backend using synchronized telemetry and historical inspection records.',
      analyzedAt: new Date().toISOString()
    };
  }
}

export const rootCauseService = new RootCauseService();
