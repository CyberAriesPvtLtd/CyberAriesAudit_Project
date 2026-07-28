import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ClientContext = createContext();

const initialAllControls = {
  "SOC 2 Type II": [
    { id: 'CTRL-AC-01', name: 'User Access Authorization', domain: 'Access Control', standard: 'SOC 2 CC6.1 / ISO A.9.1', status: 'Completed', description: 'Ensure all user access requests are formally authorized and reviewed quarterly.', requiredEvidence: 'Access requests forms, quarterly review approval logs', evidenceFile: 'Access_Auth_Review_Q1.pdf', evidenceSize: '1.4 MB', evidenceDate: '2026-05-10' },
    { id: 'CTRL-AC-02', name: 'Multi-Factor Authentication', domain: 'Access Control', standard: 'SOC 2 CC6.3 / ISO A.9.4', status: 'Action Required', description: 'Enforce MFA for all external administrative access to corporate assets.', requiredEvidence: 'Screenshots of AWS IAM MFA settings, AD configuration reports', evidenceFile: null, evidenceSize: null, evidenceDate: null },
    { id: 'CTRL-EN-01', name: 'Encryption of Data at Rest', domain: 'Cryptography', standard: 'SOC 2 CC6.6 / ISO A.18.1', status: 'Completed', description: 'All database assets containing PII must be encrypted using AES-256.', requiredEvidence: 'RDS KMS configuration screenshots, database policy document', evidenceFile: 'Database_KMS_Encryption.png', evidenceSize: '840 KB', evidenceDate: '2026-06-02' },
    { id: 'CTRL-EN-02', name: 'Data in Transit Protection', domain: 'Cryptography', standard: 'SOC 2 CC6.7 / ISO A.10.1', status: 'Completed', description: 'Configure secure transit protocols (TLS 1.3) for external API interfaces.', requiredEvidence: 'Nginx SSL config files, server TLS handshake certificates', evidenceFile: 'Nginx_TLS1.3_Config.txt', evidenceSize: '45 KB', evidenceDate: '2026-06-15' },
    { id: 'CTRL-OP-01', name: 'Daily Backup Operations', domain: 'Operations Security', standard: 'SOC 2 CC7.1 / ISO A.12.3', status: 'Completed', description: 'Retain offsite backups with encryption for at least 7 years.', requiredEvidence: 'S3 lifecycle rule config screenshots, daily backup completion records', evidenceFile: 'S3_Backup_Lifecycle_Rules.png', evidenceSize: '1.2 MB', evidenceDate: '2026-06-20' },
    { id: 'CTRL-RA-01', name: 'Annual Vulnerability Assessments', domain: 'Risk Assessment', standard: 'SOC 2 CC8.1 / ISO A.12.6', status: 'Action Required', description: 'Schedule yearly external penetration tests and remediate critical items within 30 days.', requiredEvidence: 'Latest penetration test executive report, vulnerability scan summary logs', evidenceFile: null, evidenceSize: null, evidenceDate: null },
    { id: 'CTRL-HR-01', name: 'Employee Background Check', domain: 'Human Resources', standard: 'SOC 2 CC2.1 / ISO A.7.1', status: 'In Progress', description: 'Verify education, credentials, and criminal history for all new hires.', requiredEvidence: 'Third-party HR vetting invoices, signed consent forms', evidenceFile: 'Employee_Vetting_Invoice.pdf', evidenceSize: '310 KB', evidenceDate: '2026-07-05' }
  ],
  "ISO 27001": [
    { id: 'ISO-A5-01', name: 'Information Security Policies', domain: 'Security Policy', standard: 'ISO 27001 A.5.1', status: 'Completed', description: 'Establish and publish information security policies integrated with operational controls.', requiredEvidence: 'Signed InfoSec Policy Statement, distribution log', evidenceFile: 'Info_Sec_Policy_Signed.pdf', evidenceSize: '450 KB', evidenceDate: '2026-05-15' },
    { id: 'ISO-A6-01', name: 'Security Roles & Responsibilities', domain: 'Organization of Security', standard: 'ISO 27001 A.6.1.1', status: 'Action Required', description: 'Define and assign cybersecurity administration and oversight roles.', requiredEvidence: 'Security committee organogram, roles definition spreadsheet', evidenceFile: null, evidenceSize: null, evidenceDate: null },
    { id: 'ISO-A8-01', name: 'Inventory of Assets', domain: 'Asset Management', standard: 'ISO 27001 A.8.1.1', status: 'Action Required', description: 'Maintain a detailed registry of all physical, software, and data assets.', requiredEvidence: 'CMDB export logs, asset owners spreadsheet', evidenceFile: null, evidenceSize: null, evidenceDate: null },
    { id: 'ISO-A9-02', name: 'Access Registration Lifecycle', domain: 'Access Control', standard: 'ISO 27001 A.9.2.1', status: 'Completed', description: 'Manage employee user creation, modifications, and terminations cleanly.', requiredEvidence: 'AD provisioning logs, ticket history screenshots', evidenceFile: 'Access_Auth_Logs.pdf', evidenceSize: '1.1 MB', evidenceDate: '2026-06-01' },
    { id: 'ISO-A12-04', name: 'Event Log Telemetry', domain: 'Logging & Monitoring', standard: 'ISO 27001 A.12.4.1', status: 'Completed', description: 'Configure active telemetry event capture and logs retention.', requiredEvidence: 'VPC Flow Logs config, CloudWatch metric screenshots', evidenceFile: 'CloudWatch_Logging_Rules.png', evidenceSize: '710 KB', evidenceDate: '2026-06-18' }
  ],
  "SEBI CSCRF": [
    { id: 'SEBI-GV-01', name: 'Security Governance Charter', domain: 'Governance', standard: 'SEBI CSCRF GV-1.1', status: 'Completed', description: 'Appoint cybersecurity operational steering committee chaired by CISO.', requiredEvidence: 'Governance Charter meeting minutes, CISO appointment letter', evidenceFile: 'SEBI_CISO_Charter.pdf', evidenceSize: '820 KB', evidenceDate: '2026-04-12' },
    { id: 'SEBI-ID-02', name: 'Asset Classification & Criticality', domain: 'Identification', standard: 'SEBI CSCRF ID-1.2', status: 'Completed', description: 'Perform weekly cataloging and security impact classifications.', requiredEvidence: 'Critical assets map, weekly inventory scan', evidenceFile: 'Critical_Asset_Flows.png', evidenceSize: '1.5 MB', evidenceDate: '2026-05-08' },
    { id: 'SEBI-PR-03', name: 'MFA Enforcement on Admin Lanes', domain: 'Protection', standard: 'SEBI CSCRF PR-2.1', status: 'Completed', description: 'Enforce multi-factor authentication for administrative layers.', requiredEvidence: 'MFA policy document, VPN MFA screenshots', evidenceFile: 'MFA_Active_Directory.pdf', evidenceSize: '950 KB', evidenceDate: '2026-06-05' },
    { id: 'SEBI-DE-04', name: 'SOC Log Aggregation', domain: 'Detection', standard: 'SEBI CSCRF DE-3.4', status: 'Completed', description: 'Establish SIEM dashboards for active threat scanning.', requiredEvidence: 'SIEM config, continuous security scanning log', evidenceFile: 'SIEM_Integration_Logs.txt', evidenceSize: '120 KB', evidenceDate: '2026-07-02' }
  ],
  "RBI Cyber Security": [
    { id: 'RBI-AC-01', name: 'Access Authorization Control', domain: 'Access Management', standard: 'RBI CS-1.1', status: 'In Progress', description: 'RBI privs check control parameters.', requiredEvidence: 'Database privileges request logs, signed approval files', evidenceFile: null, evidenceSize: null, evidenceDate: null }
  ]
};

const initialAllFindings = {
  "SOC 2 Type II": [
    {
      id: 'CTRL-AC-02',
      name: 'Multi-Factor Authentication',
      status: 'Pending Response',
      auditor: 'Dr. Evelyn Foster',
      comments: [
        {
          sender: 'Auditor',
          name: 'Dr. Evelyn Foster',
          message: 'Hello. I was reviewing the external console logs and noticed a few administrative users connecting without MFA enabled. Could you please provide the AWS IAM configuration details or a screenshot showing that administrative accounts enforce MFA?',
          timestamp: '2026-07-08T10:30:00Z',
          attachment: null
        }
      ]
    },
    {
      id: 'CTRL-HR-01',
      name: 'Employee Background Check',
      status: 'Pending Response',
      auditor: 'Dr. Evelyn Foster',
      comments: [
        {
          sender: 'Auditor',
          name: 'Dr. Evelyn Foster',
          message: 'The vetting invoice you submitted shows background checks for 2025. Could you upload the current policy document or invoices confirming that background screening is active for Q2 2026 hires?',
          timestamp: '2026-07-09T15:20:00Z',
          attachment: null
        }
      ]
    }
  ],
  "ISO 27001": [
    {
      id: 'ISO-A6-01',
      name: 'Security Roles & Responsibilities',
      status: 'Pending Response',
      auditor: 'Dr. Evelyn Foster',
      comments: [
        {
          sender: 'Auditor',
          name: 'Dr. Evelyn Foster',
          message: 'Please upload the signed governance organogram showing who administers access security roles.',
          timestamp: '2026-07-10T09:30:00Z',
          attachment: null
        }
      ]
    }
  ],
  "SEBI CSCRF": [],
  "RBI Cyber Security": []
};

const initialActivities = [
  { id: 'ACT-C01', user: 'System', type: 'System', message: 'Client compliance score initialized.', timestamp: '2026-07-05T09:00:00Z' },
  { id: 'ACT-C02', user: 'Sarah Connor', type: 'Document', message: 'Uploaded evidence file: "Employee_Vetting_Invoice.pdf" for CTRL-HR-01.', timestamp: '2026-07-05T10:15:00Z' },
  { id: 'ACT-C03', user: 'Dr. Evelyn Foster', type: 'Audit', message: 'Raised clarification question for CTRL-HR-01 (Background screening policy).', timestamp: '2026-07-09T15:20:00Z' },
];

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

  const [assignedAudits, setAssignedAudits] = useState(['SOC 2 Type II', 'ISO 27001', 'SEBI CSCRF', 'RBI Cyber Security']);
  const [currentAudit, setCurrentAudit] = useState(() => {
    const saved = localStorage.getItem('cc_current_audit');
    return saved || 'SOC 2 Type II';
  });

  const [allControls, setAllControls] = useState(() => {
    const saved = localStorage.getItem('cc_all_controls');
    return saved ? JSON.parse(saved) : initialAllControls;
  });

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
  const uploadEvidence = (controlId, fileName, fileSize) => {
    setAllControls(prev => {
      const currentList = prev[currentAudit] || [];
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
      return {
        ...prev,
        [currentAudit]: updatedList
      };
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
      return {
        ...prev,
        [currentAudit]: updatedList
      };
    });
  };

  const deleteEvidence = (controlId) => {
    let fileName = '';
    setAllControls(prev => {
      const currentList = prev[currentAudit] || [];
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
      updatePreferences
    }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => useContext(ClientContext);
