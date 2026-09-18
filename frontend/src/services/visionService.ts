import type { DefectItem } from '../types';

export interface VisionAnalysisRequest {
  productId: string;
  imageSource: string | File;
  machineId: string;
  batchId: string;
}

export interface VisionAnalysisResult {
  inspectionId: string;
  status: 'PASS' | 'DEFECTIVE';
  defects: DefectItem[];
  modelProvider: string;
  modelConfidenceOverall: number;
  inferenceTimeMs: number;
}

export interface VisionModelProvider {
  providerName: string;
  analyzeImage(request: VisionAnalysisRequest): Promise<VisionAnalysisResult>;
}

/**
 * DemoVisionProvider - Rule-based realistic simulation provider for controlled demonstration
 * Can be swapped with YOLOVisionProvider or OpenCVVisionProvider seamlessly.
 */
export class DemoVisionProvider implements VisionModelProvider {
  public providerName = 'DemoVisionProvider (YOLOv8 Engine Simulation)';

  async analyzeImage(request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
    // Simulate real vision inference processing time (350ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    const inspectionId = `INSP-${Date.now().toString().slice(-6)}`;
    const { productId, machineId } = request;

    // Controlled demo rules based on product ID / Machine ID:
    let status: 'PASS' | 'DEFECTIVE' = 'PASS';
    const defects: DefectItem[] = [];

    if (machineId === 'M03' || productId.includes('087') || productId.includes('086')) {
      status = 'DEFECTIVE';
      defects.push({
        id: `DEF-${Math.floor(Math.random() * 900 + 100)}`,
        type: 'Scratch',
        confidence: 94.2,
        severity: 'HIGH',
        location: 'UPPER-RIGHT SURFACE',
        boundingBox: { x: 360, y: 90, width: 90, height: 80, label: 'Scratch [94.2%]' },
        description: 'Linear deep surface abrasion detected across metallic coating.'
      });
    } else if (productId.includes('091')) {
      status = 'DEFECTIVE';
      defects.push({
        id: `DEF-${Math.floor(Math.random() * 900 + 100)}`,
        type: 'Crack',
        confidence: 89.6,
        severity: 'CRITICAL',
        location: 'LOWER-LEFT EDGE',
        boundingBox: { x: 130, y: 210, width: 65, height: 90, label: 'Crack [89.6%]' },
        description: 'Micro-fracture propagation along flange stress line.'
      });
    } else if (productId.includes('012')) {
      status = 'DEFECTIVE';
      defects.push({
        id: `DEF-${Math.floor(Math.random() * 900 + 100)}`,
        type: 'Dent',
        confidence: 92.1,
        severity: 'MEDIUM',
        location: 'CENTER BEVEL',
        boundingBox: { x: 250, y: 180, width: 70, height: 50, label: 'Dent [92.1%]' },
        description: 'Impact deformation on central mounting face.'
      });
    }

    return {
      inspectionId,
      status,
      defects,
      modelProvider: this.providerName,
      modelConfidenceOverall: defects.length > 0 ? defects[0].confidence : 99.1,
      inferenceTimeMs: 42
    };
  }
}

/**
 * YOLOVisionProvider - Future placeholder interface implementation for actual ONNX / TensorRT / FastAPI backend model
 */
export class YOLOVisionProvider implements VisionModelProvider {
  public providerName = 'YOLOVisionProvider (TensorRT/Python API)';

  async analyzeImage(_request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
    throw new Error('YOLOVisionProvider hardware inference endpoint not configured. Using DemoVisionProvider.');
  }
}

// Active Vision Service Singleton
class VisionServiceManager {
  private activeProvider: VisionModelProvider;

  constructor() {
    this.activeProvider = new DemoVisionProvider();
  }

  public getActiveProviderName(): string {
    return this.activeProvider.providerName;
  }

  public setProvider(provider: VisionModelProvider) {
    this.activeProvider = provider;
  }

  public async analyze(request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
    return this.activeProvider.analyzeImage(request);
  }
}

export const visionService = new VisionServiceManager();
