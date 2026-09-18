import React, { useState } from 'react';
import { machineService } from '../services/machineService';
import { MachineCard } from '../components/machine/MachineCard';
import { MachineDetailModal } from '../components/machine/MachineDetailModal';
import { DemoBanner } from '../components/common/DemoBanner';
import { Cpu } from 'lucide-react';
import type { Machine } from '../types';

export const MachinesPage: React.FC = () => {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const machines = machineService.getAllMachines();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="STATION MONITOR — Real-time SCADA Machine Telemetry & Vibration/Thermal Baselines" />

      <div className="scada-card">
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu className="w-4 h-4 text-system-blue" />
            <span className="scada-title">FACTORY FLOOR MACHINE STATIONS</span>
          </div>
          <span className="font-mono text-xs text-text-secondary">4 STATIONS ONLINE</span>
        </div>

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
