import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from './Badge';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  badgeText?: string;
  badgeStatus?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'PASS' | 'DEFECTIVE';
  icon: LucideIcon;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  badgeText,
  badgeStatus,
  icon: Icon,
  iconColor = 'text-system-blue'
}) => {
  return (
    <div className="scada-card flex flex-col justify-between" style={{ minHeight: '120px' }}>
      <div className="flex items-center justify-between">
        <span className="scada-title">{title}</span>
        <div style={{ color: iconColor }}>
          <Icon size={20} />
        </div>
      </div>

      <div className="my-2 flex items-baseline justify-between">
        <span className="font-mono text-2xl font-bold tracking-tight" style={{ color: '#E8EDF3' }}>
          {value}
        </span>
        {badgeText && badgeStatus && <Badge status={badgeText} />}
      </div>

      {subtext && (
        <span className="text-xs font-mono" style={{ color: '#8D9AAA' }}>
          {subtext}
        </span>
      )}
    </div>
  );
};
