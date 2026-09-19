import type { Machine, SeverityLevel, MachineStatus } from '../types';
import { apiClient } from './apiClient';

class MachineService {
  private machines: Machine[] = [];

  public async getAllMachinesAsync(): Promise<Machine[]> {
    try {
      const data = await apiClient.get<any[]>('/machines');
      if (Array.isArray(data) && data.length > 0) {
        const rows = data.map((m) => {
          const riskScore = Number(m.risk_score ?? 0);
          const riskLevel: SeverityLevel =
            riskScore >= 75 ? 'CRITICAL' :
            riskScore >= 50 ? 'HIGH' :
            riskScore >= 25 ? 'MEDIUM' : 'LOW';
          const status: MachineStatus =
            m.status === 'WARNING' ? 'WARNING' :
            m.status === 'FAULT' ? 'FAULT' :
            m.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'NORMAL';

          return {
            id: String(m.id),
            name: m.machine_name || m.name || String(m.id),
            status,
            location: m.location || 'N/A',
            currentTemp: Number(m.temperature ?? m.currentTemp ?? 0),
            baselineTemp: Number(m.baseline_temp ?? 70),
            currentVibration: Number(m.vibration ?? m.currentVibration ?? 0),
            baselineVibration: Number(m.baseline_vibration ?? 2.5),
            currentPressure: Number(m.pressure ?? m.currentPressure ?? 0),
            baselinePressure: Number(m.baseline_pressure ?? 6.0),
            currentSpeed: Number(m.speed ?? m.currentSpeed ?? 0),
            productionCount: Number(m.production_count ?? 0),
            defectCount: Number(m.defect_count ?? 0),
            defectRate: Number(m.defect_rate ?? 0),
            riskLevel,
            riskScore,
            primaryDefectType: m.primary_defect_type || 'Normal',
            recentAlerts: Number(m.recent_alerts ?? 0),
            historicalTrend: Array.isArray(m.historical_trend) ? m.historical_trend : []
          };
        });
        this.machines = rows;
        return rows;
      }
    } catch (err) {
      console.warn('Backend machine API unavailable; no synthetic machine records will be substituted.');
      throw err;
    }
    return this.machines;
  }

  public getAllMachines(): Machine[] {
    return this.machines;
  }

  public getMachineById(id: string): Machine | undefined {
    return this.machines.find((m) => m.id === id);
  }

  public updateMachineStatus(id: string, updates: Partial<Machine>): Machine | undefined {
    const index = this.machines.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.machines[index] = { ...this.machines[index], ...updates };
      return this.machines[index];
    }
    return undefined;
  }
}

export const machineService = new MachineService();
