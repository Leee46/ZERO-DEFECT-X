import React from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  alertCount?: number;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onSelectTab,
  alertCount = 3,
  children
}) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0B1220' }}>
      <TopNav alertCount={alertCount} onAlertClick={() => onSelectTab('alerts')} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />
        <main
          style={{
            flex: 1,
            backgroundColor: '#0B1220',
            overflowY: 'auto',
            padding: '1.5rem',
            height: 'calc(100vh - 60px)'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
