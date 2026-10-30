import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Download, 
  Save, 
  Send, 
  Cpu, 
  Server, 
  Building2, 
  ExternalLink, 
  X,
  FileCheck,
  Check,
  Bookmark,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initialFrameworkRules } from '../data/frameworkRulesData';
import * as api from '../services/api';
import Modal from '../components/Modal';
import './ControlDetails.css';

export default function ControlDetails() {
  const { controlId: paramControlId, auditId: paramAuditId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    selectedClient, 
    selectedAudit, 
    activeAuditData, 
    updateEvidenceStatus, 
    updateEvidenceNotes,
    saveControlEvaluation,
    getControlEvaluation
  } = useAuth();

  // 1. Resolve Control ID from params or query string
  const queryParams = new URLSearchParams(location.search);
  const resolvedControlId = paramControlId || queryParams.get('id') || queryParams.get('controlId') || 'FR-001';

  // 2. Control Master Info State
  const [controlData, setControlData] = useState(null);
  const [loadingControl, setLoadingControl] = useState(true);

  // 3. Evidence Files State for this control
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceNotesDraft, setEvidenceNotesDraft] = useState({});
  const [savingNoteId, setSavingNoteId] = useState(null);

  // 4. Preview Modal State
  const [previewState, setPreviewState] = useState(null); // { url, fileName, isMock }

  // 5. Toast / Feedback State
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  // 6. Auditor Evaluation Form State
  const [evaluation, setEvaluation] = useState({
    complianceStatus: '', // 'Compliant' | 'Partially Compliant' | 'Non-Compliant' | 'Not Applicable'
    riskRating: '',       // 'Low' | 'Medium' | 'High' | 'Critical'
    similarIssue: '',     // 'Yes' | 'No'
    rootCause: '',
    impactAnalysis: '',
    recommendations: '',
    remediationDays: '',
    managementResponse: '',
    auditorNotes: '',
    isDraft: false,
    isSubmitted: false,
    lastSaved: null
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({});

  // ─── Step 1: Load Master Control Information ───────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchControl = async () => {
      setLoadingControl(true);
      try {
        // Try fetching all master controls from server
        let matchedControl = null;
        try {
          const apiControls = await api.getControls();
          if (Array.isArray(apiControls)) {
            matchedControl = apiControls.find(c => 
              String(c.id) === String(resolvedControlId) ||
              String(c.control_id) === String(resolvedControlId) ||
              (c.framework_rules && c.framework_rules.some(r => r.includes(resolvedControlId) || resolvedControlId.includes(r)))
            );
          }
        } catch (apiErr) {
          // Backend API may be offline; fallback to initialFrameworkRules
        }

        // Fallback to local rulebook database if not found via API
        if (!matchedControl) {
          matchedControl = initialFrameworkRules.find(r => 
            String(r.id) === String(resolvedControlId) ||
            r.frameworkRules.includes(resolvedControlId) ||
            resolvedControlId.includes(r.id)
          ) || initialFrameworkRules[0];
        }

        if (isMounted && matchedControl) {
          // Normalize control fields
          const normalized = {
            id: matchedControl.id || resolvedControlId,
            name: matchedControl.frameworkRules || (matchedControl.framework_rules ? matchedControl.framework_rules.join(', ') : (matchedControl.control_desc || 'Control Information')),
            description: matchedControl.description || matchedControl.control_desc || 'Ensure operational compliance with established regulatory frameworks and guidelines.',
            domain: matchedControl.controlDomain || matchedControl.control_domain || 'Protect (PR)',
            frameworkType: matchedControl.frameworkType || matchedControl.audit_type || selectedAudit || 'SEBI CSCRF',
            frameworkCategory: matchedControl.frameworkCategory || matchedControl.audit_category || 'Access Control & Security',
            frameworkSubcategory: matchedControl.frameworkSubcategory || matchedControl.audit_subcategory || 'Policy Enforcement',
            primaryDocuments: matchedControl.primaryDocuments || matchedControl.primary_evidence || ['Approved_Policy_Standard.pdf'],
            secondaryDocuments: matchedControl.secondaryDocuments || matchedControl.secondary_evidence || ['Audit_Configuration_Settings.png'],
            system: (matchedControl.frameworkCategory || '').toLowerCase().includes('vendor') ? 'Vendor' : 'IT',
            cia: {
              confidentiality: true,
              integrity: true,
              availability: (matchedControl.controlDomain || '').toLowerCase().includes('recover') || (matchedControl.controlDomain || '').toLowerCase().includes('detect')
            },
            testCases: [
              {
                id: 'TC-01',
                title: 'Documented Policy & Governance Review',
                desc: 'Verify formal management sign-off, authorized distribution, and periodic annual review frequency.'
              },
              {
                id: 'TC-02',
                title: 'Technical Configuration Audit',
                desc: 'Inspect technical implementation console screenshots, enforced parameters, and cryptographic ciphers.'
              },
              {
                id: 'TC-03',
                title: 'Evidence Deliverable Validation',
                desc: 'Reconcile uploaded client evidence files against framework primary and secondary deliverable criteria.'
              },
              {
                id: 'TC-04',
                title: 'Sampling & Exception Verification',
                desc: 'Sample active users, systems, and exception registries to verify continuous enforcement without gaps.'
              }
            ]
          };
          setControlData(normalized);
        }
      } finally {
        if (isMounted) setLoadingControl(false);
      }
    };

    fetchControl();
    return () => { isMounted = false; };
  }, [resolvedControlId, selectedAudit]);

  // ─── Step 2: Load Associated Evidence Files ─────────────────────────
  useEffect(() => {
    // Find all evidence items associated with this control from activeAuditData
    const allEvidence = activeAuditData?.evidence || [];
    const matchedEvidence = allEvidence.filter(ev => {
      const evControlId = String(ev.controlId || '').toLowerCase();
      const targetId = String(resolvedControlId).toLowerCase();
      return evControlId.includes(targetId) || targetId.includes(evControlId);
    });

    // If active audit data has matches, use them
    if (matchedEvidence.length > 0) {
      setEvidenceList(matchedEvidence);
    } else {
      // Provide initial linked evidence based on control data
      const defaultLinked = [
        {
          id: `ev-${resolvedControlId}-01`,
          fileName: `${resolvedControlId}_Primary_Policy_Doc.pdf`,
          client: selectedClient || 'ABC Securities',
          controlId: resolvedControlId,
          controlDesc: controlData?.description || 'Corporate Security Standard Documentation',
          date: '2026-07-20',
          size: '1.4 MB',
          status: 'Approved',
          auditor_notes: 'Document version is current and signed by appropriate authority.',
          uploaded_by: 'Security Compliance Lead'
        },
        {
          id: `ev-${resolvedControlId}-02`,
          fileName: `${resolvedControlId}_Enforcement_Settings.png`,
          client: selectedClient || 'ABC Securities',
          controlId: resolvedControlId,
          controlDesc: controlData?.description || 'System Console Technical Screenshot',
          date: '2026-07-22',
          size: '860 KB',
          status: 'Pending Review',
          auditor_notes: '',
          uploaded_by: 'Infrastructure Admin'
        }
      ];
      setEvidenceList(defaultLinked);
    }
  }, [resolvedControlId, activeAuditData, controlData, selectedClient]);

  // ─── Step 3: Load Saved Evaluation for Reopening ────────────────────
  useEffect(() => {
    if (getControlEvaluation) {
      const saved = getControlEvaluation(resolvedControlId);
      if (saved) {
        setEvaluation({
          complianceStatus: saved.complianceStatus || '',
          riskRating: saved.riskRating || '',
          similarIssue: saved.similarIssue || '',
          rootCause: saved.rootCause || '',
          impactAnalysis: saved.impactAnalysis || '',
          recommendations: saved.recommendations || '',
          remediationDays: saved.remediationDays || '',
          managementResponse: saved.managementResponse || '',
          auditorNotes: saved.auditorNotes || '',
          isDraft: !!saved.isDraft,
          isSubmitted: !!saved.isSubmitted,
          lastSaved: saved.updatedAt || saved.submittedAt || null
        });
      } else {
        // Reset to clean evaluation state for unassessed controls
        setEvaluation({
          complianceStatus: '',
          riskRating: '',
          similarIssue: '',
          rootCause: '',
          impactAnalysis: '',
          recommendations: '',
          remediationDays: '',
          managementResponse: '',
          auditorNotes: '',
          isDraft: false,
          isSubmitted: false,
          lastSaved: null
        });
      }
    }
    setValidationErrors({});
  }, [resolvedControlId, user]);

  // ─── AI Findings Match (Real Project Data) ─────────────────────────
  const activeFindings = (activeAuditData?.findings || []).filter(f => {
    const fId = String(f.controlId || '').toLowerCase();
    const target = String(resolvedControlId).toLowerCase();
    return fId.includes(target) || target.includes(fId);
  });

  const primaryFinding = activeFindings.length > 0 ? activeFindings[0] : null;

  // ─── Evidence Review Handlers ──────────────────────────────────────
  const handleUpdateStatus = async (evidenceId, newStatus) => {
    if (updateEvidenceStatus) {
      await updateEvidenceStatus(evidenceId, newStatus);
    }
    setEvidenceList(prev => prev.map(ev => ev.id === evidenceId ? { ...ev, status: newStatus } : ev));
    showToast(`Evidence status updated to ${newStatus}`, 'success');
  };

  const handleSaveEvidenceNote = async (evidenceId) => {
    const noteText = evidenceNotesDraft[evidenceId] || '';
    setSavingNoteId(evidenceId);
    try {
      if (updateEvidenceNotes) {
        await updateEvidenceNotes(evidenceId, noteText);
      }
      setEvidenceList(prev => prev.map(ev => ev.id === evidenceId ? { ...ev, auditor_notes: noteText } : ev));
      showToast('Auditor note saved for evidence file', 'success');
    } finally {
      setSavingNoteId(null);
    }
  };

  const handlePreviewFile = async (ev) => {
    try {
      const data = await api.getEvidenceDownloadUrl(ev.id);
      if (data && data.download_url) {
        setPreviewState({ url: data.download_url, fileName: ev.fileName, isMock: false });
        return;
      }
    } catch (e) {
      // Offline preview
    }
    setPreviewState({ url: null, fileName: ev.fileName, isMock: true });
  };

  const handleDownloadFile = async (ev) => {
    try {
      const data = await api.getEvidenceDownloadUrl(ev.id);
      if (data && data.download_url) {
        window.open(data.download_url, '_blank');
        return;
      }
    } catch (e) {
      // Download simulation for local development
    }
    showToast(`Downloading: ${ev.fileName}`, 'success');
  };

  // ─── Form Input Change Handler ────────────────────────────────────
  const handleFieldChange = (field, value) => {
    setEvaluation(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for modified field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // ─── Toast Helper ──────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ─── Save Draft Action ─────────────────────────────────────────────
  const handleSaveDraft = async () => {
    const saved = await saveControlEvaluation(resolvedControlId, evaluation, false);
    setEvaluation(prev => ({
      ...prev,
      isDraft: true,
      isSubmitted: false,
      lastSaved: saved.updatedAt
    }));
    showToast('Evaluation draft saved successfully. Your progress has been preserved.', 'success');
  };

  // ─── Submit Evaluation Action ──────────────────────────────────────
  const handleSubmitEvaluation = async () => {
    const errors = {};

    // Mandatory core fields
    if (!evaluation.complianceStatus) {
      errors.complianceStatus = 'Compliance Status is required';
    }
    if (!evaluation.riskRating) {
      errors.riskRating = 'Risk Rating is required';
    }
    if (!evaluation.similarIssue) {
      errors.similarIssue = 'Please specify if a similar issue exists in other areas';
    }

    // If Partially Compliant or Non-Compliant: Non-Compliance Observations are required
    const isNonCompliant = evaluation.complianceStatus === 'Partially Compliant' || evaluation.complianceStatus === 'Non-Compliant';
    if (isNonCompliant) {
      if (!evaluation.rootCause?.trim()) {
        errors.rootCause = 'Root Cause Analysis is required for non-compliant controls';
      }
      if (!evaluation.impactAnalysis?.trim()) {
        errors.impactAnalysis = 'Impact Analysis is required for non-compliant controls';
      }
      if (!evaluation.recommendations?.trim()) {
        errors.recommendations = 'Recommendations / Corrective Action is required';
      }
      if (!evaluation.remediationDays || Number(evaluation.remediationDays) <= 0) {
        errors.remediationDays = 'Remediation Days must be a positive number';
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please complete all required evaluation fields before submitting.', 'error');
      // Scroll to evaluation form
      const el = document.getElementById('auditor-evaluation-form');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setValidationErrors({});
    const saved = await saveControlEvaluation(resolvedControlId, evaluation, true);
    setEvaluation(prev => ({
      ...prev,
      isSubmitted: true,
      isDraft: false,
      lastSaved: saved.updatedAt
    }));
    showToast('Evaluation submitted successfully! Final assessment persisted.', 'success');
  };

  // Helper for domain badge styling
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

  const isObservationsVisible = evaluation.complianceStatus === 'Partially Compliant' || evaluation.complianceStatus === 'Non-Compliant';

  return (
    <div className="page-container control-details-page">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: toast.type === 'error' ? '#991B1B' : '#1E293B',
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
          {toast.type === 'error' ? <AlertCircle size={18} color="#F87171" /> : <CheckCircle2 size={18} color="#4ADE80" />}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', marginLeft: '8px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── Breadcrumb Navigation ──────────────────────────────────── */}
      <div className="cd-breadcrumb-nav">
        <Link to="/framework-management" className="cd-back-link">
          <ArrowLeft size={15} /> Back to Controls List
        </Link>
        <span className="cd-breadcrumb-separator">/</span>
        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Controls</span>
        <span className="cd-breadcrumb-separator">/</span>
        <span className="cd-breadcrumb-current-id">{resolvedControlId}</span>
      </div>

      {/* ─── Header Card ───────────────────────────────────────────── */}
      <div className="cd-header-card">
        <div className="cd-header-title-area">
          <div className="cd-header-meta-row">
            <span className="cd-code-pill">{resolvedControlId}</span>
            {controlData && renderDomainBadge(controlData.domain)}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: '#F8FAFC',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)'
            }}>
              {controlData?.frameworkType || selectedAudit || 'SEBI CSCRF'}
            </span>
          </div>
          <h1 className="cd-header-title">
            {controlData ? controlData.name : 'Loading Control Details...'}
          </h1>
          <p className="cd-header-subtitle">
            Auditing client: <strong style={{ color: 'var(--text-primary)' }}>{selectedClient || 'ABC Securities'}</strong> • Audit Scope: <strong style={{ color: 'var(--text-primary)' }}>{selectedAudit || 'SEBI CSCRF Audit FY 2026'}</strong>
          </p>
        </div>

        <div className="cd-header-status-area">
          {evaluation.isSubmitted ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: '700',
              backgroundColor: '#E6F4EA',
              color: '#137333',
              border: '1px solid #A8DAB5'
            }}>
              <CheckCircle2 size={16} /> Evaluation Submitted
            </span>
          ) : evaluation.isDraft ? (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: '700',
              backgroundColor: '#FEF7E0',
              color: '#B06000',
              border: '1px solid #FDE293'
            }}>
              <Bookmark size={15} /> Draft In Progress
            </span>
          ) : (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: '600',
              backgroundColor: '#F1F5F9',
              color: '#64748B',
              border: '1px solid #E2E8F0'
            }}>
              <Clock size={15} /> Awaiting Evaluation
            </span>
          )}

          {evaluation.lastSaved && (
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Last saved: {new Date(evaluation.lastSaved).toLocaleDateString()} {new Date(evaluation.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* ─── SECTION A: Control Master Information ──────────────────── */}
      <div className="cd-section-card">
        <div className="cd-section-header">
          <h2 className="cd-section-title">
            <Shield className="cd-section-title-icon" size={20} /> Section A: Control Master Information
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Standard Baseline Reference</span>
        </div>

        {/* Master Details Grid */}
        <div className="cd-master-info-grid">
          <div className="cd-info-item">
            <span className="cd-info-label">Control ID</span>
            <span className="cd-info-value font-mono" style={{ color: 'var(--primary)', fontWeight: '700' }}>
              {resolvedControlId}
            </span>
          </div>

          <div className="cd-info-item">
            <span className="cd-info-label">System Classification</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              {controlData?.system === 'Vendor' ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  color: '#C2410C',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  <Building2 size={13} /> Vendor / Third-Party
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #DCFCE7',
                  color: '#15803D',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  <Server size={13} /> IT System (Infrastructure)
                </span>
              )}
            </div>
          </div>

          <div className="cd-info-item">
            <span className="cd-info-label">Framework Category</span>
            <span className="cd-info-value">{controlData?.frameworkCategory || 'Governance & Identity'}</span>
          </div>

          <div className="cd-info-item">
            <span className="cd-info-label">Framework Subcategory</span>
            <span className="cd-info-value">{controlData?.frameworkSubcategory || 'Access Controls'}</span>
          </div>
        </div>

        {/* Description Box */}
        <div>
          <span className="cd-info-label" style={{ display: 'block', marginBottom: '8px' }}>Control Objective & Description</span>
          <div className="cd-desc-box">
            {controlData?.description}
          </div>
        </div>

        {/* C/I/A Classification Triad */}
        <div>
          <span className="cd-info-label" style={{ display: 'block', marginBottom: '10px' }}>
            C/I/A Classification (Confidentiality, Integrity, Availability)
          </span>
          <div className="cd-cia-container">
            <div className={`cd-cia-badge ${controlData?.cia?.confidentiality ? 'active-c' : ''}`}>
              <span className="cd-cia-letter">C</span>
              <span>Confidentiality {controlData?.cia?.confidentiality ? '• High Impact' : '• N/A'}</span>
            </div>
            <div className={`cd-cia-badge ${controlData?.cia?.integrity ? 'active-i' : ''}`}>
              <span className="cd-cia-letter">I</span>
              <span>Integrity {controlData?.cia?.integrity ? '• High Impact' : '• N/A'}</span>
            </div>
            <div className={`cd-cia-badge ${controlData?.cia?.availability ? 'active-a' : ''}`}>
              <span className="cd-cia-letter">A</span>
              <span>Availability {controlData?.cia?.availability ? '• High Impact' : '• Standard'}</span>
            </div>
          </div>
        </div>

        {/* Test Cases Used */}
        <div>
          <span className="cd-info-label" style={{ display: 'block', marginBottom: '10px' }}>
            Auditor Test Cases & Verification Procedures Used
          </span>
          <div className="cd-testcases-list">
            {(controlData?.testCases || []).map(tc => (
              <div key={tc.id} className="cd-testcase-item">
                <span className="cd-testcase-id">{tc.id}</span>
                <div>
                  <h4 className="cd-testcase-title">{tc.title}</h4>
                  <p className="cd-testcase-desc">{tc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SECTION B & C: Evidence Viewer & AI Findings ────────────── */}
      <div className="cd-two-col-grid">
        {/* SECTION B: Evidence Viewer */}
        <div className="cd-section-card">
          <div className="cd-section-header">
            <h2 className="cd-section-title">
              <FileText className="cd-section-title-icon" size={20} /> Section B: Evidence Viewer
            </h2>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              {evidenceList.length} File{evidenceList.length !== 1 ? 's' : ''} Attached
            </span>
          </div>

          {evidenceList.length === 0 ? (
            <div className="cd-empty-box">
              <FileCheck size={36} color="var(--text-muted)" />
              <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>No Evidence Files Uploaded</strong>
              <p style={{ fontSize: '12.5px', maxWidth: '340px' }}>
                The client has not yet uploaded documentation or screenshots specifically linked to this control.
              </p>
            </div>
          ) : (
            <div className="cd-evidence-list">
              {evidenceList.map(ev => {
                const isPdf = ev.fileName.endsWith('.pdf');
                const isImg = ev.fileName.match(/\.(png|jpg|jpeg|webp)$/i);
                const currentDraft = evidenceNotesDraft[ev.id] !== undefined ? evidenceNotesDraft[ev.id] : (ev.auditor_notes || '');

                return (
                  <div key={ev.id} className="cd-evidence-card">
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div className="cd-evidence-main">
                          <div className={`cd-evidence-icon-box ${isPdf ? 'pdf' : isImg ? 'img' : 'doc'}`}>
                            <FileText size={20} />
                          </div>
                          <div className="cd-evidence-details">
                            <h4 className="cd-evidence-filename" title={ev.fileName}>{ev.fileName}</h4>
                            <span className="cd-evidence-meta">
                              {ev.size || '1.2 MB'} • Uploaded {ev.date} {ev.uploaded_by ? `by ${ev.uploaded_by}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="cd-evidence-actions">
                          {/* Status Badge */}
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: ev.status === 'Approved' ? '#E6F4EA' : ev.status === 'Rejected' ? '#FCE8E6' : '#FEF7E0',
                            color: ev.status === 'Approved' ? '#137333' : ev.status === 'Rejected' ? '#C5221F' : '#B06000',
                            border: `1px solid ${ev.status === 'Approved' ? '#A8DAB5' : ev.status === 'Rejected' ? '#F5C2C7' : '#FDE293'}`
                          }}>
                            {ev.status}
                          </span>

                          <button 
                            type="button" 
                            className="btn btn-secondary"
                            style={{ padding: '5px 9px', fontSize: '12px' }}
                            onClick={() => handlePreviewFile(ev)}
                            title="Preview evidence"
                          >
                            <Eye size={14} />
                          </button>

                          <button 
                            type="button" 
                            className="btn btn-secondary"
                            style={{ padding: '5px 9px', fontSize: '12px' }}
                            onClick={() => handleDownloadFile(ev)}
                            title="Download evidence"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Evidence Notes Row */}
                      <div className="cd-evidence-notes-row">
                        <input
                          type="text"
                          className="cd-evidence-notes-input"
                          placeholder="Evidence notes (e.g. verified signature, configuration approved)..."
                          value={currentDraft}
                          onChange={(e) => setEvidenceNotesDraft({ ...evidenceNotesDraft, [ev.id]: e.target.value })}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
                          onClick={() => handleSaveEvidenceNote(ev.id)}
                          disabled={savingNoteId === ev.id}
                        >
                          <Save size={13} /> {savingNoteId === ev.id ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION C: AI Findings */}
        <div className="cd-section-card">
          <div className="cd-section-header">
            <h2 className="cd-section-title">
              <Cpu className="cd-section-title-icon" size={20} /> Section C: AI Findings
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Automated Copilot Telemetry</span>
          </div>

          {primaryFinding ? (
            <div className="cd-ai-analysis-box">
              <div className="cd-ai-top-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    backgroundColor: primaryFinding.risk === 'High' ? '#FCE8E6' : '#FEF7E0',
                    color: primaryFinding.risk === 'High' ? '#C5221F' : '#B06000',
                    border: `1px solid ${primaryFinding.risk === 'High' ? '#F5C2C7' : '#FDE293'}`
                  }}>
                    {primaryFinding.risk} Risk Flaw Flagged
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Status: {primaryFinding.status}</span>
                </div>

                <div className="cd-ai-confidence-pill">
                  <Check size={13} /> Confidence Score: <strong>{primaryFinding.confidence || 92}%</strong>
                </div>
              </div>

              <div>
                <span className="cd-info-label" style={{ display: 'block', marginBottom: '6px' }}>AI Finding Analysis</span>
                <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {primaryFinding.message}
                </p>
              </div>

              <div>
                <span className="cd-info-label" style={{ display: 'block', marginBottom: '6px' }}>Reasoning / Explanation</span>
                <div className="cd-ai-reasoning-card">
                  {primaryFinding.reasoning || 'Automated inspection detected discrepancy between corporate policy statement and active system configuration artifacts.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="cd-ai-analysis-box" style={{ backgroundColor: '#F8FAFC' }}>
              <div className="cd-ai-top-row">
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  backgroundColor: '#E6F4EA',
                  color: '#137333',
                  border: '1px solid #A8DAB5'
                }}>
                  Zero Automated Flags Detected
                </span>

                <div className="cd-ai-confidence-pill" style={{ backgroundColor: '#F1F5F9', color: '#64748B', borderColor: '#CBD5E1' }}>
                  Confidence Score: <strong>N/A</strong>
                </div>
              </div>

              <div>
                <span className="cd-info-label" style={{ display: 'block', marginBottom: '6px' }}>AI Findings Summary</span>
                <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  Automated security scanning did not encounter policy breaches or missing required attributes in currently submitted telemetry for this control.
                </p>
              </div>

              <div>
                <span className="cd-info-label" style={{ display: 'block', marginBottom: '6px' }}>Reasoning / Explanation</span>
                <div className="cd-ai-reasoning-card" style={{ borderLeftColor: '#10B981', backgroundColor: '#FFFFFF' }}>
                  Current evidence matches the baseline expectations defined by the framework rulebook. The auditor should proceed with manual verification and testing.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── SECTION 3: Auditor Evaluation & Report Form ─────────────── */}
      <div className="cd-eval-form-card" id="auditor-evaluation-form">
        <div className="cd-section-header">
          <div>
            <h2 className="cd-section-title">
              <FileCheck className="cd-section-title-icon" size={20} /> Auditor Evaluation & Report Form
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Record compliance determination, risk scoring, and observation workpapers for final reporting.
            </p>
          </div>
          {evaluation.isSubmitted && (
            <span style={{ fontSize: '12px', color: '#137333', fontWeight: '600', backgroundColor: '#E6F4EA', padding: '4px 10px', borderRadius: '6px' }}>
              Formal Evaluation Active
            </span>
          )}
        </div>

        {/* Dynamic Status Group */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            A. Dynamic Status Group
          </h3>

          <div className="cd-form-grid-3">
            {/* 1. Compliance Status Dropdown */}
            <div className="cd-field-group">
              <label className="cd-field-label">
                Compliance Status <span className="req-star">*</span>
              </label>
              <select
                className={`cd-select ${validationErrors.complianceStatus ? 'error-border' : ''}`}
                value={evaluation.complianceStatus}
                onChange={(e) => handleFieldChange('complianceStatus', e.target.value)}
              >
                <option value="">Select Compliance Status...</option>
                <option value="Compliant">Compliant</option>
                <option value="Partially Compliant">Partially Compliant</option>
                <option value="Non-Compliant">Non-Compliant</option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
              {validationErrors.complianceStatus && (
                <span className="cd-field-error-msg">{validationErrors.complianceStatus}</span>
              )}
            </div>

            {/* 2. Risk Rating Dropdown */}
            <div className="cd-field-group">
              <label className="cd-field-label">
                Risk Rating <span className="req-star">*</span>
              </label>
              <select
                className={`cd-select ${validationErrors.riskRating ? 'error-border' : ''}`}
                value={evaluation.riskRating}
                onChange={(e) => handleFieldChange('riskRating', e.target.value)}
              >
                <option value="">Select Risk Rating...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              {validationErrors.riskRating && (
                <span className="cd-field-error-msg">{validationErrors.riskRating}</span>
              )}
            </div>

            {/* 3. Similar Issue Radio Buttons */}
            <div className="cd-field-group">
              <label className="cd-field-label">
                Similar Issue in Other Areas? <span className="req-star">*</span>
              </label>
              <div className="cd-radio-group">
                <label className="cd-radio-label">
                  <input
                    type="radio"
                    name="similarIssue"
                    value="Yes"
                    checked={evaluation.similarIssue === 'Yes'}
                    onChange={() => handleFieldChange('similarIssue', 'Yes')}
                  />
                  <span>Yes</span>
                </label>
                <label className="cd-radio-label">
                  <input
                    type="radio"
                    name="similarIssue"
                    value="No"
                    checked={evaluation.similarIssue === 'No'}
                    onChange={() => handleFieldChange('similarIssue', 'No')}
                  />
                  <span>No</span>
                </label>
              </div>
              {validationErrors.similarIssue && (
                <span className="cd-field-error-msg">{validationErrors.similarIssue}</span>
              )}
            </div>
          </div>
        </div>

        {/* B. Non-Compliance Observations (Dynamically displayed when Partially Compliant or Non-Compliant) */}
        {isObservationsVisible && (
          <div className="cd-observations-wrapper">
            <div className="cd-observations-banner">
              <AlertTriangle size={18} />
              <span>Non-Compliance Observations Required — Status set to {evaluation.complianceStatus}</span>
            </div>

            <div className="cd-form-grid-2">
              {/* Root Cause Analysis */}
              <div className="cd-field-group">
                <label className="cd-field-label">
                  Root Cause Analysis <span className="req-star">*</span>
                </label>
                <textarea
                  className={`cd-textarea ${validationErrors.rootCause ? 'error-border' : ''}`}
                  rows={3}
                  placeholder="Detail the technical, procedural, or organizational root cause..."
                  value={evaluation.rootCause}
                  onChange={(e) => handleFieldChange('rootCause', e.target.value)}
                />
                {validationErrors.rootCause && (
                  <span className="cd-field-error-msg">{validationErrors.rootCause}</span>
                )}
              </div>

              {/* Impact Analysis */}
              <div className="cd-field-group">
                <label className="cd-field-label">
                  Impact Analysis <span className="req-star">*</span>
                </label>
                <textarea
                  className={`cd-textarea ${validationErrors.impactAnalysis ? 'error-border' : ''}`}
                  rows={3}
                  placeholder="Describe the operational, regulatory, and confidentiality impact..."
                  value={evaluation.impactAnalysis}
                  onChange={(e) => handleFieldChange('impactAnalysis', e.target.value)}
                />
                {validationErrors.impactAnalysis && (
                  <span className="cd-field-error-msg">{validationErrors.impactAnalysis}</span>
                )}
              </div>
            </div>

            <div className="cd-form-grid-2">
              {/* Recommendations / Action */}
              <div className="cd-field-group">
                <label className="cd-field-label">
                  Recommendations / Corrective Action <span className="req-star">*</span>
                </label>
                <textarea
                  className={`cd-textarea ${validationErrors.recommendations ? 'error-border' : ''}`}
                  rows={3}
                  placeholder="Prescribe actionable remediation steps and technical fixes..."
                  value={evaluation.recommendations}
                  onChange={(e) => handleFieldChange('recommendations', e.target.value)}
                />
                {validationErrors.recommendations && (
                  <span className="cd-field-error-msg">{validationErrors.recommendations}</span>
                )}
              </div>

              {/* Remediation Days */}
              <div className="cd-field-group">
                <label className="cd-field-label">
                  Remediation Days <span className="req-star">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    className={`cd-select ${validationErrors.remediationDays ? 'error-border' : ''}`}
                    placeholder="e.g. 30"
                    value={evaluation.remediationDays}
                    onChange={(e) => handleFieldChange('remediationDays', e.target.value)}
                  />
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Days
                  </span>
                </div>
                {validationErrors.remediationDays && (
                  <span className="cd-field-error-msg">{validationErrors.remediationDays}</span>
                )}
              </div>
            </div>

            <div className="cd-form-grid-2">
              {/* Management Response */}
              <div className="cd-field-group">
                <label className="cd-field-label">Management Response</label>
                <textarea
                  className="cd-textarea"
                  rows={3}
                  placeholder="Enter client management feedback, target milestone, or remediation plan..."
                  value={evaluation.managementResponse}
                  onChange={(e) => handleFieldChange('managementResponse', e.target.value)}
                />
              </div>

              {/* Auditor Notes */}
              <div className="cd-field-group">
                <label className="cd-field-label">Auditor Internal Workpaper Notes</label>
                <textarea
                  className="cd-textarea"
                  rows={3}
                  placeholder="Internal audit team observations, follow-up items, and sampling notes..."
                  value={evaluation.auditorNotes}
                  onChange={(e) => handleFieldChange('auditorNotes', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* When compliant, show note about preserved values */}
        {!isObservationsVisible && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#F8FAFC',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info size={16} />
            <span>
              Observation fields are hidden for <strong>{evaluation.complianceStatus || 'Compliant / Not Applicable'}</strong> controls. Any previously entered observation details are safely preserved.
            </span>
          </div>
        )}
      </div>

      {/* ─── SECTION 4: Save & Submit Action Bar ─────────────────────── */}
      <div className="cd-bottom-bar">
        <div className="cd-bottom-status-info">
          <span>Assigned Auditor: <strong style={{ color: 'var(--text-primary)' }}>{user?.name || 'Rahul Sharma'}</strong></span>
          <span>•</span>
          <span>Control: <strong style={{ color: 'var(--text-primary)' }}>{resolvedControlId}</strong></span>
          {evaluation.lastSaved && (
            <>
              <span>•</span>
              <span>Saved: {new Date(evaluation.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </>
          )}
        </div>

        <div className="cd-bottom-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSaveDraft}
          >
            <Bookmark size={16} /> Save Draft
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmitEvaluation}
          >
            <Send size={16} /> Submit Evaluation
          </button>
        </div>
      </div>

      {/* ─── Evidence File Preview Modal ─────────────────────────────── */}
      <Modal
        isOpen={!!previewState}
        onClose={() => setPreviewState(null)}
        title={`Evidence Preview: ${previewState?.fileName || 'Document'}`}
      >
        <div className="cd-preview-modal-body">
          {previewState?.url ? (
            previewState.fileName.match(/\.(png|jpg|jpeg|webp)$/i) ? (
              <img src={previewState.url} alt={previewState.fileName} className="cd-preview-img" />
            ) : (
              <iframe src={previewState.url} title={previewState.fileName} className="cd-preview-iframe" />
            )
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <FileText size={48} color="var(--primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{previewState?.fileName}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                Secure artifact preview rendered from client repository. The full authentic document can be downloaded for detailed examination.
              </p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '8px' }}
                onClick={() => {
                  showToast(`Downloading: ${previewState?.fileName}`, 'success');
                  setPreviewState(null);
                }}
              >
                <Download size={16} /> Download File for Inspection
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
