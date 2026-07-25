import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

const initialCompanies = [
  { id: 'COM-001', name: 'Aether Technologies', registrationNumber: 'REG-8472910', industry: 'SaaS / Cloud', complianceScore: 94, status: 'Active', auditsCount: 2, createdDate: '2025-01-15' },
  { id: 'COM-002', name: 'Apex Financial Services', registrationNumber: 'REG-9284715', industry: 'Fintech', complianceScore: 88, status: 'Active', auditsCount: 3, createdDate: '2025-02-10' },
  { id: 'COM-003', name: 'BioHealth Solutions', registrationNumber: 'REG-5829104', industry: 'Healthcare', complianceScore: 76, status: 'Pending Review', auditsCount: 1, createdDate: '2025-03-01' },
  { id: 'COM-004', name: 'Nova Logistics Corp', registrationNumber: 'REG-1048572', industry: 'Supply Chain', complianceScore: 91, status: 'Active', auditsCount: 2, createdDate: '2025-03-18' },
  { id: 'COM-005', name: 'Quantum Retail', registrationNumber: 'REG-3920184', industry: 'E-commerce', complianceScore: 64, status: 'Non-Compliant', auditsCount: 2, createdDate: '2025-04-05' },
  { id: 'COM-006', name: 'Zenith Security Corp', registrationNumber: 'REG-7582910', industry: 'Cybersecurity', complianceScore: 99, status: 'Active', auditsCount: 1, createdDate: '2025-04-20' },
];

const initialClients = [
  { id: 'CLI-001', name: 'Sarah Connor', company: 'Aether Technologies', email: 's.connor@aether.io', username: 'sarah_connor', status: 'Active', auditPhase: 'Evidence Collection' },
  { id: 'CLI-002', name: 'Marcus Aurelius', company: 'Apex Financial Services', email: 'm.aurelius@apexfin.com', username: 'marcus_aurelius', status: 'Active', auditPhase: 'Reviewing Controls' },
  { id: 'CLI-003', name: 'Jane Goodall', company: 'BioHealth Solutions', email: 'j.goodall@biohealth.org', username: 'jane_goodall', status: 'Pending Review', auditPhase: 'Initial Assessment' },
  { id: 'CLI-004', name: 'Tony Stark', company: 'Nova Logistics Corp', email: 't.stark@novalog.com', username: 'tony_stark', status: 'Active', auditPhase: 'Audit Signed Off' },
  { id: 'CLI-005', name: 'Bruce Wayne', company: 'Quantum Retail', email: 'b.wayne@quantumretail.co', username: 'bruce_wayne', status: 'Suspended', auditPhase: 'Remediation Required' },
];

const initialAuditors = [
  { id: 'AUD-001', name: 'Dr. Evelyn Foster', email: 'evelyn.f@cyberaries.com', username: 'evelyn_foster', status: 'Active', assignments: 2 },
  { id: 'AUD-002', name: 'Christian Wolff', email: 'christian.w@cyberaries.com', username: 'christian_wolff', status: 'Active', assignments: 3 },
  { id: 'AUD-003', name: 'Lisbeth Salander', email: 'lisbeth.s@cyberaries.com', username: 'lisbeth_salander', status: 'Active', assignments: 1 },
  { id: 'AUD-004', name: 'Sherlock Holmes', email: 'sherlock.h@cyberaries.com', username: 'sherlock_holmes', status: 'Inactive', assignments: 0 },
];

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

const initialRulebook = [
  { id: 'CSCRF-GV-001', name: 'Organizational Governance Strategy', domain: 'Govern (GV)', standard: 'CSCRF GV-1.1', status: 'Active', description: 'Establish and maintain a cybersecurity governance framework integrated with risk assessment guidelines.', version: 'v1.0.2', lastUpdated: '2026-06-12' },
  { id: 'CSCRF-ID-001', name: 'Asset Inventory & Classification', domain: 'Identify (ID)', standard: 'CSCRF ID-1.2', status: 'Active', description: 'Maintain a real-time catalog of all network services, endpoints, data assets, and software components.', version: 'v1.1.0', lastUpdated: '2026-05-24' },
  { id: 'CSCRF-PR-001', name: 'Identity & Access Controls', domain: 'Protect (PR)', standard: 'CSCRF PR-2.1', status: 'Active', description: 'Enforce multi-factor authentication (MFA) and granular role-based authorization for administrative layers.', version: 'v2.0.1', lastUpdated: '2026-07-01' },
  { id: 'CSCRF-DE-001', name: 'Continuous Monitoring Telemetry', domain: 'Detect (DE)', standard: 'CSCRF DE-3.4', status: 'Active', description: 'Deploy security event monitoring log aggregates to detect malicious operational behaviors instantly.', version: 'v1.0.4', lastUpdated: '2026-06-30' },
  { id: 'CSCRF-RS-001', name: 'Incident Containment Plan', domain: 'Respond (RS)', standard: 'CSCRF RS-4.2', status: 'Active', description: 'Execute standardized procedures to contain network security incidents and mitigate impact.', version: 'v2.1.0', lastUpdated: '2026-07-08' },
  { id: 'CSCRF-RC-001', name: 'Disaster Recovery Operations', domain: 'Recover (RC)', standard: 'CSCRF RC-5.1', status: 'Active', description: 'Conduct automated database recovery procedures and back up configurations to air-gapped vaults.', version: 'v1.0.0', lastUpdated: '2026-04-15' },
];

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

  const [companies, setCompanies] = useState(() => {
    const saved = localStorage.getItem('cyberaries_companies');
    return saved ? JSON.parse(saved) : initialCompanies;
  });

  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('cyberaries_clients');
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [auditors, setAuditors] = useState(() => {
    const saved = localStorage.getItem('cyberaries_auditors');
    return saved ? JSON.parse(saved) : initialAuditors;
  });

  const [audits, setAudits] = useState(() => {
    const saved = localStorage.getItem('cyberaries_audits');
    return saved ? JSON.parse(saved) : initialAudits;
  });

  const [rulebook, setRulebook] = useState(() => {
    const saved = localStorage.getItem('cyberaries_rulebook');
    return saved ? JSON.parse(saved) : initialRulebook;
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

  const addCompany = (company) => {
    const id = `COM-${String(companies.length + 1).padStart(3, '0')}`;
    const newCompany = {
      id,
      complianceScore: 100,
      auditsCount: 0,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      ...company,
    };
    setCompanies(prev => [...prev, newCompany]);
    logActivity(currentUser?.fullName || 'Admin', 'Company', `Added new company: ${company.name}`);
  };

  const updateCompany = (updatedCompany) => {
    setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? { ...c, ...updatedCompany } : c));
    logActivity(currentUser?.fullName || 'Admin', 'Company', `Updated company parameters for: ${updatedCompany.name}`);
  };

  const addClient = (client) => {
    const id = `CLI-${String(clients.length + 1).padStart(3, '0')}`;
    const newClient = {
      id,
      status: client.status || 'Active',
      auditPhase: 'Initial Assessment',
      ...client,
    };
    delete newClient.password;
    delete newClient.confirmPassword;
    setClients(prev => [...prev, newClient]);
    
    // Update company audits count or links if needed
    logActivity(currentUser?.fullName || 'Admin', 'Client', `Added new client: ${client.name} for ${client.company}`);
  };

  const addAuditor = (auditor) => {
    const id = `AUD-${String(auditors.length + 1).padStart(3, '0')}`;
    const newAuditor = {
      id,
      assignments: 0,
      status: auditor.status || 'Active',
      ...auditor,
    };
    delete newAuditor.password;
    delete newAuditor.confirmPassword;
    setAuditors(prev => [...prev, newAuditor]);
    logActivity(currentUser?.fullName || 'Admin', 'Auditor', `Registered new auditor: ${auditor.name}`);
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

  const loginAdmin = (username, password) => {
    const registered = localStorage.getItem('cyberaries_registered_admin');
    const admin = registered ? JSON.parse(registered) : {
      username: 'admin',
      password: 'password',
      fullName: 'Administrator',
      email: 'admin@cyberaries.com',
      phone: '+1 (555) 019-2834',
    };

    if (
      (username === admin.username && password === admin.password) ||
      (username === 'admin@cyberaries.com' && password === 'Admin@123')
    ) {
      const userData = {
        username: 'admin',
        fullName: admin.fullName,
        email: 'admin@cyberaries.com',
        phone: admin.phone,
        role: 'Admin',
      };
      setCurrentUser(userData);
      localStorage.setItem('cyberaries_user', JSON.stringify(userData));
      logActivity(admin.fullName, 'Security', 'User logged in successfully.');
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      logActivity(currentUser.fullName, 'Security', 'User logged out.');
    }
    setCurrentUser(null);
    localStorage.removeItem('cyberaries_user');
  };

  const addControl = (control) => {
    const newControl = {
      status: 'Active',
      version: 'v1.0.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      ...control,
    };
    setRulebook(prev => [...prev, newControl]);
    logActivity(currentUser?.fullName || 'Admin', 'Settings', `Added new CSCRF control: ${control.id} (${control.name})`);
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
      addCompany,
      addClient,
      addAuditor,
      addAudit,
      addControl,
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
      updateCompany
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
