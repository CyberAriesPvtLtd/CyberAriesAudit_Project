import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ExcelTable from '../components/ExcelTable';
import Modal from '../components/Modal';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ExternalLink, 
  X, 
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  formatDateDDMMYYYY, 
  CONTROL_DOMAINS, 
  FRAMEWORK_TYPES, 
  FRAMEWORK_CATEGORIES 
} from '../data/frameworkRulesData';

export default function Rulebook() {
  const { rulebook, uploadFramework } = useApp();

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Detail Modal States for Table Rows
  const [viewingDescriptionRow, setViewingDescriptionRow] = useState(null);
  const [viewingDocumentsRow, setViewingDocumentsRow] = useState(null);

  // Upload Form Fields
  const [selectedFile, setSelectedFile] = useState(null);
  const [referenceLink, setReferenceLink] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');

  const fileInputRef = useRef(null);

  // Helper to trigger success toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Reset upload form
  const handleCloseUploadModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setReferenceLink('');
    setDescription('');
    setValidationError('');
    setIsDragging(false);
  };

  // File Handlers
  const handleFileSelect = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      setValidationError('Only .xlsx and .xls Excel files are supported.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setValidationError('');
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Parse Excel File & Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setValidationError('Please select or drag & drop an Excel file (.xlsx or .xls) to upload.');
      return;
    }

    try {
      const parsedRules = await parseExcelData(selectedFile, referenceLink, description);
      uploadFramework(parsedRules);
      showToast('Framework Excel uploaded and processed successfully!');
      handleCloseUploadModal();
    } catch (err) {
      console.error('Failed to parse framework excel:', err);
      setValidationError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls document.');
    }
  };

  const parseExcelData = (file, refLink, desc) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonRows = XLSX.utils.sheet_to_json(worksheet);

          const today = new Date();
          const dd = String(today.getDate()).padStart(2, '0');
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const yyyy = today.getFullYear();
          const formattedDate = `${dd}-${mm}-${yyyy}`;

          if (jsonRows && jsonRows.length > 0) {
            const parsed = jsonRows.map((row, index) => ({
              id: `FR-${Date.now()}-${index}`,
              frameworkRules: row['Framework Rules'] || row['Framework Rule'] || row['Rule'] || row['Control Name'] || `FR-${index + 1}: ${file.name.replace(/\.[^/.]+$/, '')} Standard`,
              controlDomain: row['Control Domain'] || row['Domain'] || 'Govern (GV)',
              frameworkType: row['Framework Type'] || row['Type'] || row['Framework'] || 'SEBI CSCRF',
              frameworkCategory: row['Framework Category'] || row['Category'] || 'Governance & Risk Management',
              frameworkSubcategory: row['Framework Subcategory'] || row['Subcategory'] || 'Cybersecurity Policy & Strategy',
              description: row['Description'] || desc || 'Imported framework rule from uploaded excel specification file.',
              primaryDocuments: row['Primary Documents'] 
                ? (Array.isArray(row['Primary Documents']) ? row['Primary Documents'] : String(row['Primary Documents']).split(',').map(s => s.trim())) 
                : [file.name],
              secondaryDocuments: row['Secondary Documents'] 
                ? (Array.isArray(row['Secondary Documents']) ? row['Secondary Documents'] : String(row['Secondary Documents']).split(',').map(s => s.trim())) 
                : (refLink ? [refLink] : ['Framework_Mapping_Doc.pdf']),
              lastUpdated: row['Last Updated'] || formattedDate,
              referenceLink: refLink || row['Reference Link'] || ''
            }));
            resolve(parsed);
          } else {
            const fallback = [{
              id: `FR-${Date.now()}-1`,
              frameworkRules: `FR-001: ${file.name.replace(/\.[^/.]+$/, '')} Framework Rule`,
              controlDomain: 'Govern (GV)',
              frameworkType: 'SEBI CSCRF',
              frameworkCategory: 'Governance & Risk Management',
              frameworkSubcategory: 'Cybersecurity Policy & Strategy',
              description: desc || `Uploaded compliance framework rule set derived from file ${file.name}.`,
              primaryDocuments: [file.name],
              secondaryDocuments: refLink ? [refLink] : ['Compliance_Audit_Spec.pdf'],
              lastUpdated: formattedDate,
              referenceLink: refLink || ''
            }];
            resolve(fallback);
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDocsArray = (docsProp) => {
    if (Array.isArray(docsProp)) return docsProp;
    if (typeof docsProp === 'string' && docsProp.trim()) {
      return docsProp.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  // Domain Badge Helper
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
        {domStr}
      </span>
    );
  };

  // Document Cell Helper (Horizontal compact chip + badge, max 1 visible chip to keep 100% clean table alignment)
  const renderDocsCell = (row, isPrimary = true) => {
    const docsList = getDocsArray(isPrimary ? row.primaryDocuments : row.secondaryDocuments);

    if (docsList.length === 0) {
      return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>;
    }

    const firstDoc = docsList[0];
    const remainingCount = docsList.length - 1;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', maxWidth: '160px', overflow: 'hidden' }}>
        <span
          className={`compact-doc-chip ${isPrimary ? 'primary-chip' : 'secondary-chip'}`}
          title="Click to view documents"
          onClick={(e) => {
            e.stopPropagation();
            setViewingDocumentsRow(row);
          }}
          style={{ maxWidth: '110px', flexShrink: 1, cursor: 'pointer' }}
        >
          <FileText size={11} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstDoc}</span>
        </span>

        {remainingCount > 0 && (
          <button
            type="button"
            className="more-docs-badge"
            onClick={(e) => {
              e.stopPropagation();
              setViewingDocumentsRow(row);
            }}
            title="Click to view all documents"
          >
            +{remainingCount}
          </button>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // TABLE COLUMNS (STRICT WIDTHS & ZERO OVERLAP)
  // ----------------------------------------------------
  const columns = [
    {
      header: 'Framework Rules',
      accessor: 'frameworkRules',
      sortable: true,
      width: '210px',
      cell: (row) => {
        const rulesArray = row.frameworkRulesList || [];
        
        if (rulesArray.length === 0) {
          return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>;
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '195px' }}>
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
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'inline-block'
                }}
              >
                {rule}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Control Domain',
      accessor: 'controlDomain',
      sortable: true,
      width: '130px',
      cell: (row) => renderDomainBadge(row.controlDomain)
    },
    {
      header: 'Framework Type',
      accessor: 'frameworkType',
      sortable: true,
      width: '120px',
      cell: (row) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 9px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          backgroundColor: '#F8FAFC',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          whiteSpace: 'nowrap'
        }}>
          {row.frameworkType}
        </span>
      )
    },
    {
      header: 'Framework Category',
      accessor: 'frameworkCategory',
      sortable: true,
      width: '180px',
      cell: (row) => (
        <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: '500', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.frameworkCategory}>
          {row.frameworkCategory}
        </span>
      )
    },
    {
      header: 'Framework Subcategory',
      accessor: 'frameworkSubcategory',
      sortable: true,
      width: '180px',
      cell: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.frameworkSubcategory}>
          {row.frameworkSubcategory}
        </span>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      sortable: false,
      width: '240px',
      cell: (row) => {
        const text = row.description || '';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '225px', overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={text}>
              {text}
            </span>
            <button 
              type="button"
              className="read-more-btn"
              onClick={(e) => {
                e.stopPropagation();
                setViewingDescriptionRow(row);
              }}
            >
              ... View Details
            </button>
          </div>
        );
      }
    },
    {
      header: 'Primary Documents',
      accessor: 'primaryDocuments',
      sortable: false,
      width: '170px',
      cell: (row) => renderDocsCell(row, true)
    },
    {
      header: 'Secondary Documents',
      accessor: 'secondaryDocuments',
      sortable: false,
      width: '170px',
      cell: (row) => renderDocsCell(row, false)
    },
    {
      header: 'Last Updated',
      accessor: 'lastUpdated',
      sortable: true,
      width: '110px',
      cell: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          {formatDateDDMMYYYY(row.lastUpdated)}
        </span>
      )
    }
  ];

  // ----------------------------------------------------
  // SEARCH & FILTERS (Dynamic)
  // ----------------------------------------------------
  const dynamicFrameworkTypes = [...new Set(rulebook.map(r => r.frameworkType).filter(Boolean))];
  const dynamicControlDomains = [...new Set(rulebook.map(r => r.controlDomain).filter(Boolean))];
  const dynamicFrameworkCategories = [...new Set(rulebook.map(r => r.frameworkCategory).filter(Boolean))];

  const filterOptions = [
    {
      label: 'Framework Type',
      key: 'frameworkType',
      options: dynamicFrameworkTypes.length > 0 ? dynamicFrameworkTypes : FRAMEWORK_TYPES
    },
    {
      label: 'Control Domain',
      key: 'controlDomain',
      options: dynamicControlDomains.length > 0 ? dynamicControlDomains : CONTROL_DOMAINS
    },
    {
      label: 'Framework Category',
      key: 'frameworkCategory',
      options: dynamicFrameworkCategories.length > 0 ? dynamicFrameworkCategories : FRAMEWORK_CATEGORIES
    }
  ];

  return (
    <div className="page-container">
      {/* Success Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#1E293B',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '500',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <CheckCircle2 size={18} color="#4ADE80" />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage('')}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', marginLeft: '8px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Compliance Rulebook & Controls</h1>
          <p className="page-subtitle">Framework management, regulatory control rules, and compliance documentation registry.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => alert('Exporting framework rules database...')}>
            Export Database
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            + Add Control
          </button>
        </div>
      </div>

      {/* Framework Management Table */}
      <ExcelTable
        columns={columns}
        data={rulebook}
        searchPlaceholder="Search by Framework Rule, Domain, Category..."
        searchKeys={['frameworkRules', 'controlDomain', 'frameworkType', 'frameworkCategory', 'frameworkSubcategory', 'description']}
        filterOptions={filterOptions}
        tableName="CyberAries_Framework_Management"
      />

      {/* MODAL 1: Upload Framework Excel */}
      <Modal isOpen={isModalOpen} onClose={handleCloseUploadModal} title="Upload Framework Excel">
        <form onSubmit={handleUploadSubmit}>
          {/* FIELD 1: Excel Upload */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              Excel Upload <span style={{ color: 'var(--primary)' }}>*</span>
            </label>

            {!selectedFile ? (
              <div 
                className={`excel-upload-dropzone ${isDragging ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  onChange={handleInputChange}
                  style={{ display: 'none' }}
                />
                
                <div className="excel-upload-icon-wrapper">
                  <UploadCloud size={28} />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p className="excel-upload-title">Drag & Drop Excel File Here</p>
                  <p className="excel-upload-subtitle" style={{ margin: '4px 0 10px 0' }}>or click to browse your computer</p>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <FileSpreadsheet size={15} style={{ marginRight: '6px' }} />
                    Browse File
                  </button>
                </div>
                
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Supports: .xlsx, .xls
                </p>
              </div>
            ) : (
              <div className="excel-upload-success-card">
                <div className="excel-upload-success-info">
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    backgroundColor: '#137333',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="excel-upload-file-details">
                    <span className="excel-upload-file-name">{selectedFile.name}</span>
                    <span className="excel-upload-file-meta">
                      {formatFileSize(selectedFile.size)} • Ready for import
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#137333',
                    backgroundColor: '#FFFFFF',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: '1px solid #A8DAB5'
                  }}>
                    <Check size={14} /> Upload Success State
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setValidationError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {validationError && (
              <div className="excel-upload-error-msg">
                <AlertCircle size={15} />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* FIELD 2: Reference Link (Optional) */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ fontWeight: '500', margin: 0 }}>Reference Link</label>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Optional</span>
            </div>
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/framework-document"
              value={referenceLink}
              onChange={(e) => setReferenceLink(e.target.value)}
            />
          </div>

          {/* FIELD 3: Description (Optional) */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ fontWeight: '500', margin: 0 }}>Description</label>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Optional</span>
            </div>
            <textarea
              className="form-input"
              style={{ minHeight: '90px', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Enter framework upload notes or description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="modal-footer" style={{ margin: '24px -24px -24px -24px' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseUploadModal}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <UploadCloud size={16} style={{ marginRight: '6px' }} />
              Upload Framework
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Full Description Viewer Modal */}
      <Modal 
        isOpen={!!viewingDescriptionRow} 
        onClose={() => setViewingDescriptionRow(null)} 
        title="Full Framework Rule Description"
      >
        {viewingDescriptionRow && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  {viewingDescriptionRow.frameworkRules}
                </h4>
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', alignItems: 'center' }}>
                  <span>Type: <strong>{viewingDescriptionRow.frameworkType}</strong></span>
                  <span>•</span>
                  <span>Category: <strong>{viewingDescriptionRow.frameworkCategory}</strong></span>
                </div>
              </div>
              {renderDomainBadge(viewingDescriptionRow.controlDomain)}
            </div>

            <div style={{ 
              backgroundColor: '#F8FAFC', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: '16px',
              fontSize: '13.5px',
              color: 'var(--text-primary)',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {viewingDescriptionRow.description}
            </div>

            {viewingDescriptionRow.referenceLink && (
              <a
                href={viewingDescriptionRow.referenceLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} /> Open Reference Document Link
              </a>
            )}

            <div className="modal-footer" style={{ margin: '16px -24px -24px -24px' }}>
              <button className="btn btn-secondary" onClick={() => setViewingDescriptionRow(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: All Documents Viewer Modal */}
      <Modal 
        isOpen={!!viewingDocumentsRow} 
        onClose={() => setViewingDocumentsRow(null)} 
        title="Framework Rule Documents Registry"
      >
        {viewingDocumentsRow && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {viewingDocumentsRow.frameworkRules}
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                Complete primary and secondary reference documents for this rule.
              </p>
            </div>

            {/* Primary Documents */}
            <div>
              <h5 style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Primary Documents ({getDocsArray(viewingDocumentsRow.primaryDocuments).length})
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getDocsArray(viewingDocumentsRow.primaryDocuments).length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No primary documents attached</span>
                ) : (
                  getDocsArray(viewingDocumentsRow.primaryDocuments).map((doc, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'rgba(229, 57, 53, 0.05)',
                      border: '1px solid rgba(229, 57, 53, 0.2)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={16} color="var(--primary)" />
                        <span style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--text-primary)' }}>{doc}</span>
                      </div>
                      <span style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: '600', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(229, 57, 53, 0.3)' }}>Primary</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Secondary Documents */}
            <div>
              <h5 style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Secondary Documents ({getDocsArray(viewingDocumentsRow.secondaryDocuments).length})
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getDocsArray(viewingDocumentsRow.secondaryDocuments).length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No secondary documents attached</span>
                ) : (
                  getDocsArray(viewingDocumentsRow.secondaryDocuments).map((doc, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={16} color="var(--text-secondary)" />
                        <span style={{ fontSize: '13.5px', fontWeight: '500', color: 'var(--text-primary)' }}>{doc}</span>
                      </div>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: '500', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #CBD5E1' }}>Secondary</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '16px -24px -24px -24px' }}>
              <button className="btn btn-secondary" onClick={() => setViewingDocumentsRow(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
