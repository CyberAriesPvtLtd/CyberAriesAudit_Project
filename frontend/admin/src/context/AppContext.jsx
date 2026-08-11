import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AppContext = createContext();

// Companies, Clients, Auditors — fetched from backend on mount
const initialCompanies = [];
const initialClients = [];
const initialAuditors = [];

const initialAudits = [
  { id: 'AUDIT-101', company: 'Aether Technologies', client: 'Sarah Connor', auditor: 'Dr. Evelyn Foster', rulebook: 'SOC 2 Type II', status: 'In Progress', progress: 68, dueDate: '2026-08-15' },
  { id: 'AUDIT-102', company: 'Apex Financial Services', client: 'Marcus Aurelius', auditor: 'Christian Wolff', rulebook: 'SOC 2 Type II', status: 'In Progress', progress: 45, dueDate: '2026-09-01' },
  { id: 'AUDIT-103', company: 'BioHealth Solutions', client: 'Jane Goodall', auditor: 'Christian Wolff', rulebook: 'HIPAA', status: 'Pending Review', progress: 95, dueDate: '2026-07-30' },
  { id: 'AUDIT-104', company: 'Nova Logistics Corp', client: 'Tony Stark', auditor: 'Lisbeth Salander', rulebook: 'ISO 27001', status: 'Completed', progress: 100, dueDate: '2026-06-30' },
  { id: 'AUDIT-105', company: 'Quantum Retail', client: 'Bruce Wayne', auditor: 'Christian Wolff', rulebook: 'PCI DSS', status: 'In Progress', progress: 20, dueDate: '2026-10-10' },
  { id: 'AUDIT-106', company: 'Aether Technologies', client: 'Sarah Connor', auditor: 'Dr. Evelyn Foster', rulebook: 'ISO 27001', status: 'In Progress', progress: 40, dueDate: '2026-09-15' },
  { id: 'AUDIT-107', company: 'Aether Technologies', client: 'Sarah Connor', auditor: 'Dr. Evelyn Foster', rulebook: 'SEBI CSCRF', status: 'Completed', progress: 100, dueDate: '2026-06-10' },
  { id: 'AUDIT-108', company: 'Apex Financial Services', client: 'Marcus Aurelius', auditor: 'Christian Wolff', rulebook: 'SEBI CSCRF', status: 'Completed', progress: 100, dueDate: '2026-07-01' },
  { id: 'AUDIT-109', company: 'Apex Financial Services', client: 'Marcus Aurelius', auditor: 'Christian Wolff', rulebook: 'RBI Cyber Security', status: 'Pending Review', progress: 90, dueDate: '2026-08-20' },
  { id: 'AUDIT-110', company: 'Nova Logistics Corp', client: 'Tony Stark', auditor: 'Lisbeth Salander', rulebook: 'PCI DSS', status: 'In Progress', progress: 55, dueDate: '2026-11-05' },
  { id: 'AUDIT-111', company: 'Nova Logistics Corp', client: 'Tony Stark', auditor: 'Lisbeth Salander', rulebook: 'Custom Audit', status: 'In Progress', progress: 10, dueDate: '2026-12-15' },
  { id: 'AUDIT-112', company: 'Quantum Retail', client: 'Bruce Wayne', auditor: 'Christian Wolff', rulebook: 'HIPAA', status: 'Pending Review', progress: 85, dueDate: '2026-09-25' },
  { id: 'AUDIT-113', company: 'BioHealth Solutions', client: 'Jane Goodall', auditor: 'Christian Wolff', rulebook: 'ISO 27001', status: 'In Progress', progress: 30, dueDate: '2026-10-30' },
];

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

  // ─── Fetch Companies & Users from Backend on Mount ────────────
  const fetchDataFromBackend = useCallback(async () => {
    try {
      // Test backend connectivity first
      await api.testDbConnection();
      setBackendConnected(true);

      // Fetch companies
      const dbCompanies = await api.getCompanies();
      if (dbCompanies && dbCompanies.length > 0) {
        const mapped = dbCompanies.map(mapCompanyFromDb);
        setCompanies(mapped);
      }

      // Fetch users and split into clients / auditors
      const dbUsers = await api.getUsers();
      if (dbUsers && dbUsers.length > 0) {
        // We need companies list for name lookup
        const companiesForLookup = dbCompanies && dbCompanies.length > 0
          ? dbCompanies.map(mapCompanyFromDb)
          : companies;

        const dbClients = dbUsers.filter(u => u.role === 'client');
        const dbAuditors = dbUsers.filter(u => u.role === 'auditor');

        if (dbClients.length > 0) {
          setClients(dbClients.map(u => mapUserToClient(u, companiesForLookup)));
        }
        if (dbAuditors.length > 0) {
          setAuditors(dbAuditors.map(u => mapUserToAuditor(u)));
        }
      }

      console.log('[CyberAries] Backend connected — data loaded from PostgreSQL.');
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

  const addAudit = (audit) => {
    const id = `AUDIT-${100 + audits.length + 1}`;
    const newAudit = {
      id,
      progress: 0,
      status: 'In Progress',
      ...audit,
    };
    setAudits(prev => [...prev, newAudit]);

    // Update companies
    setCompanies(prev => prev.map(c => {
      if (c.name === audit.company) {
        return { ...c, auditsCount: c.auditsCount + 1 };
      }
      return c;
    }));

    // Update auditors
    setAuditors(prev => prev.map(a => {
      if (a.name === audit.auditor) {
        return { ...a, assignments: a.assignments + 1 };
      }
      return a;
    }));

    logActivity(currentUser?.fullName || 'Admin', 'Audit', `Created new audit ${id} for ${audit.company}`);
  };

  const updateAudit = (updatedAudit) => {
    setAudits(prev => prev.map(a => {
      if (a.id === updatedAudit.id) {
        return { ...a, ...updatedAudit };
      }
      return a;
    }));
    logActivity(currentUser?.fullName || 'Admin', 'Audit', `Updated details for audit ${updatedAudit.id}`);
  };

  const deleteAudit = (auditId) => {
    let companyName = '';
    let auditorName = '';
    setAudits(prev => {
      const audit = prev.find(a => a.id === auditId);
      if (audit) {
        companyName = audit.company;
        auditorName = audit.auditor;
      }
      return prev.filter(a => a.id !== auditId);
    });

    if (companyName) {
      setCompanies(prev => prev.map(c => {
        if (c.name === companyName) {
          return { ...c, auditsCount: Math.max(0, c.auditsCount - 1) };
        }
        return c;
      }));
    }

    if (auditorName) {
      setAuditors(prev => prev.map(a => {
        if (a.name === auditorName) {
          return { ...a, assignments: Math.max(0, a.assignments - 1) };
        }
        return a;
      }));
    }

    logActivity(currentUser?.fullName || 'Admin', 'Audit', `Deleted audit ${auditId}`);
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

  const uploadFramework = (newRules) => {
    const rulesList = Array.isArray(newRules) ? newRules : [newRules];
    setRulebook(prev => [...rulesList, ...prev]);
    logActivity(currentUser?.fullName || 'Admin', 'Framework', `Uploaded framework with ${rulesList.length} rules.`);
  };

  const addControl = uploadFramework;

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

  return (
    <AppContext.Provider value={{
      currentUser,
      companies,
      clients,
      auditors,
      audits,
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
      fetchDataFromBackend
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
