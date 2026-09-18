import type { Machine, SeverityLevel, MachineStatus } from '../types';
import { INITIAL_MACHINES } from '../data/mockData';
import { apiClient } from './apiClient';

class MachineService {
  private machines: Machine[] = [...INITIAL_MACHINES];

  public async getAllMachinesAsync(): Promise<Machine[]> {
    try {
      const data = await apiClient.get<any[]>('/machines');
      if (Array.isArray(data) && data.length > 0) {
        return data.map((m) => {
          const fallback = this.machines.find((x) => x.id === m.id) || this.machines[0];
          const riskLevel: SeverityLevel = m.risk_score >= 75 ? 'CRITICAL' : (m.risk_score >= 50 ? 'HIGH' : (m.risk_score >= 25 ? 'MEDIUM' : 'LOW'));
          const status: MachineStatus = m.status === 'WARNING' ? 'WARNING' : (m.status === 'FAULT' ? 'FAULT' : 'NORMAL');
          
          return {
            ...fallback,
            id: m.id,
            name: m.machine_name || m.name || fallback.name,
            status: status,
            location: m.location || fallback.location,
            currentTemp: m.temperature ?? m.currentTemp ?? fallback.currentTemp,
            currentVibration: m.vibration ?? m.currentVibration ?? fallback.currentVibration,
            currentPressure: m.pressure ?? m.currentPressure ?? fallback.currentPressure,
            currentSpeed: m.speed ?? m.currentSpeed ?? fallback.currentSpeed,
            defectRate: m.defect_rate ?? m.defectRate ?? fallback.defectRate,
            riskLevel: riskLevel,
            riskScore: m.risk_score ?? m.riskScore ?? fallback.riskScore,
          };
        });
      }
    } catch (err) {
      console.warn('Backend unavailable, using initial machine data fallback');
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
