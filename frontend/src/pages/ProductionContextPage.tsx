import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { ProductionContextCard } from '../components/inspection/ProductionContextCard';
import { DemoBanner } from '../components/common/DemoBanner';

export const ProductionContextPage: React.FC = () => {
  const [inspection, setInspection] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<any[]>('/inspections')
      .then((rows) => {
        const latest = Array.isArray(rows) ? rows[0] : null;
        if (!latest) throw new Error('No inspection record is available.');
        setInspection({
          ...latest,
          productId: latest.product_id,
          batchId: latest.batch_id,
          machineId: latest.machine_id,
          shift: latest.shift_id,
          parameters: {
            temperature: latest.temperature ?? null,
            vibration: latest.vibration ?? null,
            pressure: latest.pressure ?? null,
            speed: latest.speed ?? null,
            envTemp: latest.environment_temperature ?? null,
            envHumidity: latest.humidity ?? null
          },
          factory_status: latest.factory_status,
          factory_source_label: latest.factory_source_label
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load production context.'));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="PRODUCTION CONTEXT MONITOR — Sensor Telemetry at Inspection Point" />
      {error && <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}><p style={{ color: '#E55353', marginBottom: 0 }}>{error}</p></div>}
      {inspection && <ProductionContextCard inspection={inspection} />}
    </div>
  );
};
