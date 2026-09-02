import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { Link, useLocation } from 'react-router-dom';
import { Search, Eye, Clipboard, ArrowLeft, Calendar, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MyAudits() {
  const { controls, allControls, assignedAudits, clientAudits, currentAudit, switchAudit } = useClient();
  const location = useLocation();
  const [viewMode, setViewMode] = useState(location.state?.viewMode || 'list'); // 'list' or 'controls'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All Subcategories');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [filteredControls, setFilteredControls] = useState([]);

  useEffect(() => {
    setViewMode(location.state?.viewMode || 'list');
  }, [location.key, location.state]);

  useEffect(() => {
    let result = [...controls];

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        (c.id && c.id.toLowerCase().includes(term)) ||
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.description && c.description.toLowerCase().includes(term)) ||
        (c.standard && c.standard.toLowerCase().includes(term)) ||
        (c.controlCode && c.controlCode.toLowerCase().includes(term))
      );
    }

    // Filter by domain
    if (selectedDomain !== 'All Domains') {
      result = result.filter(c => c.domain === selectedDomain);
    }

    // Filter by category
    if (selectedCategory !== 'All Categories') {
      result = result.filter(c => c.frameworkCategory === selectedCategory);
    }

    // Filter by subcategory
    if (selectedSubcategory !== 'All Subcategories') {
      result = result.filter(c => c.frameworkSubcategory === selectedSubcategory);
    }

    // Filter by status
    if (selectedStatus !== 'All Statuses') {
      result = result.filter(c => c.status === selectedStatus);
    }

    setFilteredControls(result);
  }, [controls, searchTerm, selectedDomain, selectedCategory, selectedSubcategory, selectedStatus]);

  // Unique domains list for filter select
  const domainsList = ['All Domains', ...new Set(controls.map(c => c.domain).filter(Boolean))];
  const categoriesList = ['All Categories', ...new Set(controls.map(c => c.frameworkCategory).filter(Boolean))];
  const subcategoriesList = ['All Subcategories', ...new Set(controls.map(c => c.frameworkSubcategory).filter(Boolean))];
  const statusesList = ['All Statuses', 'Completed', 'In Progress', 'Action Required'];

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'badge badge-completed';
      case 'In Progress': return 'badge badge-in_progress';
      case 'Action Required': return 'badge badge-action-required';
      default: return 'badge';
    }
  };

  const getAuditStats = (auditObj) => {
    const list = allControls[auditObj.audit_name] || [];
    const total = list.length;
    const completed = list.filter(c => c.status === 'Completed' || c.status === 'Submitted' || c.evidenceFile || (c.evidenceFiles && c.evidenceFiles.length > 0)).length;
    const pct = total ? Math.round((completed / total) * 100) : 0;
    
    let status = auditObj.status || 'Pending';
    
    let dueDate = auditObj.target_fy || '2026-12-31';
    
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
          {clientAudits.map(auditObj => {
            const stats = getAuditStats(auditObj);
            
            return (
              <div 
                key={auditObj.id} 
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
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{auditObj.audit_name}</h3>
                      <span 
                        style={{ 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          textTransform: 'uppercase', 
                          color: 'var(--text-secondary)' 
                        }}
                      >
                        {auditObj.audit_type || 'Framework Standard'}
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
                      <span>Target FY: <strong>{stats.dueDate}</strong></span>
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
                  onClick={() => handleSelectAudit(auditObj.audit_name)}
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

  const renderDomainBadge = (domain) => {
    const domStr = domain || '';
    let bg = '#E8F0FE'; let color = '#1A73E8'; let border = '#ADCEFE';
    if (domStr.includes('GV') || domStr.includes('Govern')) { bg = '#E8F0FE'; color = '#1A73E8'; border = '#ADCEFE'; }
    else if (domStr.includes('ID') || domStr.includes('Identify')) { bg = '#E0F7FA'; color = '#00838F'; border = '#80DEEA'; }
    else if (domStr.includes('PR') || domStr.includes('Protect')) { bg = '#E6F4EA'; color = '#137333'; border = '#A8DAB5'; }
    else if (domStr.includes('DE') || domStr.includes('Detect')) { bg = '#FEF7E0'; color = '#B06000'; border = '#FDE293'; }
    else if (domStr.includes('RS') || domStr.includes('Respond')) { bg = '#F3E8FF'; color = '#6B21A8'; border = '#D8B4FE'; }
    else if (domStr.includes('RC') || domStr.includes('Recover')) { bg = '#FCE8E6'; color = '#C5221F'; border = '#F5C2C7'; }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap'
      }}>
        {domStr || '—'}
      </span>
    );
  };

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

            {/* Filter Category */}
            <select 
              className="table-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Filter Subcategory */}
            <select 
              className="table-filter-select"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
            >
              {subcategoriesList.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
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
          <table className="excel-table" style={{ minWidth: '1150px' }}>
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Framework Rules</th>
                <th style={{ width: '380px' }}>Control Description</th>
                <th style={{ width: '140px' }}>Control Domain</th>
                <th style={{ width: '140px' }}>Framework Category</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '130px', minWidth: '130px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredControls.map((ctrl) => {
                const rulesArray = ctrl.frameworkRulesList || (ctrl.standard ? ctrl.standard.split(', ').filter(Boolean) : []);
                const isCompleted = ctrl.status === 'Completed' || ctrl.status === 'Submitted' || ctrl.evidenceFile || (ctrl.evidenceFiles && ctrl.evidenceFiles.length > 0);
                const displayStatus = isCompleted ? 'Completed' : 'Incomplete';
                
                return (
                <tr key={ctrl.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {rulesArray.map((rule, idx) => (
                        <span 
                          key={idx} 
                          title={rule}
                          style={{ 
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontFamily: 'monospace',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '145px'
                          }}
                        >
                          {rule}
                        </span>
                      ))}
                      {rulesArray.length === 0 && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '13px' }}>
                    <div style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: '360px' }} title={ctrl.description || ctrl.name}>
                      {ctrl.description || ctrl.name}
                    </div>
                  </td>
                  <td style={{ fontSize: '13px' }}>
                    {renderDomainBadge(ctrl.domain)}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{ctrl.frameworkCategory || '—'}</span>
                      {ctrl.frameworkSubcategory && <span style={{ fontSize: '11.5px' }}>{ctrl.frameworkSubcategory}</span>}
                    </div>
                  </td>
                  <td>
                    <span className={displayStatus === 'Completed' ? 'badge-completed' : 'badge-pending'} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', display: 'inline-block' }}>
                      {displayStatus}
                    </span>
                  </td>
                  <td>
                    <Link 
                      to={`/control-details?id=${ctrl.id}`}
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                    >
                      <Eye size={14} /> View Details
                    </Link>
                  </td>
                </tr>
                );
              })}
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
