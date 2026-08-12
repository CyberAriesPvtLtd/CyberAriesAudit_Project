import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, XCircle, Shield, ArrowRight } from 'lucide-react';
import ExcelTable from '../components/ExcelTable';
import { useAuth } from '../context/AuthContext';

const EvidenceReview = () => {
  const { selectedClient, selectedAudit, activeAuditData, updateEvidenceStatus } = useAuth();

  const evidenceItems = activeAuditData.evidence || [];

  // KPI Calculations
  const totalFiles = evidenceItems.length;
  const pendingCount = evidenceItems.filter(e => e.status === 'Pending Review' || e.status === 'Under AI Analysis').length;
  const approvedCount = evidenceItems.filter(e => e.status === 'Approved').length;
  const rejectedCount = evidenceItems.filter(e => e.status === 'Rejected').length;

  const columns = [
    {
      header: 'File Name',
      accessor: 'fileName',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 550 }}>
          <FileText size={16} style={{ color: 'var(--text-secondary)' }} />
          <span>{row.fileName}</span>
        </div>
      )
    },
    { header: 'Client Name', accessor: 'client' },
    {
      header: 'Control ID',
      accessor: 'controlId',
      cell: (row) => (
        <code style={{ fontSize: '12px', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
          {row.controlId}
        </code>
      )
    },
    { header: 'Control Name', accessor: 'controlName' },
    { header: 'Upload Date', accessor: 'date' },
    { header: 'Status', accessor: 'status', isStatus: true },
    {
      header: 'Review Actions',
      accessor: 'action',
      sortable: false,
      cell: (row) => (
        <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn btn-outline" 
            style={{ padding: '4px 8px', fontSize: '11px', borderColor: '#10B981', color: '#137333' }}
            onClick={() => updateEvidenceStatus(row.id, 'Approved')}
            disabled={row.status === 'Approved'}
          >
            Approve
          </button>
          <button 
            className="btn btn-outline" 
            style={{ padding: '4px 8px', fontSize: '11px', borderColor: '#C5221F', color: '#C5221F' }}
            onClick={() => updateEvidenceStatus(row.id, 'Rejected')}
            disabled={row.status === 'Rejected'}
          >
            Reject
          </button>
        </div>
      )
    }
  ];

  const filterOptions = [
    { label: 'Status', key: 'status', options: ['Pending Review', 'Under AI Analysis', 'Approved', 'Rejected'] }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Evidence Review : {selectedClient}</h1>
          <p className="page-subtitle">Examine and approve evidence files submitted for {selectedAudit} control verification.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid var(--text-muted)' }}>
          <div className="metric-content">
            <span className="metric-label">Total Evidence Files</span>
            <span className="metric-value">{totalFiles}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
            <FileText size={24} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #B06000' }}>
          <div className="metric-content">
            <span className="metric-label">Pending Review</span>
            <span className="metric-value">{pendingCount}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#FEF7E0', color: '#B06000' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #137333' }}>
          <div className="metric-content">
            <span className="metric-label">Approved Files</span>
            <span className="metric-value">{approvedCount}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#E6F4EA', color: '#137333' }}>
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #C5221F' }}>
          <div className="metric-content">
            <span className="metric-label">Rejected Files</span>
            <span className="metric-value">{rejectedCount}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#FCE8E6', color: '#C5221F' }}>
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* ExcelTable Upgrade */}
      <ExcelTable 
        columns={columns}
        data={evidenceItems}
        searchPlaceholder="Search evidence..."
        searchKeys={['fileName', 'client', 'controlName', 'controlId', 'status']}
        filterOptions={filterOptions}
        tableName="Evidence_Review"
      />
    </div>
  );
};

export default EvidenceReview;
