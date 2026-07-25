import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ExcelTable from '../components/ExcelTable';
import Modal from '../components/Modal';
import { BookOpen } from 'lucide-react';

export default function Rulebook() {
  const { rulebook, addControl } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    domain: 'Govern (GV)',
    standard: '',
    description: '',
    status: 'Active',
    version: 'v1.0.0'
  });

  const columns = [
    { header: 'Control ID', accessor: 'id', sortable: true, width: '120px' },
    { header: 'Control Name', accessor: 'name', sortable: true, width: '220px' },
    { header: 'Security Domain', accessor: 'domain', sortable: true, width: '160px' },
    { header: 'Standard Mapping', accessor: 'standard', sortable: true, width: '180px' },
    { header: 'Version', accessor: 'version', sortable: true, width: '90px' },
    { header: 'Last Updated', accessor: 'lastUpdated', sortable: true, width: '130px' },
    { 
      header: 'Description', 
      accessor: 'description', 
      sortable: false,
      cell: (row) => (
        <span style={{ 
          fontSize: '12.5px', 
          color: 'var(--text-secondary)', 
          whiteSpace: 'normal',
          display: 'block',
          maxWidth: '300px'
        }}>
          {row.description}
        </span>
      )
    },
    { header: 'Status', accessor: 'status', sortable: true, isStatus: true, width: '100px' },
  ];

  const filterOptions = [
    { label: 'Domain', key: 'domain', options: ['Govern (GV)', 'Identify (ID)', 'Protect (PR)', 'Detect (DE)', 'Respond (RS)', 'Recover (RC)'] },
    { label: 'Status', key: 'status', options: ['Active', 'Suspended'] }
  ];

  const tableActions = [
    { label: 'Inspect Guideline', onClick: (row) => alert(`Control Details: ${row.name}\n${row.description}`) },
    { label: 'Map Framework', onClick: (row) => alert(`Mapping ${row.id} to custom rulebook.`) },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.id || !formData.name || !formData.standard || !formData.description) {
      alert('All fields are required.');
      return;
    }
    addControl(formData);
    setFormData({
      id: '',
      name: '',
      domain: 'Govern (GV)',
      standard: '',
      description: '',
      status: 'Active',
      version: 'v1.0.0'
    });
    setIsModalOpen(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Compliance Rulebook & Controls</h1>
          <p className="page-subtitle">Standardized requirements catalog, control mapping, and domain compliance rules.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => alert('Exporting rulebook database...')}>
            Export Database
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Add Control
          </button>
        </div>
      </div>

      <ExcelTable
        columns={columns}
        data={rulebook}
        searchPlaceholder="Search controls by ID, name, standard mapping..."
        searchKeys={['id', 'name', 'standard', 'domain']}
        filterOptions={filterOptions}
        actions={tableActions}
        tableName="CyberAries_Rulebook_Controls"
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add CSCRF Control">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: '1.5' }}>
              <label className="form-label">Control ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CSCRF-GV-002"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group" style={{ flex: '1' }}>
              <label className="form-label">Version</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. v1.0.0"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Control Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Audit Log Configuration Policies"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Security Domain</label>
              <select
                className="form-input"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                required
              >
                <option value="Govern (GV)">Govern (GV)</option>
                <option value="Identify (ID)">Identify (ID)</option>
                <option value="Protect (PR)">Protect (PR)</option>
                <option value="Detect (DE)">Detect (DE)</option>
                <option value="Respond (RS)">Respond (RS)</option>
                <option value="Recover (RC)">Recover (RC)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Standard Mapping</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CSCRF GV-1.2"
                value={formData.standard}
                onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Describe the objective and requirements of this control..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
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
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <BookOpen size={16} /> Save Control
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
