import type { Inspection } from '../types';
import { INITIAL_INSPECTIONS } from '../data/mockData';
import { visionService } from './visionService';
import { rootCauseService } from './rootCauseService';
import { machineService } from './machineService';
import { riskService } from './riskService';
import { apiClient } from './apiClient';

class InspectionService {
  private inspections: Inspection[] = [...INITIAL_INSPECTIONS];

  public async getAllInspectionsAsync(): Promise<Inspection[]> {
    try {
      const data = await apiClient.get<any[]>('/inspections');
      if (Array.isArray(data) && data.length > 0) {
        const remoteInspections: Inspection[] = data.map((item) => {
          const rawUrl = item.image_path || item.imageUrl || '/images/sample.jpg';
          const defects = (item.defects || []).map((d: any, idx: number) => ({
            id: d.id || `DEF-${idx}`,
            type: d.defect_type || d.type || 'Surface Anomaly',
            confidence: Math.round((d.confidence || 0.88) * (d.confidence > 1 ? 1 : 100)),
            severity: d.severity || 'HIGH',
            location: d.location || 'Center surface',
            boundingBox: {
              x: d.x_min ? Math.round(d.x_min * 800) : 420,
              y: d.y_min ? Math.round(d.y_min * 600) : 80,
              width: d.x_max ? Math.round((d.x_max - d.x_min) * 800) : 190,
              height: d.y_max ? Math.round((d.y_max - d.y_min) * 600) : 130,
              label: d.defect_type || 'Surface Anomaly'
            },
            description: d.description || 'Surface structural anomaly'
          }));

          return {
            id: item.id,
            productId: item.product_id || item.productId || 'P1042-087',
            batchId: item.batch_id || item.batchId || 'B1042',
            machineId: item.machine_id || item.machineId || 'M03',
            shift: item.shift_id || item.shift || 'Shift B',
            timestamp: item.inspection_time ? item.inspection_time.replace('T', ' ').substring(0, 19) : (item.timestamp || '2026-09-18 10:00:00'),
            status: item.status === 'DEFECTIVE' ? 'DEFECTIVE' : 'PASS',
            defects: defects,
            imageUrl: rawUrl,
            imageThumbnail: rawUrl,
            parameters: {
              temperature: 72.0,
              vibration: 4.8,
              pressure: 6.2,
              speed: 1480,
              envTemp: 29.0,
              envHumidity: 68
            },
            isControlledDemo: false
          };
        });

        // Merge remote inspections with local ones avoiding duplicates
        const existingIds = new Set(remoteInspections.map((i) => i.id));
        const localOnly = this.inspections.filter((i) => !existingIds.has(i.id));
        this.inspections = [...remoteInspections, ...localOnly];
      }
    } catch (err) {
      console.warn('Backend inspections API unavailable, using cached inspection records');
    }
    return this.inspections;
  }

  public getAllInspections(): Inspection[] {
    return this.inspections;
  }

  public getInspectionById(id: string): Inspection | undefined {
    return this.inspections.find((i) => i.id === id);
  }

  public addInspection(inspection: Inspection) {
    const idx = this.inspections.findIndex((i) => i.id === inspection.id);
    if (idx !== -1) {
      this.inspections[idx] = inspection;
    } else {
      this.inspections.unshift(inspection);
    }
  }

  public async runNewInspection(
    productId: string,
    batchId: string,
    machineId: string,
    shift: string,
    imageSource: string | File
  ): Promise<Inspection> {
    const visionResult = await visionService.analyze({
      productId,
      imageSource,
      machineId,
      batchId
    });

    const machine = machineService.getMachineById(machineId) || machineService.getAllMachines()[0];

    const newInspection: Inspection = {
      id: visionResult.inspectionId,
      productId,
      batchId,
      machineId,
      shift,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: visionResult.status,
      defects: visionResult.defects,
      imageUrl: typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource),
      parameters: {
        temperature: machine.currentTemp,
        vibration: machine.currentVibration,
        pressure: machine.currentPressure,
        speed: machine.currentSpeed,
        envTemp: 29.0,
        envHumidity: 65
      },
      isControlledDemo: true
    };

    if (newInspection.status === 'DEFECTIVE') {
      newInspection.rootCause = rootCauseService.analyzeRootCause(newInspection, machine);
      newInspection.riskAssessment = riskService.calculateMachineRisk(machine);
    }

    this.addInspection(newInspection);
    return newInspection;
  }

  // --- Phase 6: Corrective Action Methods ---
  public async getCorrectiveActionsAsync(): Promise<any[]> {
    try {
      const data = await apiClient.get<any[]>('/corrective-actions');
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.warn('Failed to fetch corrective actions from API, using fallback');
    }
    return [];
  }

  public async createCorrectiveActionAsync(payload: {
    inspection_id: string;
    action_description: string;
    priority?: string;
    assigned_to?: string;
    machine_id?: string;
    probable_factor?: string;
    recommended_actions?: string[];
    notes?: string;
  }): Promise<any> {
    return await apiClient.post<any>('/corrective-actions', payload);
  }

  public async startCorrectiveActionAsync(actionId: string, notes?: string): Promise<any> {
    return await apiClient.post<any>(`/corrective-actions/${actionId}/start`, { notes });
  }

  public async completeCorrectiveActionAsync(actionId: string, notes?: string): Promise<any> {
    return await apiClient.post<any>(`/corrective-actions/${actionId}/complete`, { notes });
  }

  // --- Phase 6: Reinspection Methods ---
  public async getReinspectionsAsync(): Promise<any[]> {
    try {
      const data = await apiClient.get<any[]>('/reinspections');
      if (Array.isArray(data)) return data;
    } catch (e) {
      console.warn('Failed to fetch reinspections from API, using fallback');
    }
    return [];
  }

  public async createReinspectionAsync(payload: any): Promise<any> {
    return await apiClient.post<any>('/reinspections', payload);
  }

  public async analyzeAndReinspectAsync(formData: FormData): Promise<any> {
    const response = await fetch('/api/reinspections/analyze', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) {
      throw new Error(`Reinspection analysis failed: ${response.statusText}`);
    }
    return await response.json();
  }

  public async verifyReinspectionAsync(reinspectionId: string, notes?: string): Promise<any> {
    return await apiClient.post<any>(`/reinspections/${reinspectionId}/verify`, { notes });
  }
}

export const inspectionService = new InspectionService();
