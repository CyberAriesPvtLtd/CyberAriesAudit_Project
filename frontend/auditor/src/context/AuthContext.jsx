import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monorepo states
  const [assignedClients, setAssignedClients] = useState([]);
  const [clientAuditsMappingState, setClientAuditsMapping] = useState({});
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedAudit, setSelectedAudit] = useState("");
  const [auditsData, setAuditsData] = useState({});

  useEffect(() => {
    const loadRealData = async () => {
      if (!user) return;
      try {
        const companiesList = await api.getCompanies();
        const frameworksList = await api.getAuditFrameworks();
        const controlsList = await api.getAuditControls();

        const isAuditorOrAdmin = user.role === 'admin';
        const myFrameworkIds = new Set();
        controlsList.forEach(ctrl => {
          if (ctrl.assigned_to === user.id || isAuditorOrAdmin) {
            myFrameworkIds.add(ctrl.framework_id);
          }
        });

        const newAssignedClients = new Set();
        const newClientAuditsMapping = {};
        const newAuditsData = {};

        const companyMap = {};
        companiesList.forEach(c => { companyMap[c.id] = c.company_name; });

        for (const fw of frameworksList) {
          if (!myFrameworkIds.has(fw.id)) continue;

          const cid = fw.companyID || fw.company_id;
          const companyName = companyMap[cid] || cid;
          const auditName = fw.audit_name || fw.auditName;

          newAssignedClients.add(companyName);

          if (!newClientAuditsMapping[companyName]) {
            newClientAuditsMapping[companyName] = [];
          }
          if (!newClientAuditsMapping[companyName].includes(auditName)) {
            newClientAuditsMapping[companyName].push(auditName);
          }

          if (!newAuditsData[companyName]) {
            newAuditsData[companyName] = {};
          }

          const fwControls = controlsList.filter(c => c.framework_id === fw.id);
          const assignedControls = fwControls.filter(c => c.assigned_to === user.id || isAuditorOrAdmin);

          let pending = 0;
          let completed = 0;
          let aiReview = 0;

          assignedControls.forEach(c => {
             if (c.status === "Pending Review") pending++;
             else if (c.status === "Completed" || c.status === "Approved") completed++;
             else if (c.status === "Under AI Analysis") aiReview++;
          });

          let mappedEvidence = [];
          const assignedControlIds = assignedControls.map(c => c.id);
          
          if (assignedControlIds.length > 0) {
            try {
              const batchEvidence = await api.getEvidenceBatch(assignedControlIds);
              for (const link of batchEvidence) {
                const ev = link.evidence_item;
                const ac = assignedControls.find(c => c.id === link.audit_control_id);
                if (ev && ac) {
                  mappedEvidence.push({
                    id: ev.id,
                    fileName: ev.file_name,
                    client: ev.user?.name || companyName,
                    controlId: (ac.control?.framework_rules && ac.control.framework_rules.length > 0) ? ac.control.framework_rules.join(', ') : (ac.control?.control_id || ac.control_id),
                    controlDesc: ac.control?.control_desc || 'No description available',
                    date: new Date(ev.created_at).toLocaleDateString(),
                    status: ev.status,
                    auditor_notes: ev.auditor_notes || '',
                    reviewed_by: ev.reviewed_by || null,
                    reviewed_at: ev.reviewed_at ? new Date(ev.reviewed_at).toLocaleDateString() : null,
                  });
                }
              }
            } catch (err) {
              console.error("Failed to fetch batch evidence", err);
            }
          }

          newAuditsData[companyName][auditName] = {
            framework_id: fw.id,
            company_id: cid,
            controls: assignedControls,
            stats: {
              assigned: assignedControls.length,
              pending,
              completed,
              aiReview
            },
            evidence: mappedEvidence,
            findings: [],
            reports: [],
            progress: {
              score: assignedControls.length ? Math.round((completed / assignedControls.length) * 100) : 0,
              completed: completed,
              total: assignedControls.length
            }
          };
        }

        const assignedArray = Array.from(newAssignedClients);
        setAssignedClients(assignedArray);
        setClientAuditsMapping(newClientAuditsMapping);
        setAuditsData(newAuditsData);

        if (assignedArray.length > 0) {
          const firstClient = assignedArray[0];
          setSelectedClient(firstClient);
          if (newClientAuditsMapping[firstClient] && newClientAuditsMapping[firstClient].length > 0) {
            setSelectedAudit(newClientAuditsMapping[firstClient][0]);
          }
        } else {
          setSelectedClient("");
          setSelectedAudit("");
        }

      } catch (err) {
        console.warn("[CyberAries] Auditor data loading from backend:", err.message);
        setAssignedClients([]);
        setClientAuditsMapping({});
        setAuditsData({});
        setSelectedClient("");
        setSelectedAudit("");
      }
    };

    loadRealData();
  }, [user]);

  useEffect(() => {
    // Check for existing session in localStorage on mount
    const storedUser = localStorage.getItem('cyberaries_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('cyberaries_user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('auditor_audits_data', JSON.stringify(auditsData));
  }, [auditsData]);

  const switchClient = (clientName) => {
    if (assignedClients.includes(clientName)) {
      setSelectedClient(clientName);
      // Auto select first audit of new client
      const clientAudits = clientAuditsMappingState[clientName] || [];
      if (clientAudits.length > 0) {
        setSelectedAudit(clientAudits[0]);
      }
    }
  };

  const switchAudit = (auditName) => {
    const clientAudits = clientAuditsMappingState[selectedClient] || [];
    if (clientAudits.includes(auditName)) {
      setSelectedAudit(auditName);
    }
  };

  const updateEvidenceStatus = async (evidenceId, newStatus, clientFeedback = null) => {
    try {
      await api.updateEvidenceStatus(evidenceId, newStatus, user?.id, clientFeedback);
      if (clientFeedback !== null && clientFeedback !== undefined && String(clientFeedback).trim() !== "") {
        await api.updateClientFeedback(evidenceId, clientFeedback);
      }
    } catch (err) {
      console.error("Failed to update evidence status:", err);
      return;
    }

    setAuditsData(prev => {
      const clientData = prev[selectedClient] || {};
      const auditData = clientData[selectedAudit] || {};
      const list = auditData.evidence || [];

      const updatedList = list.map(ev => {
        if (ev.id === evidenceId) {
          return {
            ...ev,
            status: newStatus,
            ...(clientFeedback !== null ? { client_feedback: clientFeedback } : {})
          };
        }
        return ev;
      });

      return {
        ...prev,
        [selectedClient]: {
          ...clientData,
          [selectedAudit]: {
            ...auditData,
            evidence: updatedList
          }
        }
      };
    });
  };

  const updateEvidenceNotes = async (evidenceId, notes) => {
    try {
      await api.updateEvidenceNotes(evidenceId, notes);
    } catch (err) {
      console.error("Failed to update evidence notes:", err);
      return;
    }

    setAuditsData(prev => {
      const clientData = prev[selectedClient] || {};
      const auditData = clientData[selectedAudit] || {};
      const list = auditData.evidence || [];

      const updatedList = list.map(ev => {
        if (ev.id === evidenceId) {
          return { ...ev, auditor_notes: notes };
        }
        return ev;
      });

      return {
        ...prev,
        [selectedClient]: {
          ...clientData,
          [selectedAudit]: {
            ...auditData,
            evidence: updatedList
          }
        }
      };
    });
  };

  const updateClientFeedback = async (evidenceId, feedback) => {
    try {
      await api.updateClientFeedback(evidenceId, feedback);
    } catch (err) {
      console.error("Failed to update client feedback:", err);
      return;
    }

    setAuditsData(prev => {
      const clientData = prev[selectedClient] || {};
      const auditData = clientData[selectedAudit] || {};
      const list = auditData.evidence || [];

      const updatedList = list.map(ev => {
        if (ev.id === evidenceId) {
          return { ...ev, client_feedback: feedback };
        }
        return ev;
      });

      return {
        ...prev,
        [selectedClient]: {
          ...clientData,
          [selectedAudit]: {
            ...auditData,
            evidence: updatedList
          }
        }
      };
    });
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.login(email, password);

      const userData = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        username: response.user.username,
        role: response.user.role,
        company_id: response.user.company_id,
        token: response.access_token,
      };

      localStorage.setItem('cyberaries_user', JSON.stringify(userData));
      localStorage.setItem('cyberaries_token', response.access_token);
      setUser(userData);
      setIsLoading(false);

      return { success: true };
    } catch (err) {
      if (err.message?.includes('Network Error') || !err.response) {
        console.warn("[CyberAries] Backend server offline. Logging in with offline auditor profile.");
        const offlineUser = {
          id: 'auditor-1',
          email: email || 'rahul.sharma@cyberaries.com',
          name: 'Rahul Sharma',
          username: (email && email.split('@')[0]) || 'rahul.sharma',
          role: 'auditor',
          company_id: 'comp-01',
          token: 'offline-jwt-token'
        };
        localStorage.setItem('cyberaries_user', JSON.stringify(offlineUser));
        localStorage.setItem('cyberaries_token', offlineUser.token);
        setUser(offlineUser);
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      console.error('[CyberAries] Auditor login failed:', err.response?.data?.detail || err.message);
      return { success: false, error: err.response?.data?.detail || 'Invalid credentials' };
    }
  };

  const logout = () => {
    localStorage.removeItem('cyberaries_user');
    localStorage.removeItem('cyberaries_token');
    setUser(null);
  };

  const saveControlEvaluation = async (controlId, evaluationData, isSubmitted = false) => {
    const auditorId = user?.id || 'auditor-1';
    const storageKey = `auditor_eval_${auditorId}_${controlId}`;
    const payload = {
      ...evaluationData,
      controlId,
      auditorId,
      auditorName: user?.name || 'Auditor',
      isSubmitted,
      isDraft: !isSubmitted,
      updatedAt: new Date().toISOString(),
    };

    // 1. Persist to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
      const regKey = `auditor_evaluations_store_${auditorId}`;
      const existingReg = JSON.parse(localStorage.getItem(regKey) || '{}');
      existingReg[controlId] = payload;
      localStorage.setItem(regKey, JSON.stringify(existingReg));
    } catch (e) {
      console.error("Failed to save evaluation to localStorage", e);
    }

    // 2. Persist to backend if API is reachable
    try {
      const idToUpdate = evaluationData.auditControlId || controlId;
      if (idToUpdate) {
        const backendPayload = {
          compliance_status: evaluationData.complianceStatus || null,
          risk_rating: evaluationData.riskRating || null,
          similar_issue: evaluationData.similarIssue === 'Yes' ? true : (evaluationData.similarIssue === 'No' ? false : null),
          root_cause_analysis: evaluationData.rootCause || null,
          impact_analysis: evaluationData.impactAnalysis || null,
          recommendation: evaluationData.recommendations || null,
          remediation_days: evaluationData.remediationDays ? Number(evaluationData.remediationDays) : null,
          management_response: evaluationData.managementResponse || null,
          auditor_notes: evaluationData.auditorNotes || null,
        };
        try {
          if (api.evaluateAuditControl) {
            await api.evaluateAuditControl(idToUpdate, backendPayload);
          }
        } catch (evalErr) {
          if (api.updateAuditControl) {
            await api.updateAuditControl(idToUpdate, {
              status: isSubmitted ? (evaluationData.complianceStatus || 'Completed') : 'In Progress',
              evaluation: payload
            });
          }
        }
      }
    } catch (e) {
      // Offline fallback: handled by localStorage
    }

    // 3. Update active audit controls & stats in real-time
    setAuditsData(prev => {
      const clientData = prev[selectedClient] || {};
      const auditData = clientData[selectedAudit] || {};
      const controls = auditData.controls || [];
      const targetId = evaluationData.auditControlId || controlId;

      const updatedControls = controls.map(c => {
        if (
          String(c.id) === String(targetId) ||
          String(c.control_id) === String(controlId) ||
          String(c.control?.id) === String(controlId) ||
          String(c.control?.control_id) === String(controlId)
        ) {
          return {
            ...c,
            compliance_status: evaluationData.complianceStatus || c.compliance_status,
            risk_rating: evaluationData.riskRating || c.risk_rating,
            status: isSubmitted
              ? (evaluationData.complianceStatus === 'Compliant' ? 'Completed' : 'Pending Review')
              : 'In Progress',
            similar_issue: evaluationData.similarIssue === 'Yes' ? true : (evaluationData.similarIssue === 'No' ? false : null),
            root_cause_analysis: evaluationData.rootCause || c.root_cause_analysis,
            impact_analysis: evaluationData.impactAnalysis || c.impact_analysis,
            recommendation: evaluationData.recommendations || c.recommendation,
            remediation_days: evaluationData.remediationDays ? Number(evaluationData.remediationDays) : c.remediation_days,
            management_response: evaluationData.managementResponse || c.management_response,
            auditor_notes: evaluationData.auditorNotes || c.auditor_notes,
          };
        }
        return c;
      });

      const total = updatedControls.length;
      const completedCount = updatedControls.filter(c => c.compliance_status && c.compliance_status !== '').length;
      return {
        ...prev,
        [selectedClient]: {
          ...clientData,
          [selectedAudit]: {
            ...auditData,
            controls: updatedControls,
            stats: {
              ...(auditData.stats || {}),
              assigned: total,
              completed: completedCount,
              pending: Math.max(0, total - completedCount)
            },
            progress: {
              score: total ? Math.round((completedCount / total) * 100) : 0,
              completed: completedCount,
              total
            }
          }
        }
      };
    });

    return payload;
  };

  const getControlEvaluation = (controlId) => {
    const auditorId = user?.id || 'auditor-1';
    const storageKey = `auditor_eval_${auditorId}_${controlId}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load evaluation from localStorage", e);
    }
    return null;
  };

  // Get active selected data
  const clientData = auditsData[selectedClient] || {};
  const activeAuditData = clientData[selectedAudit] || {
    framework_id: null,
    company_id: null,
    stats: { assigned: 0, pending: 0, completed: 0, aiReview: 0 },
    controls: [],
    evidence: [],
    findings: [],
    reports: [],
    progress: { score: 0, completed: 0, total: 0 }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    assignedClients,
    clientAuditsMapping: clientAuditsMappingState,
    selectedClient,
    selectedAudit,
    activeAuditData,
    auditsData,
    switchClient,
    switchAudit,
    updateEvidenceStatus,
    updateEvidenceNotes,
    updateClientFeedback,
    saveControlEvaluation,
    getControlEvaluation,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
