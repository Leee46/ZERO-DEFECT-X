import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, AlertTriangle, RefreshCw, Smartphone, Layers, Activity, ArrowRight } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface MobileInspectionProps {
  onNavigate?: (tabId: string, params?: any) => void;
}

export const MobileInspection: React.FC<MobileInspectionProps> = ({ onNavigate }) => {
  const [productId, setProductId] = useState('RING-001');
  const [batchId, setBatchId] = useState('B1042');
  const [machineId, setMachineId] = useState('M03');
  const [shift, setShift] = useState('Shift B');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle camera stream for inline live preview
  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setErrorMessage('Could not open camera stream. Please use the "Take Photo / Select File" button.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `real_ring_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(file);
            setImagePreview(canvas.toDataURL('image/jpeg'));
            stopCamera();
          }
        }, 'image/jpeg', 0.92);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please capture or select a photo of the REAL METAL RING before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('product_id', productId);
      formData.append('batch_id', batchId);
      formData.append('machine_id', machineId);
      formData.append('shift_id', shift);

      const result: any = await apiClient.uploadVisionImage(formData);
      setSubmissionResult(result);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Inspection submission to Laptop 1 failed.');
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setSubmissionResult(null);
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        maxWidth: '560px',
        margin: '0 auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        backgroundColor: '#070B14',
        minHeight: '100vh',
        color: '#E8EDF3'
      }}
    >
      {/* Mobile Top Navigation / Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #26364A'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Smartphone className="w-5 h-5 text-system-blue" />
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#E8EDF3', letterSpacing: '0.04em' }}>
            ZERO-DEFECT X MOBILE
          </span>
        </div>
        <span
          style={{
            fontSize: '0.65rem',
            padding: '0.2rem 0.5rem',
            backgroundColor: '#162235',
            border: '1px solid #4F7CAC',
            borderRadius: '4px',
            color: '#4F7CAC',
            fontWeight: 700
          }}
        >
          REAL PRODUCT CAPTURE
        </span>
      </div>

      {errorMessage && (
        <div
          style={{
            backgroundColor: '#2C1B1F',
            border: '1px solid #D9383A',
            padding: '0.75rem',
            borderRadius: '4px',
            color: '#F87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {submissionResult ? (
        /* Submission Success Card */
        <div className="scada-card" style={{ border: '1px solid #22A06B', backgroundColor: '#121C2C' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#22A06B' }}>
            <CheckCircle2 size={28} />
            <div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#E8EDF3', display: 'block' }}>
                INSPECTION SUBMITTED TO LAPTOP 1
              </span>
              <span style={{ fontSize: '0.75rem', color: '#8D9AAA' }}>
                ID: {submissionResult.inspection_id}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: '#162235', borderRadius: '4px' }}>
              <span style={{ color: '#8D9AAA' }}>VISION RESULT</span>
              <span style={{ fontWeight: 700, color: submissionResult.status === 'DEFECTIVE' ? '#E55353' : '#22A06B' }}>
                {submissionResult.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: '#162235', borderRadius: '4px' }}>
              <span style={{ color: '#8D9AAA' }}>IMAGE TYPE</span>
              <span style={{ fontWeight: 700, color: '#22A06B' }}>REAL PRODUCT IMAGE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', backgroundColor: '#162235', borderRadius: '4px' }}>
              <span style={{ color: '#8D9AAA' }}>VIRTUAL FACTORY DATA</span>
              <span style={{ fontWeight: 700, color: submissionResult.factory_status === 'ONLINE' ? '#4F7CAC' : '#D99A2B' }}>
                {submissionResult.factory_source_label || 'SIMULATED FACTORY DATA'} ({submissionResult.factory_status})
              </span>
            </div>
            {submissionResult.telemetry && (
              <div style={{ padding: '0.6rem', backgroundColor: '#070B14', borderRadius: '4px', border: '1px solid #26364A', fontSize: '0.75rem' }}>
                <span style={{ color: '#4F7CAC', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                  LAPTOP 2 TELEMETRY (SIMULATED FACTORY DATA):
                </span>
                <div>Machine {submissionResult.machine_id} Temp: {submissionResult.telemetry.temperature}°C | Vib: {submissionResult.telemetry.vibration} mm/s | Press: {submissionResult.telemetry.pressure} bar</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="scada-btn scada-btn-secondary" style={{ flex: 1 }} onClick={handleReset}>
              Capture Another Ring
            </button>
            {onNavigate && (
              <button
                className="scada-btn scada-btn-primary"
                style={{ flex: 1 }}
                onClick={() => onNavigate('inspection-details', { id: submissionResult.inspection_id })}
              >
                View on Dashboard <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Mobile Form */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Form Parameters */}
          <div className="scada-card">
            <div className="scada-header">
              <span className="scada-title">PRODUCT & STATION DETAILS</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="scada-label">PRODUCT ID</label>
                <input
                  type="text"
                  className="scada-input"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="scada-label">BATCH ID</label>
                <input
                  type="text"
                  className="scada-input"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="scada-label">MACHINE STATION</label>
                <select className="scada-select" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
                  <option value="M01">M01 — Milling 01</option>
                  <option value="M02">M02 — Lathe 02</option>
                  <option value="M03">M03 — Stamping 03 (Elevated Vib)</option>
                  <option value="M04">M04 — Assembly 04</option>
                </select>
              </div>

              <div>
                <label className="scada-label">OPERATOR SHIFT</label>
                <select className="scada-select" value={shift} onChange={(e) => setShift(e.target.value)}>
                  <option value="Shift A">Shift A (Morning)</option>
                  <option value="Shift B">Shift B (Evening)</option>
                  <option value="Shift C">Shift C (Night)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Photo Capture Area */}
          <div className="scada-card">
            <div className="scada-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={16} className="text-system-blue" />
                <span className="scada-title">REAL METAL RING PHOTO CAPTURE</span>
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.4rem',
                  backgroundColor: 'rgba(34, 160, 107, 0.15)',
                  border: '1px solid #22A06B',
                  borderRadius: '3px',
                  color: '#22A06B',
                  fontWeight: 700
                }}
              >
                REAL PRODUCT IMAGE
              </span>
            </div>

            {/* Live Camera Viewfinder or Image Preview */}
            <div
              style={{
                backgroundColor: '#070B14',
                border: selectedFile ? '2px solid #22A06B' : '2px dashed #26364A',
                borderRadius: '6px',
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isCameraActive ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{ width: '100%', maxHeight: '240px', borderRadius: '4px', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    className="scada-btn scada-btn-primary"
                    onClick={captureCameraFrame}
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    <Camera size={16} /> CAPTURE RING PHOTO
                  </button>
                </div>
              ) : imagePreview ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <img
                    src={imagePreview}
                    alt="Captured Metal Ring"
                    style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '4px', border: '1px solid #26364A' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button
                      type="button"
                      className="scada-btn scada-btn-secondary scada-btn-sm"
                      onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                      style={{ flex: 1 }}
                    >
                      Retake Photo
                    </button>
                    <button
                      type="button"
                      className="scada-btn scada-btn-secondary scada-btn-sm"
                      onClick={startCamera}
                      style={{ flex: 1 }}
                    >
                      Open Live Camera
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                  <Camera size={42} style={{ color: '#4F7CAC' }} />
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#E8EDF3', display: 'block' }}>
                      Position Physical Metal Ring in Viewfinder
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#8D9AAA' }}>
                      Capture actual ring photo using camera or file select
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      className="scada-btn scada-btn-primary scada-btn-sm"
                      onClick={startCamera}
                      style={{ flex: 1 }}
                    >
                      <Camera size={14} /> Open Camera
                    </button>

                    <label className="scada-btn scada-btn-secondary scada-btn-sm" style={{ flex: 1, cursor: 'pointer' }}>
                      <Upload size={14} /> Take/Select Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="scada-btn scada-btn-primary"
            disabled={isSubmitting || !selectedFile}
            style={{ padding: '0.85rem', fontSize: '1rem', width: '100%', fontWeight: 700 }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                SENDING REAL RING IMAGE TO LAPTOP 1...
              </>
            ) : (
              <>
                SUBMIT INSPECTION TO LAPTOP 1
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
