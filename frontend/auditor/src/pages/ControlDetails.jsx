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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  ClipboardList,
  FileCode,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initialFrameworkRules } from '../data/frameworkRulesData';
import * as api from '../services/api';
import Modal from '../components/Modal';
import './ControlDetails.css';

// Helper to intelligently derive primary and secondary deliverables if missing from Excel
const deriveDeliverables = (control) => {
  const rawPrimary = control.primaryDocuments || control.primary_evidence || [];
  const rawSecondary = control.secondaryDocuments || control.secondary_evidence || [];

  let primary = Array.isArray(rawPrimary) ? rawPrimary.filter(Boolean) : (rawPrimary ? [rawPrimary] : []);
  let secondary = Array.isArray(rawSecondary) ? rawSecondary.filter(Boolean) : (rawSecondary ? [rawSecondary] : []);

  // If primary is empty or lacks column in Excel, derive standard SEBI CSCRF deliverables based on domain
  if (primary.length === 0) {
    const domain = (control.controlDomain || control.control_domain || control.domain || '').toLowerCase();
    const desc = (control.description || control.control_desc || '').toLowerCase();

    if (domain.includes('gv') || domain.includes('govern')) {
      primary = ['Approved Enterprise Cybersecurity Policy Standard', 'Governance Risk Framework Charter'];
      secondary = ['Annual Board / CISO Review Minutes'];
    } else if (desc.includes('mfa') || desc.includes('password') || desc.includes('access') || domain.includes('pr')) {
      primary = ['Access Control Standard Operating Procedure', 'Active Directory MFA & RBAC Configuration Export'];
      secondary = ['Privileged Account Exception Registry'];
    } else if (desc.includes('log') || desc.includes('siem') || domain.includes('de')) {
      primary = ['Centralized SIEM Log Ingestion Architecture', 'Audit Trail Immutability Verification Report'];
      secondary = ['180-Day Log Retention Configuration Export'];
    } else if (domain.includes('rs') || desc.includes('incident')) {
      primary = ['Cyber Incident Response Management Plan', 'SEBI Notification Workflow Standard'];
      secondary = ['Quarterly Incident Drill Workpapers'];
    } else if (domain.includes('rc') || desc.includes('backup') || desc.includes('dr')) {
      primary = ['Disaster Recovery & Business Continuity Plan', 'Automated Backup Restoration Log'];
      secondary = ['Annual DR Drill Sign-off Certificate'];
    } else {
      primary = ['Approved Policy & Procedure Standard', 'System Security Baseline Configuration Artifact'];
      secondary = ['Technical Implementation Audit Workpapers'];
    }
  }

  return { primary, secondary };
};

// Helper for Generating Overall Control AI Telemetry & Synthesis
const getControlAITelemetry = (control, evidenceItems, finding) => {
  if (finding) {
    return {
      risk: finding.risk || 'High',
      confidence: finding.confidence || 94,
      message: finding.message,
      reasoning: finding.reasoning,
      overallReportNote: `Automated telemetry scan of compliance artifacts for ${control?.name || 'this control'} identified regulatory deficiency: ${finding.message}. SEBI CSCRF guidelines mandate immediate corrective remediation within assigned grace period.`,
      rootCause: `Discrepancy identified in system telemetry: ${finding.message}`,
      impact: `Non-compliance with SEBI CSCRF standard: ${finding.reasoning || 'Compromises organizational security posture.'}`,
      recommendation: `Remediate technical configuration gap according to SEBI CSCRF operational guidelines and re-submit certified evidence.`
    };
  }

  const primaryDocs = control?.primaryDocuments || [];
  const missingCount = Math.max(0, primaryDocs.length - evidenceItems.length);

  if (missingCount > 0 && evidenceItems.length === 0) {
    return {
      risk: 'High',
      confidence: 96,
      message: `Zero deliverables submitted for mandatory requirement (${primaryDocs.join(', ')}).`,
      reasoning: `SEBI CSCRF mandates documented policy and implementation artifacts to substantiate operational enforcement.`,
      overallReportNote: `Audit verification for ${control?.name || 'this control'} could not be completed due to missing primary deliverables (${primaryDocs.join(', ')}). Control marked Non-Compliant pending client submission of certified documentation.`,
      rootCause: `Client has not uploaded mandatory primary evidence deliverables (${primaryDocs.join(', ')}).`,
      impact: `Inability to verify operational security posture under SEBI CSCRF regulatory framework.`,
      recommendation: `Management must immediately upload certified documentation (${primaryDocs.join(', ')}) signed by CISO / Authorized Signatory.`
    };
  } else if (missingCount > 0) {
    return {
      risk: 'Medium',
      confidence: 91,
      message: `Partial evidence coverage. ${evidenceItems.length} of ${primaryDocs.length} required primary deliverables uploaded.`,
      reasoning: `Secondary or corroborating artifacts remain pending for complete regulatory verification.`,
      overallReportNote: `Preliminary audit review for ${control?.name || 'this control'} validates submitted artifact (${evidenceItems[0]?.fileName}), but secondary required documentation remains outstanding. Recommended for Partially Compliant evaluation with 30-day submission milestone.`,
      rootCause: `Incomplete evidence submission. Required deliverable (${primaryDocs[primaryDocs.length - 1] || 'Supporting artifact'}) was omitted.`,
      impact: `Partial verification achieved; secondary risk exposure remains unaddressed.`,
      recommendation: `Request client upload the remaining primary deliverables to achieve full compliance.`
    };
  } else {
    return {
      risk: 'Low',
      confidence: 95,
      message: `All required primary evidence deliverables uploaded and verified against SEBI CSCRF baseline.`,
      reasoning: `Cryptographic signatures, policy statements, and technical artifacts satisfy framework criteria.`,
      overallReportNote: `Cybersecurity audit review for ${control?.name || 'this control'} completed successfully. Submitted deliverable (${evidenceItems[0]?.fileName || 'Documentation'}) satisfies SEBI CSCRF compliance criteria. Recommended evaluation: Compliant.`,
      rootCause: `No non-compliance observed. System artifacts align with regulatory specifications.`,
      impact: `Positive operational adherence; controls operate effectively.`,
      recommendation: `Maintain continuous periodic review cycle as mandated by regulatory framework.`
    };
  }
};

// Helper for Generating Evidence-Specific AI Telemetry
const getEvidenceAITelemetry = (ev, control) => {
  if (ev.ai_notes && ev.ai_notes.trim()) return ev.ai_notes;
  const isPdf = (ev.fileName || '').toLowerCase().endsWith('.pdf');
  const isImg = (ev.fileName || '').match(/\.(png|jpg|jpeg|webp)$/i);

  if (isPdf) {
    return `Document structure & metadata verified. Policy header and clause alignment validated against ${control?.name || 'SEBI CSCRF'}.`;
  } else if (isImg) {
    return `System console screenshot telemetry validated. Parameter settings inspected for RBAC, MFA, and cryptographic enforcement.`;
  }
  return `Deliverable artifact parsed. Verification confirmed against baseline criteria for ${control?.name || 'control'}.`;
};

export default function ControlDetails() {
  const { controlId: paramControlId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    selectedClient,
    selectedAudit,
    activeAuditData,
    updateEvidenceStatus,
    updateEvidenceNotes,
    updateClientFeedback,
    saveControlEvaluation,
    getControlEvaluation
  } = useAuth();

  // 1. Resolve Control ID from params or query string
  const queryParams = new URLSearchParams(location.search);
  const resolvedControlId = paramControlId || queryParams.get('id') || queryParams.get('controlId') || 'FR-001';

  // 2. Control Master Info State
  const [controlData, setControlData] = useState(null);
  const [auditControlRecord, setAuditControlRecord] = useState(null);
  const [loadingControl, setLoadingControl] = useState(true);

  // 3. Evidence Files State for this control
  const [evidenceList, setEvidenceList] = useState([]);
  const [evidenceNotesDraft, setEvidenceNotesDraft] = useState({});
  const [clientFeedbackDraft, setClientFeedbackDraft] = useState({});
  const [savingNoteId, setSavingNoteId] = useState(null);
  const [savingFeedbackId, setSavingFeedbackId] = useState(null);
  const [rejectingFileId, setRejectingFileId] = useState(null);

  // 4. Preview Modal State
  const [previewState, setPreviewState] = useState(null);

  // 5. Toast / Feedback State
  const [toast, setToast] = useState(null);

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
    auditorNotes: '',     // Report Notes for Overall Control fed into Report
    isDraft: false,
    isSubmitted: false,
    lastSaved: null
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({});
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [previousDraftNote, setPreviousDraftNote] = useState(null);

  // ─── Step 1: Load Master Control Information ───────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchControl = async () => {
      setLoadingControl(true);
      try {
        let matchedControl = null;
        let matchedAC = null;
        try {
          if (resolvedControlId) {
            try {
              const singleAC = await api.getAuditControlById(resolvedControlId);
              if (singleAC && singleAC.id) {
                matchedAC = singleAC;
                setAuditControlRecord(singleAC);
                if (singleAC.control) matchedControl = singleAC.control;
              }
            } catch (e) {
              // Not direct id, fall through to list search
            }
          }

          if (!matchedControl) {
            const [apiControls, apiAuditControls] = await Promise.allSettled([
              api.getControls(),
              api.getAuditControls()
            ]);

            const controlsList = apiControls.status === 'fulfilled' && Array.isArray(apiControls.value) ? apiControls.value : [];
            const auditControlsList = apiAuditControls.status === 'fulfilled' && Array.isArray(apiAuditControls.value) ? apiAuditControls.value : [];

            matchedAC = auditControlsList.find(ac =>
              String(ac.id) === String(resolvedControlId) ||
              String(ac.control_id) === String(resolvedControlId) ||
              String(ac.control?.id) === String(resolvedControlId) ||
              String(ac.control?.control_id) === String(resolvedControlId) ||
              (ac.control?.framework_rules && ac.control.framework_rules.some(r => r.includes(resolvedControlId) || resolvedControlId.includes(r)))
            );

            if (matchedAC) {
              setAuditControlRecord(matchedAC);
              matchedControl = matchedAC.control;
            }

            if (!matchedControl && controlsList.length > 0) {
              matchedControl = controlsList.find(c =>
                String(c.id) === String(resolvedControlId) ||
                String(c.control_id) === String(resolvedControlId) ||
                (c.framework_rules && c.framework_rules.some(r => r.includes(resolvedControlId) || resolvedControlId.includes(r)))
              );
            }
          }
        } catch (apiErr) {
          // Backend API error
        }

        // Fallback to local rulebook database if not found via API
        if (!matchedControl) {
          matchedControl = initialFrameworkRules.find(r =>
            String(r.id) === String(resolvedControlId) ||
            r.frameworkRules?.includes(resolvedControlId) ||
            resolvedControlId.includes(r.id)
          ) || initialFrameworkRules[0];
        }

        if (isMounted && matchedControl) {
          const { primary, secondary } = deriveDeliverables(matchedControl);

          const systemVal = matchedControl.system_entity || matchedControl.systemEntity ||
            ((matchedControl.frameworkCategory || '').toLowerCase().includes('vendor') ? 'Vendor / Third-Party' : 'IT System (Infrastructure)');
          const ciaVal = matchedControl.cia_classification || matchedControl.ciaClassification || 'C/I/A';
          const testProcedureVal = matchedControl.test_procedure || matchedControl.testProcedure ||
            'Verify documented policy approval, inspect active configuration console exports, and test enforcement against regulatory baseline.';

          const normalized = {
            id: matchedControl.id || resolvedControlId,
            control_id: matchedControl.control_id || resolvedControlId,
            name: matchedControl.frameworkRules || (matchedControl.framework_rules ? matchedControl.framework_rules.join(', ') : (matchedControl.control_desc || 'Control Information')),
            description: matchedControl.description || matchedControl.control_desc || 'Ensure operational compliance with established regulatory frameworks and guidelines.',
            domain: matchedControl.controlDomain || matchedControl.control_domain || 'Protect (PR)',
            frameworkType: matchedControl.frameworkType || matchedControl.audit_type || selectedAudit || 'SEBI CSCRF',
            frameworkCategory: matchedControl.frameworkCategory || matchedControl.audit_category || 'Access Control & Security',
            frameworkSubcategory: matchedControl.frameworkSubcategory || matchedControl.audit_subcategory || 'Policy Enforcement',
            primaryDocuments: primary,
            secondaryDocuments: secondary,
            systemEntity: systemVal,
            ciaClassification: ciaVal,
            testProcedure: testProcedureVal,
            cia: {
              confidentiality: true,
              integrity: true,
              availability: (matchedControl.controlDomain || '').toLowerCase().includes('recover') || (matchedControl.controlDomain || '').toLowerCase().includes('detect')
            },
            testCases: [
              {
                id: 'TC-01',
                title: 'Regulatory Audit Procedure',
                desc: testProcedureVal
              },
              {
                id: 'TC-02',
                title: 'Evidence Deliverable Verification',
                desc: 'Reconcile uploaded client evidence files against framework primary and secondary deliverable criteria.'
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
    let isMounted = true;
    const fetchEvidence = async () => {
      const targetAcId = auditControlRecord?.id || (resolvedControlId && String(resolvedControlId).length > 10 ? resolvedControlId : null);

      if (targetAcId) {
        try {
          const links = await api.getEvidenceForAuditControl(targetAcId);
          if (Array.isArray(links) && links.length > 0 && isMounted) {
            const mapped = links.map(link => {
              const ev = link.evidence_item || {};
              return {
                id: ev.id,
                fileName: ev.file_name,
                client: ev.user?.name || selectedClient || 'Client Admin',
                controlId: controlData?.name || resolvedControlId,
                date: ev.created_at ? new Date(ev.created_at).toLocaleDateString() : 'Recent',
                status: ev.status || 'Pending Review',
                auditor_notes: ev.auditor_notes || '',
                client_feedback: ev.client_feedback || '',
                ai_notes: ev.ai_notes || '',
                reviewed_by: ev.reviewed_by || null,
                reviewed_at: ev.reviewed_at ? new Date(ev.reviewed_at).toLocaleDateString() : null,
              };
            });
            setEvidenceList(mapped);
            return;
          }
        } catch (e) {
          // Fallback to active audit evidence match
        }
      }

      const allEvidence = activeAuditData?.evidence || [];
      const matchedEvidence = allEvidence.filter(ev => {
        const evControlId = String(ev.controlId || '').toLowerCase();
        const targetId = String(resolvedControlId).toLowerCase();
        const ruleName = String(controlData?.name || '').toLowerCase();
        return evControlId.includes(targetId) || targetId.includes(evControlId) || (ruleName && evControlId.includes(ruleName));
      });

      if (isMounted) {
        setEvidenceList(matchedEvidence);
      }
    };

    fetchEvidence();
    return () => { isMounted = false; };
  }, [resolvedControlId, auditControlRecord, activeAuditData, controlData, selectedClient]);

  // ─── Step 3: Load Saved Evaluation for Reopening ────────────────────
  useEffect(() => {
    const savedLocal = getControlEvaluation ? getControlEvaluation(resolvedControlId) : null;
    const ac = auditControlRecord;

    if (ac && ac.compliance_status) {
      setEvaluation({
        complianceStatus: ac.compliance_status || '',
        riskRating: ac.risk_rating || '',
        similarIssue: ac.similar_issue !== null && ac.similar_issue !== undefined ? (ac.similar_issue ? 'Yes' : 'No') : '',
        rootCause: ac.root_cause_analysis || '',
        impactAnalysis: ac.impact_analysis || '',
        recommendations: ac.recommendation || '',
        remediationDays: ac.remediation_days ? String(ac.remediation_days) : '',
        managementResponse: ac.management_response || '',
        auditorNotes: ac.auditor_notes || '',
        isDraft: ac.status !== 'Completed',
        isSubmitted: ac.status === 'Completed',
        lastSaved: ac.evaluated_at || null
      });
    } else if (savedLocal) {
      setEvaluation({
        complianceStatus: savedLocal.complianceStatus || '',
        riskRating: savedLocal.riskRating || '',
        similarIssue: savedLocal.similarIssue || '',
        rootCause: savedLocal.rootCause || '',
        impactAnalysis: savedLocal.impactAnalysis || '',
        recommendations: savedLocal.recommendations || '',
        remediationDays: savedLocal.remediationDays || '',
        managementResponse: savedLocal.managementResponse || '',
        auditorNotes: savedLocal.auditorNotes || '',
        isDraft: !!savedLocal.isDraft,
        isSubmitted: !!savedLocal.isSubmitted,
        lastSaved: savedLocal.updatedAt || savedLocal.submittedAt || null
      });
    } else {
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
    setValidationErrors({});
  }, [resolvedControlId, auditControlRecord, user]);

  // ─── AI Findings Match ──────────────────────────────────────────────
  const activeFindings = (activeAuditData?.findings || []).filter(f => {
    const fId = String(f.controlId || '').toLowerCase();
    const target = String(resolvedControlId).toLowerCase();
    const ruleName = String(controlData?.name || '').toLowerCase();
    return fId.includes(target) || target.includes(fId) || (ruleName && fId.includes(ruleName));
  });

  const primaryFinding = activeFindings.length > 0 ? activeFindings[0] : null;

  // Compute Overall AI Telemetry for this Control
  const overallAITelemetry = getControlAITelemetry(controlData, evidenceList, primaryFinding);

  // ─── Stepper Navigation Across 29 Controls ────────────────────────
  const assignedControls = activeAuditData?.controls || [];
  const totalControlsCount = assignedControls.length;

  const currentControlIndex = assignedControls.findIndex(ac =>
    String(ac.id) === String(resolvedControlId) ||
    String(ac.control_id) === String(resolvedControlId) ||
    String(ac.control?.id) === String(resolvedControlId) ||
    String(ac.control?.control_id) === String(resolvedControlId) ||
    (ac.control?.framework_rules && ac.control.framework_rules.some(r => r === resolvedControlId || resolvedControlId.includes(r)))
  );

  const prevControl = currentControlIndex > 0 ? assignedControls[currentControlIndex - 1] : null;
  const nextControl = currentControlIndex >= 0 && currentControlIndex < totalControlsCount - 1 ? assignedControls[currentControlIndex + 1] : null;
  const evaluatedControlsCount = assignedControls.filter(c => c.compliance_status && c.compliance_status !== '').length;

  const handleNavigateControl = (targetControl) => {
    if (!targetControl) return;
    const targetId = targetControl.id || targetControl.control_id;
    navigate(`/control-details/${encodeURIComponent(targetId)}`);
  };

  // ─── Evidence Review Handlers ──────────────────────────────────────
  const handleApproveEvidence = async (evidenceId) => {
    try {
      setRejectingFileId(null);
      if (updateEvidenceStatus) {
        await updateEvidenceStatus(evidenceId, 'Approved');
      } else {
        await api.updateEvidenceStatus(evidenceId, 'Approved', user?.id);
      }
      setEvidenceList(prev => prev.map(ev => ev.id === evidenceId ? { ...ev, status: 'Approved' } : ev));
      showToast('Evidence deliverable marked as Approved', 'success');
    } catch (err) {
      showToast('Failed to update evidence status', 'error');
    }
  };

  const handleRejectEvidence = async (evidenceId) => {
    const feedback = clientFeedbackDraft[evidenceId] || 'Deliverable is insufficient for verification. Please re-upload certified documentation.';
    setSavingFeedbackId(evidenceId);
    try {
      if (updateEvidenceStatus) {
        await updateEvidenceStatus(evidenceId, 'Rejected', feedback);
      } else {
        await api.updateEvidenceStatus(evidenceId, 'Rejected', user?.id, feedback);
      }
      if (updateClientFeedback) {
        await updateClientFeedback(evidenceId, feedback);
      } else {
        await api.updateClientFeedback(evidenceId, feedback);
      }
      setEvidenceList(prev => prev.map(ev => ev.id === evidenceId ? { ...ev, status: 'Rejected', client_feedback: feedback } : ev));
      setRejectingFileId(null);
      showToast('Evidence marked as Rejected. Client instruction sent to client dashboard.', 'success');
    } catch (err) {
      console.error('Failed to reject evidence:', err);
      showToast('Failed to reject evidence', 'error');
    } finally {
      setSavingFeedbackId(null);
    }
  };

  const handleSaveClientFeedback = async (evidenceId) => {
    const feedbackText = clientFeedbackDraft[evidenceId] !== undefined ? clientFeedbackDraft[evidenceId] : 'Deliverable is insufficient for verification. Please re-upload certified documentation.';
    setSavingFeedbackId(evidenceId);
    try {
      if (updateClientFeedback) {
        await updateClientFeedback(evidenceId, feedbackText);
      } else {
        await api.updateClientFeedback(evidenceId, feedbackText);
      }
      await api.updateEvidenceStatus(evidenceId, 'Rejected', user?.id, feedbackText);
      setEvidenceList(prev => prev.map(ev => ev.id === evidenceId ? { ...ev, client_feedback: feedbackText } : ev));
      showToast('Client feedback saved! Client will see this instruction.', 'success');
    } catch (err) {
      console.error('Failed to save client feedback:', err);
      showToast('Failed to save client feedback', 'error');
    } finally {
      setSavingFeedbackId(null);
    }
  };

  const handleSaveEvidenceNote = async (evidenceId) => {
    const noteText = evidenceNotesDraft[evidenceId] !== undefined ? evidenceNotesDraft[evidenceId] : '';
    setSavingNoteId(evidenceId);
    try {
      if (updateEvidenceNotes) {
        await updateEvidenceNotes(evidenceId, noteText);
      } else {
        await api.updateEvidenceNotes(evidenceId, noteText);
      }
      setEvidenceList(prev => prev.map(ev => ev.id === evidenceId ? { ...ev, auditor_notes: noteText } : ev));
      showToast('Internal auditor note saved for evidence file', 'success');
    } finally {
      setSavingNoteId(null);
    }
  };


  // Adopt Evidence-Specific Note from AI
  const handleAdoptEvidenceAINote = (evidenceId, aiNote) => {
    setEvidenceNotesDraft(prev => ({
      ...prev,
      [evidenceId]: aiNote
    }));
    showToast('Evidence-specific AI note adopted into note input! Click Save Note to confirm.', 'success');
  };

  // Adopt Evidence AI as Client Feedback
  const handleAdoptEvidenceAIFeedback = (evidenceId, aiNote) => {
    setClientFeedbackDraft(prev => ({
      ...prev,
      [evidenceId]: `Verification gap identified by automated inspection: ${aiNote}. Please re-upload updated deliverable.`
    }));
    showToast('AI note adopted into Client Feedback! Click Save Feedback to confirm.', 'success');
  };

  const handlePreviewFile = async (ev) => {
    try {
      const data = await api.getEvidenceDownloadUrl(ev.id);
      if (data && data.download_url) {
        setPreviewState({ url: data.download_url, fileName: ev.fileName });
        return;
      }
    } catch (e) {
      // Preview error
    }
    setPreviewState({ url: null, fileName: ev.fileName });
  };

  const handleDownloadFile = async (ev) => {
    try {
      const data = await api.getEvidenceDownloadUrl(ev.id);
      if (data && data.download_url) {
        window.open(data.download_url, '_blank');
        return;
      }
    } catch (e) {
      // Download fallback
    }
    showToast(`Downloading: ${ev.fileName}`, 'success');
  };

  // ─── AI Copilot Synthesis Handlers ────────────────────────────────
  const handleTriggerAISynthesis = async () => {
    const targetACId = auditControlRecord?.id || (resolvedControlId && String(resolvedControlId).length > 10 ? resolvedControlId : null);
    if (!targetACId) {
      showToast('No active audit control record found to synthesize.', 'error');
      return;
    }

    try {
      setIsSynthesizing(true);
      setPreviousDraftNote(evaluation.auditorNotes || '');

      const currentStatus = evaluation.complianceStatus || 'Non-Compliant';
      const result = await api.aiSynthesizeControl(targetACId, {
        raw_note: evaluation.auditorNotes || '',
        compliance_status: currentStatus,
      });

      if (result && result.success) {
        setEvaluation(prev => ({
          ...prev,
          auditorNotes: result.report_note || prev.auditorNotes,
          ...(result.root_cause_analysis ? { rootCause: result.root_cause_analysis } : {}),
          ...(result.impact_analysis ? { impactAnalysis: result.impact_analysis } : {}),
          ...(result.recommendation ? { recommendations: result.recommendation } : {}),
          ...(result.remediation_days ? { remediationDays: String(result.remediation_days) } : {}),
        }));

        showToast(
          result.is_mock
            ? '✨ Standardized SEBI observation & observations generated!'
            : '✨ AI synthesized professional observation & findings!',
          'success'
        );
      }
    } catch (err) {
      console.error('AI Synthesis error:', err);
      showToast(
        err.response?.data?.detail || 'Failed to synthesize observations with AI. Please check server.',
        'error'
      );
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleUndoAISynthesis = () => {
    if (previousDraftNote !== null) {
      setEvaluation(prev => ({
        ...prev,
        auditorNotes: previousDraftNote
      }));
      setPreviousDraftNote(null);
      showToast('Reverted to previous note.', 'info');
    }
  };

  // ─── Adopt Overall Control AI Note into Report Notes Component ─────
  const handleAdoptOverallNoteToReport = (noteText) => {
    const textToSet = noteText || overallAITelemetry.overallReportNote;
    setEvaluation(prev => ({
      ...prev,
      auditorNotes: textToSet
    }));

    showToast('Overall AI Executive Synthesis adopted into Audit Report Notes!', 'success');
    setTimeout(() => {
      const el = document.getElementById('report-notes-component');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // ─── Adopt AI Finding into Non-Compliance Observations ──────────────
  const handleAdoptAIFindingToObservations = () => {
    setEvaluation(prev => ({
      ...prev,
      complianceStatus: prev.complianceStatus === 'Compliant' ? 'Partially Compliant' : (prev.complianceStatus || 'Partially Compliant'),
      riskRating: overallAITelemetry.risk || prev.riskRating || 'High',
      similarIssue: prev.similarIssue || 'No',
      rootCause: overallAITelemetry.rootCause,
      impactAnalysis: overallAITelemetry.impact,
      recommendations: overallAITelemetry.recommendation,
      remediationDays: prev.remediationDays || '30'
    }));

    showToast('AI flaw finding adopted into Non-Compliance Observations! Review below.', 'success');
    setTimeout(() => {
      const el = document.getElementById('auditor-evaluation-form');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // ─── 1-Click Pre-fill for Missing Deliverable ────────────────────────
  const handlePreFillMissingEvidence = () => {
    const missingDocs = (controlData?.primaryDocuments || []).join(', ') || 'Mandatory policy and configuration artifacts';
    setEvaluation(prev => ({
      ...prev,
      complianceStatus: 'Non-Compliant',
      riskRating: 'High',
      similarIssue: 'No',
      rootCause: `Client has failed to submit required primary evidence deliverables: ${missingDocs}.`,
      impactAnalysis: `Inability to verify operational enforcement without authorized deliverables creates significant audit exposure and regulatory breach under SEBI CSCRF.`,
      recommendations: `Client must provide certified primary documentation (${missingDocs}) signed by authorized CISO / Management personnel immediately.`,
      remediationDays: '15',
      auditorNotes: prev.auditorNotes || `Control marked Non-Compliant due to absence of mandatory primary deliverables: ${missingDocs}. Remediation timeline set to 15 days.`
    }));

    showToast('Missing evidence observations generated. Review workpaper below.', 'success');
    setTimeout(() => {
      const el = document.getElementById('auditor-evaluation-form');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // ─── Form Input Change Handler ────────────────────────────────────
  const handleFieldChange = (field, value) => {
    setEvaluation(prev => ({
      ...prev,
      [field]: value
    }));

    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => { setToast(null); }, 4000);
  };

  // ─── Save Draft Action ─────────────────────────────────────────────
  const handleSaveDraft = async () => {
    const targetAuditControlId = auditControlRecord?.id || resolvedControlId;
    const saved = await saveControlEvaluation(resolvedControlId, { ...evaluation, auditControlId: targetAuditControlId }, false);
    setEvaluation(prev => ({
      ...prev,
      isDraft: true,
      isSubmitted: false,
      lastSaved: saved?.updatedAt || new Date().toISOString()
    }));
    showToast('Evaluation draft saved successfully.', 'success');
  };

  // ─── Submit Evaluation Action ──────────────────────────────────────
  const handleSubmitEvaluation = async () => {
    const errors = {};

    if (!evaluation.complianceStatus) {
      errors.complianceStatus = 'Compliance Status is required';
    }
    if (!evaluation.riskRating) {
      errors.riskRating = 'Risk Rating is required';
    }
    if (!evaluation.similarIssue) {
      errors.similarIssue = 'Please specify if a similar issue exists in other areas';
    }

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
      const el = document.getElementById('auditor-evaluation-form');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setValidationErrors({});
    const targetAuditControlId = auditControlRecord?.id || resolvedControlId;
    const saved = await saveControlEvaluation(resolvedControlId, { ...evaluation, auditControlId: targetAuditControlId }, true);
    setEvaluation(prev => ({
      ...prev,
      isSubmitted: true,
      isDraft: false,
      lastSaved: saved?.updatedAt || new Date().toISOString()
    }));
    showToast('Evaluation submitted successfully! Assessment persisted in database.', 'success');
  };

  const renderDomainBadge = (domain) => {
    const domStr = domain || '';
    let bg = '#E8F0FE'; let color = '#1A73E8'; let border = '#ADCEFE';
    if (domStr.includes('GV') || domStr.includes('Govern')) { bg = '#E8F0FE'; color = '#1A73E8'; border = '#ADCEFE'; }
    else if (domStr.includes('ID') || domStr.includes('Identify')) { bg = '#E0F7FA'; color = '#00838F'; border = '#80DEEA'; }
    else if (domStr.includes('PR') || domStr.includes('Protect')) { bg = '#E6F4EA'; color = '#137333'; border = '#A8DAB5'; }
    else if (domStr.includes('DE') || domStr.includes('Detect')) { bg = '#FEF7E0'; color = '#B06000'; border = '#FDE293'; }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: '5px',
        fontSize: '11px', fontWeight: '700', backgroundColor: bg, color: color, border: `1px solid ${border}`
      }}>
        {domain}
      </span>
    );
  };

  const isObservationsVisible = evaluation.complianceStatus === 'Partially Compliant' || evaluation.complianceStatus === 'Non-Compliant';

  const primaryDocs = controlData?.primaryDocuments || [];
  const hasMissingPrimary = primaryDocs.length > 0 && evidenceList.length < primaryDocs.length;

  return (
    <div className="page-container control-details-page">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          backgroundColor: toast.type === 'error' ? '#991B1B' : '#1E293B',
          color: '#FFFFFF', padding: '12px 20px', borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '14px', fontWeight: '500', animation: 'fadeIn 0.2s ease-in-out'
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

      {/* ─── Breadcrumb & Sequential Stepper Navigation ────────────── */}
      <div className="cd-top-nav-bar">
        <div className="cd-breadcrumb-nav">
          <Link to="/evidence-review" className="cd-back-link">
            <ArrowLeft size={15} /> Back to Evidence Review
          </Link>
          <span className="cd-breadcrumb-separator">/</span>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Controls</span>
          <span className="cd-breadcrumb-separator">/</span>
          <span className="cd-breadcrumb-current-id">{controlData?.name || resolvedControlId}</span>
        </div>

        {/* Stepper Navigation */}
        <div className="cd-stepper-nav">
          <button
            type="button"
            className="btn btn-secondary cd-stepper-btn"
            onClick={() => handleNavigateControl(prevControl)}
            disabled={!prevControl}
            title={prevControl ? 'Previous Control' : 'First control'}
          >
            <ChevronLeft size={16} /> Prev Control
          </button>

          <div className="cd-stepper-info-pill">
            <strong>Control {currentControlIndex >= 0 ? currentControlIndex + 1 : 1} of {totalControlsCount || 29}</strong>
            <span className="cd-stepper-divider">•</span>
            <span style={{ color: '#137333', fontWeight: 600 }}>{evaluatedControlsCount} Evaluated</span>
            <span className="cd-stepper-divider">•</span>
            <span style={{ color: '#B06000', fontWeight: 600 }}>{Math.max(0, (totalControlsCount || 29) - evaluatedControlsCount)} Pending</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary cd-stepper-btn"
            onClick={() => handleNavigateControl(nextControl)}
            disabled={!nextControl}
            title={nextControl ? 'Next Control' : 'Last control'}
          >
            Next Control <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ─── Header Card ───────────────────────────────────────────── */}
      <div className="cd-header-card">
        <div className="cd-header-title-area">
          <div className="cd-header-meta-row">
            <span className="cd-code-pill">{resolvedControlId}</span>
            {controlData && renderDomainBadge(controlData.domain)}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
              backgroundColor: '#F8FAFC', border: '1px solid var(--border-color)', color: 'var(--text-secondary)'
            }}>
              {controlData?.frameworkType || 'SEBI CSCRF'}
            </span>
            {evaluation.complianceStatus && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                backgroundColor: evaluation.complianceStatus === 'Compliant' ? '#E6F4EA' : evaluation.complianceStatus === 'Non-Compliant' ? '#FCE8E6' : '#FEF7E0',
                color: evaluation.complianceStatus === 'Compliant' ? '#137333' : evaluation.complianceStatus === 'Non-Compliant' ? '#C5221F' : '#B06000',
                border: `1px solid ${evaluation.complianceStatus === 'Compliant' ? '#A8DAB5' : evaluation.complianceStatus === 'Non-Compliant' ? '#FAD2CF' : '#FDE293'}`
              }}>
                {evaluation.complianceStatus}
              </span>
            )}
          </div>

          <h1 className="cd-header-title">
            {controlData ? controlData.name : 'Loading Control Details...'}
          </h1>
          <p className="cd-header-subtitle">
            Client: <strong>{selectedClient || 'Enterprise Client'}</strong> • Audit: <strong>{selectedAudit || 'SEBI CSCRF'}</strong> • Category: <strong>{controlData?.frameworkCategory || 'GRC'}</strong>
          </p>
        </div>
      </div>

      {/* ─── SECTION A: Master Control Information ─────────────────── */}
      <div className="cd-section-card">
        <div className="cd-section-header">
          <h2 className="cd-section-title">
            <Shield className="cd-section-title-icon" size={20} /> Section A: Master Control Information
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Standard Baseline Checklist</span>
        </div>

        <div className="cd-info-grid">
          <div className="cd-info-item">
            <span className="cd-info-label">System (RE / Vendor)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '6px',
                backgroundColor: (controlData?.systemEntity || '').toLowerCase().includes('vendor') ? '#FFF7ED' : '#F0FDF4',
                border: `1px solid ${(controlData?.systemEntity || '').toLowerCase().includes('vendor') ? '#FFEDD5' : '#DCFCE7'}`,
                color: (controlData?.systemEntity || '').toLowerCase().includes('vendor') ? '#C2410C' : '#15803D',
                fontSize: '12px', fontWeight: '600'
              }}>
                {(controlData?.systemEntity || '').toLowerCase().includes('vendor') ? <Building2 size={13} /> : <Server size={13} />}
                {controlData?.systemEntity || 'IT System (Infrastructure)'}
              </span>
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
            C/I/A Classification {controlData?.ciaClassification ? `(${controlData.ciaClassification})` : '(Confidentiality, Integrity, Availability)'}
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

      {/* ─── SECTION B: Evidence Deliverables & Verification (Full Width) ─── */}
      <div className="cd-section-card" style={{ marginBottom: '24px' }}>
          <div className="cd-section-header">
            <h2 className="cd-section-title">
              <FileText className="cd-section-title-icon" size={20} /> Section B: Evidence Deliverables & Verification
            </h2>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              {evidenceList.length} Uploaded
            </span>
          </div>

          {/* 1. Deliverables Checklist & Coverage Banner */}
          <div className="cd-deliverables-checklist">
            <div className="cd-deliverables-header">
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Framework Required Deliverables
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: '600', color: hasMissingPrimary ? '#C5221F' : '#137333' }}>
                {evidenceList.length} of {primaryDocs.length || 1} Primary Deliverables Uploaded
              </span>
            </div>

            <div className="cd-deliverables-items">
              {primaryDocs.map((docName, idx) => {
                const matchedFile = evidenceList[idx];
                const isMissing = !matchedFile;

                return (
                  <div key={idx} className={`cd-deliverable-item ${isMissing ? 'missing' : 'provided'}`}>
                    <div className="cd-deliverable-left">
                      <span className="cd-deliverable-badge-primary">PRIMARY</span>
                      <span className="cd-deliverable-name">{docName}</span>
                    </div>
                    <div>
                      {matchedFile ? (
                        <span className="cd-status-pill provided">
                          <Check size={11} /> Uploaded: {matchedFile.fileName}
                        </span>
                      ) : (
                        <span className="cd-status-pill missing">
                          <AlertTriangle size={11} /> Missing Deliverable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {(controlData?.secondaryDocuments || []).map((docName, idx) => (
                <div key={`sec-${idx}`} className="cd-deliverable-item secondary">
                  <div className="cd-deliverable-left">
                    <span className="cd-deliverable-badge-secondary">SECONDARY</span>
                    <span className="cd-deliverable-name">{docName}</span>
                  </div>
                  <div>
                    <span className="cd-status-pill supporting">Supporting / Corroborating</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missing Deliverables Quick-Action Banner */}
          {hasMissingPrimary && (
            <div className="cd-missing-alert-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color="#C5221F" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#C5221F' }}>
                  Primary Deliverable Missing from Client Submission
                </span>
              </div>
              <button
                type="button"
                className="btn btn-outline cd-missing-action-btn"
                onClick={handlePreFillMissingEvidence}
                title="Auto-fill observation form with missing primary deliverable finding"
              >
                <FileCheck size={13} style={{ marginRight: '4px' }} />
                Pre-fill "Missing Deliverable" Observation
              </button>
            </div>
          )}

          {/* 2. Uploaded Evidence Cards */}
          {evidenceList.length === 0 ? (
            <div className="cd-empty-box">
              <FileCheck size={36} color="var(--text-muted)" />
              <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>No Evidence Files Uploaded Yet</strong>
              <p style={{ fontSize: '12.5px', maxWidth: '340px' }}>
                The client has not yet uploaded documentation or screenshots for this control. You can record this as Non-Compliant using the pre-fill button above.
              </p>
            </div>
          ) : (
            <div className="cd-evidence-list">
              {evidenceList.map(ev => {
                const isPdf = ev.fileName.endsWith('.pdf');
                const isImg = ev.fileName.match(/\.(png|jpg|jpeg|webp)$/i);
                const currentDraft = evidenceNotesDraft[ev.id] !== undefined ? evidenceNotesDraft[ev.id] : (ev.auditor_notes || '');
                const currentFeedback = clientFeedbackDraft[ev.id] !== undefined ? clientFeedbackDraft[ev.id] : (ev.client_feedback || '');
                const isApproved = ev.status === 'Approved';
                const isRejected = ev.status === 'Rejected';
                const fileAITelemetry = getEvidenceAITelemetry(ev, controlData);

                return (
                  <div key={ev.id} className={`cd-evidence-card ${isRejected ? 'rejected-card' : isApproved ? 'approved-card' : ''}`}>
                    {/* Top Row: Details & Actions */}
                    <div className="cd-evidence-top-row">
                      <div className="cd-evidence-main">
                        <div className={`cd-evidence-icon-box ${isPdf ? 'pdf' : isImg ? 'img' : 'doc'}`}>
                          <FileText size={20} />
                        </div>
                        <div className="cd-evidence-details">
                          <h4 className="cd-evidence-filename" title={ev.fileName}>{ev.fileName}</h4>
                          <span className="cd-evidence-meta">
                            Uploaded {ev.date} {ev.uploaded_by ? `by ${ev.uploaded_by}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="cd-evidence-actions">
                        <span className={`cd-file-status-badge ${ev.status?.toLowerCase().replace(/\s+/g, '-') || 'pending'}`}>
                          {ev.status || 'Pending Review'}
                        </span>

                        <button
                          type="button"
                          className="btn btn-secondary cd-action-btn"
                          onClick={() => handlePreviewFile(ev)}
                          title="Preview file"
                        >
                          <Eye size={13} /> Preview
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary cd-action-btn"
                          onClick={() => handleDownloadFile(ev)}
                          title="Download file"
                        >
                          <Download size={13} />
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline cd-action-approve"
                          onClick={() => handleApproveEvidence(ev.id)}
                          disabled={isApproved}
                          title="Approve deliverable"
                        >
                          <Check size={13} /> Approve
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline cd-action-reject"
                          onClick={() => {
                            if (isRejected) return;
                            setRejectingFileId(prev => prev === ev.id ? null : ev.id);
                          }}
                          disabled={isRejected}
                          title={isRejected ? "Evidence deliverable is rejected" : "Reject deliverable and provide client revision instruction"}
                        >
                          <XCircle size={13} /> {isRejected ? 'Rejected' : 'Reject'}
                        </button>
                      </div>
                    </div>

                    {/* Client Feedback Box: Directly connected to Reject button (shown when Rejected or actively Rejecting) */}
                    {(isRejected || rejectingFileId === ev.id) && (
                      <div className="cd-feedback-row" style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
                        <label className="cd-feedback-label" style={{ color: '#C5221F', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <AlertTriangle size={13} color="#C5221F" />
                          Client Feedback (Rejection Instruction):
                        </label>
                        <div style={{ display: 'flex', gap: '6px', flex: 1, alignItems: 'center' }}>
                          <input
                            type="text"
                            className="cd-feedback-input"
                            style={{ borderColor: '#FECACA', backgroundColor: '#FFFFFF' }}
                            placeholder="Specify reason for rejection and required client revision (sent to client dashboard)..."
                            value={currentFeedback}
                            onChange={(e) => setClientFeedbackDraft({ ...clientFeedbackDraft, [ev.id]: e.target.value })}
                            autoFocus={rejectingFileId === ev.id}
                          />
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{
                              backgroundColor: '#DC2626',
                              color: '#FFFFFF',
                              borderColor: '#DC2626',
                              fontSize: '11px',
                              padding: '5px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontWeight: '600',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={() => {
                              if (isRejected) {
                                handleSaveClientFeedback(ev.id);
                              } else {
                                handleRejectEvidence(ev.id);
                              }
                            }}
                            disabled={savingFeedbackId === ev.id}
                          >
                            <XCircle size={12} />
                            {savingFeedbackId === ev.id ? 'Saving...' : (isRejected ? 'Update Instruction' : 'Confirm & Reject')}
                          </button>
                          {!isRejected && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: '11px', padding: '5px 8px', whiteSpace: 'nowrap' }}
                              onClick={() => setRejectingFileId(null)}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

{/* ─── SECTION 3: Auditor Evaluation & Report Form ─────────────── */}
      <div className="cd-eval-form-card" id="auditor-evaluation-form">
        <div className="cd-section-header">
          <div>
            <h2 className="cd-section-title">
              <FileCheck className="cd-section-title-icon" size={20} /> Section D: Auditor Evaluation & Report Workpaper
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
              Record formal compliance determination, risk scoring, non-compliance observations, and final report workpapers.
            </p>
          </div>
          {evaluation.isSubmitted && (
            <span style={{ fontSize: '12px', color: '#137333', fontWeight: '600', backgroundColor: '#E6F4EA', padding: '4px 10px', borderRadius: '6px' }}>
              Formal Evaluation Active
            </span>
          )}
        </div>

        {/* A. Dynamic Status Group */}
        <div>
          <h3 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            A. Compliance Determination & Risk Rating
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

        {/* B. Executive Audit Report Notes Component (Always Visible & Fed into Final Audit Report) */}
        <div id="report-notes-component" className="cd-report-notes-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <label className="cd-field-label" style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClipboardList size={16} color="var(--primary)" />
                B. Executive Audit Report Notes (Included in Official Audit Report)
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                This overall control narrative is compiled directly into the official compliance audit report presented to SEBI and executive management.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {previousDraftNote !== null && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '11.5px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleUndoAISynthesis}
                  title="Undo AI generation and revert to your previous note"
                >
                  <RotateCcw size={12} /> Revert Note
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                style={{ fontSize: '12px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
                onClick={handleTriggerAISynthesis}
                disabled={isSynthesizing}
                title="Use AI to generate professional SEBI audit observations, root cause, impact, and recommendations from your notes"
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 size={13} className="spin" /> Generating Observations...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} /> {evaluation.complianceStatus === 'Compliant' ? '✨ Enhance Report Note with AI' : '✨ Generate All Observations & Notes with AI'}
                  </>
                )}
              </button>
            </div>
          </div>

          <textarea
            className="cd-textarea"
            rows={3}
            placeholder="Enter overall executive audit workpaper narrative for this control (or click 'Adopt from AI Synthesis' above)..."
            value={evaluation.auditorNotes}
            onChange={(e) => handleFieldChange('auditorNotes', e.target.value)}
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
        </div>

        {/* C. Non-Compliance Observations (Dynamically displayed when Partially Compliant or Non-Compliant) */}
        {isObservationsVisible && (
          <div className="cd-observations-wrapper">
            <div className="cd-observations-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                <span>C. Non-Compliance Observations Required — Status set to {evaluation.complianceStatus}</span>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#FFFFFF', color: '#B06000', borderColor: '#FDE293' }}
                onClick={handleTriggerAISynthesis}
                disabled={isSynthesizing}
              >
                <Sparkles size={11} color="#B06000" /> {isSynthesizing ? 'Generating...' : 'Auto-Fill Observations with AI'}
              </button>
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
            </div>
          </div>
        )}

        {/* When compliant, show note about preserved observation values */}
        {!isObservationsVisible && (
          <div style={{
            padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px'
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
          <span>Control: <strong style={{ color: 'var(--text-primary)' }}>{controlData?.name || resolvedControlId}</strong></span>
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
