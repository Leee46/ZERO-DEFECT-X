import React from 'react';
import { inspectionService } from '../services/inspectionService';
import { ProductionContextCard } from '../components/inspection/ProductionContextCard';
import { DemoBanner } from '../components/common/DemoBanner';

export const ProductionContextPage: React.FC = () => {
  const latestInspection = inspectionService.getAllInspections()[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="PRODUCTION CONTEXT MONITOR — Sensor Telemetry at Inspection Point" />
      <ProductionContextCard inspection={latestInspection} />
    </div>
  );
};
