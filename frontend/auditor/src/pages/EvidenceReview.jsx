import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, XCircle, Shield, ArrowRight, Save, ExternalLink, X } from 'lucide-react';
import ExcelTable from '../components/ExcelTable';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const NotesCell = ({ row }) => {
  const [notes, setNotes] = useState(row.auditor_notes || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.stopPropagation();
    setSaving(true);
    try {
      await api.updateEvidenceNotes(row.id, notes);
    } catch (error) {
      console.error("Failed to save notes", error);
    }
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: '150px', height: '30px', fontSize: '11px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', resize: 'vertical' }}
        placeholder="Add notes..."
      />
      <button
        className="btn btn-primary"
        style={{ padding: '4px 8px', fontSize: '11px', minWidth: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={handleSave}
        disabled={saving}
      >
        <Save size={14} />
      </button>
    </div>
  );
};

const EvidenceReview = () => {
  const { selectedClient, selectedAudit, activeAuditData, updateEvidenceStatus } = useAuth();

  // Preview modal state — null when closed, { url, fileName } when open
  const [previewState, setPreviewState] = useState(null);
  // Description modal state — null when closed, string when open
  const [descModal, setDescModal] = useState(null);

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
      header: 'Framework Code',
      accessor: 'controlId',
      cell: (row) => (
        <code style={{ fontSize: '12px', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
          {row.controlId}
        </code>
      )
    },
    { 
      header: 'Description', 
      accessor: 'controlDesc',
      cell: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDescModal(row.controlDesc); }}
          className="btn btn-outline"
          style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
        >
          <FileText size={14} style={{ marginRight: '4px' }} />
          View Desc
        </button>
      )
    },
    { header: 'Upload Date', accessor: 'date' },
    { header: 'Status', accessor: 'status', isStatus: true },
    {
      header: 'Reviewed At',
      accessor: 'reviewed_at',
      cell: (row) => row.reviewed_at ? <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{row.reviewed_at}</span> : '-'
    },
    {
      header: 'Auditor Notes',
      accessor: 'auditor_notes',
      sortable: false,
      cell: (row) => <NotesCell row={row} />
    },
    {
      header: 'Review Actions',
      accessor: 'action',
      sortable: false,
      cell: (row) => {
        const handlePreview = async (e) => {
          e.stopPropagation();
          try {
            const data = await api.getEvidenceDownloadUrl(row.id);
            if (data.download_url) {
              // Open in-page preview modal instead of navigating away.
              // window.open() after async/await loses the user gesture trust,
              // is blocked as a popup, and falls back to navigating the current tab.
              setPreviewState({ url: data.download_url, fileName: data.file_name || row.fileName });
            }
          } catch (err) {
            console.error("Failed to get preview URL", err);
          }
        };

        return (
          <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
              onClick={handlePreview}
            >
              <ExternalLink size={14} style={{ marginRight: '4px' }} />
              Preview
            </button>
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
        );
      }
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
        searchKeys={['fileName', 'client', 'controlId', 'controlDesc', 'status']}
        filterOptions={filterOptions}
        tableName="Evidence_Review"
      />

      {/* Control Description Modal */}
      {descModal && (
        <div
          onClick={() => setDescModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card, #fff)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} />
              Control Description
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
              {descModal}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => setDescModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-page Evidence Preview Modal — avoids popup-block and page navigation */}
      {previewState && (
        <div
          onClick={() => setPreviewState(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card, #fff)',
              borderRadius: '12px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
              width: '80vw', height: '80vh',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-hover)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {previewState.fileName}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Fallback: open raw URL via anchor — anchor clicks are never popup-blocked */}
                <a
                  href={previewState.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                >
                  <ExternalLink size={13} /> Open in new tab
                </a>
                <button
                  onClick={() => setPreviewState(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* File content rendered in iframe — stays within the Auditor app */}
            <iframe
              src={previewState.url}
              title={previewState.fileName}
              style={{ flex: 1, border: 'none', width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceReview;
