import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ExcelTable from '../components/ExcelTable';
import Modal from '../components/Modal';
import { Building2 } from 'lucide-react';

export default function Companies() {
  const { companies, addCompany, updateCompany } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    registrationNumber: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    industry: '',
    registrationNumber: '',
    status: ''
  });

  const columns = [
    { header: 'ID', accessor: 'id', sortable: true },
    { header: 'Company Name', accessor: 'name', sortable: true },
    { header: 'Registration Number', accessor: 'registrationNumber', sortable: true },
    { header: 'Industry Verticals', accessor: 'industry', sortable: true },
    { 
      header: 'Compliance Score', 
      accessor: 'complianceScore', 
      sortable: true,
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flexGrow: 1, height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', width: '100px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${row.complianceScore}%`, 
              height: '100%', 
              backgroundColor: row.complianceScore > 85 ? '#10B981' : row.complianceScore > 70 ? '#F59E0B' : 'var(--primary)' 
            }}></div>
          </div>
          <span style={{ fontWeight: '600', fontSize: '13px' }}>{row.complianceScore}%</span>
        </div>
      )
    },
    { header: 'Creation Date', accessor: 'createdDate', sortable: true },
    { header: 'Compliance Audits', accessor: 'auditsCount', sortable: true },
    { header: 'Status', accessor: 'status', sortable: true, isStatus: true },
  ];

  const filterOptions = [
    { label: 'Status', key: 'status', options: ['Active', 'Pending Review', 'Non-Compliant'] },
    { label: 'Industry', key: 'industry', options: ['SaaS / Cloud', 'Fintech', 'Healthcare', 'Supply Chain', 'E-commerce', 'Cybersecurity'] }
  ];

  const tableActions = [
    { 
      label: 'View Profile', 
      onClick: (row) => {
        setSelectedCompany(row);
        setIsViewModalOpen(true);
      } 
    },
    { 
      label: 'Edit Parameters', 
      onClick: (row) => {
        setSelectedCompany(row);
        setEditFormData({
          id: row.id,
          name: row.name,
          industry: row.industry,
          registrationNumber: row.registrationNumber || '',
          status: row.status || 'Active'
        });
        setIsEditModalOpen(true);
      } 
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.industry || !formData.registrationNumber) return;
    addCompany(formData);
    setFormData({ name: '', industry: '', registrationNumber: '' });
    setIsModalOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.industry || !editFormData.registrationNumber) return;
    updateCompany(editFormData);
    setIsEditModalOpen(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Registered Companies</h1>
          <p className="page-subtitle">Manage client organizations, compliance scopes, and industrial frameworks.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Add Company
        </button>
      </div>

      <ExcelTable
        columns={columns}
        data={companies}
        searchPlaceholder="Search by name, industry, score..."
        searchKeys={['name', 'industry', 'id', 'registrationNumber']}
        filterOptions={filterOptions}
        actions={tableActions}
        tableName="Companies_Registry"
      />

      {/* CREATE NEW COMPANY */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Company">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Acme Corp"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Registration Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter Company Registration Number"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Industry Sector</label>
            <select
              className="form-input"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              required
            >
              <option value="">Select industry sector</option>
              <option value="SaaS / Cloud">SaaS / Cloud</option>
              <option value="Fintech">Fintech</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Supply Chain">Supply Chain</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Cybersecurity">Cybersecurity</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Building2 size={16} /> Register Company
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW COMPANY MODAL */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Company Profile Details">
        {selectedCompany && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13.5px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Company ID</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedCompany.id}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Company Name</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedCompany.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Registration Number</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedCompany.registrationNumber || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Industry Vertical</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedCompany.industry}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Creation Date</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedCompany.createdDate}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Compliance Score</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedCompany.complianceScore}%</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Compliance Audits Count</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedCompany.auditsCount}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block' }}>Status</span>
                <span className={`badge ${selectedCompany.status === 'Active' ? 'badge-completed' : selectedCompany.status === 'Pending Review' ? 'badge-pending' : 'badge-action-required'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                  {selectedCompany.status}
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
              <button className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT COMPANY MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Company Parameters">
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              className="form-input"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Registration Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter Company Registration Number"
              value={editFormData.registrationNumber}
              onChange={(e) => setEditFormData({ ...editFormData, registrationNumber: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Industry Sector</label>
            <select
              className="form-input"
              value={editFormData.industry}
              onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
              required
            >
              <option value="SaaS / Cloud">SaaS / Cloud</option>
              <option value="Fintech">Fintech</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Supply Chain">Supply Chain</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Cybersecurity">Cybersecurity</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={editFormData.status}
              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              required
            >
              <option value="Active">Active</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Non-Compliant">Non-Compliant</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
