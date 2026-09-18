import React from 'react';
import type { SeverityLevel, MachineStatus, ActionStatus, AlertStatus } from '../../types';

interface BadgeProps {
  status: SeverityLevel | MachineStatus | ActionStatus | AlertStatus | 'PASS' | 'DEFECTIVE' | string;
  type?: 'severity' | 'machine' | 'general';
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ status, showDot = true }) => {
  let badgeClass = 'scada-badge-neutral';
  let dotClass = 'status-dot-safe';

  const statusUpper = status.toUpperCase();

  if (['SAFE', 'NORMAL', 'PASS', 'LOW', 'RESOLVED', 'VERIFIED', 'IMPROVED'].includes(statusUpper)) {
    badgeClass = 'scada-badge-safe';
    dotClass = 'status-dot-safe';
  } else if (['WARNING', 'MEDIUM', 'ACKNOWLEDGED', 'IN_PROGRESS', 'FLAGGED'].includes(statusUpper)) {
    badgeClass = 'scada-badge-warning';
    dotClass = 'status-dot-warning';
  } else if (['CRITICAL', 'HIGH', 'DEFECTIVE', 'FAULT', 'UNRESOLVED'].includes(statusUpper)) {
    badgeClass = 'scada-badge-critical';
    dotClass = 'status-dot-critical';
  } else if (['NEW', 'INFO', 'ACTIVE', 'MAINTENANCE'].includes(statusUpper)) {
    badgeClass = 'scada-badge-info';
    dotClass = 'status-dot-safe';
  }

  return (
    <span className={`scada-badge ${badgeClass}`}>
      {showDot && <span className={`status-dot ${dotClass}`} />}
      {status}
    </span>
  );
};
