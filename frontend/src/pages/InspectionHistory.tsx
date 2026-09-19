import React, { useState, useEffect } from 'react';
import { inspectionService } from '../services/inspectionService';
import type { Inspection } from '../types';
import { Badge } from '../components/common/Badge';
import { DemoBanner } from '../components/common/DemoBanner';
import { Search, Eye, History, RefreshCw, ShieldCheck } from 'lucide-react';

interface InspectionHistoryProps {
  onNavigate: (tabId: string, params?: any) => void;
}

export const InspectionHistory: React.FC<InspectionHistoryProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'reinspections'>('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [machineFilter, setMachineFilter] = useState('ALL');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [reinspections, setReinspections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await inspectionService.getAllInspectionsAsync();
      setInspections([...data]);

      const reinspData = await inspectionService.getReinspectionsAsync();
      setReinspections(reinspData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredInspections = inspections.filter((insp) => {
    const matchesSearch =
      insp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (insp.productId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (insp.batchId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || insp.status === statusFilter;
    const matchesMachine = machineFilter === 'ALL' || insp.machineId === machineFilter;

    return matchesSearch && matchesStatus && matchesMachine;
  });

  const filteredReinspections = reinspections.filter((re) => {
    const matchesSearch =
      re.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (re.original_inspection_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (re.corrective_action_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMachine = machineFilter === 'ALL' || re.machine_id === machineFilter;
    return matchesSearch && matchesMachine;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <DemoBanner message="INSPECTION & REINSPECTION ARCHIVE — Traceable Closed-Loop Audit Trail (SI-03)" />

      <div className="scada-card">
        <div className="scada-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History className="w-4 h-4 text-system-blue" />
            <span className="scada-title">QUALITY AUDIT & REINSPECTION ARCHIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="font-mono text-xs text-text-secondary">
              SHOWING {activeTab === 'standard' ? filteredInspections.length : filteredReinspections.length} RECORDS
            </span>
            <button
              className="scada-btn scada-btn-secondary scada-btn-sm"
              onClick={fetchHistory}
              disabled={isLoading}
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              Refresh Archive
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #26364A', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('standard')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === 'standard' ? '#162235' : 'transparent',
              border: '1px solid',
              borderColor: activeTab === 'standard' ? '#4F7CAC' : 'transparent',
              borderRadius: '4px',
              color: activeTab === 'standard' ? '#E8EDF3' : '#8D9AAA',
              fontWeight: activeTab === 'standard' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Production Inspections ({inspections.length})
          </button>
          <button
            onClick={() => setActiveTab('reinspections')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: activeTab === 'reinspections' ? '#162235' : 'transparent',
              border: '1px solid',
              borderColor: activeTab === 'reinspections' ? '#22A06B' : 'transparent',
              borderRadius: '4px',
              color: activeTab === 'reinspections' ? '#22A06B' : '#8D9AAA',
              fontWeight: activeTab === 'reinspections' ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ShieldCheck size={14} />
            Reinspection Records (Closed-Loop) ({reinspections.length})
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="scada-input"
              placeholder={activeTab === 'standard' ? "Search by Inspection ID, Product SKU, or Batch..." : "Search by Reinspection ID, Original Inspection, or Action..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.2rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8D9AAA' }} />
          </div>

          <select className="scada-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses (Pass & Defective)</option>
            <option value="DEFECTIVE">Defective Only</option>
            <option value="PASS">Pass Only</option>
            <option value="NOT_ANALYZABLE">Not Analyzable</option>
          </select>

          <select className="scada-select" value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)}>
            <option value="ALL">All Machine Stations</option>
            <option value="M01">M01</option>
            <option value="M02">M02</option>
            <option value="M03">M03</option>
            <option value="M04">M04</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="scada-table-wrapper">
          {activeTab === 'standard' ? (
            <table className="scada-table">
              <thead>
                <tr>
                  <th>Inspection ID</th>
                  <th>Product ID</th>
                  <th>Batch</th>
                  <th>Machine</th>
                  <th>Status</th>
                  <th>Defect Type</th>
                  <th>Severity</th>
                  <th>Score</th>
                  <th>Timestamp</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map((insp) => (
                  <tr key={insp.id}>
                    <td className="font-mono" style={{ color: '#4F7CAC', fontWeight: 600 }}>
                      {insp.id}
                    </td>
                    <td className="font-mono">{insp.productId}</td>
                    <td className="font-mono">{insp.batchId}</td>
                    <td className="font-mono">{insp.machineId}</td>
                    <td>
                      <Badge status={insp.status} />
                    </td>
                    <td style={{ color: insp.status === 'DEFECTIVE' ? '#E55353' : '#22A06B', fontWeight: 600 }}>
                      {insp.defects[0]?.type || 'Normal'}
                    </td>
                    <td>
                      {insp.defects[0] ? <Badge status={insp.defects[0].severity} showDot={false} /> : <span style={{ color: '#5C6B7E' }}>—</span>}
                    </td>
                    <td className="font-mono">
                      {insp.defects[0] ? `${insp.defects[0].confidence}%` : 'N/A'}
                    </td>
                    <td className="font-mono" style={{ color: '#8D9AAA' }}>
                      {insp.timestamp}
                    </td>
                    <td>
                      <button
                        className="scada-btn scada-btn-secondary scada-btn-sm"
                        onClick={() => onNavigate('inspection-details', { id: insp.id })}
                      >
                        <Eye size={12} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="scada-table">
              <thead>
                <tr>
                  <th>Reinspection ID</th>
                  <th>Original Inspection</th>
                  <th>Corrective Action</th>
                  <th>Product</th>
                  <th>Machine</th>
                  <th>Defect Before</th>
                  <th>Result After</th>
                  <th>Timestamp</th>
                  <th>Verification</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReinspections.map((re) => (
                  <tr key={re.id}>
                    <td className="font-mono" style={{ color: '#22A06B', fontWeight: 600 }}>
                      {re.id}
                    </td>
                    <td className="font-mono" style={{ color: '#4F7CAC' }}>
                      {re.original_inspection_id}
                    </td>
                    <td className="font-mono" style={{ color: '#E8EDF3' }}>
                      {re.corrective_action_id || '—'}
                    </td>
                    <td className="font-mono">{re.product_id || 'P1042-087'}</td>
                    <td className="font-mono">{re.machine_id || 'M03'}</td>
                    <td style={{ color: '#E55353', fontWeight: 600 }}>
                      {re.before_condition?.defect || 'Scratch'}
                    </td>
                    <td>
                      <Badge status={re.status === 'PASSED' ? 'PASSED' : 'DEFECTIVE'} />
                    </td>
                    <td className="font-mono" style={{ color: '#8D9AAA' }}>
                      {re.reinspection_time ? re.reinspection_time.replace('T', ' ').substring(0, 19) : '2026-09-18'}
                    </td>
                    <td>
                      <Badge status={re.verification_status || 'VERIFIED'} />
                    </td>
                    <td>
                      <button
                        className="scada-btn scada-btn-secondary scada-btn-sm"
                        onClick={() => onNavigate('reinspection', {
                          actionId: re.corrective_action_id,
                          inspectionId: re.original_inspection_id
                        })}
                      >
                        <Eye size={12} />
                        Open Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
