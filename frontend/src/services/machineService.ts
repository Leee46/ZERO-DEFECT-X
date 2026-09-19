import type { Machine, SeverityLevel, MachineStatus } from '../types';
import { apiClient } from './apiClient';

class MachineService {
  private machines: Machine[] = [];

  public async getAllMachinesAsync(): Promise<Machine[]> {
    try {
      const data = await apiClient.get<any[]>('/machines');
      if (Array.isArray(data) && data.length > 0) {
        return data.map((m) => {
          const fallback = this.machines.find((x) => x.id === m.id);
          const riskLevel: SeverityLevel = m.risk_score >= 75 ? 'CRITICAL' : (m.risk_score >= 50 ? 'HIGH' : (m.risk_score >= 25 ? 'MEDIUM' : 'LOW'));
          const status: MachineStatus = m.status === 'WARNING' ? 'WARNING' : (m.status === 'FAULT' ? 'FAULT' : 'NORMAL');
          
          return {
            ...(fallback || {}),
            id: m.id,
            name: m.machine_name || m.name || fallback?.name || m.id,
            status: status,
            location: m.location || fallback?.location || 'N/A',
            currentTemp: m.temperature ?? m.currentTemp ?? fallback?.currentTemp ?? 0,
            currentVibration: m.vibration ?? m.currentVibration ?? fallback?.currentVibration ?? 0,
            currentPressure: m.pressure ?? m.currentPressure ?? fallback?.currentPressure ?? 0,
            currentSpeed: m.speed ?? m.currentSpeed ?? fallback?.currentSpeed ?? 0,
            defectRate: m.defect_rate ?? m.defectRate ?? fallback?.defectRate ?? 0,
            riskLevel: riskLevel,
            riskScore: m.risk_score ?? m.riskScore ?? fallback?.riskScore ?? 0,
          };
        });
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
