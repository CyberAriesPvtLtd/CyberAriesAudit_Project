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

        const myFrameworkIds = new Set();
        controlsList.forEach(ctrl => {
          if (ctrl.assigned_to === user.id) {
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
          const assignedControls = fwControls.filter(c => c.assigned_to === user.id);

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
        }

      } catch (err) {
        console.warn("Backend not accessible, initializing offline auditor workspace data:", err.message);
        const defaultClients = ['ABC Securities', 'XYZ Finance', 'PQR Capital'];
        const defaultMapping = {
          'ABC Securities': ['SEBI CSCRF', 'ISO 27001'],
          'XYZ Finance': ['SEBI CSCRF'],
          'PQR Capital': ['ISO 27001']
        };
        const defaultAuditsData = {
          'ABC Securities': {
            'SEBI CSCRF': {
              stats: { assigned: 7, pending: 2, completed: 4, aiReview: 1 },
              evidence: [
                {
                  id: 'ev-01',
                  fileName: 'CSCRF_Governance_Policy_v2.pdf',
                  client: 'ABC Securities',
                  controlId: 'FR-001',
                  controlDesc: 'Establish, maintain, and enforce an enterprise cybersecurity governance strategy and risk framework integrated with SEBI CSCRF operational guidelines.',
                  date: '2026-07-15',
                  status: 'Approved',
                  auditor_notes: 'Policy statement is complete, signed by CISO and approved by the board.',
                  reviewed_by: 'auditor-1',
                  reviewed_at: '2026-07-16'
                },
                {
                  id: 'ev-02',
                  fileName: 'Asset_Classification_Standard.pdf',
                  client: 'ABC Securities',
                  controlId: 'FR-002',
                  controlDesc: 'Maintain an automated real-time catalog of all enterprise network services, server endpoints, data assets, and third-party software components.',
                  date: '2026-07-18',
                  status: 'Approved',
                  auditor_notes: 'Real-time discovery telemetry configured and verified.',
                  reviewed_by: 'auditor-1',
                  reviewed_at: '2026-07-19'
                },
                {
                  id: 'ev-03',
                  fileName: 'AD_Password_MFA_Settings.png',
                  client: 'ABC Securities',
                  controlId: 'FR-003',
                  controlDesc: 'Enforce hardware-based multi-factor authentication (MFA) and least-privilege role-based access control (RBAC) across administrative lanes.',
                  date: '2026-07-20',
                  status: 'Pending Review',
                  auditor_notes: 'Under review for MFA exclusions on 8 service accounts.',
                  reviewed_by: null,
                  reviewed_at: null
                },
                {
                  id: 'ev-04',
                  fileName: 'SSL_TLS_Scan_Report.pdf',
                  client: 'ABC Securities',
                  controlId: 'FR-004',
                  controlDesc: 'Enforce AES-256 encryption for database volumes and TLS 1.3 for all external microservice APIs, preventing unauthorized data exposure.',
                  date: '2026-07-21',
                  status: 'Approved',
                  auditor_notes: 'TLS 1.3 ciphers validated across production ingress gateways.',
                  reviewed_by: 'auditor-1',
                  reviewed_at: '2026-07-22'
                },
                {
                  id: 'ev-05',
                  fileName: 'SIEM_Monitoring_Standard.pdf',
                  client: 'ABC Securities',
                  controlId: 'FR-005',
                  controlDesc: 'Aggregate audit telemetry from firewalls, active directory, and servers into a centralized Security Information and Event Management (SIEM) pipeline.',
                  date: '2026-07-22',
                  status: 'Under AI Analysis',
                  auditor_notes: '',
                  reviewed_by: null,
                  reviewed_at: null
                }
              ],
              findings: [
                {
                  controlId: 'FR-003',
                  controlName: 'Privileged Identity & Multi-Factor Access Controls',
                  risk: 'High',
                  message: 'Active Directory configuration screenshot indicates 8 service accounts with MFA enforcement disabled and password expiry set to never.',
                  status: 'Open',
                  confidence: 94,
                  reasoning: 'SEBI CSCRF PR-2.1 mandates MFA for all privileged access lanes. Telemetry scan detected exceptions without registered compensatory controls.'
                },
                {
                  controlId: 'FR-005',
                  controlName: 'Centralized SIEM Log Telemetry & Threat Detection',
                  risk: 'Medium',
                  message: 'Log retention configuration indicates 90 days local storage instead of mandated 180 days tamper-proof archive.',
                  status: 'Open',
                  confidence: 88,
                  reasoning: 'Log retention standard CSCRF-DE-3.4 requires minimum 180 days active logs retention with cryptographic immutability.'
                }
              ],
              reports: [],
              progress: { score: 57, completed: 4, total: 7 }
            },
            'ISO 27001': {
              stats: { assigned: 4, pending: 1, completed: 2, aiReview: 1 },
              evidence: [],
              findings: [],
              reports: [],
              progress: { score: 50, completed: 2, total: 4 }
            }
          }
        };
        setAssignedClients(defaultClients);
        setClientAuditsMapping(defaultMapping);
        setAuditsData(defaultAuditsData);
        setSelectedClient('ABC Securities');
        setSelectedAudit('SEBI CSCRF');
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

  const updateEvidenceStatus = async (evidenceId, newStatus, notes = null) => {
    try {
      await api.updateEvidenceStatus(evidenceId, newStatus, user?.id);
      if (notes !== null) {
        await api.updateEvidenceNotes(evidenceId, notes);
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
            ...(notes !== null ? { auditor_notes: notes } : {})
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
      if (evaluationData.auditControlId || controlId) {
        const idToUpdate = evaluationData.auditControlId || controlId;
        await api.updateAuditControl(idToUpdate, {
          status: isSubmitted ? (evaluationData.complianceStatus || 'Completed') : 'In Progress',
          evaluation: payload
        });
      }
    } catch (e) {
      // Offline fallback: handled by localStorage
    }

    // 3. Update active audit stats if submitted
    if (isSubmitted) {
      setAuditsData(prev => {
        const clientData = prev[selectedClient] || {};
        const auditData = clientData[selectedAudit] || {};
        const stats = auditData.stats || { assigned: 0, pending: 0, completed: 0, aiReview: 0 };
        return {
          ...prev,
          [selectedClient]: {
            ...clientData,
            [selectedAudit]: {
              ...auditData,
              stats: {
                ...stats,
                completed: stats.completed + 1,
                pending: Math.max(0, stats.pending - 1)
              }
            }
          }
        };
      });
    }

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
    stats: { assigned: 0, pending: 0, completed: 0, aiReview: 0 },
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
