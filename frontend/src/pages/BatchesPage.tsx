import React from 'react';
import { INITIAL_BATCHES } from '../data/mockData';
import { Badge } from '../components/common/Badge';
import { DemoBanner } from '../components/common/DemoBanner';
import { Box } from 'lucide-react';

export const BatchesPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="PRODUCTION BATCH MONITOR — Batch Quality Yield & Quarantine Tracking" />

      <div className="scada-card">
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box className="w-4 h-4 text-system-blue" />
            <span className="scada-title">ACTIVE & HISTORICAL PRODUCTION BATCHES</span>
          </div>
        </div>

        <div className="scada-table-wrapper">
          <table className="scada-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Product SKU</th>
                <th>Station</th>
                <th>Shift</th>
                <th>Target Qty</th>
                <th>Produced</th>
                <th>Defects</th>
                <th>Defect Rate</th>
                <th>Status</th>
                <th>Start Time</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_BATCHES.map((b) => {
                const rate = ((b.defectCount / b.producedQuantity) * 100).toFixed(2);
                return (
                  <tr key={b.id}>
                    <td className="font-mono" style={{ color: '#4F7CAC', fontWeight: 600 }}>{b.id}</td>
                    <td className="font-mono">{b.productId}</td>
                    <td className="font-mono">{b.machineId}</td>
                    <td className="font-mono">{b.shift}</td>
                    <td className="font-mono">{b.targetQuantity}</td>
                    <td className="font-mono">{b.producedQuantity}</td>
                    <td className="font-mono" style={{ color: b.defectCount > 10 ? '#E55353' : '#22A06B', fontWeight: 700 }}>{b.defectCount}</td>
                    <td className="font-mono">{rate}%</td>
                    <td><Badge status={b.status} /></td>
                    <td className="font-mono" style={{ color: '#8D9AAA' }}>{b.startTime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
