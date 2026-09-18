import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Cpu,
  Layers,
  Box,
  Clock,
  Search,
  ShieldAlert,
  BarChart3,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  HardDrive,
  Settings,
  GitPullRequest
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const navSections: NavSection[] = [
    {
      title: 'COMMAND CENTER',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard }
      ]
    },
    {
      title: 'INSPECTION',
      items: [
        { id: 'new-inspection', label: 'New Inspection', icon: PlusCircle },
        { id: 'inspection-history', label: 'Inspection History', icon: History }
      ]
    },
    {
      title: 'PRODUCTION',
      items: [
        { id: 'machines', label: 'Machines', icon: Cpu },
        { id: 'production-context', label: 'Production Context', icon: Layers },
        { id: 'batches', label: 'Batches', icon: Box },
        { id: 'shifts', label: 'Shifts', icon: Clock }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'root-cause', label: 'Root-Cause Analysis', icon: Search },
        { id: 'risk-monitor', label: 'Risk Monitor', icon: ShieldAlert },
        { id: 'analytics', label: 'Defect Analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'ACTIONS',
      items: [
        { id: 'alerts', label: 'Active Alerts', icon: AlertTriangle },
        { id: 'corrective-actions', label: 'Corrective Actions', icon: Wrench },
        { id: 'reinspection', label: 'Reinspection', icon: CheckCircle2 }
      ]
    },
    {
      title: 'TRACEABILITY',
      items: [
        { id: 'product-traceability', label: 'Product Traceability', icon: GitPullRequest }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'system-status', label: 'System Status', icon: HardDrive },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#0B1220',
        borderRight: '1px solid #26364A',
        height: 'calc(100vh - 60px)',
        overflowY: 'auto',
        padding: '1rem 0.5rem',
        flexShrink: 0
      }}
    >
      {navSections.map((section, idx) => (
        <div key={idx} style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#5C6B7E',
              letterSpacing: '0.08em',
              padding: '0 0.75rem 0.4rem 0.75rem',
              textTransform: 'uppercase'
            }}
          >
            {section.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.825rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#FFFFFF' : '#8D9AAA',
                    backgroundColor: isActive ? '#162235' : 'transparent',
                    borderLeft: isActive ? '3px solid #4F7CAC' : '3px solid transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px', color: isActive ? '#4F7CAC' : '#5C6B7E' }} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
};
