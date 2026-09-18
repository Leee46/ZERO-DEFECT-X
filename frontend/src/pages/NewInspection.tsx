import React, { useState, useEffect } from 'react';
import { SAMPLE_PRODUCTS } from '../data/mockData';
import { inspectionService } from '../services/inspectionService';
import { apiClient } from '../services/apiClient';
import { WorkflowStepper } from '../components/workflow/WorkflowStepper';
import { DemoBanner } from '../components/common/DemoBanner';
import { QrCodeDisplay } from '../components/common/QrCodeDisplay';
import { MobileInspection } from './MobileInspection';
import { Upload, Camera, Play, RefreshCw, AlertTriangle, FileCheck } from 'lucide-react';

interface NewInspectionProps {
  onNavigate: (tabId: string, params?: any) => void;
}

export const NewInspection: React.FC<NewInspectionProps> = ({ onNavigate }) => {
  // If user navigated directly to /mobile-inspection URL on phone
  const isMobilePath = typeof window !== 'undefined' && window.location.pathname === '/mobile-inspection';

  const [selectedProduct, setSelectedProduct] = useState(SAMPLE_PRODUCTS[0]);
  const [batchId, setBatchId] = useState(SAMPLE_PRODUCTS[0].batchId);
  const [machineId, setMachineId] = useState(SAMPLE_PRODUCTS[0].machineId);
  const [shift, setShift] = useState(SAMPLE_PRODUCTS[0].shift);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string>('http://10.10.56.134:5173/mobile-inspection');

  useEffect(() => {
    // Dynamically detect LAN IP or default to 10.10.56.134
    const host = typeof window !== 'undefined' ? window.location.hostname : '10.10.56.134';
    const port = typeof window !== 'undefined' ? window.location.port || '5173' : '5173';
    const effectiveHost = (host === 'localhost' || host === '127.0.0.1') ? '10.10.56.134' : host;
    setMobileUrl(`http://${effectiveHost}:${port}/mobile-inspection`);
  }, []);

  if (isMobilePath) {
    return <MobileInspection onNavigate={onNavigate} />;
  }

  const handleProductChange = (prodId: string) => {
    const prod = SAMPLE_PRODUCTS.find((p) => p.id === prodId) || SAMPLE_PRODUCTS[0];
    setSelectedProduct(prod);
    setBatchId(prod.batchId);
    setMachineId(prod.machineId);
    setShift(prod.shift);
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Unsupported format. Please upload JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const loadTestImage = async (filename: string) => {
    try {
      setErrorMessage(null);
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await fetch(`http://${host}:8000/static/demo_images/${filename}`);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      processFile(file);
    } catch (err) {
      setErrorMessage('Could not load test image from backend server.');
    }
  };

  const handleRunInspection = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (selectedFile) {
        // Upload to backend OpenCV vision engine
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('machine_id', machineId);
        formData.append('product_id', selectedProduct.id);
        formData.append('batch_id', batchId);
        formData.append('shift_id', shift);

        const result: any = await apiClient.uploadVisionImage(formData);
        setIsProcessing(false);
        onNavigate('inspection-details', { id: result.inspection_id || result.id });
      } else {
        // Run fallback demo inspection
        const inspection = await inspectionService.runNewInspection(
          selectedProduct.id,
          batchId,
          machineId,
          shift,
          'preset_metal_scratch'
        );
        setIsProcessing(false);
        onNavigate('inspection-details', { id: inspection.id });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Inspection execution failed.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <WorkflowStepper currentStepIndex={1} onStepClick={(idx) => {
        if (idx === 0) onNavigate('dashboard');
      }} />

      <DemoBanner message="OPENCV COMPUTER VISION INSPECTION ENGINE — Real-time Surface Anomaly Detection & Localization" />

      {errorMessage && (
        <div style={{ backgroundColor: '#2C1B1F', border: '1px solid #D9383A', padding: '0.75rem', borderRadius: '4px', color: '#F87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: QR Code Phone Entry + Parameters + Image Input */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr', gap: '1.25rem' }}>
        {/* Leftmost Column: QR Code Section */}
        <div>
          <QrCodeDisplay url={mobileUrl} size={180} />
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.65rem',
              backgroundColor: '#121C2C',
              borderRadius: '6px',
              border: '1px solid #26364A',
              fontSize: '0.75rem',
              color: '#8D9AAA'
            }}
          >
            <span style={{ color: '#22A06B', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
              REAL METAL RING DEMO:
            </span>
            Place the real physical ring in front of your phone camera and submit. Laptop 1 will receive the photo and trigger the vision analysis.
          </div>
        </div>

        {/* Center Column: Form Parameters */}
        <div className="scada-card">
          <div className="scada-header">
            <span className="scada-title">PRODUCT & PRODUCTION CONTEXT PARAMETERS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="scada-label">SELECT SAMPLE PRODUCT SKU</label>
              <select
                className="scada-select"
                value={selectedProduct.id}
                onChange={(e) => handleProductChange(e.target.value)}
              >
                {SAMPLE_PRODUCTS.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.id} — {prod.name} (Simulates: {prod.defectType})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="scada-label">BATCH ID</label>
                <input
                  type="text"
                  className="scada-input"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                />
              </div>

              <div>
                <label className="scada-label">MACHINE STATION</label>
                <select
                  className="scada-select"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                >
                  <option value="M01">M01 — Milling Station 01</option>
                  <option value="M02">M02 — CNC Lathe 02</option>
                  <option value="M03">M03 — Stamping Press 03 (Elevated Vib)</option>
                  <option value="M04">M04 — Assembly Station 04</option>
                </select>
              </div>
            </div>

            <div>
              <label className="scada-label">OPERATOR SHIFT</label>
              <select className="scada-select" value={shift} onChange={(e) => setShift(e.target.value)}>
                <option value="Shift A">Shift A (Morning 07:00 - 15:00)</option>
                <option value="Shift B">Shift B (Evening 15:00 - 23:00)</option>
                <option value="Shift C">Shift C (Night 23:00 - 07:00)</option>
              </select>
            </div>

            <div style={{ backgroundColor: '#162235', padding: '0.75rem', borderRadius: '4px', border: '1px solid #26364A' }}>
              <span className="scada-label" style={{ color: '#4F7CAC' }}>ACTIVE VISION PIPELINE SPECIFICATION</span>
              <ul style={{ fontSize: '0.75rem', color: '#8D9AAA', marginTop: '0.3rem', listStylePosition: 'inside' }}>
                <li>Detector: OpenCV Anomaly Engine (Otsu Adaptive Threshold + Canny Edge)</li>
                <li>Localization: Bounding Box Coordinate Mapper (x_min, y_min, x_max, y_max)</li>
                <li>Severity Estimator: Transparent Surface Area Ratio Metric</li>
                <li>Telemetry Engine: Synchronized with Laptop 2 Virtual Factory</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Rightmost Column: Image Upload Dropzone */}
        <div className="scada-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="scada-header">
            <span className="scada-title">PRODUCT IMAGE INPUT SOURCE</span>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processFile(e.dataTransfer.files[0]);
              }
            }}
            style={{
              flex: 1,
              backgroundColor: '#070B14',
              border: selectedFile ? '2px solid #22A06B' : '2px dashed #26364A',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {imagePreview ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={imagePreview}
                  alt="Selected Product Component"
                  style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '4px', marginBottom: '0.75rem', border: '1px solid #26364A' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <FileCheck size={16} color="#22A06B" />
                  <span style={{ fontSize: '0.8rem', color: '#E8EDF3' }}>{selectedFile?.name || 'Selected Component'}</span>
                  <button
                    className="scada-btn scada-btn-secondary scada-btn-sm"
                    onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Camera style={{ width: '36px', height: '36px', color: '#4F7CAC', marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#E8EDF3' }}>
                  Upload Component Image or Drag & Drop
                </span>
                <span style={{ fontSize: '0.75rem', color: '#8D9AAA', marginTop: '0.2rem', marginBottom: '1rem' }}>
                  Supported Formats: JPG, PNG, WEBP (Max 10MB)
                </span>

                <label className="scada-btn scada-btn-secondary scada-btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={14} />
                  Browse Local File
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </>
            )}
          </div>

          {/* Quick Development Test Image Picker */}
          <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: '#0B1220', borderRadius: '4px', border: '1px solid #26364A' }}>
            <span style={{ fontSize: '0.7rem', color: '#8D9AAA', display: 'block', marginBottom: '0.4rem' }}>
              QUICK TEST IMAGE PICKER (Development Set):
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="scada-btn scada-btn-secondary scada-btn-sm" style={{ fontSize: '0.7rem', flex: 1 }} onClick={() => loadTestImage('scratch_component.jpg')}>
                Scratch Component
              </button>
              <button className="scada-btn scada-btn-secondary scada-btn-sm" style={{ fontSize: '0.7rem', flex: 1 }} onClick={() => loadTestImage('surface_defect_component.jpg')}>
                Surface Defect
              </button>
              <button className="scada-btn scada-btn-secondary scada-btn-sm" style={{ fontSize: '0.7rem', flex: 1 }} onClick={() => loadTestImage('normal_component.jpg')}>
                Normal Component
              </button>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <button
              className="scada-btn scada-btn-primary"
              onClick={handleRunInspection}
              disabled={isProcessing}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Processing OpenCV Anomaly Engine & Preprocessing...
                </>
              ) : (
                <>
                  <Play size={18} />
                  RUN COMPUTER VISION INSPECTION
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
