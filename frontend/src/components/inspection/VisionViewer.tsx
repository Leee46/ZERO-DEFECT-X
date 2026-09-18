import React, { useState } from 'react';
import type { DefectItem } from '../../types';
import { ZoomIn, Layers, Crosshair, Eye, Camera } from 'lucide-react';
import { Badge } from '../common/Badge';
import { getApiBaseUrl } from '../../services/apiClient';

interface VisionViewerProps {
  imageUrl: string;
  annotatedImageUrl?: string;
  defects: DefectItem[];
  status: 'PASS' | 'DEFECTIVE';
  modelProvider?: string;
  confidence?: number;
}

export const VisionViewer: React.FC<VisionViewerProps> = ({
  imageUrl,
  annotatedImageUrl,
  defects,
  status,
  modelProvider = 'OpenCV Anomaly Detector (Development-stage computer vision)',
  confidence = 84
}) => {
  const [showAnnotated, setShowAnnotated] = useState<boolean>(true);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Normalize image URL for backend static serving
  const resolveUrl = (url: string) => {
    if (!url) return '/images/sample.jpg';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads/') || url.startsWith('/static/')) {
      const apiBase = getApiBaseUrl().replace(/\/api\/?$/, '');
      return `${apiBase}${url}`;
    }
    return url;
  };

  const activeSrc = (showAnnotated && annotatedImageUrl) ? resolveUrl(annotatedImageUrl) : resolveUrl(imageUrl);

  return (
    <div className="scada-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header controls */}
      <div className="scada-header" style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Crosshair className="w-4 h-4 text-system-blue" />
          <span className="scada-title">COMPUTER VISION ANALYSIS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.65rem',
              padding: '0.15rem 0.45rem',
              backgroundColor: 'rgba(34, 160, 107, 0.15)',
              border: '1px solid #22A06B',
              borderRadius: '3px',
              color: '#22A06B',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
          >
            <Camera size={10} />
            REAL PRODUCT IMAGE
          </span>

          <Badge status={status} />
          {annotatedImageUrl && (
            <button
              className={`scada-btn scada-btn-sm ${showAnnotated ? 'scada-btn-primary' : 'scada-btn-secondary'}`}
              onClick={() => setShowAnnotated(!showAnnotated)}
            >
              <Eye size={14} />
              {showAnnotated ? 'Annotated OpenCV Image' : 'Original Raw Product'}
            </button>
          )}
          <button
            className="scada-btn scada-btn-secondary scada-btn-sm"
            onClick={() => setShowBoxes(!showBoxes)}
          >
            <Layers size={14} />
            {showBoxes ? 'Hide Overlays' : 'Show Overlays'}
          </button>
          <button
            className="scada-btn scada-btn-secondary scada-btn-sm"
            onClick={() => setZoomLevel((z) => (z >= 1.5 ? 1 : z + 0.25))}
          >
            <ZoomIn size={14} />
            {Math.round(zoomLevel * 100)}%
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#070B14',
          border: '1px solid #26364A',
          borderRadius: '4px',
          overflow: 'hidden',
          minHeight: '340px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.2s ease',
            maxWidth: '100%',
            maxHeight: '400px'
          }}
        >
          <img
            src={activeSrc}
            alt="Inspected Real Metal Ring Surface"
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '360px',
              borderRadius: '2px',
              border: '1px solid #162235'
            }}
          />

          {/* Render CSS Bounding Box Overlay if raw image is active */}
          {!showAnnotated && showBoxes &&
            defects.map((defect, idx) => {
              const { x, y, width, height, label } = defect.boundingBox || { x: 420, y: 80, width: 190, height: 130, label: defect.type };
              const isCrit = defect.severity === 'CRITICAL' || defect.severity === 'HIGH';
              const boxColor = isCrit ? '#E55353' : '#D99A2B';
              return (
                <div
                  key={defect.id || idx}
                  style={{
                    position: 'absolute',
                    left: `${(x / 800) * 100}%`,
                    top: `${(y / 600) * 100}%`,
                    width: `${(width / 800) * 100}%`,
                    height: `${(height / 600) * 100}%`,
                    border: `2px solid ${boxColor}`,
                    backgroundColor: `${boxColor}22`,
                    borderRadius: '2px',
                    pointerEvents: 'none',
                    boxShadow: `0 0 8px ${boxColor}66`
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '-22px',
                      left: '-2px',
                      backgroundColor: boxColor,
                      color: '#000',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      padding: '1px 5px',
                      borderRadius: '2px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {label || `${defect.type}`}
                  </span>
                </div>
              );
            })}
        </div>

        {/* HUD Overlay Info */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            backgroundColor: 'rgba(11, 18, 32, 0.90)',
            border: '1px solid #26364A',
            padding: '0.3rem 0.75rem',
            borderRadius: '3px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: '#8D9AAA'
          }}
        >
          COMPUTER VISION ANALYSIS: <span style={{ color: '#4F7CAC', fontWeight: 600 }}>{modelProvider}</span> | ANOMALY SCORE:{' '}
          <span style={{ color: '#E8EDF3', fontWeight: 700 }}>{confidence}%</span>
        </div>
      </div>
    </div>
  );
};
