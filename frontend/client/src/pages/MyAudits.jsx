import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { Link } from 'react-router-dom';
import { Search, Eye, Clipboard, ArrowLeft, Calendar, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MyAudits() {
  const { controls, allControls, assignedAudits, currentAudit, switchAudit } = useClient();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'controls'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [filteredControls, setFilteredControls] = useState([]);

  useEffect(() => {
    let result = [...controls];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.id.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.standard.toLowerCase().includes(term)
      );
    }

    // Filter by domain
    if (selectedDomain !== 'All Domains') {
      result = result.filter(c => c.domain === selectedDomain);
    }

    // Filter by status
    if (selectedStatus !== 'All Statuses') {
      result = result.filter(c => c.status === selectedStatus);
    }

    setFilteredControls(result);
  }, [controls, searchTerm, selectedDomain, selectedStatus]);

  // Unique domains list for filter select
  const domainsList = ['All Domains', ...new Set(controls.map(c => c.domain))];
  const statusesList = ['All Statuses', 'Completed', 'In Progress', 'Action Required'];

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'badge badge-completed';
      case 'In Progress': return 'badge badge-in_progress';
      case 'Action Required': return 'badge badge-action-required';
      default: return 'badge';
    }
  };

  const getAuditStats = (auditName) => {
    const list = allControls[auditName] || [];
    const total = list.length;
    const completed = list.filter(c => c.status === 'Completed').length;
    const pct = total ? Math.round((completed / total) * 100) : 0;
    
    let status = 'Pending';
    if (pct === 100) status = 'Completed';
    else if (pct > 0) status = 'In Progress';
    
    let dueDate = '2026-08-15';
    if (auditName === 'ISO 27001') dueDate = '2026-09-15';
    else if (auditName === 'SEBI CSCRF') dueDate = '2026-06-10';
    else if (auditName === 'RBI Cyber Security') dueDate = '2026-10-30';
    
    return { total, completed, percentage: pct, status, dueDate };
  };

  const handleSelectAudit = (auditName) => {
    switchAudit(auditName);
    setViewMode('controls');
  };

  if (viewMode === 'list') {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-title-section">
            <h1 className="page-title">My Compliance Audits</h1>
            <p className="page-subtitle">Inspect requirements, progress metrics, and compliance framework statuses.</p>
          </div>
        </div>

        {/* Audits Card Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {assignedAudits.map(auditName => {
            const stats = getAuditStats(auditName);
            
            return (
              <div 
                key={auditName} 
                className="dashboard-section-card" 
                style={{ 
                  margin: 0,
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  minHeight: '220px',
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{auditName}</h3>
                      <span 
                        style={{ 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          textTransform: 'uppercase', 
                          color: 'var(--text-secondary)' 
                        }}
                      >
                        Framework Standards
                      </span>
                    </div>
                    <span 
                      className={`badge ${
                        stats.status === 'Completed' ? 'badge-completed' : 
                        stats.status === 'In Progress' ? 'badge-in_progress' : 
                        'badge-pending'
                      }`}
                    >
                      {stats.status}
                    </span>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <span>Audit Completion</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{stats.percentage}%</span>
                    </div>
                    <div className="progress-bar-track" style={{ height: '8px' }}>
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${stats.percentage}%`, 
                          height: '100%',
                          backgroundColor: stats.status === 'Completed' ? '#10B981' : 'var(--primary)'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} />
                      <span>Due: <strong>{stats.dueDate}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clipboard size={14} />
                      <span>Controls: <strong>{stats.total}</strong></span>
                    </div>
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}
                  onClick={() => handleSelectAudit(auditName)}
                >
                  <Eye size={16} /> View Audit
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft size={14} /> Back to My Audits
            </button>
          </div>
          <h1 className="page-title">{currentAudit} Controls Inventory</h1>
          <p className="page-subtitle">Inspect requirements, upload evidence files, and verify status for all controls under the current framework.</p>
        </div>
      </div>

      {/* Audit Switcher Row */}
      <div className="dashboard-section-card" style={{ padding: '16px 20px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
          Current Audit
        </span>
        <div style={{ position: 'relative', width: '320px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '14px' }}>
            {currentAudit.includes('SOC 2') ? '🔑' : currentAudit.includes('SEBI') ? '🛡️' : currentAudit.includes('ISO 27001') ? '📁' : '⚡'}
          </span>
          <select
            className="table-filter-select"
            style={{ 
              padding: '10px 24px 10px 34px', 
              fontSize: '13px', 
              fontWeight: '600', 
              width: '100%', 
              cursor: 'pointer', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
            value={currentAudit}
            onChange={(e) => switchAudit(e.target.value)}
          >
            {assignedAudits.map(audit => (
              <option key={audit} value={audit}>{audit}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Excel Table Container with Filters Toolbar */}
      <div className="excel-table-container">
        <div className="table-toolbar">
          <div className="toolbar-left">
            <div className="table-search-wrapper">
              <Search size={16} className="table-search-icon" />
              <input 
                type="text" 
                placeholder="Search by ID, name, reference..." 
                className="table-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter Domain */}
            <select 
              className="table-filter-select"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              {domainsList.map(dom => (
                <option key={dom} value={dom}>{dom}</option>
              ))}
            </select>

            {/* Filter Status */}
            <select 
              className="table-filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusesList.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          
          <div className="toolbar-right">
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing {filteredControls.length} of {controls.length} Controls
            </span>
          </div>
        </div>

        {/* Table layout */}
        <div className="table-scrollable">
          <table className="excel-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Control ID</th>
                <th>Control Name</th>
                <th>Security Domain</th>
                <th>Standard Reference</th>
                <th>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredControls.map((ctrl) => (
                <tr key={ctrl.id}>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{ctrl.id}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{ctrl.name}</td>
                  <td>{ctrl.domain}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {ctrl.standard}
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(ctrl.status)}>
                      {ctrl.status}
                    </span>
                  </td>
                  <td>
                    <Link 
                      to={`/control-details?id=${ctrl.id}`}
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={14} /> View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredControls.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No controls match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
