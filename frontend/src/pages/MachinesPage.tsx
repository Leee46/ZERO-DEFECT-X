import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { MachineCard } from '../components/machine/MachineCard';
import { MachineDetailModal } from '../components/machine/MachineDetailModal';
import { DemoBanner } from '../components/common/DemoBanner';
import { Cpu } from 'lucide-react';
import type { Machine } from '../types';

export const MachinesPage: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiClient.get<any[]>('/machines')
      .then((data) => {
        if (!mounted) return;
        const rows = (Array.isArray(data) ? data : []).map((m: any) => ({
          id: m.id,
          name: m.machine_name || m.name || m.id,
          status: m.status || 'NORMAL',
          location: m.location || 'N/A',
          currentTemp: m.temperature,
          currentVibration: m.vibration,
          currentPressure: m.pressure,
          currentSpeed: m.speed,
          defectRate: Number(m.defect_rate || 0),
          riskLevel: Number(m.risk_score || 0) >= 75 ? 'CRITICAL' : Number(m.risk_score || 0) >= 50 ? 'HIGH' : Number(m.risk_score || 0) >= 25 ? 'MEDIUM' : 'LOW',
          riskScore: Number(m.risk_score || 0),
          baselineTemp: 70,
          baselineVibration: 2.5,
          primaryDefectType: 'Normal',
          baselinePressure: 6.0,
          productionCount: 0,
          defectCount: 0,
          recentAlerts: 0,
          historicalTrend: []
        })) as Machine[];
        setMachines(rows);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load machine data.'));

    return () => { mounted = false; };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="STATION MONITOR — Real-time SCADA Machine Telemetry & Vibration/Thermal Baselines" />

      <div className="scada-card">
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu className="w-4 h-4 text-system-blue" />
            <span className="scada-title">FACTORY FLOOR MACHINE STATIONS</span>
          </div>
          <span className="font-mono text-xs text-text-secondary">{machines.length} STATIONS RECORDED</span>
        </div>

        {error && <p style={{ color: '#E55353' }}>{error}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} onSelect={(m) => setSelectedMachine(m)} />
          ))}
        </div>
      </div>

      <MachineDetailModal machine={selectedMachine} onClose={() => setSelectedMachine(null)} />
    </div>
  );
};
