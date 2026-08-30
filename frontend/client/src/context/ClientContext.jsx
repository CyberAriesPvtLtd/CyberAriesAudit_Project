import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ClientContext = createContext();

// Findings remain as dummy data for now (auditor-client communication pipeline is a future feature)
const initialAllFindings = {
};

const initialActivities = [
  { id: 'ACT-C01', user: 'System', type: 'System', message: 'Client compliance score initialized.', timestamp: '2026-07-05T09:00:00Z' },
];

const defaultSettings = {
  timezone: 'UTC/GMT +5:30',
  dateFormat: 'YYYY-MM-DD',
  sessionTimeout: '60 minutes',
  alertsEnabled: true,
  weeklyDigest: false,
};

// ─── Helper: Map backend AuditControlResponse to client control shape ───
const mapAuditControlForClient = (ac) => {
  const ctrl = ac.control || {};
  const frameworkRules = ctrl.framework_rules || [];
  const primaryEvidence = ctrl.primary_evidence || [];

  return {
    id: ac.id,
    controlCode: ctrl.control_id || '',
    name: ctrl.control_desc ? ctrl.control_desc.substring(0, 80) : 'Unnamed Control',
    domain: ctrl.control_domain || '',
    standard: frameworkRules.join(', '),
    description: ctrl.control_desc || '',
    requiredEvidence: primaryEvidence.join('; '),
    status: ac.status || 'Action Required',
    evidenceFile: null,
    evidenceSize: null,
    evidenceDate: null,
    assignedAuditorId: ac.assigned_to || null,
    frameworkRulesList: frameworkRules,
    frameworkCategory: ctrl.audit_category || '',
  };
};

// ─── Helper: Map backend ControlsResponse to client rulebook shape ───
const mapControlFromDb = (dbControl) => {
  const rules = dbControl.framework_rules || [];
  return {
    id: dbControl.id,
    frameworkRules: rules.join(', '),
    frameworkRulesList: rules,
    controlDomain: dbControl.control_domain || '',
    frameworkType: dbControl.audit_type,
    frameworkCategory: dbControl.audit_category,
    frameworkSubcategory: dbControl.audit_subcategory,
    description: dbControl.control_desc,
    primaryDocuments: dbControl.primary_evidence || [],
    secondaryDocuments: dbControl.secondary_evidence || [],
    lastUpdated: dbControl.created_at
      ? new Date(dbControl.created_at).toLocaleDateString('en-GB').split('/').join('-')
      : '',
  };
};

export const ClientProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cc_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Audit objects from backend: [{ id, audit_name, audit_type, company_id, ... }]
  const [clientAudits, setClientAudits] = useState([]);

  // Derived list of audit display names for dropdowns / cards
  const assignedAudits = clientAudits.map(a => a.audit_name);

  // Currently selected audit name
  const [currentAudit, setCurrentAudit] = useState(() => {
    const saved = localStorage.getItem('cc_current_audit');
    return saved || '';
  });

  // Controls keyed by audit ID: { [auditId]: [...controls] }
  const [auditControlsMap, setAuditControlsMap] = useState({});

  // Loading state
  const [isLoadingAudits, setIsLoadingAudits] = useState(false);
  const [isLoadingControls, setIsLoadingControls] = useState(false);

  // Rulebook (all controls for Framework Management page)
  const [rulebook, setRulebook] = useState([]);

  const [allFindings, setAllFindings] = useState(() => {
    const saved = localStorage.getItem('cc_all_findings');
    return saved ? JSON.parse(saved) : initialAllFindings;
  });

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('cc_activities');
    return saved ? JSON.parse(saved) : initialActivities;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cc_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  // ─── Get current audit object ───
  const currentAuditObj = clientAudits.find(a => a.audit_name === currentAudit) || null;

  // ─── Derived controls for current audit ───
  const controls = currentAuditObj ? (auditControlsMap[currentAuditObj.id] || []) : [];

  // ─── allControls keyed by audit name (for stats in MyAudits) ───
  const allControls = {};
  clientAudits.forEach(a => {
    allControls[a.audit_name] = auditControlsMap[a.id] || [];
  });

  const findings = allFindings[currentAudit] || [];

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('cc_current_audit', currentAudit);
  }, [currentAudit]);

  useEffect(() => {
    localStorage.setItem('cc_all_findings', JSON.stringify(allFindings));
  }, [allFindings]);

  useEffect(() => {
    localStorage.setItem('cc_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('cc_settings', JSON.stringify(settings));
  }, [settings]);

  // ─── Fetch audits for client's company ───
  const fetchClientAudits = useCallback(async (companyId) => {
    if (!companyId) return;
    setIsLoadingAudits(true);
    try {
      const allAudits = await api.getAuditFrameworks();
      const myAudits = allAudits.filter(a => a.companyID === companyId || a.company_id === companyId);
      setClientAudits(myAudits);
      console.log(`[CyberAries Client] Loaded ${myAudits.length} audits for company ${companyId}.`);

      // Auto-select the first audit if no current audit or current doesn't exist
      if (myAudits.length > 0) {
        const currentExists = myAudits.some(a => a.audit_name === currentAudit);
        if (!currentExists) {
          setCurrentAudit(myAudits[0].audit_name);
        }
      }

      // Pre-fetch controls for all audits
      for (const audit of myAudits) {
        await fetchAuditControls(audit.id);
      }
    } catch (err) {
      console.error('[CyberAries Client] Failed to fetch audits:', err.response?.data?.detail || err.message);
    } finally {
      setIsLoadingAudits(false);
    }
  }, [currentAudit]);

  // ─── Fetch controls for a specific audit ───
  const fetchAuditControls = async (auditId) => {
    if (!auditId) return [];
    setIsLoadingControls(true);
    try {
      const dbControls = await api.getAuditControlsByFramework(auditId);
      if (dbControls && Array.isArray(dbControls)) {
        const mapped = dbControls.map(mapAuditControlForClient);
        setAuditControlsMap(prev => ({ ...prev, [auditId]: mapped }));
        console.log(`[CyberAries Client] Loaded ${mapped.length} controls for audit ${auditId}.`);
        return mapped;
      }
      return [];
    } catch (err) {
      console.error('[CyberAries Client] Failed to fetch controls:', err.response?.data?.detail || err.message);
      return [];
    } finally {
      setIsLoadingControls(false);
    }
  };

  // ─── Fetch all controls for Framework Management page ───
  const fetchRulebook = useCallback(async () => {
    try {
      const dbControls = await api.getControls();
      if (dbControls && Array.isArray(dbControls)) {
        const mapped = dbControls.map(mapControlFromDb);
        setRulebook(mapped);
        console.log(`[CyberAries Client] Loaded ${mapped.length} controls for rulebook.`);
      }
    } catch (err) {
      console.error('[CyberAries Client] Failed to fetch rulebook:', err.response?.data?.detail || err.message);
    }
  }, []);

  // ─── Auto-fetch on mount if user is already logged in ───
  useEffect(() => {
    if (currentUser?.companyId) {
      fetchClientAudits(currentUser.companyId);
      fetchRulebook();
    }
  }, [currentUser?.companyId]);

  // ─── Switch audit (from dropdown or card click) ───
  const switchAudit = (auditName) => {
    setCurrentAudit(auditName);

    // Ensure controls are loaded for this audit
    const auditObj = clientAudits.find(a => a.audit_name === auditName);
    if (auditObj && !auditControlsMap[auditObj.id]) {
      fetchAuditControls(auditObj.id);
    }

    addActivityLog(currentUser?.fullName || 'Client', 'System', `Switched active workspace view to: ${auditName}`);
  };

  // ─── Auth Operations ───
  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);

      let fetchedCompanyName = '';
      if (response.user.company_id) {
        try {
          const companyData = await api.getCompanyById(response.user.company_id);
          fetchedCompanyName = companyData.company_name;
        } catch (cErr) {
          console.warn('[CyberAries] Failed to fetch company name:', cErr);
        }
      }

      const userData = {
        id: response.user.id,
        fullName: response.user.name,
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        companyId: response.user.company_id,
        companyName: fetchedCompanyName,
        token: response.access_token,
        avatarInitials: response.user.name
          ? response.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
          : 'CL',
      };

      setCurrentUser(userData);
      localStorage.setItem('cc_user', JSON.stringify(userData));
      localStorage.setItem('cc_token', response.access_token);
      addActivityLog(userData.fullName, 'System', 'Client logged in successfully.');

      // Fetch audits for this client's company
      if (userData.companyId) {
        await fetchClientAudits(userData.companyId);
        await fetchRulebook();
      }

      return { success: true };
    } catch (err) {
      console.error('[CyberAries] Client login failed:', err.response?.data?.detail || err.message);
      return { success: false, error: err.response?.data?.detail || 'Invalid credentials' };
    }
  };

  const logout = () => {
    if (currentUser) {
      addActivityLog(currentUser.fullName, 'System', 'Client logged out.');
    }
    setCurrentUser(null);
    localStorage.removeItem('cc_user');
    localStorage.removeItem('cc_token');
  };

  // Activity Log helper
  const addActivityLog = (user, type, message) => {
    const newLog = {
      id: `ACT-${Date.now()}`,
      user,
      type,
      message,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newLog, ...prev]);
  };

  // Evidence Management
  const uploadEvidence = (controlId, fileName, fileSize) => {
    // Update controls in the auditControlsMap for the current audit
    if (!currentAuditObj) return;
    const auditId = currentAuditObj.id;

    setAuditControlsMap(prev => {
      const currentList = prev[auditId] || [];
      const updatedList = currentList.map(c => {
        if (c.id === controlId) {
          return {
            ...c,
            evidenceFile: fileName,
            evidenceSize: fileSize,
            evidenceDate: new Date().toISOString().split('T')[0],
            status: 'In Progress',
          };
        }
        return c;
      });
      return { ...prev, [auditId]: updatedList };
    });

    addActivityLog(currentUser?.fullName || 'Client', 'Document', `Uploaded evidence file: "${fileName}" for ${controlId} under ${currentAudit}.`);

    // Auto-resolve any pending findings for this control
    setAllFindings(prev => {
      const currentList = prev[currentAudit] || [];
      const updatedList = currentList.map(f => {
        if (f.id === controlId && f.status === 'Pending Response') {
          return {
            ...f,
            status: 'Resolved',
            comments: [
              ...f.comments,
              {
                sender: 'Client',
                name: currentUser?.fullName || 'Client User',
                message: `I have uploaded the requested evidence file: "${fileName}"`,
                timestamp: new Date().toISOString(),
                attachment: fileName
              }
            ]
          };
        }
        return f;
      });
      return { ...prev, [currentAudit]: updatedList };
    });
  };

  const deleteEvidence = (controlId) => {
    if (!currentAuditObj) return;
    const auditId = currentAuditObj.id;
    let fileName = '';

    setAuditControlsMap(prev => {
      const currentList = prev[auditId] || [];
      const updatedList = currentList.map(c => {
        if (c.id === controlId) {
          fileName = c.evidenceFile;
          return {
            ...c,
            evidenceFile: null,
            evidenceSize: null,
            evidenceDate: null,
            status: 'Action Required',
          };
        }
        return c;
      });
      return { ...prev, [auditId]: updatedList };
    });

    if (fileName) {
      addActivityLog(currentUser?.fullName || 'Client', 'Document', `Removed evidence file: "${fileName}" from ${controlId} under ${currentAudit}.`);
    }
  };

  // Findings Comments
  const addReplyToFinding = (findingId, message, attachment) => {
    setAllFindings(prev => {
      const currentList = prev[currentAudit] || [];
      const updatedList = currentList.map(f => {
        if (f.id === findingId) {
          const updatedComments = [
            ...f.comments,
            {
              sender: 'Client',
              name: currentUser?.fullName || 'Client User',
              message,
              timestamp: new Date().toISOString(),
              attachment
            }
          ];
          return {
            ...f,
            status: 'Resolved',
            comments: updatedComments
          };
        }
        return f;
      });
      return { ...prev, [currentAudit]: updatedList };
    });

    if (attachment) {
      uploadEvidence(findingId, attachment, '1.2 MB');
    } else {
      addActivityLog(currentUser?.fullName || 'Client', 'Audit', `Submitted clarification reply for ${findingId} under ${currentAudit}.`);
    }
  };

  // Profile Form Updates
  const updateProfile = (profileData) => {
    setCurrentUser(prev => {
      const updated = {
        ...prev,
        ...profileData,
        avatarInitials: profileData.fullName ? profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'CL'
      };
      localStorage.setItem('cc_user', JSON.stringify(updated));
      return updated;
    });

    addActivityLog(profileData.fullName || currentUser?.fullName || 'Client', 'System', 'Account profile contact details updated.');
  };

  // Portal Settings Form Toggles
  const updatePreferences = (preferencesData) => {
    setSettings(prev => ({
      ...prev,
      ...preferencesData,
    }));
    addActivityLog(currentUser?.fullName || 'Client', 'System', 'Portal preferences updated.');
  };

  return (
    <ClientContext.Provider value={{
      currentUser,
      assignedAudits,
      clientAudits,
      currentAudit,
      currentAuditObj,
      controls,
      findings,
      allControls,
      activities,
      settings,
      rulebook,
      isLoadingAudits,
      isLoadingControls,
      login,
      logout,
      switchAudit,
      uploadEvidence,
      deleteEvidence,
      addReplyToFinding,
      updateProfile,
      updatePreferences,
      fetchClientAudits,
      fetchAuditControls,
      fetchRulebook,
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => useContext(ClientContext);
