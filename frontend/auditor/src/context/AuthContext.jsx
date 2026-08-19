import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { updateEvidenceItemStatus } from '../services/api';

const AuthContext = createContext(null);

const defaultAuditsData = {
  "ABC Technologies": {
    "ISO 27001": {
      stats: { assigned: 12, pending: 4, completed: 6, aiReview: 2 },
      evidence: [
        { id: '1', fileName: 'ISMS_Manual_v1.pdf', type: 'Document', controlId: 'A.5.1.1', controlName: 'InfoSec Policy', client: 'ABC Technologies', date: '06 Jul 2026', status: 'Pending Review', auditId: 'ISO-27001' },
        { id: '2', fileName: 'Access_Provisioning_Logs.xlsx', type: 'Spreadsheet', controlId: 'A.9.2.1', controlName: 'Access Control', client: 'ABC Technologies', date: '08 Jul 2026', status: 'Under AI Analysis', auditId: 'ISO-27001' }
      ],
      findings: [
        { id: '1', controlId: 'A.8.1.1', controlName: 'Asset Inventory', risk: 'Medium', status: 'Open', message: 'Asset inventory records are missing owner specifications.' }
      ],
      reports: [
        { id: '1', name: 'ISO 27001 Stage 1 Audit Summary.pdf', period: 'FY 2026', status: 'Draft', date: '2026-07-15' }
      ],
      progress: { score: 62, completed: 8, total: 13 }
    },
    "SOC 2 Type II": {
      stats: { assigned: 7, pending: 2, completed: 4, aiReview: 1 },
      evidence: [
        { id: '11', fileName: 'Access_Auth_Review_Q1.pdf', type: 'Document', controlId: 'CTRL-AC-01', controlName: 'User Access Authorization', client: 'ABC Technologies', date: '10 Jul 2026', status: 'Approved', auditId: 'SOC2' },
        { id: '12', fileName: 'Database_KMS_Encryption.png', type: 'Image', controlId: 'CTRL-EN-01', controlName: 'Encryption at Rest', client: 'ABC Technologies', date: '12 Jul 2026', status: 'Pending Review', auditId: 'SOC2' }
      ],
      findings: [
        { id: '11', controlId: 'CTRL-AC-02', controlName: 'MFA Configuration', risk: 'High', status: 'Open', message: 'MFA is not enforced for external console access.' }
      ],
      reports: [
        { id: '11', name: 'SOC 2 Type II Interim Assessment.pdf', period: 'Q2 2026', status: 'Approved', date: '2026-06-30' }
      ],
      progress: { score: 57, completed: 4, total: 7 }
    },
    "SEBI CSCRF": {
      stats: { assigned: 4, pending: 0, completed: 4, aiReview: 0 },
      evidence: [
        { id: '21', fileName: 'SEBI_CISO_Charter.pdf', type: 'Document', controlId: 'SEBI-GV-01', controlName: 'Security Governance Charter', client: 'ABC Technologies', date: '05 Jul 2026', status: 'Approved', auditId: 'SEBI' }
      ],
      findings: [],
      reports: [
        { id: '21', name: 'SEBI CSCRF Final Evaluation.pdf', period: 'FY 2025-26', status: 'Approved', date: '2026-07-01' }
      ],
      progress: { score: 100, completed: 4, total: 4 }
    }
  },
  "XYZ Finance": {
    "SOC 2 Type II": {
      stats: { assigned: 7, pending: 1, completed: 5, aiReview: 1 },
      evidence: [
        { id: '31', fileName: 'XYZ_MFA_Settings.png', type: 'Image', controlId: 'CTRL-AC-02', controlName: 'MFA Configuration', client: 'XYZ Finance', date: '05 Jul 2026', status: 'Pending Review', auditId: 'SOC2' }
      ],
      findings: [],
      reports: [],
      progress: { score: 71, completed: 5, total: 7 }
    },
    "SEBI CSCRF": {
      stats: { assigned: 4, pending: 2, completed: 2, aiReview: 0 },
      evidence: [
        { id: '41', fileName: 'VAPT_Scope_Approval.pdf', type: 'Document', controlId: 'SEBI-DE-04', controlName: 'VAPT Testing', client: 'XYZ Finance', date: '08 Jul 2026', status: 'Pending Review', auditId: 'SEBI' }
      ],
      findings: [],
      reports: [],
      progress: { score: 50, completed: 2, total: 4 }
    },
    "RBI Cyber Security": {
      stats: { assigned: 1, pending: 1, completed: 0, aiReview: 0 },
      evidence: [],
      findings: [],
      reports: [],
      progress: { score: 0, completed: 0, total: 1 }
    }
  },
  "Nova Logistics": {
    "ISO 27001": {
      stats: { assigned: 13, pending: 5, completed: 6, aiReview: 2 },
      evidence: [
        { id: '51', fileName: 'Scope_Definition_v1.pdf', type: 'Document', controlId: 'A.5.1', controlName: 'Scope Definitions', client: 'Nova Logistics', date: '10 Jul 2026', status: 'Pending Review', auditId: 'ISO-27001' }
      ],
      findings: [],
      reports: [],
      progress: { score: 46, completed: 6, total: 13 }
    },
    "PCI DSS": {
      stats: { assigned: 12, pending: 3, completed: 8, aiReview: 1 },
      evidence: [
        { id: '61', fileName: 'Cardholder_Data_Flows.png', type: 'Image', controlId: 'PCI-1.1', controlName: 'Network Diagrams', client: 'Nova Logistics', date: '12 Jul 2026', status: 'Approved', auditId: 'PCI' }
      ],
      findings: [],
      reports: [],
      progress: { score: 66, completed: 8, total: 12 }
    }
  },
  "Quantum Retail": {
    "PCI DSS": {
      stats: { assigned: 12, pending: 6, completed: 4, aiReview: 2 },
      evidence: [],
      findings: [],
      reports: [],
      progress: { score: 33, completed: 4, total: 12 }
    },
    "HIPAA": {
      stats: { assigned: 8, pending: 4, completed: 3, aiReview: 1 },
      evidence: [],
      findings: [],
      reports: [],
      progress: { score: 37, completed: 3, total: 8 }
    }
  },
  "BioHealth Solutions": {
    "HIPAA": {
      stats: { assigned: 8, pending: 2, completed: 5, aiReview: 1 },
      evidence: [],
      findings: [],
      reports: [],
      progress: { score: 62, completed: 5, total: 8 }
    },
    "ISO 27001": {
      stats: { assigned: 13, pending: 4, completed: 7, aiReview: 2 },
      evidence: [],
      findings: [],
      reports: [],
      progress: { score: 53, completed: 7, total: 13 }
    }
  }
};

const clientAuditsMapping = {
  "ABC Technologies": ["ISO 27001", "SOC 2 Type II", "SEBI CSCRF"],
  "XYZ Finance": ["SOC 2 Type II", "SEBI CSCRF", "RBI Cyber Security"],
  "Nova Logistics": ["ISO 27001", "PCI DSS"],
  "Quantum Retail": ["PCI DSS", "HIPAA"],
  "BioHealth Solutions": ["HIPAA", "ISO 27001"]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monorepo states
  const [assignedClients, setAssignedClients] = useState([
    "ABC Technologies",
    "XYZ Finance",
    "Nova Logistics",
    "Quantum Retail",
    "BioHealth Solutions"
  ]);
  const [selectedClient, setSelectedClient] = useState("ABC Technologies");
  const [selectedAudit, setSelectedAudit] = useState("ISO 27001");
  const [auditsData, setAuditsData] = useState(() => {
    const saved = localStorage.getItem('auditor_audits_data');
    return saved ? JSON.parse(saved) : defaultAuditsData;
  });

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
      const clientAudits = clientAuditsMapping[clientName] || [];
      if (clientAudits.length > 0) {
        setSelectedAudit(clientAudits[0]);
      }
    }
  };

  const switchAudit = (auditName) => {
    const clientAudits = clientAuditsMapping[selectedClient] || [];
    if (clientAudits.includes(auditName)) {
      setSelectedAudit(auditName);
    }
  };

  // NOTE: evidenceId here is still the mock evidence id from
  // defaultAuditsData (e.g. '1', '2') for controls/audits not yet wired to
  // the real backend. This function now attempts the real API call using
  // that id as a best effort - it will succeed once evidence ids in this
  // context are replaced with real EvidenceItem ids from the backend
  // (mirrors the same placeholder situation in the client app's
  // ClientContext.jsx uploadEvidence). Local state updates immediately
  // either way so the UI stays responsive; the backend call runs
  // alongside it and is logged (not thrown) on failure so a stale id
  // never breaks the review screen.
  const updateEvidenceStatus = (evidenceId, newStatus) => {
    setAuditsData(prev => {
      const clientData = prev[selectedClient] || {};
      const auditData = clientData[selectedAudit] || {};
      const list = auditData.evidence || [];
      
      const updatedList = list.map(ev => {
        if (ev.id === evidenceId) {
          return { ...ev, status: newStatus };
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

    updateEvidenceItemStatus(evidenceId, newStatus).catch((err) => {
      console.error(
        '[CyberAries] Backend evidence status update failed (expected while evidence ids are still mock data):',
        err.response?.data?.detail || err.message
      );
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
        token: response.access_token,
      };

      localStorage.setItem('cyberaries_user', JSON.stringify(userData));
      localStorage.setItem('cyberaries_token', response.access_token);
      setUser(userData);
      setIsLoading(false);
      
      return { success: true };
    } catch (err) {
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
    clientAuditsMapping,
    selectedClient,
    selectedAudit,
    activeAuditData,
    auditsData,
    switchClient,
    switchAudit,
    updateEvidenceStatus,
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
