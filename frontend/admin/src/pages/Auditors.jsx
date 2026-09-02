import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ExcelTable from '../components/ExcelTable';
import Modal from '../components/Modal';
import { ShieldAlert, CheckCircle, UserCheck, Trash2, Shield } from 'lucide-react';

export default function Auditors() {
  const {
    auditors,
    addAuditor,
    audits,
    companies,
    assignClientToAuditor,
    removeClientFromAuditor
  } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    status: 'Active'
  });

  // Modal states for multi-client assignments
  const [selectedAuditor, setSelectedAuditor] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  // Form state
  const [selectedCompany, setSelectedCompany] = useState('');

  const getAuditorClients = (auditorName) => {
    const list = audits.filter(a => a.auditor === auditorName).map(a => a.company);
    return [...new Set(list)];
  };

  const handleViewClients = (auditor) => {
    setSelectedAuditor(auditor);
    setIsViewModalOpen(true);
  };

  const handleAssignClient = (auditor) => {
    setSelectedAuditor(auditor);
    setSelectedCompany('');
    setIsAssignModalOpen(true);
  };

  const handleRemoveClient = (auditor) => {
    setSelectedAuditor(auditor);
    setIsRemoveModalOpen(true);
  };

  const columns = [
    { header: 'ID', accessor: 'id', sortable: true },
    { header: 'Full Name', accessor: 'name', sortable: true },
    { header: 'Official Email', accessor: 'email', sortable: true },
    { header: 'Username', accessor: 'username', sortable: true },
    {
      header: 'Assigned Clients',
      accessor: 'clientsCount',
      sortable: false,
      cell: (row) => {
        const count = getAuditorClients(row.name).length;
        const badgeLabel = count === 1 ? '1 Client' : `${count} Clients`;
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
            onClick={() => handleViewClients(row)}
          >
            {badgeLabel}
          </button>
        );
      }
    },
    {
      header: 'Assigned Audits',
      accessor: 'assignments',
      sortable: false,
      cell: (row) => {
        const auditCount = audits.filter(a => (a.auditors || []).includes(row.name)).length;
        const badgeLabel = auditCount === 1 ? '1 Audit' : `${auditCount} Audits`;
        return (
          <button
            className="badge badge-completed"
            style={{
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              padding: '6px 12px',
              borderRadius: '12px',
              backgroundColor: '#E6F4EA',
              color: '#137333'
            }}
            onClick={() => handleViewClients(row)}
          >
            {badgeLabel}
          </button>
        );
      }
    },
    { header: 'Status', accessor: 'status', sortable: true, isStatus: true },
  ];

  const filterOptions = [
    { label: 'Status', key: 'status', options: ['Active', 'Inactive'] }
  ];

  const tableActions = [
    { label: 'View Assigned Clients', onClick: (row) => handleViewClients(row) },
    { label: 'View Assigned Audits', onClick: (row) => handleViewClients(row) },
    { label: 'Assign Client', onClick: (row) => handleAssignClient(row) },
    { label: 'Remove Client', onClick: (row) => handleRemoveClient(row) },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      alert('All fields are required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    addAuditor(formData);
    setFormData({ name: '', email: '', username: '', password: '', confirmPassword: '', status: 'Active' });
    setIsCreateModalOpen(false);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!selectedCompany) {
      alert('Please select a company to assign.');
      return;
    }
    assignClientToAuditor(selectedAuditor.name, selectedCompany);
    setIsAssignModalOpen(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Compliance Auditors</h1>
          <p className="page-subtitle">Manage staff auditors, security engineers, assessors, and expertise frameworks.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          + Create Auditor
        </button>
      </div>

      <ExcelTable
        columns={columns}
        data={auditors}
        searchPlaceholder="Search by name, email, username..."
        searchKeys={['name', 'email', 'username']}
        filterOptions={filterOptions}
        actions={tableActions}
        tableName="Auditors_Registry"
      />

      {/* CREATE AUDITOR */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Auditor">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Christian Wolff"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Official Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="auditor@cyberaries.com"
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
              placeholder="e.g. c_wolff"
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
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <ShieldAlert size={16} /> Create Auditor
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW ASSIGNED CLIENTS MODAL */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Auditor Client Assignments">
        {selectedAuditor && (
          <div>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Auditor Name: </span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedAuditor.name}</span>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Assigned Companies</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {getAuditorClients(selectedAuditor.name).map(comp => {
                  const companyAudits = audits.filter(a => a.company === comp && a.auditor === selectedAuditor.name);
                  return (
                    <div
                      key={comp}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '12px 14px',
                        backgroundColor: 'var(--bg-hover)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{comp}</span>
                        <span className="badge badge-active" style={{ fontSize: '11px' }}>
                          {companyAudits.length} {companyAudits.length === 1 ? 'Audit' : 'Audits'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        Frameworks: {companyAudits.map(a => a.rulebook).join(', ')}
                      </div>
                    </div>
                  );
                })}
                {getAuditorClients(selectedAuditor.name).length === 0 && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                    No client companies currently assigned.
                  </span>
                )}
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

      {/* ASSIGN CLIENT MODAL */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Client Company">
        {selectedAuditor && (
          <form onSubmit={handleAssignSubmit}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Assigning client to: </span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedAuditor.name}</span>
            </div>

            <div className="form-group">
              <label className="form-label">Select Client Company</label>
              <select
                className="form-input"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                required
              >
                <option value="">Select company</option>
                {companies.map(comp => {
                  const alreadyAssigned = getAuditorClients(selectedAuditor.name).includes(comp.name);
                  return (
                    <option
                      key={comp.id}
                      value={comp.name}
                      disabled={alreadyAssigned}
                    >
                      {comp.name} {alreadyAssigned ? '(Already Assigned)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <UserCheck size={16} /> Assign Client
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* REMOVE CLIENT MODAL */}
      <Modal isOpen={isRemoveModalOpen} onClose={() => setIsRemoveModalOpen(false)} title="Remove Assigned Client">
        {selectedAuditor && (
          <div>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Auditor: </span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedAuditor.name}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {getAuditorClients(selectedAuditor.name).map(comp => (
                <div
                  key={comp}
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
                  <span style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-primary)' }}>{comp}</span>
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
                      if (window.confirm(`Are you sure you want to remove ${comp} from ${selectedAuditor.name}?`)) {
                        removeClientFromAuditor(selectedAuditor.name, comp);
                      }
                    }}
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              ))}
              {getAuditorClients(selectedAuditor.name).length === 0 && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', padding: '16px 0' }}>
                  No client companies currently assigned.
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
    </div>
  );
}
