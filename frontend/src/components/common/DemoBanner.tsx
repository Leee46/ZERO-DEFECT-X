import React from 'react';
import { Info } from 'lucide-react';

interface DemoBannerProps {
  message?: string;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  message = 'CONTROLLED DEMONSTRATION DATA ACTIVE — Architecture is prepared for real-time ESP32 sensors & YOLO vision hardware integration.'
}) => {
  return (
    <div className="demo-badge-header">
      <Info className="w-4 h-4 text-system-blue flex-shrink-0" />
      <span className="font-mono text-xs text-text-secondary">{message}</span>
    </div>
  );
};
