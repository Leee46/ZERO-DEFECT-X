import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Badge } from '../components/common/Badge';
import { DemoBanner } from '../components/common/DemoBanner';
import { Box } from 'lucide-react';

export const BatchesPage: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiClient.get<any[]>('/batches'), apiClient.get<any[]>('/inspections')])
      .then(([batchRows, inspectionRows]) => {
        setBatches(Array.isArray(batchRows) ? batchRows : []);
        setInspections(Array.isArray(inspectionRows) ? inspectionRows : []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load batch records.'));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="PRODUCTION BATCH MONITOR — Batch Quality Yield & Quarantine Tracking" />

      {error && <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}><p style={{ color: '#E55353', marginBottom: 0 }}>{error}</p></div>}

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
              {batches.map((b) => {
                const batchInspections = inspections.filter((i) => i.batch_id === b.id);
                const producedQuantity = batchInspections.length;
                const defectCount = batchInspections.filter((i) => i.status === 'DEFECTIVE').length;
                const rate = producedQuantity ? ((defectCount / producedQuantity) * 100).toFixed(2) : '0.00';
                return (
                  <tr key={b.id}>
                    <td className="font-mono" style={{ color: '#4F7CAC', fontWeight: 600 }}>{b.id}</td>
                    <td className="font-mono">{b.product_id || 'N/A'}</td>
                    <td className="font-mono">{b.machine_id || 'N/A'}</td>
                    <td className="font-mono">{b.shift_id || 'N/A'}</td>
                    <td className="font-mono">{producedQuantity || 'N/A'}</td>
                    <td className="font-mono">{producedQuantity}</td>
                    <td className="font-mono" style={{ color: defectCount > 0 ? '#E55353' : '#22A06B', fontWeight: 700 }}>{defectCount}</td>
                    <td className="font-mono">{rate}%</td>
                    <td><Badge status={b.status} /></td>
                    <td className="font-mono" style={{ color: '#8D9AAA' }}>{b.production_start ? new Date(b.production_start).toLocaleString() : 'N/A'}</td>
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
