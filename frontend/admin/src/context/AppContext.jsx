import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AppContext = createContext();

// Companies, Clients, Auditors — fetched from backend on mount
const initialCompanies = [];
const initialClients = [];
const initialAuditors = [];

const initialAudits = [];

import { initialFrameworkRules } from '../data/frameworkRulesData';

const initialRulebook = initialFrameworkRules;

const initialActivities = [
  { id: 'ACT-001', user: 'System', type: 'System', message: 'Automated compliance score recalculation completed successfully.', timestamp: '2026-07-09T14:45:00Z' },
  { id: 'ACT-002', user: 'Admin User', type: 'Audit', message: 'Assigned audit AUDIT-103 to auditor Christian Wolff.', timestamp: '2026-07-09T12:30:00Z' },
  { id: 'ACT-003', user: 'Dr. Evelyn Foster', type: 'Document', message: 'Uploaded CSCRF PR Evidence file: "Aether_Access_Review_Q2.pdf".', timestamp: '2026-07-09T10:15:00Z' },
  { id: 'ACT-004', user: 'Admin User', type: 'Company', message: 'Registered new company Apex Financial Services.', timestamp: '2026-07-08T16:20:00Z' },
  { id: 'ACT-005', user: 'System', type: 'Security', message: 'Successful login detected for user admin@cyberaries.com from IP 192.168.1.42.', timestamp: '2026-07-08T09:00:00Z' },
  { id: 'ACT-006', user: 'Christian Wolff', type: 'Audit', message: 'Marked audit AUDIT-104 (Nova Logistics Corp) as Completed.', timestamp: '2026-07-07T17:45:00Z' },
];

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cyberaries_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [auditors, setAuditors] = useState([]);

  const [audits, setAudits] = useState(() => {
    const saved = localStorage.getItem('cyberaries_audits');
    return saved ? JSON.parse(saved) : initialAudits;
  });

  const [auditControls, setAuditControls] = useState({});

  const [rulebook, setRulebook] = useState(() => {
    const saved = localStorage.getItem('cyberaries_rulebook');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].frameworkRules) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialFrameworkRules;
  });

  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('cyberaries_activities');
    return saved ? JSON.parse(saved) : initialActivities;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cyberaries_settings');
    return saved ? JSON.parse(saved) : {
      general: {
        platformName: 'CyberAries',
        tagline: 'Cybersecurity Compliance Management Platform',
        timezone: 'UTC/GMT +5:30',
        dateFormat: 'YYYY-MM-DD',
        sessionTimeout: '60 minutes',
      },
      profile: {
        fullName: 'Admin User',
        email: 'admin@cyberaries.com',
        phone: '+1 (555) 019-2834',
        role: 'Admin',
      },
      smtp: {
        server: 'smtp.cyberaries.com',
        port: '587',
        username: 'alerts@cyberaries.com',
        ssl: true,
      }
    };
  });

  // Track if backend is reachable
  const [backendConnected, setBackendConnected] = useState(false);

  // ─── Helper: Map backend company response to frontend shape ───
  const mapCompanyFromDb = (dbCompany) => ({
    id: dbCompany.id,
    name: dbCompany.company_name,
    registrationNumber: dbCompany.registration_no,
    industry: dbCompany.industry || '',
    complianceScore: dbCompany.complianceScore ?? 100,
    status: dbCompany.status || 'Active',
    auditsCount: dbCompany.auditsCount ?? 0,
    createdDate: dbCompany.created_at ? new Date(dbCompany.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });

  // ─── Helper: Map backend user response to frontend client shape ───
  const mapUserToClient = (dbUser, companiesList) => {
    const company = companiesList.find(c => c.id === dbUser.company_id);
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role,
      company: company?.name || '',
      company_id: dbUser.company_id,
      status: 'Active',
      auditPhase: 'Initial Assessment',
      createdDate: dbUser.created_at ? new Date(dbUser.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    };
  };

  // ─── Helper: Map backend control response to frontend rulebook shape ───
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

  // ─── Helper: Map backend user response to frontend auditor shape ───
  const mapUserToAuditor = (dbUser) => ({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    username: dbUser.username,
    role: dbUser.role,
    status: 'Active',
    assignments: 0,
    createdDate: dbUser.created_at ? new Date(dbUser.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });

  // ─── Helper: Map backend audit response to frontend audit shape ───
  const mapAuditFromDb = (dbAudit, companiesList, auditorsList) => {
    const company = companiesList.find(c => c.id === dbAudit.companyID) || {};
    const auditorNames = (dbAudit.assigned_auditors || []).map(id => {
      const auditor = auditorsList.find(a => a.id === id);
      return auditor ? auditor.name : null;
    }).filter(Boolean);

    return {
      id: dbAudit.id,
      company: company.name || 'Unknown Company (Deleted)',
      framework: dbAudit.audit_type,
      category: dbAudit.audit_category,
      subcategory: dbAudit.audit_subcategory,
      auditName: dbAudit.audit_name,
      auditors: auditorNames,
      targetFY: dbAudit.target_fy,
      status: dbAudit.status || 'Pending',
      createdDate: dbAudit.created_at ? new Date(dbAudit.created_at).toISOString().split('T')[0] : '',
    };
  };

  // ─── Fetch Companies & Users from Backend on Mount ────────────
  const fetchDataFromBackend = useCallback(async () => {
    try {
      // Test backend connectivity first
      await api.testDbConnection();
      setBackendConnected(true);

      // Fetch companies
      const dbCompanies = await api.getCompanies();
      if (dbCompanies) {
        const mapped = dbCompanies.map(mapCompanyFromDb);
        setCompanies(mapped);
      }

      // Fetch users and split into clients / auditors
      const dbUsers = await api.getUsers();
      if (dbUsers) {
        // We need companies list for name lookup
        const companiesForLookup = dbCompanies && dbCompanies.length > 0
          ? dbCompanies.map(mapCompanyFromDb)
          : companies;

        const dbClients = dbUsers.filter(u => u.role === 'client');
        const dbAuditors = dbUsers.filter(u => u.role === 'auditor');

        setClients(dbClients.map(u => mapUserToClient(u, companiesForLookup)));
        setAuditors(dbAuditors.map(u => mapUserToAuditor(u)));
      }

      console.log('[CyberAries] Backend connected — data loaded from PostgreSQL.');

      // Fetch controls / rulebook
      const dbControls = await api.getControls();
      if (dbControls) {
        const mappedControls = dbControls.map(mapControlFromDb);
        setRulebook(mappedControls);
        console.log(`[CyberAries] Loaded ${mappedControls.length} controls from backend.`);
      }

      // Fetch audits
      const dbAudits = await api.getAuditFrameworks();
      if (dbAudits) {
        // Prepare lookup lists
        const companiesForLookup = dbCompanies && dbCompanies.length > 0 ? dbCompanies.map(mapCompanyFromDb) : companies;
        let auditorsForLookup = auditors;
        if (dbUsers && dbUsers.length > 0) {
          auditorsForLookup = dbUsers.filter(u => u.role === 'auditor').map(mapUserToAuditor);
        }
        
        const mappedAudits = dbAudits.map(a => mapAuditFromDb(a, companiesForLookup, auditorsForLookup));
        setAudits(mappedAudits);
        console.log(`[CyberAries] Loaded ${mappedAudits.length} audits from backend.`);
      }

    } catch (err) {
      setBackendConnected(false);
      console.warn('[CyberAries] Backend unreachable — using local/dummy data.', err.message);
    }
  }, []);

  useEffect(() => {
    fetchDataFromBackend();
  }, [fetchDataFromBackend]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('cyberaries_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('cyberaries_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('cyberaries_auditors', JSON.stringify(auditors));
  }, [auditors]);

  useEffect(() => {
    localStorage.setItem('cyberaries_audits', JSON.stringify(audits));
  }, [audits]);



  useEffect(() => {
    localStorage.setItem('cyberaries_rulebook', JSON.stringify(rulebook));
    localStorage.setItem('cyberaries_framework_rules', JSON.stringify(rulebook));
  }, [rulebook]);

  useEffect(() => {
    localStorage.setItem('cyberaries_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('cyberaries_settings', JSON.stringify(settings));
  }, [settings]);

  // Actions
  const logActivity = (user, type, message) => {
    const newActivity = {
      id: `ACT-${Date.now()}`,
      user,
      type,
      message,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const addCompany = async (company) => {
    try {
      // Send to backend — backend generates the ID
      const created = await api.createCompany({
        company_name: company.name,
        registration_no: company.registrationNumber,
      });
      const mapped = mapCompanyFromDb(created);
      // Merge frontend-only fields (industry, status, etc.)
      mapped.industry = company.industry || '';
      mapped.status = 'Active';
      setCompanies(prev => [...prev, mapped]);
      logActivity(currentUser?.fullName || 'Admin', 'Company', `Added new company: ${company.name}`);
    } catch (err) {
      console.error('[CyberAries] Failed to create company:', err.response?.data?.detail || err.message);
      alert(`Failed to create company: ${err.response?.data?.detail || err.message}`);
    }
  };

  const updateCompany = async (updatedCompany) => {
    try {
      await api.updateCompany(updatedCompany.id, {
        company_name: updatedCompany.name,
        registration_no: updatedCompany.registrationNumber,
      });
      setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? { ...c, ...updatedCompany } : c));
      logActivity(currentUser?.fullName || 'Admin', 'Company', `Updated company parameters for: ${updatedCompany.name}`);
    } catch (err) {
      console.error('[CyberAries] Failed to update company:', err.response?.data?.detail || err.message);
      alert(`Failed to update company: ${err.response?.data?.detail || err.message}`);
    }
  };

  const addClient = async (client) => {
    try {
      // Find company_id from company name
      const company = companies.find(c => c.name === client.company);
      const created = await api.createUser({
        name: client.name,
        email: client.email,
        username: client.username,
        password: client.password,
        role: 'client',
        company_id: company?.id || null,
      });
      const mapped = mapUserToClient(created, companies);
      mapped.company = client.company; // preserve company name from form
      setClients(prev => [...prev, mapped]);
      logActivity(currentUser?.fullName || 'Admin', 'Client', `Added new client: ${client.name} for ${client.company}`);
    } catch (err) {
      console.error('[CyberAries] Failed to create client:', err.response?.data?.detail || err.message);
      alert(`Failed to create client: ${err.response?.data?.detail || err.message}`);
    }
  };

  const addAuditor = async (auditor) => {
    try {
      const created = await api.createUser({
        name: auditor.name,
        email: auditor.email,
        username: auditor.username,
        password: auditor.password,
        role: 'auditor',
        company_id: null,
      });
      const mapped = mapUserToAuditor(created);
      setAuditors(prev => [...prev, mapped]);
      logActivity(currentUser?.fullName || 'Admin', 'Auditor', `Registered new auditor: ${auditor.name}`);
    } catch (err) {
      console.error('[CyberAries] Failed to create auditor:', err.response?.data?.detail || err.message);
      alert(`Failed to create auditor: ${err.response?.data?.detail || err.message}`);
    }
  };

  const addAudit = async (auditData) => {
    try {
      const company = companies.find(c => c.name === auditData.company);
      if (!company) throw new Error("Selected company not found in database.");

      const auditorIds = (auditData.auditors || []).map(name => {
        const auditor = auditors.find(a => a.name === name);
        return auditor ? auditor.id : null;
      }).filter(Boolean);

      const payload = {
        audit_type: auditData.framework,
        audit_category: auditData.category,
        audit_subcategory: auditData.subcategory || '',
        audit_name: auditData.auditName,
        target_fy: auditData.targetFY,
        status: 'Pending',
        companyID: company.id,
        assigned_auditors: auditorIds
      };

      const created = await api.createAuditFramework(payload);
      const mapped = mapAuditFromDb(created, companies, auditors);
      setAudits(prev => [...prev, mapped]);

      logActivity(currentUser?.fullName || 'Admin', 'Audit', `Created new audit ${mapped.id} for ${auditData.company}`);
    } catch (err) {
      console.error('[CyberAries] Failed to create audit:', err.response?.data?.detail || err.message);
      alert(`Failed to create audit: ${err.response?.data?.detail || err.message}`);
    }
  };

  const updateAudit = async (auditData) => {
    try {
      const auditorIds = (auditData.auditors || []).map(name => {
        const auditor = auditors.find(a => a.name === name);
        return auditor ? auditor.id : null;
      }).filter(Boolean);

      const payload = {
        audit_type: auditData.framework,
        audit_category: auditData.category,
        audit_subcategory: auditData.subcategory || '',
        audit_name: auditData.auditName,
        target_fy: auditData.targetFY,
        status: auditData.status,
        assigned_auditors: auditorIds
      };

      const updated = await api.updateAuditFramework(auditData.id, payload);
      const mapped = mapAuditFromDb(updated, companies, auditors);

      setAudits(prev => prev.map(a => a.id === auditData.id ? mapped : a));
      logActivity(currentUser?.fullName || 'Admin', 'Audit', `Updated details for audit ${auditData.id}`);
    } catch (err) {
      console.error('[CyberAries] Failed to update audit:', err.response?.data?.detail || err.message);
      alert(`Failed to update audit: ${err.response?.data?.detail || err.message}`);
    }
  };

  const deleteAudit = async (auditId) => {
    try {
      await api.deleteAuditFramework(auditId);
      setAudits(prev => prev.filter(a => a.id !== auditId));
      logActivity(currentUser?.fullName || 'Admin', 'Audit', `Deleted audit ${auditId}`);
    } catch (err) {
      console.error('[CyberAries] Failed to delete audit:', err.response?.data?.detail || err.message);
      alert(`Failed to delete audit: ${err.response?.data?.detail || err.message}`);
    }
  };

  const updateSettings = (section, data) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      }
    }));
    logActivity(currentUser?.fullName || 'Admin', 'Settings', `Updated system settings in ${section} section.`);
  };

  const registerAdmin = (adminData) => {
    localStorage.setItem('cyberaries_registered_admin', JSON.stringify(adminData));
    logActivity('Registration', 'Security', `Registered new administrator account: ${adminData.username}`);
  };

  const loginAdmin = async (username, password) => {
    try {
      const response = await api.login(username, password);

      const userData = {
        ...response.user,
        token: response.access_token,
        mustChangePassword: response.must_change_password
      };

      setCurrentUser(userData);
      localStorage.setItem('cyberaries_user', JSON.stringify(userData));
      localStorage.setItem('cyberaries_token', response.access_token);
      logActivity(userData.name, 'Security', 'User logged in successfully via Backend API.');

      return { success: true, mustChangePassword: response.must_change_password };
    } catch (err) {
      console.error('[CyberAries] Login failed:', err.response?.data?.detail || err.message);
      return { success: false, error: err.response?.data?.detail || 'Invalid credentials' };
    }
  };

  const logout = () => {
    if (currentUser) {
      logActivity(currentUser.fullName, 'Security', 'User logged out.');
    }
    setCurrentUser(null);
    localStorage.removeItem('cyberaries_user');
    localStorage.removeItem('cyberaries_token');
  };

  const uploadFramework = async (file) => {
    try {
      // Send the Excel file to the backend — it handles parsing, saving,
      // and seeding into the database in one shot.
      const result = await api.uploadControlsExcel(file);
      console.log(`[CyberAries] Upload result:`, result);

      // Refresh all controls from the database
      await fetchDataFromBackend();
      logActivity(
        currentUser?.fullName || 'Admin',
        'Framework',
        `Uploaded framework file "${file.name}" — ${result.inserted} inserted, ${result.updated} updated.`
      );
      return result;
    } catch (err) {
      console.error('[CyberAries] Failed to upload framework file:', err);
      throw err;
    }
  };

  const addControl = async (rule) => {
    try {
      await api.createControl(rule);
      await fetchDataFromBackend();
      logActivity(currentUser?.fullName || 'Admin', 'Framework', `Added new control rule.`);
    } catch (err) {
      console.error('[CyberAries] Failed to add control rule:', err);
      throw err;
    }
  };

  const assignAuditToClient = (companyName, clientName, frameworkName, auditorName) => {
    const exists = audits.some(a => a.company === companyName && a.rulebook === frameworkName);
    if (exists) return;
    const newAudit = {
      id: `AUDIT-${Date.now()}`,
      company: companyName,
      client: clientName,
      auditor: auditorName || 'Dr. Evelyn Foster',
      rulebook: frameworkName,
      status: 'In Progress',
      progress: 0,
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    setAudits(prev => [...prev, newAudit]);
    logActivity(currentUser?.fullName || 'Admin', 'Audit', `Assigned ${frameworkName} to client ${clientName}`);
  };

  const removeAuditFromClient = (companyName, frameworkName) => {
    setAudits(prev => prev.filter(a => !(a.company === companyName && a.rulebook === frameworkName)));
    logActivity(currentUser?.fullName || 'Admin', 'Audit', `Removed ${frameworkName} from ${companyName}`);
  };

  const manageAuditAssignments = (companyName, clientName, frameworkNames, auditorName) => {
    setAudits(prev => {
      const filtered = prev.filter(a => !(a.company === companyName && !frameworkNames.includes(a.rulebook)));
      const existing = prev.filter(a => a.company === companyName).map(a => a.rulebook);
      const toAdd = frameworkNames.filter(f => !existing.includes(f));
      const newAudits = toAdd.map((f, idx) => ({
        id: `AUDIT-${Date.now()}-${idx}`,
        company: companyName,
        client: clientName,
        auditor: auditorName || 'Dr. Evelyn Foster',
        rulebook: f,
        status: 'In Progress',
        progress: 0,
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
      return [...filtered, ...newAudits];
    });
    logActivity(currentUser?.fullName || 'Admin', 'Audit', `Managed audits for ${companyName}`);
  };

  const assignClientToAuditor = (auditorName, companyName) => {
    setAudits(prev => prev.map(a => {
      if (a.company === companyName) {
        return { ...a, auditor: auditorName };
      }
      return a;
    }));
    logActivity(currentUser?.fullName || 'Admin', 'Auditor', `Assigned company ${companyName} to auditor ${auditorName}`);
  };

  const removeClientFromAuditor = (auditorName, companyName) => {
    setAudits(prev => prev.map(a => {
      if (a.company === companyName && a.auditor === auditorName) {
        return { ...a, auditor: 'Dr. Evelyn Foster' }; // fallback
      }
      return a;
    }));
    logActivity(currentUser?.fullName || 'Admin', 'Auditor', `Removed company ${companyName} from auditor ${auditorName}`);
  };

  // ─── Helper: Map backend AuditControlResponse to frontend control shape ───
  const mapAuditControlFromDb = (ac) => {
    const ctrl = ac.control || {};
    let assignedAuditorName = 'Unassigned';
    if (ac.assigned_to) {
      const auditor = auditors.find(a => a.id === ac.assigned_to);
      assignedAuditorName = auditor ? auditor.name : 'Unknown Auditor';
    }
    return {
      id: ac.id,
      controlId: ctrl.framework_rules || [],       // Array of rules like ["GV.OC.S2", "GV.OC.S3"]
      controlCode: ctrl.control_id || '',           // Original control_id like "SEBI-CSCRF-001"
      description: ctrl.control_desc || '',         // Control description text
      domain: ctrl.control_domain || '',
      category: ctrl.audit_category || '',
      subcategory: ctrl.audit_subcategory || '',
      framework: ctrl.audit_type || '',
      primaryDocuments: ctrl.primary_evidence || [],
      secondaryDocuments: ctrl.secondary_evidence || [],
      assignedAuditorId: ac.assigned_to || null,
      assignedAuditor: assignedAuditorName,
      status: ac.assigned_to ? 'Assigned' : (ac.status || 'Unassigned'),
      auditId: ac.framework_id
    };
  };

  const getAuditControls = (auditId) => {
    if (auditControls[auditId] && Array.isArray(auditControls[auditId])) {
      return auditControls[auditId];
    }
    return [];
  };

  const fetchAuditControls = async (auditId) => {
    try {
      const dbControls = await api.getAuditControlsByFramework(auditId);
      if (dbControls && Array.isArray(dbControls)) {
        const mapped = dbControls.map(mapAuditControlFromDb);
        setAuditControls(prev => ({ ...prev, [auditId]: mapped }));
        console.log(`[CyberAries] Loaded ${mapped.length} audit controls for ${auditId}.`);
        return mapped;
      }
      return [];
    } catch (err) {
      console.error('[CyberAries] Failed to fetch audit controls:', err.response?.data?.detail || err.message);
      return [];
    }
  };

  const assignControlsToAuditor = async (auditId, controlIds, auditorName) => {
    let auditorId = null;
    let newStatus = 'Unassigned';
    
    if (auditorName && auditorName !== 'Unassigned') {
      const auditor = auditors.find(a => a.name === auditorName);
      if (auditor) {
        auditorId = auditor.id;
        newStatus = 'Assigned';
      }
    }

    try {
      // Call the API to persist changes for each control
      await Promise.all(controlIds.map(ctrlId => 
        api.updateAuditControl(ctrlId, { 
          assigned_to: auditorId, 
          status: newStatus 
        })
      ));

      // On success, update the local state
      setAuditControls(prev => {
        const currentList = getAuditControls(auditId);
        const updatedList = currentList.map(ctrl => {
          if (controlIds.includes(ctrl.id) || controlIds.includes(ctrl.controlId)) {
            return {
              ...ctrl,
              assignedAuditor: auditorName,
              assignedAuditorId: auditorId,
              status: newStatus
            };
          }
          return ctrl;
        });
        return { ...prev, [auditId]: updatedList };
      });

      logActivity(
        currentUser?.fullName || 'Admin',
        'Audit Control',
        `Assigned ${controlIds.length} control(s) in audit ${auditId} to auditor ${auditorName}`
      );
    } catch (err) {
      console.error('[CyberAries] Failed to assign controls:', err);
    }
  };

  const reassignControlAuditor = (auditId, controlId, newAuditorName) => {
    assignControlsToAuditor(auditId, [controlId], newAuditorName);
  };

  const getAuditControlMetrics = (auditId) => {
    const list = getAuditControls(auditId);
    const total = list.length;
    const assigned = list.filter(c => c.status === 'Assigned' && c.assignedAuditor && c.assignedAuditor !== 'Unassigned').length;
    const unassigned = total - assigned;

    const auditorSet = new Set(
      list
        .filter(c => c.status === 'Assigned' && c.assignedAuditor && c.assignedAuditor !== 'Unassigned')
        .map(c => c.assignedAuditor)
    );
    const auditorsCount = auditorSet.size;
    const assignedAuditorsList = Array.from(auditorSet);
    const progressPct = total > 0 ? Math.round((assigned / total) * 100) : 0;

    let assignmentStatus = 'Unassigned';
    if (unassigned === 0 && total > 0) {
      assignmentStatus = 'Fully Assigned';
    } else if (assigned > 0 && unassigned > 0) {
      assignmentStatus = 'Partially Assigned';
    }

    return {
      total,
      assigned,
      unassigned,
      auditorsCount,
      assignedAuditorsList,
      progressPct,
      assignmentStatus
    };
  };

  const getAuditorControlAssignments = (auditorName) => {
    const results = [];
    audits.forEach(audit => {
      const controls = getAuditControls(audit.id);
      const assignedToThisAuditor = controls.filter(c => c.assignedAuditor === auditorName);
      if (assignedToThisAuditor.length > 0 || (audit.auditors || []).includes(auditorName)) {
        results.push({
          auditId: audit.id,
          auditName: audit.auditName || `${audit.framework} Assessment`,
          company: audit.company,
          framework: audit.framework,
          assignedControlsCount: assignedToThisAuditor.length,
          controls: assignedToThisAuditor
        });
      }
    });
    return results;
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      companies,
      clients,
      auditors,
      audits,
      auditControls,
      rulebook,
      activities,
      settings,
      backendConnected,
      addCompany,
      addClient,
      addAuditor,
      addAudit,
      addControl,
      uploadFramework,
      updateSettings,
      registerAdmin,
      loginAdmin,
      logout,
      assignAuditToClient,
      removeAuditFromClient,
      manageAuditAssignments,
      assignClientToAuditor,
      removeClientFromAuditor,
      updateAudit,
      deleteAudit,
      updateCompany,
      fetchDataFromBackend,
      getAuditControls,
      fetchAuditControls,
      assignControlsToAuditor,
      reassignControlAuditor,
      getAuditControlMetrics,
      getAuditorControlAssignments
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
