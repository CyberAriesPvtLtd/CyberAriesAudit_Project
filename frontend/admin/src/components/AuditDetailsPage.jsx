import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Modal from './Modal';
import { 
  ArrowLeft, 
  Search, 
  UserCheck, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Zap,
  RefreshCw,
  Edit,
  ClipboardList,
  User,
  Calendar,
  Building,
  Shield,
  Activity
} from 'lucide-react';
import { CONTROL_DOMAINS, FRAMEWORK_CATEGORIES } from '../data/frameworkRulesData';

export default function AuditDetailsPage({ audit: auditProp, onBack: onBackProp, onOpenEdit }) {
  const { auditId: paramAuditId } = useParams();
  const navigate = useNavigate();

  const { 
    audits,
    auditControls, 
    auditors, 
    assignControlsToAuditor, 
    reassignControlAuditor, 
    getAuditControlMetrics,
    updateAudit
  } = useApp();

  // Determine active audit object
  const audit = useMemo(() => {
    if (auditProp) return auditProp;
    if (paramAuditId) {
      return audits.find(a => a.id === paramAuditId) || {
        id: paramAuditId,
        auditName: `${paramAuditId} Assessment`,
        company: 'Aether Technologies',
        client: 'Sarah Connor',
        auditor: 'Dr. Evelyn Foster',
        rulebook: 'SEBI CSCRF',
        status: 'In Progress',
        progress: 65,
        dueDate: '2026-12-31'
      };
    }
    return null;
  }, [auditProp, paramAuditId, audits]);

  const handleBack = () => {
    if (onBackProp) {
      onBackProp();
    } else {
      navigate('/audit-management');
    }
  };

  // Mapped controls for this specific audit
  const controls = useMemo(() => {
    if (!audit) return [];
    return (auditControls && auditControls[audit.id]) || [];
  }, [auditControls, audit]);

  // Metrics summary for this audit
  const metrics = useMemo(() => {
    if (!audit) return { total: 24, assigned: 18, unassigned: 6, auditorsCount: 3, assignedAuditorsList: [], progressPct: 75, assignmentStatus: 'Partially Assigned' };
    return getAuditControlMetrics(audit.id);
  }, [getAuditControlMetrics, audit]);

  // Control Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All'); // 'All' | 'Assigned' | 'Unassigned'
  const [selectedAuditorFilter, setSelectedAuditorFilter] = useState('');
  const [isQuickUnassigned, setIsQuickUnassigned] = useState(false);

  // Checkbox Selection state
  const [selectedControlIds, setSelectedControlIds] = useState([]);
  const [bulkAuditor, setBulkAuditor] = useState('');

  // Reassignment Modal state
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [controlToReassign, setControlToReassign] = useState(null);
  const [newAuditorName, setNewAuditorName] = useState('');

  // Filtering Logic
  const filteredControls = useMemo(() => {
    return controls.filter(ctrl => {
      // Search
      const matchesSearch = searchQuery === '' || 
        ctrl.controlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctrl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ctrl.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Domain
      const matchesDomain = !selectedDomain || ctrl.domain === selectedDomain;

      // Category
      const matchesCategory = !selectedCategory || ctrl.category === selectedCategory;

      // Status
      let matchesStatus = true;
      if (isQuickUnassigned) {
        matchesStatus = ctrl.status === 'Unassigned';
      } else if (selectedStatus !== 'All') {
        matchesStatus = ctrl.status === selectedStatus;
      }

      // Auditor
      let matchesAuditor = true;
      if (selectedAuditorFilter) {
        if (selectedAuditorFilter === 'Unassigned') {
          matchesAuditor = ctrl.status === 'Unassigned' || ctrl.assignedAuditor === 'Unassigned';
        } else {
          matchesAuditor = ctrl.assignedAuditor === selectedAuditorFilter;
        }
      }

      return matchesSearch && matchesDomain && matchesCategory && matchesStatus && matchesAuditor;
    });
  }, [controls, searchQuery, selectedDomain, selectedCategory, selectedStatus, selectedAuditorFilter, isQuickUnassigned]);

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedControlIds(filteredControls.map(c => c.id));
    } else {
      setSelectedControlIds([]);
    }
  };

  const handleToggleControlSelect = (id) => {
    setSelectedControlIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk Assign Handler
  const handleBulkAssignSubmit = (e) => {
    e.preventDefault();
    if (selectedControlIds.length === 0) return;
    if (!bulkAuditor) {
      alert('Please select an auditor to assign controls.');
      return;
    }

    assignControlsToAuditor(audit.id, selectedControlIds, bulkAuditor);
    setSelectedControlIds([]);
    setBulkAuditor('');
  };

  // Open Reassign Modal for Single Control
  const handleOpenReassignModal = (ctrl) => {
    setControlToReassign(ctrl);
    setNewAuditorName(ctrl.assignedAuditor !== 'Unassigned' ? ctrl.assignedAuditor : '');
    setIsReassignModalOpen(true);
  };

  const handleConfirmReassign = (e) => {
    e.preventDefault();
    if (!controlToReassign || !newAuditorName) return;

    reassignControlAuditor(audit.id, controlToReassign.id, newAuditorName);
    setIsReassignModalOpen(false);
    setControlToReassign(null);
    setNewAuditorName('');
  };

  const availableAuditors = auditors.length > 0 ? auditors.map(a => a.name) : ['Dr. Evelyn Foster', 'Christian Wolff', 'Lisbeth Salander'];

  if (!audit) {
    return (
      <div className="page-container" style={{ padding: '32px 16px', textAlign: 'center' }}>
        <h2>Audit Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>The requested audit ID standard record could not be found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/audit-management')}>
          ← Back to Audit Management
        </button>
      </div>
    );
  }

  return (
    <div className="audit-details-page" style={{ padding: '0 4px 32px 4px' }}>
      
      {/* ── 1. Top Header Navigation ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleBack}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 14px',
              fontSize: '13.5px',
              fontWeight: '600'
            }}
          >
            <ArrowLeft size={16} /> Back to Audit Management
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="page-title" style={{ margin: 0, fontSize: '22px' }}>
                {audit.auditName || `${audit.rulebook} Audit`}
              </h1>
              <span className="badge badge-active" style={{ fontSize: '12px' }}>
                {audit.rulebook}
              </span>
            </div>
            <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: '500' }}>
              {audit.company} • Audit ID: <strong>{audit.id}</strong>
            </span>
          </div>
        </div>

        {onOpenEdit && (
          <button className="btn btn-outline" onClick={() => onOpenEdit(audit)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Edit size={14} /> Edit Audit Specifications
          </button>
        )}
      </div>

      {/* ── 8. AUDIT SUMMARY METRICS ── */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}
      >
        {/* Total Controls */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Controls
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
              {metrics.total}
            </div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#F1F5F9', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            <Layers size={20} />
          </div>
        </div>

        {/* Assigned Controls */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Assigned Controls
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#166534', marginTop: '2px' }}>
              {metrics.assigned}
            </div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#DCFCE7', borderRadius: '8px', color: '#166534' }}>
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Unassigned Controls */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Unassigned Controls
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#9A3412', marginTop: '2px' }}>
              {metrics.unassigned}
            </div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#FFEDD5', borderRadius: '8px', color: '#9A3412' }}>
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Total Auditors */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Auditors
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
              {metrics.auditorsCount}
            </div>
          </div>
          <div style={{ padding: '8px', backgroundColor: '#E0F2FE', borderRadius: '8px', color: '#0369A1' }}>
            <UserCheck size={20} />
          </div>
        </div>

        {/* Assignment Progress */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Assignment Progress
            </span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>
              {metrics.progressPct}% Assigned
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${metrics.progressPct}%`, 
                height: '100%', 
                backgroundColor: metrics.progressPct === 100 ? '#10B981' : 'var(--primary)',
                transition: 'width 0.4s ease'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* ── 3. COMPLETE AUDIT INFORMATION CARD ── */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={18} style={{ color: 'var(--primary)' }} /> Audit Overview Specifications
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13.5px' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Audit ID</span>
            <strong style={{ color: 'var(--text-primary)' }}>{audit.id}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Audit Name</span>
            <strong style={{ color: 'var(--text-primary)' }}>{audit.auditName || `${audit.rulebook} Assessment`}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Company</span>
            <strong style={{ color: 'var(--text-primary)' }}>{audit.company}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Client Representative</span>
            <strong style={{ color: 'var(--text-primary)' }}>{audit.client || 'Representative'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Assigned Auditor(s)</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
              {metrics.assignedAuditorsList.length > 0 ? metrics.assignedAuditorsList.join(', ') : audit.auditor || 'Unassigned'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Framework Standard</span>
            <strong style={{ color: 'var(--text-primary)' }}>{audit.rulebook}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Audit Phase</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {audit.phase || (audit.status === 'Completed' ? 'Certification' : audit.status === 'Pending Review' ? 'Auditor Review' : 'Evidence Gathering')}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Start Date</span>
            <strong style={{ color: 'var(--text-primary)' }}>{audit.startDate || '2026-07-01'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Target Due Date</span>
            <strong style={{ color: 'var(--text-primary)' }}>{audit.dueDate || '2026-12-31'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Overall Progress</span>
            <strong style={{ color: 'var(--text-primary)' }}>{audit.progress || 0}%</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', fontWeight: '600' }}>Status</span>
            <span className={`badge ${audit.status === 'Completed' ? 'badge-completed' : audit.status === 'Pending Review' ? 'badge-pending' : 'badge-in_progress'}`} style={{ marginTop: '2px', display: 'inline-block' }}>
              {audit.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. MAPPED CONTROLS SECTION ── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              MAPPED CONTROLS
            </h3>
            <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Total Controls: <strong>{metrics.total}</strong> • Assigned: <strong style={{ color: '#166534' }}>{metrics.assigned}</strong> • Unassigned: <strong style={{ color: '#C2410C' }}>{metrics.unassigned}</strong>
            </span>
          </div>
        </div>

        {/* 5. Control Filters */}
        <div 
          style={{ 
            backgroundColor: '#F8FAFC', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-md)', 
            padding: '14px 16px', 
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            
            {/* Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '6px 12px' }}>
              <Search size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Search Controls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--text-primary)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  ✕
                </button>
              )}
            </div>

            {/* Quick Unassigned Pill */}
            <button
              type="button"
              className={`btn ${isQuickUnassigned ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setIsQuickUnassigned(prev => {
                  const next = !prev;
                  setSelectedStatus(next ? 'Unassigned' : 'All');
                  return next;
                });
              }}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '12.5px', 
                fontWeight: '600',
                padding: '6px 14px',
                borderRadius: '20px',
                borderColor: isQuickUnassigned ? 'var(--primary)' : 'var(--border-color)',
                color: isQuickUnassigned ? '#FFFFFF' : '#C2410C',
                backgroundColor: isQuickUnassigned ? 'var(--primary)' : '#FFF7ED'
              }}
            >
              <Zap size={14} /> Unassigned Controls ({metrics.unassigned})
            </button>
          </div>

          {/* Filter Dropdowns Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
            {/* Domain */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                Filter by Domain
              </label>
              <select
                className="form-input"
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              >
                <option value="">All Domains</option>
                {CONTROL_DOMAINS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                Filter by Category
              </label>
              <select
                className="form-input"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              >
                <option value="">All Categories</option>
                {FRAMEWORK_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                Filter by Assignment Status
              </label>
              <select
                className="form-input"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  if (e.target.value !== 'Unassigned') setIsQuickUnassigned(false);
                }}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              >
                <option value="All">All Statuses</option>
                <option value="Assigned">Assigned</option>
                <option value="Unassigned">Unassigned</option>
              </select>
            </div>

            {/* Auditor */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                Filter by Auditor
              </label>
              <select
                className="form-input"
                value={selectedAuditorFilter}
                onChange={(e) => setSelectedAuditorFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              >
                <option value="">All Auditors</option>
                {availableAuditors.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
                <option value="Unassigned">Unassigned Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 6. SELECT CONTROLS & BULK ASSIGNMENT BAR ── */}
        {selectedControlIds.length > 0 && (
          <div 
            style={{ 
              backgroundColor: '#1E293B', 
              color: '#FFFFFF', 
              padding: '12px 18px', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span 
                style={{ 
                  backgroundColor: 'var(--primary)', 
                  color: '#FFFFFF', 
                  fontWeight: '700', 
                  padding: '3px 10px', 
                  borderRadius: '12px', 
                  fontSize: '12px' 
                }}
              >
                {selectedControlIds.length} Controls Selected
              </span>
              <span style={{ fontSize: '13px', color: '#CBD5E1' }}>
                Assign selected controls to an auditor:
              </span>
            </div>

            <form onSubmit={handleBulkAssignSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                className="form-input"
                value={bulkAuditor}
                onChange={(e) => setBulkAuditor(e.target.value)}
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '13px', 
                  backgroundColor: '#334155', 
                  color: '#FFFFFF', 
                  borderColor: '#475569',
                  borderRadius: 'var(--radius-sm)',
                  minWidth: '180px'
                }}
                required
              >
                <option value="">Assign To Auditor ▼</option>
                {availableAuditors.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
                <option value="Unassigned">Unassign Controls</option>
              </select>

              <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={14} /> Assign Controls
              </button>

              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedControlIds([])}
                style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'transparent', color: '#94A3B8', borderColor: '#475569' }}
              >
                Clear
              </button>
            </form>
          </div>
        )}

        {/* ── MAPPED CONTROLS TABLE ── */}
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="excel-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ width: '40px', textAlign: 'center', padding: '10px' }}>
                  <input
                    type="checkbox"
                    checked={filteredControls.length > 0 && selectedControlIds.length === filteredControls.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '12.5px' }}>
                  Control ID
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '12.5px' }}>
                  Control Name
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '12.5px' }}>
                  Domain / Category
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '12.5px' }}>
                  Framework
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', fontSize: '12.5px' }}>
                  Assigned Auditor
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700', fontSize: '12.5px' }}>
                  Assignment Status
                </th>
                <th style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', fontSize: '12.5px' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredControls.map((ctrl) => {
                const isSelected = selectedControlIds.includes(ctrl.id);
                const isAssigned = ctrl.status === 'Assigned' && ctrl.assignedAuditor && ctrl.assignedAuditor !== 'Unassigned';

                return (
                  <tr 
                    key={ctrl.id} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <td style={{ textAlign: 'center', padding: '10px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleControlSelect(ctrl.id)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </td>

                    {/* Control ID */}
                    <td style={{ padding: '12px 14px', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        {ctrl.controlId}
                      </span>
                    </td>

                    {/* Control Name & Description */}
                    <td style={{ padding: '12px 14px', maxWidth: '300px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {ctrl.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {ctrl.description}
                      </div>
                    </td>

                    {/* Domain / Category */}
                    <td style={{ padding: '12px 14px', fontSize: '12.5px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {ctrl.domain}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        {ctrl.category}
                      </div>
                    </td>

                    {/* Framework */}
                    <td style={{ padding: '12px 14px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {ctrl.framework}
                    </td>

                    {/* Assigned Auditor */}
                    <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                      {isAssigned ? (
                        <span className="badge badge-active" style={{ fontSize: '12px', fontWeight: '600', backgroundColor: '#E0F2FE', color: '#0369A1' }}>
                          👤 {ctrl.assignedAuditor}
                        </span>
                      ) : (
                        <span className="badge" style={{ fontSize: '11.5px', backgroundColor: '#FFF7ED', color: '#C2410C', border: '1px solid #FFEDD5' }}>
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Assignment Status */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span 
                        className={`badge ${isAssigned ? 'badge-completed' : 'badge-pending'}`} 
                        style={{ fontSize: '11.5px', fontWeight: '600' }}
                      >
                        {isAssigned ? 'Assigned' : 'Unassigned'}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleOpenReassignModal(ctrl)}
                        style={{ 
                          padding: '4px 10px', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <RefreshCw size={12} /> {isAssigned ? 'Reassign' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredControls.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary)', fontSize: '13.5px', fontStyle: 'italic' }}>
                    No controls match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 7. REASSIGN SINGLE CONTROL MODAL ── */}
      <Modal 
        isOpen={isReassignModalOpen} 
        onClose={() => setIsReassignModalOpen(false)} 
        title="Reassign Control Auditor"
      >
        {controlToReassign && (
          <form onSubmit={handleConfirmReassign}>
            <div style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Control ID: {controlToReassign.controlId}
              </div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {controlToReassign.name}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                {controlToReassign.domain} • {controlToReassign.category}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Current Auditor: </span>
              <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {controlToReassign.assignedAuditor || 'Unassigned'}
              </strong>
            </div>

            <div className="form-group">
              <label className="form-label">Select New Auditor</label>
              <select
                className="form-input"
                value={newAuditorName}
                onChange={(e) => setNewAuditorName(e.target.value)}
                required
              >
                <option value="">Select Auditor ▼</option>
                {availableAuditors.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
                <option value="Unassigned">Unassign Control</option>
              </select>
            </div>

            <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsReassignModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <CheckCircle2 size={16} /> Confirm Reassignment
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
