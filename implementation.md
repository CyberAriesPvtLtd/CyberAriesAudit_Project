# CyberAries Audit Evaluation & Report Integration — Implementation Guide

## 1. Executive Summary

This document specifies the end-to-end architecture and implementation for upgrading the Auditor Dashboard to evaluate controls and populate the standard audit report table.

### Column Classification
The columns required for the final audit report table are categorized into three groups:

| Category | Columns | Stored In | Who / When Updated |
| :--- | :--- | :--- | :--- |
| **Static Report Fields** | • System (RE / Vendor)<br>• C / I / A<br>• Test Cases Used | `controls` table | Seeded directly from the master Excel control checklists (`seed_controls.py`). |
| **Dynamic Fields** | • Compliance Status (`Compliant`, `Partially Compliant`, `Non-Compliant`, `Not Applicable`)<br>• Risk Rating (`Critical`, `High`, `Medium`, `Low`)<br>• Similar Issue (`Yes`, `No`) | `audit_control` table | Filled dynamically by the assigned Auditor during evaluation. |
| **Default-but-Editable (Non-Compliance)** | • Root Cause Analysis<br>• Impact Analysis<br>• Recommendation / Corrective Actions<br>• Remediation Days<br>• Management Response | `audit_control` table | Completed by the Auditor when a control is `Partially Compliant` or `Non-Compliant`. |

---

## 2. Database Schema Changes

### A. `controls` Table (`app/models/controls.py`)
Static baseline columns for the control catalogue:
```python
system_entity = Column(String, nullable=True)         # System (RE / Vendor) — e.g. "Governance Team", "IT Team"
cia_classification = Column(String, nullable=True)    # C/I/A — e.g. "C", "I", "A", "C/I", "C/I/A"
test_procedure = Column(String, nullable=True)        # Test Cases Used — procedure / test steps
```

### B. `audit_control` Table (`app/models/audit_control.py`)
Audit-instance evaluation columns:
```python
# ── Dynamic evaluation fields ──
compliance_status = Column(String, nullable=True)     # Compliant / Partially Compliant / Non-Compliant / Not Applicable
risk_rating = Column(String, nullable=True)           # Critical / High / Medium / Low
similar_issue = Column(Boolean, nullable=True)        # True (Yes) / False (No)

# ── Default-but-editable fields (for non-compliant / partially compliant) ──
root_cause_analysis = Column(String, nullable=True)
impact_analysis = Column(String, nullable=True)
recommendation = Column(String, nullable=True)
remediation_days = Column(Integer, nullable=True)
management_response = Column(String, nullable=True)
```

---

## 3. Database Migration

Since the backend uses `Base.metadata.create_all()` without Alembic, an idempotent migration script is provided at:
`backend/app/migrations/add_evaluation_columns.py`

### Running the Migration:
```bash
cd backend
python -m app.migrations.add_evaluation_columns
```
*Note: The migration script is also hooked directly into `main.py` startup, so it automatically checks and creates these columns when the backend server boots with PostgreSQL running.*

---

## 4. Backend API Specification

### A. Evaluation Endpoint
- **URL**: `PATCH /audit-control/{audit_control_id}/evaluate`
- **Role Requirement**: Auditor role (`require_auditor` dependency). Only the auditor assigned to this specific control (`assigned_to == current_user.id`) can evaluate it.
- **Request Body (`AuditControlEvaluate` schema)**:
```json
{
  "compliance_status": "Non-Compliant",
  "risk_rating": "High",
  "similar_issue": false,
  "root_cause_analysis": "Default root cause or auditor modified analysis",
  "impact_analysis": "Potential exposure of sensitive financial credentials",
  "recommendation": "Implement mandatory MFA and 90-day password rotation across all AD accounts",
  "remediation_days": 30,
  "management_response": "Management agreed to implement MFA by end of month",
  "auditor_notes": "Auditor note for this specific control"
}
```
*Note: All fields are optional to support partial drafting.*
- **Side Effects**: Automatically sets `evaluated_at = utcnow()` and updates `status = "Completed"` once `compliance_status` is submitted.

### B. Querying Controls with Evaluation & Master Data
- **URL**: `GET /audit-control/framework/{framework_id}`
- **Response**: List of `AuditControlResponse` objects, where each object includes the evaluation fields and the joined master `control` object (including `system_entity`, `cia_classification`, `test_procedure`, `primary_evidence`, `secondary_evidence`).

---

## 5. Excel Seeding Integration (`app/utils/seed_controls.py`)

The seeding script automatically resolves header variants (case-insensitive, normalized) for the 3 static columns:
- **System (RE / Vendor)** aliases: `system`, `systementity`, `systemrevendor`, `revendor`, `entity`
- **C/I/A** aliases: `cia`, `ciaclassification`, `ciatriad`, `ciaimpact`
- **Test Cases Used** aliases: `testcasesused`, `testcases`, `testprocedure`, `testprocedureused`, `teststeps`

When new Excel sheets are placed in `backend/app/data/controls/`, the seed script will automatically populate and update these fields. Existing sheets without these columns will continue to seed without errors.

---

## 6. Frontend Developer Implementation Guide

### A. Page Structure Recommendation: Should we add a dedicated page?
**YES (Recommended):** Use a dedicated Evaluation View (or enhance the existing `AuditReview.jsx`).
- **Why?** Evaluating a cybersecurity control requires reviewing the control description, primary/secondary evidence requirements, uploaded client files, and AI findings simultaneously. Cramming 8 observation textareas into a table row creates clutter.
- **Route**: `/audit-review/:auditControlId` or `/assigned-audits/:frameworkId/evaluate/:auditControlId`

### B. UI Component Architecture (`AuditReview.jsx` / Evaluation Form)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Breadcrumb: ← Back to Controls List | Control ID: PR.AC.01             │
├──────────────────────────┬─────────────────────────────┬───────────────┤
│ Left Panel (Master Info) │ Center Panel (Evidence)     │ Right Panel   │
│ • Control Name & Desc    │ • Uploaded Files Viewer     │ • AI Findings │
│ • System: IT / Vendor    │ • Download & Preview        │ • Confidence  │
│ • C/I/A Classification   │ • Evidence Status / Notes   │ • Reasoning   │
│ • Test Cases Used        │                             │               │
├──────────────────────────┴─────────────────────────────┴───────────────┤
│ Bottom Section: Auditor Evaluation & Report Form                       │
│                                                                        │
│ 1. Dynamic Status Group:                                               │
│    [ Compliance Status: Non-Compliant ▼ ]   [ Risk Rating: High ▼ ]    │
│    [ Similar Issue: ( ) Yes  (•) No ]                                  │
│                                                                        │
│ 2. Non-Compliance Observations (Visible when Non-Compliant/Partial):   │
│    • Root Cause Analysis:              [ Textarea                    ] │
│    • Impact Analysis:                  [ Textarea                    ] │
│    • Recommendations / Action:         [ Textarea                    ] │
│    • Remediation Days:                 [ Number Input (e.g. 30)      ] │
│    • Management Response:              [ Textarea                    ] │
│    • Auditor Notes:                    [ Textarea                    ] │
│                                                                        │
│ [ Save Draft ]                                    [ Submit Evaluation ]│
└────────────────────────────────────────────────────────────────────────┘
```

### C. Frontend API Methods (`src/services/api.js`)
The methods are already added in `frontend/auditor/src/services/api.js`:
- `evaluateAuditControl(auditControlId, payload)`: Calls `PATCH /audit-control/{id}/evaluate`
- `getAuditControlById(auditControlId)`: Calls `GET /audit-control/{id}`
- `getAuditControlsByFramework(frameworkId)`: Calls `GET /audit-control/framework/{id}`

### D. Form State Example:
```javascript
const [evaluation, setEvaluation] = useState({
  compliance_status: auditControl.compliance_status || '',
  risk_rating: auditControl.risk_rating || '',
  similar_issue: auditControl.similar_issue ?? false,
  root_cause_analysis: auditControl.root_cause_analysis || '',
  impact_analysis: auditControl.impact_analysis || '',
  recommendation: auditControl.recommendation || '',
  remediation_days: auditControl.remediation_days || 30,
  management_response: auditControl.management_response || '',
  auditor_notes: auditControl.auditor_notes || '',
});

const isNonCompliant =
  evaluation.compliance_status === 'Non-Compliant' ||
  evaluation.compliance_status === 'Partially Compliant';

const handleSave = async () => {
  await evaluateAuditControl(auditControlId, evaluation);
  // display toast notification and update UI status
};
```

---

## 7. Standard Report Mapping Table

When generating the standard audit report (docx / pdf / excel), map the columns as follows:

| Standard Report Column Header | Data Source | Database Field |
| :--- | :--- | :--- |
| **Sr. No.** | Sequence counter / Index | `row_index + 1` |
| **Clause (Framework Code)** | Controls Master | `audit_control.control.framework_rules` (joined as string) |
| **Description** | Controls Master | `audit_control.control.control_desc` |
| **System (RE / Vendor)** | Controls Master | `audit_control.control.system_entity` |
| **C / I / A** | Controls Master | `audit_control.control.cia_classification` |
| **Test Cases Used** | Controls Master | `audit_control.control.test_procedure` |
| **Evidence Required** | Controls Master | Primary: `control.primary_evidence`<br>Secondary: `control.secondary_evidence` |
| **Status** | Auditor Evaluation | `audit_control.compliance_status` |
| **Risk** | Auditor Evaluation | `audit_control.risk_rating` |
| **Similar Issue** | Auditor Evaluation | `audit_control.similar_issue ? "Yes" : "No"` |
| **Root Cause Analysis** | Auditor Evaluation | `audit_control.root_cause_analysis` |
| **Impact Analysis** | Auditor Evaluation | `audit_control.impact_analysis` |
| **Recommendation / Corrective Actions** | Auditor Evaluation | `audit_control.recommendation` |
| **Days** | Auditor Evaluation | `audit_control.remediation_days` |
| **Management Response** | Auditor Evaluation | `audit_control.management_response` |
| **Auditor Note** | Auditor Evaluation | `audit_control.auditor_notes` |
