import React from 'react';
import { DemoBanner } from '../components/common/DemoBanner';
import { Clock } from 'lucide-react';

export const ShiftsPage: React.FC = () => {
  const shifts = [
    { shift: 'Shift A', hours: '07:00 - 15:00', supervisor: 'J. Miller', inspected: 520, defects: 5, rate: '0.96%' },
    { shift: 'Shift B', hours: '15:00 - 23:00', supervisor: 'R. Vance', inspected: 480, defects: 28, rate: '5.83%' },
    { shift: 'Shift C', hours: '23:00 - 07:00', supervisor: 'S. Chen', inspected: 248, defects: 4, rate: '1.61%' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="OPERATOR SHIFTS — Performance & Defect Rate Correlation by Work Shift" />

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
