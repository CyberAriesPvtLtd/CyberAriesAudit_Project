export const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};

export const initialFrameworkRules = [
  {
    id: 'FR-001',
    frameworkRules: 'CSCRF-GV-1.1: Cybersecurity Governance Strategy & Policy Framework',
    controlDomain: 'Govern (GV)',
    frameworkType: 'SEBI CSCRF',
    frameworkCategory: 'Governance & Risk Management',
    frameworkSubcategory: 'Cybersecurity Policy & Strategy',
    description: 'Establish, maintain, and enforce an enterprise cybersecurity governance strategy and risk framework integrated with SEBI CSCRF operational guidelines.',
    primaryDocuments: ['CSCRF_Governance_Policy_v2.pdf', 'Cyber_Strategy_2026.pdf'],
    secondaryDocuments: ['Board_Approval_Minutes.pdf', 'Risk_Register_Q2.xlsx'],
    lastUpdated: '15-07-2026'
  },
  {
    id: 'FR-002',
    frameworkRules: 'CSCRF-ID-1.2: Real-time Asset Classification & Criticality Mapping',
    controlDomain: 'Identify (ID)',
    frameworkType: 'SEBI CSCRF',
    frameworkCategory: 'Asset Management',
    frameworkSubcategory: 'Hardware & Software Catalog',
    description: 'Maintain an automated real-time catalog of all enterprise network services, server endpoints, data assets, and third-party software components.',
    primaryDocuments: ['Asset_Classification_Standard.pdf', 'CMDB_Schema_Config.pdf'],
    secondaryDocuments: ['Asset_Inventory_Q2.xlsx', 'Discovery_Scan_Log.txt'],
    lastUpdated: '28-06-2026'
  },
  {
    id: 'FR-003',
    frameworkRules: 'ISO-27001-A9: Privileged Identity & Multi-Factor Access Controls',
    controlDomain: 'Protect (PR)',
    frameworkType: 'ISO 27001',
    frameworkCategory: 'Access Control & Identity',
    frameworkSubcategory: 'Multi-Factor Authentication',
    description: 'Enforce hardware-based multi-factor authentication (MFA) and least-privilege role-based access control (RBAC) across administrative lanes.',
    primaryDocuments: ['IAM_Security_Policy.pdf', 'MFA_Enforcement_Standard.pdf'],
    secondaryDocuments: ['AD_Group_Permissions.csv', 'MFA_Audit_Log_Q2.pdf'],
    lastUpdated: '01-07-2026'
  },
  {
    id: 'FR-004',
    frameworkRules: 'SOC2-CC6.6: End-to-End Data Encryption at Rest & in Transit',
    controlDomain: 'Protect (PR)',
    frameworkType: 'SOC 2 Type II',
    frameworkCategory: 'Data Security & Cryptography',
    frameworkSubcategory: 'AES-256 & TLS 1.3 Protocol Enforcements',
    description: 'Enforce AES-256 encryption for database volumes and TLS 1.3 for all external microservice APIs, preventing unauthorized data exposure.',
    primaryDocuments: ['Data_Encryption_Architecture.pdf', 'KMS_Key_Rotation_Policy.pdf'],
    secondaryDocuments: ['SSL_TLS_Scan_Report.pdf', 'KMS_Config_Spec.json'],
    lastUpdated: '10-07-2026'
  },
  {
    id: 'FR-005',
    frameworkRules: 'CSCRF-DE-3.4: Centralized SIEM Log Telemetry & Threat Detection',
    controlDomain: 'Detect (DE)',
    frameworkType: 'SEBI CSCRF',
    frameworkCategory: 'Continuous Monitoring',
    frameworkSubcategory: 'Security Operations & Event Aggregation',
    description: 'Aggregate audit telemetry from firewalls, active directory, and servers into a centralized Security Information and Event Management (SIEM) pipeline.',
    primaryDocuments: ['SIEM_Monitoring_Standard.pdf', 'SOC_Alerting_Rules.pdf'],
    secondaryDocuments: ['Splunk_Config_Export.xml', 'Weekly_Threat_Report.pdf'],
    lastUpdated: '30-06-2026'
  },
  {
    id: 'FR-006',
    frameworkRules: 'HIPAA-164.308: Incident Containment & Regulatory Breach Notification',
    controlDomain: 'Respond (RS)',
    frameworkType: 'HIPAA',
    frameworkCategory: 'Incident Management',
    frameworkSubcategory: 'Response Plan & Breach Notification',
    description: 'Maintain and execute standardized incident response playbooks for swift network containment, forensic isolation, and mandatory breach notification.',
    primaryDocuments: ['Incident_Response_Plan_2026.pdf', 'Breach_Notification_Procedure.pdf'],
    secondaryDocuments: ['Tabletop_Exercise_Summary.pdf', 'IR_Team_Roster.xlsx'],
    lastUpdated: '08-07-2026'
  },
  {
    id: 'FR-007',
    frameworkRules: 'PCI-DSS-v4-10: Disaster Recovery & Air-Gapped Immutable Vaults',
    controlDomain: 'Recover (RC)',
    frameworkType: 'PCI DSS',
    frameworkCategory: 'Data Protection & Backup',
    frameworkSubcategory: 'Immutable Vaults & Recovery Testing',
    description: 'Conduct automated daily backups to immutable, air-gapped storage vaults and execute quarterly disaster recovery restoration drills.',
    primaryDocuments: ['Disaster_Recovery_Policy.pdf', 'Backup_Retention_Specification.pdf'],
    secondaryDocuments: ['DR_Drill_Results_Q2.pdf', 'S3_Vault_Config.json'],
    lastUpdated: '18-05-2026'
  },
  {
    id: 'FR-008',
    frameworkRules: 'RBI-CS-4.1: Cyber Crisis Management & Third-Party Vendor Audits',
    controlDomain: 'Govern (GV)',
    frameworkType: 'RBI Cyber Security',
    frameworkCategory: 'Governance & Risk Management',
    frameworkSubcategory: 'Vendor Risk Assessment',
    description: 'Establish cyber crisis management procedures and perform biannual security assessments for third-party vendors and fintech service providers.',
    primaryDocuments: ['Vendor_Risk_Management_Policy.pdf', 'Crisis_Plan_RBI.pdf'],
    secondaryDocuments: ['Third_Party_Audit_Log.xlsx', 'Vendor_SLA_Reviews.pdf'],
    lastUpdated: '04-07-2026'
  }
];

export const CONTROL_DOMAINS = [
  'Govern (GV)',
  'Identify (ID)',
  'Protect (PR)',
  'Detect (DE)',
  'Respond (RS)',
  'Recover (RC)'
];

export const FRAMEWORK_TYPES = [
  'SEBI CSCRF',
  'ISO 27001',
  'SOC 2 Type II',
  'HIPAA',
  'PCI DSS',
  'RBI Cyber Security'
];

export const FRAMEWORK_CATEGORIES = [
  'Governance & Risk Management',
  'Asset Management',
  'Access Control & Identity',
  'Data Security & Cryptography',
  'Continuous Monitoring',
  'Incident Management',
  'Data Protection & Backup'
];

export const FRAMEWORK_SUBCATEGORIES = [
  'Cybersecurity Policy & Strategy',
  'Hardware & Software Catalog',
  'Multi-Factor Authentication',
  'AES-256 & TLS 1.3 Protocol Enforcements',
  'Security Operations & Event Aggregation',
  'Response Plan & Breach Notification',
  'Immutable Vaults & Recovery Testing',
  'Vendor Risk Assessment'
];
