import React from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Users, ShieldAlert, FileText, ClipboardList, Activity, ArrowRight, UploadCloud } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const { companies, clients, auditors, audits, rulebook, activities } = useApp();
  const navigate = useNavigate();

  const totalClients = clients.length;
  const uniqueFrameworks = 9;
  const totalAssignedAudits = audits.length;
  const activeAuditorsCount = auditors.filter(a => a.status === 'Active').length;

  // Filter lists for dashboard summary
  const recentAudits = audits.slice(0, 3);
  const pendingAudits = audits.filter(a => a.status === 'Pending Review').slice(0, 3);
  const recentClients = clients.slice(0, 3);
  const recentLogs = activities.slice(0, 5);

  const mockDocuments = [
    { name: 'CSCRF_Protect_System_Description_v2.pdf', size: '2.4 MB', uploadedBy: 'Sarah Connor', date: '2026-07-09' },
    { name: 'CSCRF_Govern_Statement_Of_Applicability.xlsx', size: '412 KB', uploadedBy: 'Christian Wolff', date: '2026-07-08' },
    { name: 'CSCRF_Risk_Assessment_Report_2026.pdf', size: '5.1 MB', uploadedBy: 'Jane Goodall', date: '2026-07-05' },
    { name: 'CSCRF_Access_Control_Policy_Signed.pdf', size: '890 KB', uploadedBy: 'Admin User', date: '2026-07-02' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Platform overview, active compliance statuses, and auditor telemetry.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/system-activity')}>
            <Activity size={16} /> View Activity Logs
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/audit-management')}>
            + Create New Audit
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid #1E293B' }}>
          <div className="metric-content">
            <span className="metric-label">Total Clients</span>
            <span className="metric-value">{totalClients}</span>
          </div>
          <div className="metric-icon-wrapper">
            <Users size={24} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="metric-content">
            <span className="metric-label">Total Audits</span>
            <span className="metric-value">{uniqueFrameworks}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Building2 size={24} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #1A73E8' }}>
          <div className="metric-content">
            <span className="metric-label">Total Assigned Audits</span>
            <span className="metric-value">{totalAssignedAudits}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#E8F0FE', color: '#1A73E8' }}>
            <ClipboardList size={24} />
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #10B981' }}>
          <div className="metric-content">
            <span className="metric-label">Active Auditors</span>
            <span className="metric-value">{activeAuditorsCount}</span>
          </div>
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#E6F4EA', color: '#137333' }}>
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Tables & Updates */}
        <div>
          {/* Section: Recent Audits */}
          <div className="dashboard-section-card">
            <div className="section-header">
              <span className="section-title">Recent Audits in Progress</span>
              <Link to="/audit-management" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                Manage Audits <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ padding: '0px' }}>
              <table className="excel-table" style={{ border: 'none', borderRadius: '0' }}>
                <thead>
                  <tr style={{ background: 'transparent' }}>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>ID</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Company</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Auditor</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Framework</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Progress</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudits.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: '600' }}>{a.id}</td>
                      <td>{a.company}</td>
                      <td>{a.auditor}</td>
                      <td>{a.rulebook}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flexGrow: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', width: '80px', overflow: 'hidden' }}>
                            <div style={{ width: `${a.progress}%`, height: '100%', backgroundColor: a.progress === 100 ? '#10B981' : 'var(--primary)' }}></div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '600' }}>{a.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${a.status === 'Completed' ? 'badge-completed' : a.status === 'Pending Review' ? 'badge-pending' : 'badge-in_progress'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Pending Audits / Reviews */}
          <div className="dashboard-section-card">
            <div className="section-header">
              <span className="section-title">Awaiting Auditor Review</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>High Priority Actions</span>
            </div>
            <div>
              <table className="excel-table">
                <thead>
                  <tr style={{ background: 'transparent' }}>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>ID</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Auditor</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Target Domain</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Due Date</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAudits.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No items pending review currently.</td>
                    </tr>
                  ) : (
                    pendingAudits.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: '600' }}>{a.id}</td>
                        <td>{a.auditor}</td>
                        <td>{a.rulebook}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: '500' }}>{a.dueDate}</td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => navigate('/audit-management')}>
                            Review Evidence
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Recent Client Updates */}
          <div className="dashboard-section-card">
            <div className="section-header">
              <span className="section-title">Recent Client Contact Updates</span>
              <Link to="/clients" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                All Clients <ArrowRight size={14} />
              </Link>
            </div>
            <div>
              <table className="excel-table">
                <thead>
                  <tr style={{ background: 'transparent' }}>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Name</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Company</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Phase</th>
                    <th style={{ borderBottom: '1px solid var(--border-color)' }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClients.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '500' }}>{c.name}</td>
                      <td>{c.company}</td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.auditPhase}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Documents, Activity Timeline */}
        <div>
          {/* Section: Recent Uploads */}
          <div className="dashboard-section-card">
            <div className="section-header">
              <span className="section-title">Recent Uploaded Documents</span>
              <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => alert('Drag and drop files to start secure compliance upload')}>
                <UploadCloud size={14} /> Upload
              </button>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {mockDocuments.map((doc, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: idx < mockDocuments.length - 1 ? '1px solid #F1F5F9' : 'none', paddingBottom: '10px' }}>
                    <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: '6px' }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.uploadedBy}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert(`Downloading: ${doc.name}`)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
                    >
                      Retrieve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section: System Activity Feed */}
          <div className="dashboard-section-card">
            <div className="section-header">
              <span className="section-title">System Activity Timeline</span>
              <Link to="/system-activity" style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                View Logs
              </Link>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div className="timeline-list">
                {recentLogs.map((log) => (
                  <div key={log.id} className={`timeline-item ${log.type.toLowerCase()}`}>
                    <span className="timeline-marker"></span>
                    <div className="timeline-content">
                      <span className="timeline-message">{log.message}</span>
                      <div className="timeline-meta">
                        <span className="timeline-time">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span>•</span>
                        <span className="timeline-user">{log.user}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compliance Alerts Panel */}
          <div className="dashboard-section-card" style={{ borderLeft: '4px solid var(--primary)', backgroundColor: 'var(--primary-light)' }}>
            <div style={{ padding: '16px 20px' }}>
              <h4 style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} /> Compliance Operations Warning
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                Quantum Retail (COM-005) is currently marked <span style={{ fontWeight: '700' }}>Non-Compliant</span> due to CSCRF assessment delays. Action is required within 3 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
