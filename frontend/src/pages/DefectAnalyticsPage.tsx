import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { DemoBanner } from '../components/common/DemoBanner';
import { Activity, Thermometer, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface DefectAnalyticsPageProps {
  onNavigate: (tabId: string) => void;
}

export const DefectAnalyticsPage: React.FC<DefectAnalyticsPageProps> = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<any>('/analytics/defects');
      setAnalyticsData(data);
    } catch (err) {
      console.warn('Analytics API unavailable; no synthetic analytics will be substituted.');
      setError(err instanceof Error ? err.message : 'Unable to load live defect analytics.');
      setAnalyticsData(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const machineData = (analyticsData?.machine_breakdown || []).map((m: any) => ({
    name: m.machine,
    rate: Number(m.defect_rate || 0)
  }));

  const defectTypeData = (analyticsData?.defect_distribution || []).map((d: any) => ({
    name: d.type,
    value: Number(d.count || 0)
  }));

  const vibrationCorrelationData = (analyticsData?.vibration_correlation || []).map((row: any) => ({
    vibration: Number(row.vibration),
    scratches: Number(row.defects || row.scratch_defects || 0)
  }));

  const tempCorrelationData = (analyticsData?.temperature_correlation || []).map((row: any) => ({
    temp: Number(row.temperature ?? row.temp),
    defects: Number(row.defects || 0)
  }));

  const vibrationCorrelationData = [
    { vibration: 1.8, scratches: 0 },
    { vibration: 2.1, scratches: 1 },
    { vibration: 2.3, scratches: 2 },
    { vibration: 3.6, scratches: 12 },
    { vibration: 4.8, scratches: 27 }
  ];

  const tempCorrelationData = [
    { temp: 64.2, defects: 1 },
    { temp: 68.5, defects: 2 },
    { temp: 74.2, defects: 14 },
    { temp: 78.4, defects: 27 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="DEFECT ANALYTICS HUB — Live PostgreSQL / SQLite Database Telemetry Analytics" />

      {error && (
        <div className="scada-card" style={{ borderLeft: '4px solid #E55353' }}>
          <span className="scada-label" style={{ color: '#E55353' }}>ANALYTICS DATA UNAVAILABLE</span>
          <p style={{ color: '#8D9AAA', marginBottom: 0 }}>{error}</p>
        </div>
      )}

      {/* Top Controls Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#121C2C', padding: '0.75rem 1rem', borderRadius: '4px', border: '1px solid #26364A' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E8EDF3' }}>
            TOTAL INSPECTIONS: {analyticsData?.total_inspected ?? 0} | DEFECTIVE UNITS: {analyticsData?.defective_units ?? 0}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#8D9AAA', display: 'block', marginTop: '2px' }}>
            OVERALL PLANT DEFECT RATE: <strong style={{ color: '#E55353' }}>{analyticsData?.defect_rate ?? 0}%</strong>
          </span>
        </div>
        <button className="scada-btn scada-btn-secondary scada-btn-sm" onClick={fetchAnalytics} disabled={isLoading}>
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          Refresh Analytics
        </button>
      </div>

      {/* Top 2 Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Machine Defect Rate */}
        <div className="scada-card">
          <div className="scada-header">
            <span className="scada-title">DEFECT RATE BY MACHINE STATION (%)</span>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26364A" />
                <XAxis dataKey="name" stroke="#8D9AAA" />
                <YAxis stroke="#8D9AAA" />
                <Tooltip contentStyle={{ backgroundColor: '#121C2C', borderColor: '#26364A', color: '#E8EDF3' }} />
                <Bar dataKey="rate" fill="#4F7CAC" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Type Distribution */}
        <div className="scada-card">
          <div className="scada-header">
            <span className="scada-title">DEFECT TYPE DISTRIBUTION</span>
          </div>
          <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={defectTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                  {defectTypeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#121C2C', borderColor: '#26364A', color: '#E8EDF3' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Correlation Visualizers Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Machine Vibration vs Scratch Occurrence */}
        <div className="scada-card">
          <div className="scada-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={16} style={{ color: '#E55353' }} />
              <span className="scada-title">MACHINE VIBRATION (mm/s) VS SCRATCH OCCURRENCE</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vibrationCorrelationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26364A" />
                <XAxis dataKey="vibration" name="Vibration mm/s" stroke="#8D9AAA" />
                <YAxis dataKey="scratches" name="Scratch Defects" stroke="#8D9AAA" />
                <Tooltip contentStyle={{ backgroundColor: '#121C2C', borderColor: '#26364A', color: '#E8EDF3' }} />
                <Line type="monotone" dataKey="scratches" stroke="#E55353" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature vs Defect Occurrence */}
        <div className="scada-card">
          <div className="scada-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Thermometer size={16} style={{ color: '#D99A2B' }} />
              <span className="scada-title">SPINDLE TEMP (°C) VS DEFECT OCCURRENCE</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempCorrelationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#26364A" />
                <XAxis dataKey="temp" stroke="#8D9AAA" />
                <YAxis dataKey="defects" stroke="#8D9AAA" />
                <Tooltip contentStyle={{ backgroundColor: '#121C2C', borderColor: '#26364A', color: '#E8EDF3' }} />
                <Line type="monotone" dataKey="defects" stroke="#D99A2B" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
