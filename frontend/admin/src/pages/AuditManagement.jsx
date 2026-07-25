import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ExcelTable from '../components/ExcelTable';
import Modal from '../components/Modal';
import { ClipboardList, Edit, Trash2, UserPlus, Eye, Users } from 'lucide-react';

const FRAMEWORKS = [
  'ISO 27001',
  'SOC 2 Type II',
  'SEBI CSCRF',
  'ISO 22301',
  'PCI DSS',
  'HIPAA',
  'RBI Cyber Security',
  'Internal Audit',
  'Custom Audit'
];

export default function AuditManagement() {
  const { 
    audits, 
    companies, 
    clients, 
    auditors, 
    addAudit, 
    updateAudit, 
    deleteAudit 
  } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReassignClientOpen, setIsReassignClientOpen] = useState(false);
  const [isReassignAuditorOpen, setIsReassignAuditorOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  const [selectedAudit, setSelectedAudit] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    auditName: '',
    company: '',
    client: '',
    auditor: '',
    rulebook: FRAMEWORKS[0],
    phase: 'Scope & Setup',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: ''
  });

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
    { header: 'Client', accessor: 'client', sortable: true },
    { header: 'Assigned Auditor', accessor: 'auditor', sortable: true },
    { header: 'Framework', accessor: 'rulebook', sortable: true },
    { 
      header: 'Progress', 
      accessor: 'progress', 
      sortable: true,
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flexGrow: 1, height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '80px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${row.progress}%`, 
              height: '100%', 
              backgroundColor: row.progress === 100 ? '#10B981' : 'var(--primary)' 
            }}></div>
          </div>
          <span style={{ fontWeight: '600', fontSize: '12px' }}>{row.progress}%</span>
        </div>
      )
    },
    { header: 'Status', accessor: 'status', sortable: true, isStatus: true },
  ];

  const filterOptions = [
    { label: 'Status', key: 'status', options: ['In Progress', 'Pending Review', 'Completed'] },
    { label: 'Framework', key: 'rulebook', options: FRAMEWORKS },
    { label: 'Auditor', key: 'auditor', options: auditors.map(a => a.name) }
  ];

  const tableActions = [
    { label: 'Edit Audit', onClick: (row) => handleOpenEdit(row) },
    { label: 'Reassign Client', onClick: (row) => handleOpenReassignClient(row) },
    { label: 'Reassign Auditor', onClick: (row) => handleOpenReassignAuditor(row) },
    { label: 'View Details', onClick: (row) => handleOpenViewDetails(row) },
    { label: 'Delete', onClick: (row) => handleDeleteAudit(row) },
  ];

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!createForm.company || !createForm.client || !createForm.auditor || !createForm.dueDate || !createForm.auditName) {
      alert('Audit Name, Company, Representative, Auditor and Target Due Date are required.');
      return;
    }
    const newAudit = {
      company: createForm.company,
      client: createForm.client,
      auditor: createForm.auditor,
      rulebook: createForm.rulebook,
      auditName: createForm.auditName,
      phase: createForm.phase,
      priority: createForm.priority,
      startDate: createForm.startDate,
      dueDate: createForm.dueDate,
      description: createForm.description
    };
    addAudit(newAudit);
    setCreateForm({
      auditName: '',
      company: '',
      client: '',
      auditor: '',
      rulebook: FRAMEWORKS[0],
      phase: 'Scope & Setup',
      priority: 'Medium',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      description: ''
    });
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
        searchPlaceholder="Search by ID, company, client, auditor, framework..."
        searchKeys={['id', 'company', 'client', 'auditor', 'rulebook']}
        filterOptions={filterOptions}
        actions={tableActions}
        tableName="Audits_Registry_Grid"
      />

      {/* CREATE AUDIT MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Compliance Audit">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Audit Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Q3 SOC 2 Audit"
                value={createForm.auditName}
                onChange={(e) => setCreateForm({ ...createForm, auditName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Audit ID (Auto-Generated)</label>
              <input
                type="text"
                className="form-input"
                value={`AUDIT-${100 + audits.length + 1}`}
                disabled
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Client Company</label>
              <select
                className="form-input"
                value={createForm.company}
                onChange={(e) => setCreateForm({ ...createForm, company: e.target.value, client: '' })}
                required
              >
                <option value="">Select target company</option>
                {companies.map(comp => (
                  <option key={comp.id} value={comp.name}>{comp.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Client Representative</label>
              <select
                className="form-input"
                value={createForm.client}
                onChange={(e) => setCreateForm({ ...createForm, client: e.target.value })}
                required
                disabled={!createForm.company}
              >
                <option value="">Select representative</option>
                {createForm.company ? (
                  filteredClients.map(c => (
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
              <label className="form-label">Assigned Lead Auditor</label>
              <select
                className="form-input"
                value={createForm.auditor}
                onChange={(e) => setCreateForm({ ...createForm, auditor: e.target.value })}
                required
              >
                <option value="">Select lead auditor</option>
                {auditors.filter(a => a.status === 'Active').map(aud => (
                  <option key={aud.id} value={aud.name}>{aud.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Audit Framework Standard</label>
              <select
                className="form-input"
                value={createForm.rulebook}
                onChange={(e) => setCreateForm({ ...createForm, rulebook: e.target.value })}
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
              <label className="form-label">Audit Phase</label>
              <select
                className="form-input"
                value={createForm.phase}
                onChange={(e) => setCreateForm({ ...createForm, phase: e.target.value })}
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
                value={createForm.priority}
                onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
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
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Due Date</label>
              <input
                type="date"
                className="form-input"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Scope Details</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Scope guidelines, excluded operations, specific standard requirements..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            ></textarea>
          </div>

          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <ClipboardList size={16} /> Schedule Audit
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
