import React, { useState } from 'react';
import { FileText, Download, CheckCircle, RefreshCw, Send, Trash2 } from 'lucide-react';
import ExcelTable from '../components/ExcelTable';
import { useAuth } from '../context/AuthContext';

const DraftReports = () => {
  const { selectedClient, selectedAudit, activeAuditData } = useAuth();
  
  const [reports, setReports] = useState(() => activeAuditData.reports || []);

  // Update report state if activeAuditData.reports changes
  React.useEffect(() => {
    setReports(activeAuditData.reports || []);
  }, [activeAuditData.reports]);

  const handleGenerateDraft = () => {
    const newDraft = {
      id: String(Date.now()),
      name: `${selectedAudit} Final Audit Report (Draft v${reports.length + 1}).pdf`,
      period: 'FY 2025-26',
      status: 'Draft',
      date: new Date().toISOString().split('T')[0]
    };
    setReports(prev => [newDraft, ...prev]);
  };

  const handlePublishReport = (id) => {
    setReports(prev => prev.map(rep => {
      if (rep.id === id) {
        return { ...rep, status: 'Approved' };
      }
      return rep;
    }));
  };

  const handleDeleteReport = (id) => {
    setReports(prev => prev.filter(rep => rep.id !== id));
  };

  const columns = [
    {
      header: 'Report Name',
      accessor: 'name',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 550 }}>
          <FileText size={16} style={{ color: 'var(--primary)' }} />
          <span>{row.name}</span>
        </div>
      )
    },
    { header: 'Audited Period', accessor: 'period' },
    { header: 'Generated Date', accessor: 'date' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`badge ${row.status === 'Approved' ? 'badge-completed' : 'badge-pending'}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      sortable: false,
      cell: (row) => (
        <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 8px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => alert(`Downloading: ${row.name}`)}
          >
            <Download size={12} /> Download
          </button>
          
          {row.status !== 'Approved' && (
            <button 
              className="btn btn-primary" 
              style={{ padding: '6px 8px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handlePublishReport(row.id)}
            >
              <Send size={12} /> Approve Report
            </button>
          )}

          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 8px', fontSize: '11.5px', color: 'var(--primary)' }}
            onClick={() => handleDeleteReport(row.id)}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Executive Draft Reports : {selectedClient}</h1>
          <p className="page-subtitle">Compile, generate, and sign off executive summaries for {selectedAudit}.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleGenerateDraft}>
            <RefreshCw size={16} /> Compile New Draft
          </button>
        </div>
      </div>

      <div className="excel-table-container">
        <ExcelTable 
          columns={columns}
          data={reports}
          searchPlaceholder="Search draft reports..."
          searchKeys={['name', 'period', 'status']}
          tableName="Draft_Reports"
        />
      </div>
    </div>
  );
};

export default DraftReports;
