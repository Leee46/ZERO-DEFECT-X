import React, { useState } from 'react';
import { DemoBanner } from '../components/common/DemoBanner';
import { Settings, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [vibBaseline, setVibBaseline] = useState('2.1');
  const [tempBaseline, setTempBaseline] = useState('68.0');
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="SYSTEM CONFIGURATION — Baseline Thresholds & Provider Switching" />

      <div className="scada-card" style={{ maxWidth: '600px' }}>
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings className="w-4 h-4 text-system-blue" />
            <span className="scada-title">THRESHOLD & VISION PROVIDER CONFIGURATION</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="scada-label">ACTIVE VISION MODEL PROVIDER</label>
            <select className="scada-select" defaultValue="demo">
              <option value="demo">DemoVisionProvider (YOLOv8 Simulation)</option>
              <option value="yolo">YOLOVisionProvider (TensorRT API Endpoint)</option>
              <option value="opencv">OpenCVVisionProvider (Classic Contour Analysis)</option>
            </select>
          </div>

          <div>
            <label className="scada-label">MACHINE VIBRATION BASELINE THRESHOLD (mm/s)</label>
            <input
              type="number"
              step="0.1"
              className="scada-input font-mono"
              value={vibBaseline}
              onChange={(e) => setVibBaseline(e.target.value)}
            />
          </div>

          <div>
            <label className="scada-label">TEMPERATURE WARNING BASELINE THRESHOLD (°C)</label>
            <input
              type="number"
              step="0.1"
              className="scada-input font-mono"
              value={tempBaseline}
              onChange={(e) => setTempBaseline(e.target.value)}
            />
          </div>

          <div style={{ paddingTop: '0.5rem' }}>
            <button className="scada-btn scada-btn-primary" onClick={handleSave}>
              <Save size={16} />
              Save Configuration Settings
            </button>
            {savedMsg && (
              <span style={{ marginLeft: '1rem', color: '#22A06B', fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ Settings saved successfully
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
