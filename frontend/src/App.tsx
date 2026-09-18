import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { CommandCenter } from './pages/CommandCenter';
import { NewInspection } from './pages/NewInspection';
import { MobileInspection } from './pages/MobileInspection';
import { InspectionDetails } from './pages/InspectionDetails';
import { InspectionHistory } from './pages/InspectionHistory';
import { MachinesPage } from './pages/MachinesPage';
import { ProductionContextPage } from './pages/ProductionContextPage';
import { BatchesPage } from './pages/BatchesPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { RootCausePage } from './pages/RootCausePage';
import { RiskMonitorPage } from './pages/RiskMonitorPage';
import { DefectAnalyticsPage } from './pages/DefectAnalyticsPage';
import { ActiveAlertsPage } from './pages/ActiveAlertsPage';
import { CorrectiveActionsPage } from './pages/CorrectiveActionsPage';
import { ReinspectionPage } from './pages/ReinspectionPage';
import { ProductTraceabilityPage } from './pages/ProductTraceabilityPage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const getInitialTab = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/mobile-inspection') {
      return 'mobile-inspection';
    }
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<string>(getInitialTab);
  const [navParams, setNavParams] = useState<any>({});

  React.useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/mobile-inspection') {
        setCurrentTab('mobile-inspection');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (tabId: string, params?: any) => {
    setCurrentTab(tabId);
    if (params) {
      setNavParams(params);
    }
  };

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <CommandCenter onNavigate={handleNavigate} />;
      case 'mobile-inspection':
        return <MobileInspection onNavigate={handleNavigate} />;
      case 'new-inspection':
        return <NewInspection onNavigate={handleNavigate} />;
      case 'inspection-details':
        return <InspectionDetails inspectionId={navParams?.id} onNavigate={handleNavigate} />;
      case 'inspection-history':
        return <InspectionHistory onNavigate={handleNavigate} />;
      case 'machines':
        return <MachinesPage />;
      case 'production-context':
        return <ProductionContextPage />;
      case 'batches':
        return <BatchesPage />;
      case 'shifts':
        return <ShiftsPage />;
      case 'root-cause':
        return <RootCausePage inspectionId={navParams?.inspectionId} onNavigate={handleNavigate} />;
      case 'risk-monitor':
        return <RiskMonitorPage onNavigate={handleNavigate} />;
      case 'analytics':
        return <DefectAnalyticsPage onNavigate={handleNavigate} />;
      case 'alerts':
        return <ActiveAlertsPage onNavigate={handleNavigate} />;
      case 'corrective-actions':
        return <CorrectiveActionsPage inspectionId={navParams?.inspectionId} onNavigate={handleNavigate} />;
      case 'reinspection':
        return <ReinspectionPage inspectionId={navParams?.inspectionId} actionId={navParams?.actionId} onNavigate={handleNavigate} />;
      case 'product-traceability':
        return <ProductTraceabilityPage onNavigate={handleNavigate} />;
      case 'system-status':
        return <SystemStatusPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <CommandCenter onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppShell currentTab={currentTab} onSelectTab={handleNavigate}>
      {renderActiveTab()}
    </AppShell>
  );
};

export default App;
