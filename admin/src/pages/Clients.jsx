import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ExcelTable from '../components/ExcelTable';
import Modal from '../components/Modal';
import { UserPlus, Clipboard, CheckCircle, Shield, Trash2, Edit } from 'lucide-react';

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

export default function Clients() {
  const { 
    clients, 
    companies, 
    addClient, 
    audits, 
    auditors,
    assignAuditToClient, 
    removeAuditFromClient, 
    manageAuditAssignments,
    addAudit
  } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    status: 'Active'
  });

  // Modal states for multi-audit
  const [selectedClient, setSelectedClient] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isCreateAssignModalOpen, setIsCreateAssignModalOpen] = useState(false);

  // Form states for assignments
  const [assignForm, setAssignForm] = useState({
    frameworks: [],
    auditor: ''
  });
  const [manageForm, setManageForm] = useState({
    frameworks: [],
    auditor: ''
  });
  const [createAssignForm, setCreateAssignForm] = useState({
    auditName: '',
    rulebook: '',
    auditor: '',
    phase: 'Scope & Setup',
    priority: 'Medium',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: ''
  });

  const getClientAudits = (companyName) => {
    return audits.filter(a => a.company === companyName);
  };

  const handleViewAudits = (client) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  const handleAssignAudit = (client) => {
    setSelectedClient(client);
    setAssignForm({
      frameworks: [],
      auditor: auditors[0]?.name || ''
    });
    setIsAssignModalOpen(true);
  };

  const handleRemoveAudit = (client) => {
    setSelectedClient(client);
    setIsRemoveModalOpen(true);
  };

  const handleCreateAndAssignAudit = (client) => {
    setSelectedClient(client);
    setCreateAssignForm({
      auditName: '',
      rulebook: FRAMEWORKS[0],
      auditor: auditors[0]?.name || '',
      phase: 'Scope & Setup',
      priority: 'Medium',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      description: ''
    });
    setIsCreateAssignModalOpen(true);
  };

  const handleManageAssignments = (client) => {
    setSelectedClient(client);
    const current = getClientAudits(client.company).map(a => a.rulebook);
    const firstAudit = getClientAudits(client.company)[0];
    setManageForm({
      frameworks: current,
      auditor: firstAudit?.auditor || auditors[0]?.name || ''
    });
    setIsManageModalOpen(true);
  };

  const columns = [
    { header: 'ID', accessor: 'id', sortable: true },
    { header: 'Full Name', accessor: 'name', sortable: true },
    { header: 'Client Company', accessor: 'company', sortable: true },
    { header: 'Official Email', accessor: 'email', sortable: true },
    { header: 'Username', accessor: 'username', sortable: true },
    { 
      header: 'Assigned Audits', 
      accessor: 'auditsCount', 
      sortable: false,
      cell: (row) => {
        const count = getClientAudits(row.company).length;
        const badgeLabel = count === 1 ? '1 Audit' : `${count} Audits`;
        return (
          <button 
            className="badge badge-active" 
            style={{ 
              border: 'none', 
              cursor: 'pointer',
              fontWeight: '600',
              padding: '6px 12px',
              borderRadius: '12px'
            }}
            onClick={() => handleViewAudits(row)}
          >
            {badgeLabel}
          </button>
        );
      }
    },
    { header: 'Audit Phase', accessor: 'auditPhase', sortable: true },
    { header: 'Status', accessor: 'status', sortable: true, isStatus: true },
  ];

  const filterOptions = [
    { label: 'Status', key: 'status', options: ['Active', 'Suspended', 'Pending Review'] },
    { label: 'Company', key: 'company', options: companies.map(c => c.name) }
  ];

  const tableActions = [
    { label: 'View Assigned Audits', onClick: (row) => handleViewAudits(row) },
    { label: 'Assign Existing Audit', onClick: (row) => handleAssignAudit(row) },
    { label: 'Create & Assign New Audit', onClick: (row) => handleCreateAndAssignAudit(row) },
    { label: 'Remove Audit', onClick: (row) => handleRemoveAudit(row) },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.company || !formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      alert('All fields are required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    addClient(formData);
    setFormData({ name: '', company: '', email: '', username: '', password: '', confirmPassword: '', status: 'Active' });
    setIsCreateModalOpen(false);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (assignForm.frameworks.length === 0) {
      alert('Please select at least one audit framework.');
      return;
    }
    assignForm.frameworks.forEach(f => {
      assignAuditToClient(selectedClient.company, selectedClient.name, f, assignForm.auditor);
    });
    setIsAssignModalOpen(false);
  };

  const handleManageSubmit = (e) => {
    e.preventDefault();
    manageAuditAssignments(selectedClient.company, selectedClient.name, manageForm.frameworks, manageForm.auditor);
    setIsManageModalOpen(false);
  };

  const handleCreateAssignSubmit = (e) => {
    e.preventDefault();
    if (!createAssignForm.auditName || !createAssignForm.rulebook || !createAssignForm.auditor || !createAssignForm.dueDate) {
      alert('Audit Name, Framework, Auditor and Target Due Date are required.');
      return;
    }
    const newAudit = {
      company: selectedClient.company,
      client: selectedClient.name,
      rulebook: createAssignForm.rulebook,
      auditor: createAssignForm.auditor,
      auditName: createAssignForm.auditName,
      status: 'In Progress',
      progress: 0,
      phase: createAssignForm.phase,
      priority: createAssignForm.priority,
      startDate: createAssignForm.startDate,
      dueDate: createAssignForm.dueDate,
      description: createAssignForm.description
    };
    addAudit(newAudit);
    setIsCreateAssignModalOpen(false);
  };

  const toggleAssignFramework = (f) => {
    setAssignForm(prev => {
      const exists = prev.frameworks.includes(f);
      return {
        ...prev,
        frameworks: exists ? prev.frameworks.filter(item => item !== f) : [...prev.frameworks, f]
      };
    });
  };

  const toggleManageFramework = (f) => {
    setManageForm(prev => {
      const exists = prev.frameworks.includes(f);
      return {
        ...prev,
        frameworks: exists ? prev.frameworks.filter(item => item !== f) : [...prev.frameworks, f]
      };
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Client Contact Center</h1>
          <p className="page-subtitle">Manage client users, verify registration parameters, and audit phase logs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          + Create Client
        </button>
      </div>

      <ExcelTable
        columns={columns}
        data={clients}
        searchPlaceholder="Search by name, company, email..."
        searchKeys={['name', 'company', 'email']}
        filterOptions={filterOptions}
        actions={tableActions}
        tableName="Clients_Registry"
      />

      {/* CREATE CLIENT MODAL */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Client Account">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Tony Stark"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Client Company</label>
            <select
              className="form-input"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
            >
              <option value="">Select client company</option>
              {companies.map(comp => (
                <option key={comp.id} value={comp.name}>{comp.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Official Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="rep@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. tony_stark"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Pending Review">Pending Review</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <UserPlus size={16} /> Create Client
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW ASSIGNED AUDITS MODAL */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Client Details & Assigned Audits">
        {selectedClient && (
          <div>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Client Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Client Name</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedClient.name}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Company Name</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedClient.company}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Official Email</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedClient.email}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Username</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedClient.username}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Assigned Audits</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {getClientAudits(selectedClient.company).map(audit => (
                  <div 
                    key={audit.id} 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '6px', 
                      padding: '12px 16px', 
                      backgroundColor: 'var(--bg-hover)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '13.5px' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={16} style={{ color: '#10B981' }} />
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{audit.rulebook}</span>
                      </div>
                      <span className={`badge ${audit.status === 'Completed' ? 'badge-completed' : audit.status === 'Pending Review' ? 'badge-pending' : 'badge-in_progress'}`}>
                        {audit.status} ({audit.progress}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', paddingLeft: '24px' }}>
                      <span>Due Date: <strong>{audit.dueDate}</strong></span>
                      <span>Auditor: <strong>{audit.auditor}</strong></span>
                    </div>
                  </div>
                ))}
                {getClientAudits(selectedClient.company).length === 0 && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                    No audits currently assigned.
                  </span>
                )}
              </div>
              <div style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-primary)', textAlign: 'right' }}>
                Total Assigned Audits: {getClientAudits(selectedClient.company).length}
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
              <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ASSIGN NEW AUDIT MODAL */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign New Compliance Audit">
        {selectedClient && (
          <form onSubmit={handleAssignSubmit}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px', fontSize: '13px', display: 'flex', gap: '24px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Client: </span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedClient.name}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Company: </span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedClient.company}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ marginBottom: '10px' }}>Select Audit Frameworks</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '4px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                {FRAMEWORKS.map(f => {
                  const isAlreadyAssigned = getClientAudits(selectedClient.company).some(a => a.rulebook === f);
                  return (
                    <label 
                      key={f} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '13px', 
                        cursor: isAlreadyAssigned ? 'not-allowed' : 'pointer',
                        padding: '6px',
                        borderRadius: '4px',
                        backgroundColor: isAlreadyAssigned ? '#F1F5F9' : 'transparent',
                        color: isAlreadyAssigned ? 'var(--text-muted)' : 'var(--text-primary)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={assignForm.frameworks.includes(f) || isAlreadyAssigned}
                        disabled={isAlreadyAssigned}
                        onChange={() => toggleAssignFramework(f)}
                      />
                      <span>{f} {isAlreadyAssigned && '(Assigned)'}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign Auditor</label>
              <select
                className="form-input"
                value={assignForm.auditor}
                onChange={(e) => setAssignForm({ ...assignForm, auditor: e.target.value })}
                required
              >
                {auditors.map(aud => (
                  <option key={aud.id} value={aud.name}>{aud.name}</option>
                ))}
              </select>
            </div>

            <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Clipboard size={16} /> Assign Audits
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* REMOVE AUDIT MODAL */}
      <Modal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} title="Remove Assigned Audit">
        {selectedClient && (
          <div>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Company: </span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedClient.company}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {getClientAudits(selectedClient.company).map(audit => (
                <div 
                  key={audit.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '10px 14px', 
                    backgroundColor: 'var(--bg-hover)', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)' 
                  }}
                >
                  <span style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-primary)' }}>{audit.rulebook}</span>
                  <button 
                    className="btn btn-outline" 
                    style={{ 
                      padding: '4px 10px', 
                      fontSize: '12px', 
                      color: 'var(--primary)', 
                      borderColor: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove ${audit.rulebook} for ${selectedClient.company}?`)) {
                        removeAuditFromClient(selectedClient.company, audit.rulebook);
                      }
                    }}
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              ))}
              {getClientAudits(selectedClient.company).length === 0 && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', padding: '16px 0' }}>
                  No audits currently assigned.
                </span>
              )}
            </div>

            <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
              <button className="btn btn-secondary" onClick={() => setIsRemoveModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MANAGE AUDIT ASSIGNMENTS MODAL */}
      <Modal isOpen={isManageModalOpen} onClose={() => setIsManageModalOpen(false)} title="Manage Compliance Assignments">
        {selectedClient && (
          <form onSubmit={handleManageSubmit}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Managing: </span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedClient.company} ({selectedClient.name})</span>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ marginBottom: '8px' }}>Select Frameworks (Adds checked, removes unchecked)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '220px', overflowY: 'auto', padding: '6px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                {FRAMEWORKS.map(f => (
                  <label 
                    key={f} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      fontSize: '13.5px', 
                      cursor: 'pointer',
                      padding: '4px' 
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={manageForm.frameworks.includes(f)}
                      onChange={() => toggleManageFramework(f)}
                    />
                    <span>{f}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assign Auditor</label>
              <select
                className="form-input"
                value={manageForm.auditor}
                onChange={(e) => setManageForm({ ...manageForm, auditor: e.target.value })}
                required
              >
                {auditors.map(aud => (
                  <option key={aud.id} value={aud.name}>{aud.name}</option>
                ))}
              </select>
            </div>

            <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsManageModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Edit size={16} /> Save Assignments
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* CREATE & ASSIGN NEW AUDIT MODAL */}
      <Modal isOpen={isCreateAssignModalOpen} onClose={() => setIsCreateAssignModalOpen(false)} title="Create & Assign New Audit">
        {selectedClient && (
          <form onSubmit={handleCreateAssignSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Audit Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Q3 SOC 2 Review"
                  value={createAssignForm.auditName}
                  onChange={(e) => setCreateAssignForm({ ...createAssignForm, auditName: e.target.value })}
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
                <label className="form-label">Company Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedClient.company}
                  disabled
                />
              </div>
              <div className="form-group">
                <label className="form-label">Client Representative</label>
                <input
                  type="text"
                  className="form-input"
                  value={selectedClient.name}
                  disabled
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assigned Lead Auditor</label>
                <select
                  className="form-input"
                  value={createAssignForm.auditor}
                  onChange={(e) => setCreateAssignForm({ ...createAssignForm, auditor: e.target.value })}
                  required
                >
                  <option value="">Select auditor</option>
                  {auditors.filter(a => a.status === 'Active').map(aud => (
                    <option key={aud.id} value={aud.name}>{aud.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Audit Framework Standard</label>
                <select
                  className="form-input"
                  value={createAssignForm.rulebook}
                  onChange={(e) => setCreateAssignForm({ ...createAssignForm, rulebook: e.target.value })}
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
                  value={createAssignForm.phase}
                  onChange={(e) => setCreateAssignForm({ ...createAssignForm, phase: e.target.value })}
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
                <label className="form-label">Audit Priority</label>
                <select
                  className="form-input"
                  value={createAssignForm.priority}
                  onChange={(e) => setCreateAssignForm({ ...createAssignForm, priority: e.target.value })}
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
                  value={createAssignForm.startDate}
                  onChange={(e) => setCreateAssignForm({ ...createAssignForm, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={createAssignForm.dueDate}
                  onChange={(e) => setCreateAssignForm({ ...createAssignForm, dueDate: e.target.value })}
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
                value={createAssignForm.description}
                onChange={(e) => setCreateAssignForm({ ...createAssignForm, description: e.target.value })}
              ></textarea>
            </div>

            <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreateAssignModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create & Assign
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
