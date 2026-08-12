// Initial Mapped Controls Data Generator for CyberAries Audits

export const MOCK_CONTROL_TEMPLATES = [
  // GOVERN (GV)
  {
    code: 'GV-01',
    name: 'Cybersecurity Governance Strategy & Policy Framework',
    domain: 'Govern (GV)',
    category: 'Governance & Risk Management',
    subcategory: 'Cybersecurity Policy & Strategy',
    description: 'Establish, maintain, and enforce an enterprise cybersecurity governance strategy and risk framework integrated with regulatory operational guidelines.'
  },
  {
    code: 'GV-02',
    name: 'Operational Risk Framework & Regulatory Alignment',
    domain: 'Govern (GV)',
    category: 'Governance & Risk Management',
    subcategory: 'Risk Management Framework',
    description: 'Implement formal risk assessment methodologies, risk appetite statements, and regular board compliance reporting.'
  },
  {
    code: 'GV-03',
    name: 'Third-Party & Vendor Risk Management',
    domain: 'Govern (GV)',
    category: 'Governance & Risk Management',
    subcategory: 'Vendor Risk Assessment',
    description: 'Perform mandatory biannual security assessments and risk scoring for all third-party vendors and external technology partners.'
  },
  {
    code: 'GV-04',
    name: 'Board & Executive Security Oversight',
    domain: 'Govern (GV)',
    category: 'Governance & Risk Management',
    subcategory: 'Board Oversight & Compliance',
    description: 'Ensure quarterly board presentation of cyber posture metrics, compliance audit findings, and risk mitigation progress.'
  },

  // IDENTIFY (ID)
  {
    code: 'ID-01',
    name: 'Real-time Asset Classification & Criticality Mapping',
    domain: 'Identify (ID)',
    category: 'Asset Management',
    subcategory: 'Hardware & Software Catalog',
    description: 'Maintain an automated real-time catalog of network services, server endpoints, data assets, and software components.'
  },
  {
    code: 'ID-02',
    name: 'Hardware & Endpoint Inventory Tracking',
    domain: 'Identify (ID)',
    category: 'Asset Management',
    subcategory: 'Real-time Asset Classification',
    description: 'Track hardware serial numbers, MAC addresses, operating system builds, and network segment assignments.'
  },
  {
    code: 'ID-03',
    name: 'Media Handling, Classification & Secure Destruction',
    domain: 'Identify (ID)',
    category: 'Asset Management',
    subcategory: 'Media Handling & Destruction',
    description: 'Enforce cryptographic wiping, physical destruction logs, and sanitized disposal procedures for legacy media.'
  },
  {
    code: 'ID-04',
    name: 'Data Asset Tagging & Sensitivity Labelling',
    domain: 'Identify (ID)',
    category: 'Asset Management',
    subcategory: 'Real-time Asset Classification',
    description: 'Automate data classification tags (Public, Internal, Confidential, Restricted) across all cloud storage buckets and databases.'
  },

  // PROTECT (PR)
  {
    code: 'PR-01',
    name: 'Privileged Identity & Multi-Factor Access Controls',
    domain: 'Protect (PR)',
    category: 'Access Control & Identity',
    subcategory: 'Multi-Factor Authentication',
    description: 'Enforce hardware-based multi-factor authentication (MFA) and least-privilege role-based access control (RBAC).'
  },
  {
    code: 'PR-02',
    name: 'Least-Privilege Role-Based Access Control (RBAC)',
    domain: 'Protect (PR)',
    category: 'Access Control & Identity',
    subcategory: 'Least Privilege Enforcements',
    description: 'Restrict access permissions based strictly on job role requirement with automated quarterly privilege reviews.'
  },
  {
    code: 'PR-03',
    name: 'Privileged Access Management (PAM) Vaulting',
    domain: 'Protect (PR)',
    category: 'Access Control & Identity',
    subcategory: 'Privileged Identity Management',
    description: 'Enforce session recording, time-bound break-glass checkouts, and password vaulting for infrastructure root credentials.'
  },
  {
    code: 'PR-04',
    name: 'End-to-End Data Encryption at Rest & in Transit',
    domain: 'Protect (PR)',
    category: 'Data Security & Cryptography',
    subcategory: 'AES-256 & TLS 1.3 Protocol Enforcements',
    description: 'Enforce AES-256 encryption for storage volumes and mandatory TLS 1.3 for all external microservice network traffic.'
  },
  {
    code: 'PR-05',
    name: 'Cryptographic Key Management & HSM Vaulting',
    domain: 'Protect (PR)',
    category: 'Data Security & Cryptography',
    subcategory: 'Key Management & Rotation',
    description: 'Conduct annual master key rotation inside Hardware Security Modules (HSMs) with dual-custody authorization.'
  },

  // DETECT (DE)
  {
    code: 'DE-01',
    name: 'Centralized SIEM Log Telemetry & Threat Detection',
    domain: 'Detect (DE)',
    category: 'Continuous Monitoring',
    subcategory: 'Security Operations & Event Aggregation',
    description: 'Aggregate audit telemetry from firewalls, directory services, and database nodes into a centralized SIEM pipeline.'
  },
  {
    code: 'DE-02',
    name: 'Real-Time Endpoint Detection & Response (EDR)',
    domain: 'Detect (DE)',
    category: 'Continuous Monitoring',
    subcategory: 'SIEM Telemetry & Logging',
    description: 'Deploy EDR agents on all workstations and production servers with automated behavioral anomaly isolation.'
  },
  {
    code: 'DE-03',
    name: 'Continuous Automated Vulnerability Scanning',
    domain: 'Detect (DE)',
    category: 'Continuous Monitoring',
    subcategory: 'Vulnerability Scanning',
    description: 'Run weekly credentialed vulnerability scans on internal subnets and continuous SAST/DAST in build pipelines.'
  },
  {
    code: 'DE-04',
    name: 'Network Intrusion Detection & Behavioral Alerts',
    domain: 'Detect (DE)',
    category: 'Continuous Monitoring',
    subcategory: 'Security Operations & Event Aggregation',
    description: 'Monitor ingress/egress perimeter network traffic with deep packet inspection and signature threat detection.'
  },

  // RESPOND (RS)
  {
    code: 'RS-01',
    name: 'Incident Containment & Regulatory Breach Notification',
    domain: 'Respond (RS)',
    category: 'Incident Management',
    subcategory: 'Response Plan & Breach Notification',
    description: 'Execute standardized incident response playbooks for network containment, isolation, and mandatory breach notification.'
  },
  {
    code: 'RS-02',
    name: 'Forensic Isolation & Evidence Preservation',
    domain: 'Respond (RS)',
    category: 'Incident Management',
    subcategory: 'Forensic Isolation & Containment',
    description: 'Maintain automated VM snapshot and memory dump procedures for forensic investigation following security alerts.'
  },
  {
    code: 'RS-03',
    name: 'Incident Escalation & CERT Communication Playbook',
    domain: 'Respond (RS)',
    category: 'Incident Management',
    subcategory: 'Incident Escalation',
    description: 'Document escalation thresholds and regulatory timeline notifications for CERT-In and industry bodies.'
  },

  // RECOVER (RC)
  {
    code: 'RC-01',
    name: 'Disaster Recovery & Air-Gapped Immutable Vaults',
    domain: 'Recover (RC)',
    category: 'Data Protection & Backup',
    subcategory: 'Immutable Vaults & Recovery Testing',
    description: 'Conduct automated daily backups to immutable, air-gapped storage vaults and execute quarterly restoration drills.'
  },
  {
    code: 'RC-02',
    name: 'Business Continuity & Disaster Recovery Drills',
    domain: 'Recover (RC)',
    category: 'Data Protection & Backup',
    subcategory: 'Disaster Recovery Plan',
    description: 'Test Recovery Time Objectives (RTO < 4 hrs) and Recovery Point Objectives (RPO < 15 mins) under simulated outages.'
  },
  {
    code: 'RC-03',
    name: 'Backup Retention, Archiving & Integrity Verification',
    domain: 'Recover (RC)',
    category: 'Data Protection & Backup',
    subcategory: 'Backup Retention & Archiving',
    description: 'Verify cryptographic SHA-256 checksums on all archived tape and cloud cold storage recovery sets.'
  }
];

export const generateInitialAuditControls = (auditList) => {
  const initialMap = {};

  const listToProcess = Array.isArray(auditList) && auditList.length > 0 ? auditList : [
    { id: 'AUDIT-101', rulebook: 'SOC 2 Type II', auditor: 'Dr. Evelyn Foster' },
    { id: 'AUDIT-102', rulebook: 'SOC 2 Type II', auditor: 'Christian Wolff' },
    { id: 'AUDIT-103', rulebook: 'HIPAA', auditor: 'Christian Wolff' },
    { id: 'AUDIT-104', rulebook: 'ISO 27001', auditor: 'Lisbeth Salander' },
    { id: 'AUDIT-105', rulebook: 'PCI DSS', auditor: 'Christian Wolff' },
    { id: 'AUDIT-106', rulebook: 'ISO 27001', auditor: 'Dr. Evelyn Foster' },
    { id: 'AUDIT-107', rulebook: 'SEBI CSCRF', auditor: 'Dr. Evelyn Foster' },
    { id: 'AUDIT-108', rulebook: 'SEBI CSCRF', auditor: 'Christian Wolff' },
    { id: 'AUDIT-109', rulebook: 'RBI Cyber Security', auditor: 'Christian Wolff' },
    { id: 'AUDIT-110', rulebook: 'PCI DSS', auditor: 'Lisbeth Salander' },
    { id: 'AUDIT-111', rulebook: 'Custom Audit', auditor: 'Lisbeth Salander' },
    { id: 'AUDIT-112', rulebook: 'HIPAA', auditor: 'Christian Wolff' },
    { id: 'AUDIT-113', rulebook: 'ISO 27001', auditor: 'Christian Wolff' }
  ];

  listToProcess.forEach(audit => {
    const leadAuditor = audit.auditor || 'Dr. Evelyn Foster';

    const controls = MOCK_CONTROL_TEMPLATES.map((tmpl, idx) => {
      let assignedAuditor = 'Unassigned';
      let status = 'Unassigned';

      if (idx % 4 === 0) {
        assignedAuditor = leadAuditor;
        status = 'Assigned';
      } else if (idx % 4 === 1) {
        assignedAuditor = 'Christian Wolff';
        status = 'Assigned';
      } else if (idx % 4 === 2) {
        assignedAuditor = 'Lisbeth Salander';
        status = 'Assigned';
      } else {
        assignedAuditor = 'Unassigned';
        status = 'Unassigned';
      }

      return {
        id: `${audit.id}-${tmpl.code}`,
        controlId: tmpl.code,
        name: tmpl.name,
        domain: tmpl.domain,
        category: tmpl.category,
        subcategory: tmpl.subcategory,
        framework: audit.rulebook || 'SEBI CSCRF',
        description: tmpl.description,
        assignedAuditor,
        status,
        auditId: audit.id
      };
    });

    initialMap[audit.id] = controls;
  });

  return initialMap;
};
