import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Eye,
  X
} from 'lucide-react';
import ExcelTable from '../components/ExcelTable';
import { useAuth } from '../context/AuthContext';

// Helper for rendering Control Domain Badges
const renderDomainBadge = (domain) => {
  const dom = (domain || '').toUpperCase();
  let bg = '#E8F0FE';
  let color = '#1A73E8';
  let border = '#ADCEFE';

  if (dom.includes('GV') || dom.includes('GOVERN')) {
    bg = '#E8F0FE'; color = '#1A73E8'; border = '#ADCEFE';
  } else if (dom.includes('ID') || dom.includes('IDENTIFY')) {
    bg = '#E0F7FA'; color = '#00838F'; border = '#80DEEA';
  } else if (dom.includes('PR') || dom.includes('PROTECT')) {
    bg = '#E6F4EA'; color = '#137333'; border = '#A8DAB5';
  } else if (dom.includes('DE') || dom.includes('DETECT')) {
    bg = '#FEF7E0'; color = '#B06000'; border = '#FDE293';
  } else if (dom.includes('RS') || dom.includes('RESPOND')) {
    bg = '#FCE8E6'; color = '#C5221F'; border = '#FAD2CF';
  } else if (dom.includes('RC') || dom.includes('RECOVER')) {
    bg = '#F3E8FD'; color = '#7B1FA2'; border = '#E1BEE7';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '5px',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap'
      }}
    >
      {domain || 'General'}
    </span>
  );
};

// Helper for Compliance Status Badges
const renderComplianceBadge = (status) => {
  if (!status) {
    return (
      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Clock size={12} /> Pending Evaluation
      </span>
    );
  }

  let bg = '#F1F3F4';
  let color = '#5F6368';
  let border = '#DADCE0';

  if (status === 'Compliant') {
    bg = '#E6F4EA'; color = '#137333'; border = '#A8DAB5';
  } else if (status === 'Partially Compliant') {
    bg = '#FEF7E0'; color = '#B06000'; border = '#FDE293';
  } else if (status === 'Non-Compliant') {
    bg = '#FCE8E6'; color = '#C5221F'; border = '#FAD2CF';
  } else if (status === 'Not Applicable') {
    bg = '#F1F3F4'; color = '#5F6368'; border = '#DADCE0';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: '6px',
        fontSize: '11.5px',
        fontWeight: '600',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap'
      }}
    >
      {status === 'Compliant' && <CheckCircle size={12} style={{ marginRight: '4px' }} />}
      {status === 'Partially Compliant' && <AlertTriangle size={12} style={{ marginRight: '4px' }} />}
      {status === 'Non-Compliant' && <XCircle size={12} style={{ marginRight: '4px' }} />}
      {status}
    </span>
  );
};

// Helper for Risk Rating Badges
const renderRiskBadge = (risk) => {
  if (!risk) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>;

  let bg = '#EFF6FF';
  let color = '#1E40AF';
  let border = '#BFDBFE';

  if (risk === 'Critical') {
    bg = '#FEF2F2'; color = '#991B1B'; border = '#FECACA';
  } else if (risk === 'High') {
    bg = '#FFF1F2'; color = '#BE123C'; border = '#FECDD3';
  } else if (risk === 'Medium') {
    bg = '#FFFBEB'; color = '#B45309'; border = '#FDE68A';
  } else if (risk === 'Low') {
    bg = '#F0FDF4'; color = '#15803D'; border = '#BBF7D0';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '700',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}
    >
      {risk}
    </span>
  );
};

const EvidenceReview = () => {
  const {
    assignedClients,
    clientAuditsMapping,
    selectedClient,
    selectedAudit,
    switchClient,
    switchAudit,
    activeAuditData
  } = useAuth();

  const navigate = useNavigate();

  // Description modal state — null when closed, { title, description, testProcedure } when open
  const [descModal, setDescModal] = useState(null);

  const rawControls = activeAuditData.controls || [];
  const evidenceItems = activeAuditData.evidence || [];

  // Map controls for clean display in ExcelTable
  const mappedControls = useMemo(() => {
    return rawControls.map(ac => {
      const c = ac.control || {};
      const rules = c.framework_rules && c.framework_rules.length > 0
        ? c.framework_rules.join(', ')
        : (c.control_id || ac.control_id || 'CTRL');

      // Check linked evidence count from mapped evidence
      const linkedEvidence = evidenceItems.filter(ev => {
        const evCode = String(ev.controlId || '').toLowerCase();
        const ruleCode = String(rules).toLowerCase();
        const cId = String(c.control_id || '').toLowerCase();
        return evCode.includes(ruleCode) || ruleCode.includes(evCode) || (cId && evCode.includes(cId));
      });

      return {
        id: ac.id,
        auditControlId: ac.id,
        controlId: c.id || ac.control_id,
        ruleCode: rules,
        rulesList: c.framework_rules || [rules],
        description: c.control_desc || 'No description provided for this control.',
        domain: c.control_domain || 'General',
        systemEntity: c.system_entity || 'RE / IT',
        cia: c.cia_classification || 'C/I/A',
        testProcedure: c.test_procedure || 'Verify policy enforcement and configuration settings.',
        complianceStatus: ac.compliance_status || null,
        riskRating: ac.risk_rating || null,
        status: ac.status || 'Pending Review',
        evidenceCount: linkedEvidence.length,
        evidenceFiles: linkedEvidence
      };
    });
  }, [rawControls, evidenceItems]);

  // KPI Calculations
  const totalControls = mappedControls.length;
  const evaluatedControls = mappedControls.filter(c => c.complianceStatus && c.complianceStatus !== '').length;
  const compliantControls = mappedControls.filter(c => c.complianceStatus === 'Compliant').length;
  const pendingControls = totalControls - evaluatedControls;
  const totalFiles = evidenceItems.length;

  // ─── Table Columns: Assigned Controls Evaluation ─────────────────
  const controlColumns = [
    {
      header: 'Framework Code',
      accessor: 'ruleCode',
      sortable: true,
      width: '160px',
      cell: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {row.rulesList.map((r, i) => (
            <code
              key={i}
              style={{
                fontSize: '12px',
                padding: '3px 7px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontWeight: 700,
                backgroundColor: 'var(--bg-main)',
                color: 'var(--primary)',
                border: '1px solid var(--border-color)',
                display: 'inline-block'
              }}
            >
              {r}
            </code>
          ))}
        </div>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      sortable: false,
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span
            style={{
              fontSize: '12.5px',
              color: 'var(--text-primary)',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '380px'
            }}
            title={row.description}
          >
            {row.description}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDescModal({ title: row.ruleCode, description: row.description, testProcedure: row.testProcedure });
            }}
            className="btn btn-outline"
            style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}
            title="Read full control requirement"
          >
            <Eye size={13} /> View
          </button>
        </div>
      )
    },
    {
      header: 'Domain',
      accessor: 'domain',
      sortable: true,
      width: '120px',
      cell: (row) => renderDomainBadge(row.domain)
    },
    {
      header: 'System / Entity',
      accessor: 'systemEntity',
      sortable: true,
      width: '120px',
      cell: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {row.systemEntity}
        </span>
      )
    },
    {
      header: 'C/I/A',
      accessor: 'cia',
      sortable: true,
      width: '80px',
      cell: (row) => (
        <code style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '2px 5px', borderRadius: '4px', background: 'var(--bg-hover)' }}>
          {row.cia}
        </code>
      )
    },
    {
      header: 'Evidence Submitted',
      accessor: 'evidenceCount',
      sortable: true,
      width: '130px',
      cell: (row) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11.5px',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: '12px',
            backgroundColor: row.evidenceCount > 0 ? '#E8F0FE' : 'var(--bg-hover)',
            color: row.evidenceCount > 0 ? '#1A73E8' : 'var(--text-muted)'
          }}
        >
          <FileText size={12} />
          {row.evidenceCount} {row.evidenceCount === 1 ? 'file' : 'files'}
        </span>
      )
    },
    {
      header: 'Compliance Status',
      accessor: 'complianceStatus',
      sortable: true,
      width: '150px',
      cell: (row) => renderComplianceBadge(row.complianceStatus)
    },
    {
      header: 'Risk',
      accessor: 'riskRating',
      sortable: true,
      width: '90px',
      cell: (row) => renderRiskBadge(row.riskRating)
    },
    {
      header: 'Audit Action',
      accessor: 'action',
      sortable: false,
      width: '140px',
      cell: (row) => (
        <Link
          to={`/control-details/${encodeURIComponent(row.auditControlId)}`}
          className="btn btn-primary"
          style={{
            padding: '5px 12px',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <FileCheck size={14} /> Evaluate Control
        </Link>
      )
    }
  ];

  // Empty state if no assigned clients in database
  if (!selectedClient || assignedClients.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">Evidence Review & Controls Evaluation</h1>
            <p className="page-subtitle">Examine deliverables and record regulatory compliance assessments.</p>
          </div>
        </div>

        <div
          className="dashboard-section-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <Shield size={32} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            No Assigned Client Audits Found
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '460px', margin: 0 }}>
            There are currently no active audit frameworks assigned to your auditor profile in the database. When an administrator assigns audit controls to you, they will appear here.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/assigned-audits')} style={{ marginTop: '8px' }}>
            View Assigned Portfolios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ─── Page Header with Client & Audit Context ─────────────────── */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-title-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-active" style={{ fontSize: '12px' }}>
              {selectedClient}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
              {selectedAudit}
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 700 }}>
            Evidence Review & Control Evaluation
          </h1>
          <p className="page-subtitle">
            Manage your assigned controls, inspect client-submitted deliverables, and execute your compliance evaluations.
          </p>
        </div>

        {/* Client & Audit Workspace Switcher */}
        {assignedClients.length > 1 && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={selectedClient}
              onChange={(e) => switchClient(e.target.value)}
              className="form-control"
              style={{ fontSize: '13px', padding: '6px 12px', minWidth: '160px' }}
            >
              {assignedClients.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {clientAuditsMapping[selectedClient] && clientAuditsMapping[selectedClient].length > 1 && (
              <select
                value={selectedAudit}
                onChange={(e) => switchAudit(e.target.value)}
                className="form-control"
                style={{ fontSize: '13px', padding: '6px 12px', minWidth: '140px' }}
              >
                {clientAuditsMapping[selectedClient].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* ─── KPI Metrics Grid ─────────────────────────────────────────── */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="metric-content">
            <span className="metric-label">Assigned Controls</span>
            <span className="metric-value">{totalControls}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#E8F0FE', color: 'var(--primary)' }}>
            <ShieldCheck size={22} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #137333' }}>
          <div className="metric-content">
            <span className="metric-label">Controls Evaluated</span>
            <span className="metric-value">{evaluatedControls}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#E6F4EA', color: '#137333' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #B06000' }}>
          <div className="metric-content">
            <span className="metric-label">Pending Evaluation</span>
            <span className="metric-value">{pendingControls}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#FEF7E0', color: '#B06000' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #1A73E8' }}>
          <div className="metric-content">
            <span className="metric-label">Evidence Files Attached</span>
            <span className="metric-value">{totalFiles}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#E8F0FE', color: '#1A73E8' }}>
            <FileText size={22} />
          </div>
        </div>
      </div>

      {/* ─── Assigned Controls Evaluation Table ────────────────── */}
      <div>
        {totalControls === 0 ? (
          <div
            className="dashboard-section-card"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <ShieldCheck size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              No Controls Assigned for this Framework
            </h3>
            <p style={{ fontSize: '13px', margin: 0 }}>
              No audit controls are currently allocated to you for {selectedAudit}. Check the Assigned Audits section or switch client projects.
            </p>
          </div>
        ) : (
          <ExcelTable
            columns={controlColumns}
            data={mappedControls}
            searchPlaceholder="Search assigned controls by code, description, or domain..."
            searchKeys={['ruleCode', 'description', 'domain', 'systemEntity', 'complianceStatus', 'riskRating']}
            filterOptions={[
              { label: 'Domain', key: 'domain', options: ['Governance', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'] },
              { label: 'Compliance Status', key: 'complianceStatus', options: ['Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Applicable'] },
              { label: 'Risk Rating', key: 'riskRating', options: ['Critical', 'High', 'Medium', 'Low'] }
            ]}
            tableName={`Assigned_Controls_${selectedClient}_${selectedAudit}`}
          />
        )}
      </div>

      {/* ─── Control Description & Test Procedure Modal ──────────────── */}
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
              maxWidth: '560px',
              width: '90%',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-active" style={{ fontSize: '12px', marginBottom: '6px' }}>
                  {descModal.title || 'Control Details'}
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', color: 'var(--text-primary)' }}>
                  Requirement Specification
                </h3>
              </div>
              <button
                onClick={() => setDescModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Control Description
              </label>
              <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6', margin: 0, backgroundColor: 'var(--bg-hover)', padding: '12px', borderRadius: '6px' }}>
                {descModal.description}
              </p>
            </div>

            {descModal.testProcedure && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Test Procedure / Verification Guidance
                </label>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, backgroundColor: 'var(--bg-hover)', padding: '12px', borderRadius: '6px' }}>
                  {descModal.testProcedure}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setDescModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceReview;
