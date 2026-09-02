import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { uploadEvidenceFile, deleteEvidenceItem as apiDeleteEvidenceItem } from '../services/api';
import {
  initialAllControls as mockControls,
  initialAllFindings as mockFindings,
  initialActivities as mockActivities,
} from '../data/mockData';

const ClientContext = createContext();

// ─── Toggle ──────────────────────────────────────────────────────
// Set VITE_USE_MOCK_API=true in frontend/client/.env to bypass the
// backend entirely (useful for frontend devs who don't run Docker).
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

const formatBytesForContext = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

const defaultSettings = {
  timezone: 'UTC/GMT +5:30',
  dateFormat: 'YYYY-MM-DD',
  sessionTimeout: '60 minutes',
  alertsEnabled: true,
  weeklyDigest: false,
};

export const ClientProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cc_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [assignedAudits, setAssignedAudits] = useState(() => {
    if (USE_MOCK) return Object.keys(mockControls);
    return [];
  });

  const [clientAudits, setClientAudits] = useState(() => {
    if (USE_MOCK) {
      return Object.keys(mockControls).map((key, idx) => ({
        id: `mock-audit-${idx}`,
        audit_name: key,
        audit_type: 'Framework Standard',
        status: 'In Progress',
        target_fy: '2026-12-31'
      }));
    }
    return [];
  });

  const [currentAudit, setCurrentAudit] = useState(() => {
    const saved = localStorage.getItem('cc_current_audit');
    if (saved) return saved;
    if (USE_MOCK) return Object.keys(mockControls)[0];
    return '';
  });

  const [allControls, setAllControls] = useState(() => {
    if (USE_MOCK) {
      const saved = localStorage.getItem('cc_all_controls');
      return saved ? JSON.parse(saved) : mockControls;
    }
    return {};
  });

  // Maps auditName -> array of { id (audit_control id), backendControlId, ... }
  // This lets uploadEvidence pass the real audit_control_id to the backend.
  const [auditControlMap, setAuditControlMap] = useState({});

  const [allFindings, setAllFindings] = useState(() => {
    const saved = localStorage.getItem('cc_all_findings');
    return saved ? JSON.parse(saved) : (USE_MOCK ? mockFindings : {});
  });

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('cc_activities');
    return saved ? JSON.parse(saved) : (USE_MOCK ? mockActivities : []);
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cc_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  // ─── Fetch real data from backend ─────────────────────────────
  const fetchClientData = useCallback(async () => {
    if (USE_MOCK || !currentUser?.companyId) return;

    try {
      // 1. Get the company's assigned audit frameworks
      const frameworks = await api.getCompanyAuditFrameworks(currentUser.companyId);
      if (!frameworks || frameworks.length === 0) {
        console.log('[CyberAries] No audits assigned to this company.');
        setAssignedAudits([]);
        setAllControls({});
        return;
      }

      const auditNames = frameworks.map(f => f.audit_name || `${f.audit_type} Assessment`);
      setAssignedAudits(auditNames);
      setClientAudits(frameworks);

      // If no currentAudit selected yet, pick the first one
      if (!currentAudit || !auditNames.includes(currentAudit)) {
        setCurrentAudit(auditNames[0]);
      }

      // 2. For each framework, fetch its AuditControls (with nested Controls)
      const controlsByAudit = {};
      const acMap = {};

      for (const fw of frameworks) {
        const auditName = fw.audit_name || `${fw.audit_type} Assessment`;
        try {
          const auditControls = await api.getAuditControlsByFramework(fw.id);

          // Also fetch evidence linked to each audit control
          const controlsWithEvidence = await Promise.all(
            (auditControls || []).map(async (ac) => {
              const ctrl = ac.control || {};
              const rules = ctrl.framework_rules || [];
              const primaryDocs = ctrl.primary_evidence || [];
              const secondaryDocs = ctrl.secondary_evidence || [];

              // Fetch evidence files linked to this audit control
              let evidenceFiles = [];

              try {
                const linkedEvidence = await api.getEvidenceForAuditControl(ac.id);
                if (linkedEvidence && linkedEvidence.length > 0) {
                  evidenceFiles = linkedEvidence.map(link => {
                    const item = link.evidence_item;
                    if (!item) return null;
                    return {
                      name: item.file_name,
                      size: item.file_size ? formatBytesForContext(item.file_size) : '—',
                      date: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                      type: item.file_name.split('.').pop().toUpperCase(),
                      uploadedBy: item.uploaded_by || 'Client',
                      status: 'Uploaded',
                      evidenceItemId: item.id,
                      linkId: link.id, // the AuditControlEvidence link id
                    };
                  }).filter(Boolean);
                }
              } catch (e) {
                // Evidence fetch failed — non-critical, continue without evidence data
              }

              return {
                id: ac.id,                            // This IS the audit_control_id
                name: ctrl.control_desc || 'Untitled Control',
                domain: ctrl.control_domain || '',
                standard: rules.join(', ') || ctrl.control_id || '',
                status: evidenceFiles.length > 0 ? 'In Progress' : (ac.status || 'Action Required'),
                description: ctrl.control_desc || '',
                requiredEvidence: [...primaryDocs, ...secondaryDocs].join(', ') || 'Evidence documents required',
                evidenceFiles,
                frameworkCategory: ctrl.audit_category || '',
                frameworkSubcategory: ctrl.audit_subcategory || '',
              };
            })
          );

          controlsByAudit[auditName] = controlsWithEvidence;

          // Build a lookup: controlId (frontend) -> real audit_control_id (backend)
          acMap[auditName] = {};
          controlsWithEvidence.forEach(c => {
            acMap[auditName][c.id] = c.id; // they're the same — the ac.id
          });

        } catch (err) {
          console.warn(`[CyberAries] Failed to fetch controls for ${auditName}:`, err.message);
          controlsByAudit[auditName] = [];
        }
      }

      setAllControls(controlsByAudit);
      setAuditControlMap(acMap);
      console.log(`[CyberAries] Client data loaded: ${frameworks.length} audits, ${Object.values(controlsByAudit).flat().length} controls.`);

    } catch (err) {
      console.error('[CyberAries] Failed to fetch client data:', err.message);
    }
  }, [currentUser?.companyId]);

  // Fetch data on login / mount (only when not using mock)
  useEffect(() => {
    if (!USE_MOCK && currentUser?.companyId) {
      fetchClientData();
    }
  }, [currentUser?.companyId, fetchClientData]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('cc_current_audit', currentAudit);
  }, [currentAudit]);

  useEffect(() => {
    localStorage.setItem('cc_all_controls', JSON.stringify(allControls));
  }, [allControls]);

  useEffect(() => {
    localStorage.setItem('cc_all_findings', JSON.stringify(allFindings));
  }, [allFindings]);

  useEffect(() => {
    localStorage.setItem('cc_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('cc_settings', JSON.stringify(settings));
  }, [settings]);

  // Derived Active Data based on selected audit
  const controls = allControls[currentAudit] || [];
  const findings = allFindings[currentAudit] || [];

  const switchAudit = (auditName) => {
    if (allControls[auditName]) {
      setCurrentAudit(auditName);
      addActivityLog(currentUser?.fullName || 'Client', 'System', `Switched active workspace view to: ${auditName}`);
    }
  };

  // Auth Operations
  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      
      const userData = {
        id: response.user.id,
        fullName: response.user.name,
        email: response.user.email,
        username: response.user.username,
        role: response.user.role,
        companyId: response.user.company_id,
        token: response.access_token,
        avatarInitials: response.user.name
          ? response.user.name.split(' ').map(n => n[0]).join('').toUpperCase()
          : 'CL',
      };

      setCurrentUser(userData);
      localStorage.setItem('cc_user', JSON.stringify(userData));
      localStorage.setItem('cc_token', response.access_token);
      addActivityLog(userData.fullName, 'System', 'Client logged in successfully.');
      
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
  const uploadEvidence = async (controlId, file, onProgress) => {
    if (!currentUser?.companyId || !currentUser?.id) {
      console.error('[CyberAries] Cannot upload evidence: missing companyId or user id.');
      return { success: false, error: 'You must be logged in with a company account to upload evidence.' };
    }

    // Resolve the real audit_control_id for the backend.
    // In real mode the controlId IS the audit_control_id already.
    // In mock mode we pass null (same as before).
    const auditControlId = USE_MOCK ? null : controlId;

    try {
      const result = await uploadEvidenceFile({
        file,
        companyId: currentUser.companyId,
        uploadedBy: currentUser.id,
        auditControlId,
        onProgress,
      });

      const fileName = file.name;
      const fileSize = formatBytesForContext(file.size);

      setAllControls(prev => {
        const currentList = prev[currentAudit] || [];
        const updatedList = currentList.map(c => {
          if (c.id === controlId) {
            return {
              ...c,
              evidenceFile: fileName, // keep for backward compatibility
              evidenceSize: fileSize,
              evidenceDate: new Date().toISOString().split('T')[0],
              status: 'In Progress',
              evidenceItemId: result.evidence.id,
              evidenceFiles: [
                ...(c.evidenceFiles || []),
                {
                  name: fileName,
                  size: fileSize,
                  date: new Date().toISOString().split('T')[0],
                  type: fileName.split('.').pop().toUpperCase(),
                  uploadedBy: currentUser?.fullName || 'Client',
                  status: 'Uploaded',
                  evidenceItemId: result.evidence.id
                }
              ]
            };
          }
          return c;
        });
        return { ...prev, [currentAudit]: updatedList };
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
                  name: currentUser?.fullName || 'Sarah Connor',
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

      return { success: true, evidenceItemId: result.evidence.id };
    } catch (err) {
      console.error('[CyberAries] Evidence upload failed:', err.response?.data?.detail || err.message);
      return { success: false, error: err.response?.data?.detail || 'Upload failed. Please try again.' };
    }
  };

  const deleteEvidence = async (controlId, evidenceItemId) => {
    let fileName = '';

    setAllControls(prev => {
      const currentList = prev[currentAudit] || [];
      const found = currentList.find(c => c.id === controlId);
      if (found && found.evidenceFiles) {
        const file = found.evidenceFiles.find(f => f.evidenceItemId === evidenceItemId);
        if (file) fileName = file.name;
      }
      return prev;
    });

    if (evidenceItemId) {
      try {
        await apiDeleteEvidenceItem(evidenceItemId);
      } catch (err) {
        console.error('[CyberAries] Failed to delete evidence from backend:', err.response?.data?.detail || err.message);
      }
    }

    setAllControls(prev => {
      const currentList = prev[currentAudit] || [];
      const updatedList = currentList.map(c => {
        if (c.id === controlId) {
          const newFiles = (c.evidenceFiles || []).filter(f => f.evidenceItemId !== evidenceItemId);
          return {
            ...c,
            evidenceFiles: newFiles,
            status: newFiles.length > 0 ? 'In Progress' : 'Action Required',
          };
        }
        return c;
      });
      return {
        ...prev,
        [currentAudit]: updatedList
      };
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
              name: currentUser?.fullName || 'Sarah Connor',
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
      return {
        ...prev,
        [currentAudit]: updatedList
      };
    });

    if (attachment) {
      addActivityLog(currentUser?.fullName || 'Client', 'Audit', `Attached "${attachment}" to reply for ${findingId} under ${currentAudit}.`);
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
        avatarInitials: profileData.fullName ? profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'SC'
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
      controls,
      findings,
      allControls,
      activities,
      settings,
      login,
      logout,
      switchAudit,
      uploadEvidence,
      deleteEvidence,
      addReplyToFinding,
      updateProfile,
      updatePreferences,
      fetchClientData,
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => useContext(ClientContext);