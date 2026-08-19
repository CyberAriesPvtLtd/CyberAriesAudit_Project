import React, { useState, useEffect, useRef } from 'react';
import { useClient } from '../context/ClientContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Download, Trash2, Eye, AlertTriangle, ShieldCheck, FileCheck } from 'lucide-react';
import Modal from '../components/Modal';

export default function ControlDetails() {
  const { currentUser, controls, uploadEvidence, deleteEvidence, currentAudit } = useClient();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Parse control query ID
  const query = new URLSearchParams(location.search);
  const controlId = query.get('id') || 'CTRL-AC-02';

  const control = controls.find(c => c.id === controlId);

  // Parse required deliverables from comma-separated list
  const requirements = control ? control.requiredEvidence.split(',').map(s => s.trim()) : [];

  // Multi-file uploaded evidence state
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    if (!control) return [];
    const saved = localStorage.getItem(`cc_uploaded_files_${control.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Fallback: If control already has a mock file, initialize with it
    if (control.evidenceFile) {
      return [{
        name: control.evidenceFile,
        size: control.evidenceSize || '1.4 MB',
        date: control.evidenceDate || new Date().toISOString().split('T')[0],
        type: control.evidenceFile.split('.').pop().toUpperCase(),
        uploadedBy: currentUser?.fullName || 'Sarah Connor',
        status: 'Uploaded',
        requirement: requirements[0] || 'Deliverable'
      }];
    }
    return [];
  });

  // Sync uploaded files list to localStorage
  useEffect(() => {
    if (control) {
      localStorage.setItem(`cc_uploaded_files_${control.id}`, JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles, control?.id]);

  // States for upload workflow
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Track which requirement is being uploaded to (null if generic drag & drop)
  const [activeReqForUpload, setActiveReqForUpload] = useState(null);
  
  // Show successful upload alert banner
  const [successNotification, setSuccessNotification] = useState(false);

  // If control doesn't exist, redirect back
  useEffect(() => {
    if (!control) {
      navigate('/my-audits');
    }
  }, [control, navigate]);

  if (!control) return null;

  // Determine missing required deliverables
  const missingRequirements = requirements.filter(req => 
    !uploadedFiles.some(file => file.requirement === req)
  );

  // File size formatter
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Drag and drop event handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Process, validate, and actually upload the file via ClientContext ->
  // services/api.js -> presigned MinIO URL -> confirm with the backend.
  // Replaces the old setInterval progress simulation with real upload
  // progress reported by axios' onUploadProgress.
  const processFile = async (file) => {
    setErrorMsg('');
    setSuccessNotification(false);

    // Limit to 100MB (100 * 1024 * 1024 bytes)
    const limit = 100 * 1024 * 1024;
    if (file.size > limit) {
      setErrorMsg('File limit exceeded! The evidence file must not exceed 100 MB in size.');
      return;
    }

    // Allowed extensions: PDF, DOC, DOCX, PNG, JPG, JPEG, ZIP
    const extension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'zip'];
    if (!allowedExtensions.includes(extension)) {
      setErrorMsg('Unsupported format! Allowed formats: PDF, DOC, DOCX, PNG, JPG, JPEG, ZIP.');
      return;
    }

    setUploadFileName(file.name);
    setUploading(true);
    setUploadProgress(0);

    const result = await uploadEvidence(control.id, file, (pct) => {
      setUploadProgress(pct);
    });

    setUploading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Upload failed. Please try again.');
      setActiveReqForUpload(null);
      return;
    }

    const reqToAssign = activeReqForUpload || missingRequirements[0] || 'Additional Evidence';

    const newFile = {
      name: file.name,
      size: formatBytes(file.size),
      date: new Date().toISOString().split('T')[0],
      type: extension.toUpperCase(),
      uploadedBy: currentUser?.fullName || 'Sarah Connor',
      status: 'Uploaded',
      requirement: reqToAssign,
      evidenceItemId: result.evidenceItemId,
    };

    setUploadedFiles(prevFiles => [...prevFiles, newFile]);
    setSuccessNotification(true);
    setActiveReqForUpload(null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleUploadNowClick = (requirementName) => {
    setActiveReqForUpload(requirementName);
    triggerFileSelect();
  };

  const handleDeleteFile = (fileNameToDelete) => {
    const updated = uploadedFiles.filter(f => f.name !== fileNameToDelete);
    setUploadedFiles(updated);
    setSuccessNotification(false);

    // deleteEvidence handles the real backend + MinIO deletion internally,
    // using the evidenceItemId ClientContext already tracked from the
    // upload. It reads control.evidenceItemId, so context state is the
    // source of truth here - this call just triggers it.
    deleteEvidence(control.id);
  };

  const handlePreviewFile = (fileItem) => {
    setPreviewFile(fileItem);
    setPreviewOpen(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'badge badge-completed';
      case 'In Progress': return 'badge badge-in_progress';
      case 'Action Required': return 'badge badge-action-required';
      default: return 'badge';
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div className="page-title-section">
          <Link to="/my-audits" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13.5px', marginBottom: '8px', fontWeight: '500' }}>
            <ArrowLeft size={14} /> Back to {currentAudit} Requirements List
          </Link>
          <h1 className="page-title">{control.id} - Details & Evidence</h1>
        </div>
      </div>

      {/* Control Detail card */}
      <div className="dashboard-section-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{control.name}</h2>
            <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', fontFamily: 'monospace' }}>
              Standard Ref: {control.standard} | Domain: {control.domain}
            </span>
          </div>
          <span className={getStatusBadgeClass(control.status)} style={{ fontSize: '13px', padding: '4px 12px' }}>
            {control.status}
          </span>
        </div>
        
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <strong>Description:</strong> {control.description}
        </p>
      </div>

      {/* Evidence Required Specifications */}
      <div className="dashboard-section-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 className="section-title" style={{ fontSize: '14.5px', marginBottom: '12px' }}>Required Auditing Deliverables</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
          Submit screenshots or documentation confirming the implementation of this requirement. The compliance inspector expects:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {requirements.map((req, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--primary)', fontWeight: '700' }}>•</span>
              <span>{req}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Upload Section */}
      <div className="dashboard-section-card" style={{ padding: '24px' }}>
        <h3 className="section-title" style={{ fontSize: '14.5px', marginBottom: '16px' }}>Evidence Upload & Vetting</h3>

        {errorMsg && (
          <div className="error-message" style={{ marginBottom: '16px' }}>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            {errorMsg}
          </div>
        )}

        {successNotification && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#E6F4EA', border: '1px solid #A3E635', color: '#137333', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '13.5px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <ShieldCheck size={16} />
              <span>Evidence uploaded successfully.</span>
            </div>
            <span style={{ fontSize: '12px', color: '#137333', marginLeft: '24px' }}>Your auditor will review the submitted document.</span>
          </div>
        )}

        {/* Uploaded Evidence Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Uploaded Evidence
          </h4>
          
          {uploadedFiles.length > 0 ? (
            <div className="excel-table-container" style={{ margin: 0 }}>
              <div className="table-scrollable">
                <table className="excel-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>File Type</th>
                      <th>File Size</th>
                      <th>Uploaded Date</th>
                      <th>Uploaded By</th>
                      <th>Status</th>
                      <th style={{ width: '220px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((file, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }} title={file.name}>
                              {file.name}
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: '400', marginTop: '2px' }}>
                            Requirement: {file.requirement}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '11.5px', padding: '2px 6px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            {file.type}
                          </span>
                        </td>
                        <td>{file.size}</td>
                        <td>{file.date}</td>
                        <td>{file.uploadedBy}</td>
                        <td>
                          <span className="badge badge-completed" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FileCheck size={12} /> {file.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 8px', fontSize: '12px' }}
                              onClick={() => handlePreviewFile(file)}
                            >
                              <Eye size={12} /> Preview
                            </button>
                            
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 8px', fontSize: '12px' }}
                              onClick={() => alert(`Downloading: ${file.name}`)}
                            >
                              <Download size={12} /> Download
                            </button>

                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 8px', fontSize: '12px', color: 'var(--primary)' }}
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                                  handleDeleteFile(file.name);
                                }
                              }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No evidence files submitted yet.
            </div>
          )}
        </div>

        {/* Missing Evidence Section */}
        <div style={{ marginBottom: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Missing Evidence
          </h4>
          
          {missingRequirements.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {missingRequirements.map((req, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={16} style={{ color: 'var(--primary)' }} />
                    <div>
                      <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>{req}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: '#C5221F', fontWeight: '500' }}>Status: Pending</span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '12.5px' }}
                    onClick={() => handleUploadNowClick(req)}
                  >
                    <Upload size={12} /> Upload Now
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#137333', backgroundColor: '#E6F4EA', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
              <ShieldCheck size={16} />
              <span>All required evidence deliverables have been uploaded successfully.</span>
            </div>
          )}
        </div>

        {/* Evidence Upload Area Section */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <h4 style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Evidence Upload Area
          </h4>

          {uploading ? (
            /* Upload Progress Indicator */
            <div className="upload-progress-container">
              <div className="dropzone-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Upload size={24} />
              </div>
              <div className="upload-progress-info">
                <span className="upload-progress-name">Uploading: {uploadFileName} {activeReqForUpload && `(For: ${activeReqForUpload})`}</span>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{uploadProgress}% completed</span>
              </div>
            </div>
          ) : (
            /* Drag and Drop Box */
            <div 
              className={`dropzone ${dragActive ? 'dragover' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
              />
              <div className="dropzone-icon">
                <Upload size={24} />
              </div>
              <span className="dropzone-text">Drag & Drop files here or click to upload</span>
              <span className="dropzone-hint">Allowed formats: PDF, DOC, DOCX, PNG, JPG, JPEG, ZIP (Maximum file size: 100 MB)</span>
            </div>
          )}
        </div>
      </div>

      {/* Mock Document Preview Modal */}
      <Modal 
        isOpen={previewOpen} 
        title={`File Preview: ${previewFile?.name}`} 
        onClose={() => setPreviewOpen(false)}
      >
        <div style={{ backgroundColor: '#F8F9FA', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '28px', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <FileText size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>{previewFile?.name}</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '360px', lineHeight: '1.5', margin: '0 auto' }}>
            <strong>Requirement Mapping:</strong> {previewFile?.requirement}<br />
            <strong>Size:</strong> {previewFile?.size} | <strong>Uploaded On:</strong> {previewFile?.date}<br /><br />
            <span style={{ fontStyle: 'italic' }}>[Mock Document Viewer]</span><br />
            This is a secure preview of the file submitted for {control.id}. The content is verified for compliance checking.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <button className="btn btn-secondary" onClick={() => setPreviewOpen(false)}>Close Preview</button>
        </div>
      </Modal>
    </div>
  );
}