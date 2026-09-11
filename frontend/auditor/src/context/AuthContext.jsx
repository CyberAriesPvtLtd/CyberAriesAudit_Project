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
        console.error("Failed to load real data:", err);
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

  const updateEvidenceStatus = async (evidenceId, newStatus) => {
    try {
      await api.updateEvidenceStatus(evidenceId, newStatus, user?.id);
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
    clientAuditsMapping: clientAuditsMappingState,
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
