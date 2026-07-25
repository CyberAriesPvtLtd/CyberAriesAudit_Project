import React from 'react';
import { Cpu, AlertTriangle, ShieldCheck, CheckCircle, Info } from 'lucide-react';
import ExcelTable from '../components/ExcelTable';
import { useAuth } from '../context/AuthContext';

const AIFindings = () => {
  const { selectedClient, selectedAudit, activeAuditData } = useAuth();

  const findingsList = activeAuditData.findings || [];

  // Metrics
  const totalFindings = findingsList.length;
  const highRiskCount = findingsList.filter(f => f.risk === 'High').length;
  const medRiskCount = findingsList.filter(f => f.risk === 'Medium').length;
  const openCount = findingsList.filter(f => f.status === 'Open').length;

  const columns = [
    {
      header: 'Control ID',
      accessor: 'controlId',
      cell: (row) => (
        <code style={{ fontSize: '12px', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
          {row.controlId}
        </code>
      )
    },
    { header: 'Control Name', accessor: 'controlName' },
    {
      header: 'AI Risk Rating',
      accessor: 'risk',
      cell: (row) => (
        <span 
          className={`badge ${
            row.risk === 'High' ? 'badge-action-required' : 
            row.risk === 'Medium' ? 'badge-pending' : 
            'badge-completed'
          }`}
          style={{ fontSize: '11px', fontWeight: '700' }}
        >
          {row.risk} Risk
        </span>
      )
    },
    {
      header: 'AI Finding Analysis / Details',
      accessor: 'message',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '4px 0' }}>
          <Cpu size={14} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{row.message}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`badge ${row.status === 'Open' ? 'badge-pending' : 'badge-completed'}`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">AI Copilot Findings : {selectedClient}</h1>
          <p className="page-subtitle">Inspect automatic security classification notes raised by AI scanning for {selectedAudit}.</p>
        </div>
      </div>

      {/* AI Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="metric-content">
            <span className="metric-label">AI Analyzed Findings</span>
            <span className="metric-value">{totalFindings}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Cpu size={24} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #C5221F' }}>
          <div className="metric-content">
            <span className="metric-label">High Risk Flaws</span>
            <span className="metric-value">{highRiskCount}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#FCE8E6', color: '#C5221F' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #B06000' }}>
          <div className="metric-content">
            <span className="metric-label">Medium Risk Alerts</span>
            <span className="metric-value">{medRiskCount}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#FEF7E0', color: '#B06000' }}>
            <Info size={24} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #137333' }}>
          <div className="metric-content">
            <span className="metric-label">Open Alerts</span>
            <span className="metric-value">{openCount}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#E6F4EA', color: '#137333' }}>
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* ExcelTable */}
      <ExcelTable 
        columns={columns}
        data={findingsList}
        searchPlaceholder="Search AI findings..."
        searchKeys={['controlId', 'controlName', 'risk', 'message', 'status']}
        tableName="AI_Findings"
      />
    </div>
  );
};

export default AIFindings;
