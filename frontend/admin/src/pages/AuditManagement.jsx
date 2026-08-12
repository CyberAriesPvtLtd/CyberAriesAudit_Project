import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ExcelTable from '../components/ExcelTable';
import Modal from '../components/Modal';
import AuditDetailsPage from '../components/AuditDetailsPage';
import { ClipboardList, Edit, Trash2, UserPlus, Eye, Users, X, ChevronDown, Search } from 'lucide-react';

// Dropdown values (FRAMEWORKS, CATEGORIES, SUBCATEGORIES) are now dynamic —
// computed from the `rulebook` (master Controls data) inside the component.

const TARGET_FYS = [
  'FY 2024-25',
  'FY 2025-26',
  'FY 2026-27',
  'FY 2027-28'
];

export default function AuditManagement() {
  const navigate = useNavigate();
  const { 
    audits, 
    companies, 
    clients, 
    auditors, 
    rulebook,
    addAudit, 
    updateAudit, 
    deleteAudit 
  } = useApp();

  // ─── Dynamic Dropdowns (from master Controls / rulebook) ───
  const FRAMEWORKS = [...new Set(rulebook.map(r => r.frameworkType).filter(Boolean))];
  const AUDIT_CATEGORIES = [...new Set(rulebook.map(r => r.frameworkCategory).filter(Boolean))];

  // Build subcategory map: { category: [subcategory1, subcategory2, ...] }
  const AUDIT_SUBCATEGORIES_MAP = {};
  rulebook.forEach(r => {
    if (r.frameworkCategory && r.frameworkSubcategory) {
      if (!AUDIT_SUBCATEGORIES_MAP[r.frameworkCategory]) {
        AUDIT_SUBCATEGORIES_MAP[r.frameworkCategory] = new Set();
      }
      AUDIT_SUBCATEGORIES_MAP[r.frameworkCategory].add(r.frameworkSubcategory);
    }
  });
  // Convert Sets to Arrays
  Object.keys(AUDIT_SUBCATEGORIES_MAP).forEach(key => {
    AUDIT_SUBCATEGORIES_MAP[key] = [...AUDIT_SUBCATEGORIES_MAP[key]];
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReassignClientOpen, setIsReassignClientOpen] = useState(false);
  const [isReassignAuditorOpen, setIsReassignAuditorOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  const [selectedAudit, setSelectedAudit] = useState(null);
  const [activeAuditDetails, setActiveAuditDetails] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    auditName: '',
    company: '',
    auditors: [],
    framework: '',
    category: '',
    subcategory: '',
    targetFY: ''
  });

  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [isAuditorsDropdownOpen, setIsAuditorsDropdownOpen] = useState(false);

  const handleToggleAuditor = (auditorName) => {
    setCreateForm(prev => {
      const exists = prev.auditors.includes(auditorName);
      const updated = exists
        ? prev.auditors.filter(a => a !== auditorName)
        : [...prev.auditors, auditorName];
      return { ...prev, auditors: updated };
    });
  };

  const handleRemoveAuditor = (auditorName, e) => {
    e.stopPropagation();
    setCreateForm(prev => ({
      ...prev,
      auditors: prev.auditors.filter(a => a !== auditorName)
    }));
  };

  const [editForm, setEditForm] = useState({
    id: '',
    auditName: '',
    company: '',
    client: '',
    auditor: '',
    rulebook: '',
    phase: 'Scope & Setup',
    priority: 'Medium',
    startDate: '',
    dueDate: '',
    description: '',
    progress: 0,
    status: 'In Progress'
  });

  const [reassignClientForm, setReassignClientForm] = useState({
    clientName: '',
    companyName: ''
  });

  const [reassignAuditorForm, setReassignAuditorForm] = useState({
    auditorName: ''
  });

  const handleOpenEdit = (audit) => {
    setSelectedAudit(audit);
    setEditForm({
      id: audit.id,
      auditName: audit.auditName || `${audit.rulebook} Assessment`,
      company: audit.company,
      client: audit.client,
      auditor: audit.auditor,
      rulebook: audit.rulebook,
      phase: audit.phase || (audit.status === 'Completed' ? 'Certification' : audit.status === 'Pending Review' ? 'Auditor Review' : 'Evidence Gathering'),
      priority: audit.priority || 'Medium',
      startDate: audit.startDate || '2026-07-01',
      dueDate: audit.dueDate,
      description: audit.description || 'Standard compliance assessment.',
      progress: audit.progress || 0,
      status: audit.status || 'In Progress'
    });
    setIsEditModalOpen(true);
  };

  const handleOpenReassignClient = (audit) => {
    setSelectedAudit(audit);
    setReassignClientForm({
      clientName: audit.client,
      companyName: audit.company
    });
    setIsReassignClientOpen(true);
  };

  const handleOpenReassignAuditor = (audit) => {
    setSelectedAudit(audit);
    setReassignAuditorForm({
      auditorName: audit.auditor
    });
    setIsReassignAuditorOpen(true);
  };

  const handleOpenViewDetails = (audit) => {
    setSelectedAudit(audit);
    setIsViewDetailsOpen(true);
  };

  const handleDeleteAudit = (audit) => {
    if (window.confirm(`Are you sure you want to delete audit ${audit.id} for ${audit.company}?`)) {
      deleteAudit(audit.id);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id', sortable: true },
    { header: 'Company', accessor: 'company', sortable: true },
    { header: 'Framework Type', accessor: 'framework', sortable: true },
    { header: 'Framework Category', accessor: 'category', sortable: true },
    { header: 'Audit Name', accessor: 'auditName', sortable: true },
    { 
      header: 'Assigned Auditors', 
      accessor: 'auditors', 
      sortable: false,
      cell: (row) => {
        const auditorsList = row.auditors || [];
        if (auditorsList.length === 0) {
          return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Unassigned</span>;
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {auditorsList.map((name, idx) => (
              <span key={idx} style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}>
                {name}
              </span>
            ))}
          </div>
        );
      }
    },
    { header: 'Target FY', accessor: 'targetFY', sortable: true },
    { header: 'Status', accessor: 'status', sortable: true, isStatus: true },
  ];

  const filterOptions = [
    { label: 'Status', key: 'status', options: ['Pending', 'In Progress', 'Completed'] },
    { label: 'Framework Type', key: 'framework', options: FRAMEWORKS },
    { label: 'Framework Category', key: 'category', options: AUDIT_CATEGORIES }
  ];

  const tableActions = [
    { label: 'View Audit', onClick: (row) => navigate(`/audits/${row.id}`) },
    { label: 'Edit Audit', onClick: (row) => handleOpenEdit(row) },
    { label: 'Manage Controls', onClick: (row) => navigate(`/audits/${row.id}`) },
    { label: 'Reassign Auditor', onClick: (row) => handleOpenReassignAuditor(row) },
    { label: 'View Specifications', onClick: (row) => handleOpenViewDetails(row) },
    { label: 'Delete', onClick: (row) => handleDeleteAudit(row) },
  ];

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const newAudit = {
      company: createForm.company,
      framework: createForm.framework,
      auditName: createForm.auditName || 'New Compliance Audit',
      category: createForm.category,
      subcategory: createForm.subcategory,
      auditors: createForm.auditors,
      targetFY: createForm.targetFY,
      status: 'Pending'
    };
    addAudit(newAudit);
    setCreateForm({
      auditName: '',
      company: '',
      auditors: [],
      framework: '',
      category: '',
      subcategory: '',
      targetFY: ''
    });
    setCompanySearchQuery('');
    setIsCompanyDropdownOpen(false);
    setIsAuditorsDropdownOpen(false);
    setIsCreateModalOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateAudit(editForm);
    setIsEditModalOpen(false);
  };

  const handleReassignClientSubmit = (e) => {
    e.preventDefault();
    updateAudit({
      ...selectedAudit,
      client: reassignClientForm.clientName,
      company: reassignClientForm.companyName
    });
    setIsReassignClientOpen(false);
  };

  const handleReassignAuditorSubmit = (e) => {
    e.preventDefault();
    updateAudit({
      ...selectedAudit,
      auditor: reassignAuditorForm.auditorName
    });
    setIsReassignAuditorOpen(false);
  };

  const filteredClients = clients.filter(c => c.company === createForm.company);
  const editFilteredClients = clients.filter(c => c.company === editForm.company);

  const availableCompanies = companies.length > 0
    ? companies.map(c => c.name)
    : ['Aether Technologies', 'Apex Financial Services', 'BioHealth Solutions', 'Nova Logistics Corp', 'Quantum Retail'];

  const filteredCompaniesList = availableCompanies.filter(c =>
    c.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  const availableAuditorsList = auditors.length > 0
    ? auditors.map(a => a.name)
    : ['Dr. Evelyn Foster', 'Christian Wolff', 'Lisbeth Salander'];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Compliance Audit Registry</h1>
          <p className="page-subtitle">Track active assessments, assign reviewers, inspect progress, and set compliance timelines.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          + Create Audit
        </button>
      </div>

      <ExcelTable
        columns={columns}
        data={audits}
        searchPlaceholder="Search by ID, company, framework, category, audit name..."
        searchKeys={['id', 'company', 'framework', 'category', 'auditName']}
        filterOptions={filterOptions}
        actions={tableActions}
        onRowClick={(row) => navigate(`/audits/${row.id}`)}
        tableName="Audits_Registry_Grid"
      />

      {/* CREATE AUDIT MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Compliance Audit">
        <form onSubmit={handleCreateSubmit}>
          {/* 1. Audit Name */}
          <div className="form-group">
            <label className="form-label">Audit Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter Audit Name"
              value={createForm.auditName}
              onChange={(e) => setCreateForm({ ...createForm, auditName: e.target.value })}
            />
          </div>

          {/* 2. Company Name - Searchable Dropdown */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Company Name</label>
            <div
              className="multi-select-box"
              onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
              style={{ justifyContent: 'space-between' }}
            >
              {createForm.company ? (
                <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {createForm.company}
                </span>
              ) : (
                <span style={{ fontSize: '15px', color: '#94A3B8' }}>Select Company</span>
              )}
              <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>

            {isCompanyDropdownOpen && (
              <div className="multi-select-dropdown-menu" style={{ padding: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '6px', backgroundColor: '#F8FAFC' }}>
                  <Search size={14} style={{ color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    placeholder="Search company..."
                    value={companySearchQuery}
                    onChange={(e) => setCompanySearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--text-primary)' }}
                  />
                </div>
                {filteredCompaniesList.length > 0 ? (
                  filteredCompaniesList.map(comp => (
                    <div
                      key={comp}
                      className={`multi-select-option ${createForm.company === comp ? 'selected' : ''}`}
                      onClick={() => {
                        setCreateForm({ ...createForm, company: comp });
                        setIsCompanyDropdownOpen(false);
                      }}
                    >
                      {comp}
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    No companies found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Auditors Assigned - Multi-Select Dropdown with Chips */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Auditors Assigned</label>
            <div
              className={`multi-select-box ${isAuditorsDropdownOpen ? 'focused' : ''}`}
              onClick={() => setIsAuditorsDropdownOpen(!isAuditorsDropdownOpen)}
              style={{ justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', flex: 1 }}>
                {createForm.auditors.length > 0 ? (
                  createForm.auditors.map(aud => (
                    <span key={aud} className="chip-tag">
                      {aud}
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={(e) => handleRemoveAuditor(aud, e)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '15px', color: '#94A3B8' }}>Select Auditors</span>
                )}
              </div>
              <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>

            {isAuditorsDropdownOpen && (
              <div className="multi-select-dropdown-menu">
                {availableAuditorsList.map(aud => {
                  const isSelected = createForm.auditors.includes(aud);
                  return (
                    <div
                      key={aud}
                      className={`multi-select-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleAuditor(aud)}
                    >
                      <span>{aud}</span>
                      {isSelected && <span style={{ fontSize: '12px', fontWeight: '700' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Audit Framework */}
          <div className="form-group">
            <label className="form-label">Audit Framework</label>
            <select
              className="form-input"
              value={createForm.framework}
              onChange={(e) => setCreateForm({ ...createForm, framework: e.target.value })}
            >
              <option value="">Select Audit Framework</option>
              {FRAMEWORKS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* 5. Audit Category */}
          <div className="form-group">
            <label className="form-label">Audit Category</label>
            <select
              className="form-input"
              value={createForm.category}
              onChange={(e) => setCreateForm({
                ...createForm,
                category: e.target.value,
                subcategory: ''
              })}
            >
              <option value="">Select Audit Category</option>
              {AUDIT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 6. Audit Subcategory */}
          <div className="form-group">
            <label className="form-label">Audit Subcategory</label>
            <select
              className="form-input"
              value={createForm.subcategory}
              onChange={(e) => setCreateForm({ ...createForm, subcategory: e.target.value })}
              disabled={!createForm.category}
            >
              <option value="">Select Audit Subcategory</option>
              {createForm.category && AUDIT_SUBCATEGORIES_MAP[createForm.category] ? (
                AUDIT_SUBCATEGORIES_MAP[createForm.category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))
              ) : (
                <option disabled>Please select an Audit Category first</option>
              )}
            </select>
          </div>

          {/* 7. Target FY */}
          <div className="form-group">
            <label className="form-label">Target FY</label>
            <select
              className="form-input"
              value={createForm.targetFY}
              onChange={(e) => setCreateForm({ ...createForm, targetFY: e.target.value })}
            >
              <option value="">Select Financial Year</option>
              {TARGET_FYS.map(fy => (
                <option key={fy} value={fy}>{fy}</option>
              ))}
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsCompanyDropdownOpen(false);
                setIsAuditorsDropdownOpen(false);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Audit
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT AUDIT MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Compliance Audit Details">
        <form onSubmit={handleEditSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Audit Name</label>
              <input
                type="text"
                className="form-input"
                value={editForm.auditName}
                onChange={(e) => setEditForm({ ...editForm, auditName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Audit ID</label>
              <input
                type="text"
                className="form-input"
                value={editForm.id}
                disabled
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Client Company</label>
              <select
                className="form-input"
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value, client: '' })}
                required
              >
                {companies.map(comp => (
                  <option key={comp.id} value={comp.name}>{comp.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Client Representative</label>
              <select
                className="form-input"
                value={editForm.client}
                onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                required
                disabled={!editForm.company}
              >
                <option value="">Select representative</option>
                {editForm.company ? (
                  editFilteredClients.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))
                ) : (
                  <option disabled>Please select a company first</option>
                )}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lead Auditor</label>
              <select
                className="form-input"
                value={editForm.auditor}
                onChange={(e) => setEditForm({ ...editForm, auditor: e.target.value })}
                required
              >
                {auditors.map(aud => (
                  <option key={aud.id} value={aud.name}>{aud.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Framework</label>
              <select
                className="form-input"
                value={editForm.rulebook}
                onChange={(e) => setEditForm({ ...editForm, rulebook: e.target.value })}
                required
              >
                {FRAMEWORKS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phase</label>
              <select
                className="form-input"
                value={editForm.phase}
                onChange={(e) => setEditForm({ ...editForm, phase: e.target.value })}
                required
              >
                <option value="Scope & Setup">Scope & Setup</option>
                <option value="Evidence Gathering">Evidence Gathering</option>
                <option value="Auditor Review">Auditor Review</option>
                <option value="Draft Report">Draft Report</option>
                <option value="Certification">Certification</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-input"
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                required
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Due Date</label>
              <input
                type="date"
                className="form-input"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Progress (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={editForm.progress}
                onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                required
              >
                <option value="In Progress">In Progress</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Scope Description</label>
            <textarea
              className="form-input"
              rows="3"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            ></textarea>
          </div>

          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Edit size={16} /> Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* REASSIGN CLIENT MODAL */}
      <Modal isOpen={isReassignClientOpen} onClose={() => setIsReassignClientOpen(false)} title="Reassign Client Representative">
        <form onSubmit={handleReassignClientSubmit}>
          {selectedAudit && (
            <div>
              <div style={{ marginBottom: '16px', fontSize: '13.5px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Audit: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.id} - {selectedAudit.rulebook}</strong>
              </div>

              <div className="form-group">
                <label className="form-label">Select Client Representative</label>
                <select
                  className="form-input"
                  value={`${reassignClientForm.companyName}|${reassignClientForm.clientName}`}
                  onChange={(e) => {
                    const [comp, cli] = e.target.value.split('|');
                    setReassignClientForm({ companyName: comp, clientName: cli });
                  }}
                  required
                >
                  <option value="">Select client representative</option>
                  {clients.map(c => (
                    <option key={c.id} value={`${c.company}|${c.name}`}>{c.name} ({c.company})</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsReassignClientOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <UserPlus size={16} /> Reassign Client
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* REASSIGN AUDITOR MODAL */}
      <Modal isOpen={isReassignAuditorOpen} onClose={() => setIsReassignAuditorOpen(false)} title="Reassign Lead Auditor">
        <form onSubmit={handleReassignAuditorSubmit}>
          {selectedAudit && (
            <div>
              <div style={{ marginBottom: '16px', fontSize: '13.5px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Active Audit: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.id} - {selectedAudit.rulebook}</strong>
              </div>

              <div className="form-group">
                <label className="form-label">Select Auditor</label>
                <select
                  className="form-input"
                  value={reassignAuditorForm.auditorName}
                  onChange={(e) => setReassignAuditorForm({ auditorName: e.target.value })}
                  required
                >
                  <option value="">Select lead auditor</option>
                  {auditors.map(aud => (
                    <option key={aud.id} value={aud.name}>{aud.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsReassignAuditorOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Users size={16} /> Reassign Auditor
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal isOpen={isViewDetailsOpen} onClose={() => setIsViewDetailsOpen(false)} title="Compliance Audit Specifications">
        {selectedAudit && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13.5px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Audit ID</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.id}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Audit Name</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.auditName || `${selectedAudit.rulebook} Assessment`}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Client Company</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.company}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Client Representative</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.client}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Assigned Lead Auditor</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.auditor}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Framework standard</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.rulebook}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Audit Phase</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {selectedAudit.phase || (selectedAudit.status === 'Completed' ? 'Certification' : selectedAudit.status === 'Pending Review' ? 'Auditor Review' : 'Evidence Gathering')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Priority Level</span>
                <span className={`badge ${selectedAudit.priority === 'High' ? 'badge-action-required' : selectedAudit.priority === 'Low' ? 'badge-completed' : 'badge-pending'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                  {selectedAudit.priority || 'Medium'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Start Date</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.startDate || '2026-07-01'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Target Due Date</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.dueDate}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Progress Metrics</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit.progress}%</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Assessment Status</span>
                <span className={`badge ${selectedAudit.status === 'Completed' ? 'badge-completed' : selectedAudit.status === 'Pending Review' ? 'badge-pending' : 'badge-in_progress'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                  {selectedAudit.status}
                </span>
              </div>
            </div>

            <div style={{ fontSize: '13.5px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Scope Description & Guidelines</span>
              <p style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                {selectedAudit.description || 'Standard compliance assessment. All operational security parameters to be audited.'}
              </p>
            </div>

            <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
              <button className="btn btn-secondary" onClick={() => setIsViewDetailsOpen(false)}>
                Close Specifications
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
