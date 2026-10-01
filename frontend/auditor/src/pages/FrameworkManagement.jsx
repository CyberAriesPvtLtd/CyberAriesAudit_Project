import React, { useState, useEffect } from 'react';
import ExcelTable from '../components/ExcelTable';
import Modal from '../components/Modal';
import { 
  FileText, 
  ExternalLink, 
  X,
  CheckCircle2
} from 'lucide-react';
import { 
  formatDateDDMMYYYY, 
  CONTROL_DOMAINS, 
  FRAMEWORK_TYPES, 
  FRAMEWORK_CATEGORIES,
  initialFrameworkRules
} from '../data/frameworkRulesData';
import * as api from '../services/api';

export default function FrameworkManagement({ isReadOnly = true }) {
  const [rulebook, setRulebook] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllControls = async () => {
      try {
        setLoading(true);
        const data = await api.getControls();
        const mappedData = data.map(c => ({
          id: c.id,
          frameworkRules: (c.framework_rules || []).join(', '),
          frameworkRulesList: c.framework_rules || [],
          controlDomain: c.control_domain || '',
          frameworkType: c.audit_type || '',
          frameworkCategory: c.audit_category || '',
          frameworkSubcategory: c.audit_subcategory || '',
          description: c.control_desc || '',
          primaryDocuments: c.primary_evidence || [],
          secondaryDocuments: c.secondary_evidence || [],
          lastUpdated: c.created_at
        }));
        setRulebook(mappedData);
      } catch (err) {
        console.error('Failed to fetch controls:', err);
        setToastMessage('Failed to load framework rules from server.');
      } finally {
        setLoading(false);
      }
    };
    fetchAllControls();
  }, []);

  // Detail Modal States for Table Rows
  const [viewingDescriptionRow, setViewingDescriptionRow] = useState(null);
  const [viewingDocumentsRow, setViewingDocumentsRow] = useState(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState('');

  const getDocsArray = (docsProp) => {
    if (Array.isArray(docsProp)) return docsProp;
    if (typeof docsProp === 'string' && docsProp.trim()) {
      return docsProp.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  };

  // Domain Badge Helper (EXACT ADMIN BADGES)
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
  // TABLE COLUMNS (EXACTLY MATCHING ADMIN)
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
                  backgroundColor: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: 'var(--accent-primary, #6366F1)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontFamily: 'monospace',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'inline-block',
                  maxWidth: '190px',
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
  // SEARCH & FILTERS
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
      options: dynamicFrameworkTypes
    },
    {
      label: 'Control Domain',
      key: 'controlDomain',
      options: dynamicControlDomains
    },
    {
      label: 'Framework Category',
      key: 'frameworkCategory',
      options: dynamicFrameworkCategories
    }
  ];

  return (
    <div className="page-container">
      {/* Toast Notification */}
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

      {/* Page Header (EXACT ADMIN HEADER & SUBTITLE) */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Compliance Rulebook & Controls</h1>
          <p className="page-subtitle">Framework management, regulatory control rules, and compliance documentation registry.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => alert('Exporting framework rules database...')}>
            Export Database
          </button>
        </div>
      </div>

      {/* Framework Management Table (EXACT ADMIN TABLE) */}
      <ExcelTable
        columns={columns}
        data={rulebook}
        searchPlaceholder="Search by Framework Rule, Domain, Category..."
        searchKeys={['frameworkRules', 'controlDomain', 'frameworkType', 'frameworkCategory', 'frameworkSubcategory', 'description']}
        filterOptions={filterOptions}
        tableName="CyberAries_Framework_Management"
      />

      {/* MODAL 1: Full Description Viewer Modal (EXACT ADMIN MODAL) */}
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

      {/* MODAL 2: All Documents Viewer Modal (EXACT ADMIN MODAL) */}
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
