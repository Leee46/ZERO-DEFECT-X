import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { DemoBanner } from '../components/common/DemoBanner';
import { Clock } from 'lucide-react';

export const ShiftsPage: React.FC = () => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiClient.get<any[]>('/shifts'), apiClient.get<any[]>('/inspections')])
      .then(([shiftRows, inspectionRows]) => {
        const inspections = Array.isArray(inspectionRows) ? inspectionRows : [];
        const rows = (Array.isArray(shiftRows) ? shiftRows : []).map((shift: any) => {
          const records = inspections.filter((item: any) => item.shift_id === shift.id);
          const defects = records.filter((item: any) => item.status === 'DEFECTIVE').length;
          return {
            shift: shift.shift_name || shift.id,
            hours: `${shift.start_time || 'N/A'} - ${shift.end_time || 'N/A'}`,
            supervisor: shift.operator_name || 'N/A',
            inspected: records.length,
            defects,
            rate: records.length ? `${(defects / records.length * 100).toFixed(2)}%` : '0.00%'
          };
        });
        setShifts(rows);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load shift quality data.'));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="OPERATOR SHIFTS — Performance & Defect Rate Correlation by Work Shift" />

      {error && <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}><p style={{ color: '#E55353', marginBottom: 0 }}>{error}</p></div>}

      <div className="scada-card">
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock className="w-4 h-4 text-system-blue" />
            <span className="scada-title">OPERATOR SHIFT QUALITY OVERVIEW</span>
          </div>
        </div>

        <div className="scada-table-wrapper">
          <table className="scada-table">
            <thead>
              <tr>
                <th>Shift Name</th>
                <th>Working Hours</th>
                <th>Shift Lead</th>
                <th>Total Inspected</th>
                <th>Defects Logged</th>
                <th>Defect Rate</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s, idx) => (
                <tr key={idx}>
                  <td className="font-mono" style={{ fontWeight: 600, color: '#4F7CAC' }}>{s.shift}</td>
                  <td className="font-mono">{s.hours}</td>
                  <td>{s.supervisor}</td>
                  <td className="font-mono">{s.inspected}</td>
                  <td className="font-mono" style={{ color: s.defects > 15 ? '#E55353' : '#22A06B', fontWeight: 700 }}>{s.defects}</td>
                  <td className="font-mono" style={{ fontWeight: 700, color: parseFloat(s.rate) > 4.0 ? '#E55353' : '#22A06B' }}>{s.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
