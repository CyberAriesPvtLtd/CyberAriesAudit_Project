# 📄 Audit Report Generation — Implementation Guide

> **Module:** Report Generation (`.docx` format)  
> **Status:** Planned  
> **Library:** [`docxtpl`](https://docxtpl.readthedocs.io/) (Jinja2 templating inside Word documents)  
> **Last Updated:** September 7, 2026

---

## 📌 Overview

This module enables **automated generation of audit reports** in `.docx` (Microsoft Word) format. Auditors and admins can click a single button on the dashboard, and the system will:

1. Query all control data from the database for the selected audit framework
2. Inject it into a pre-designed Word template
3. Return the completed `.docx` file as a browser download

### Why `.docx`?

- PM requirement: Reports must be editable in Microsoft Word
- Auditors need to review/modify before final submission
- `.docx` is the industry standard for GRC audit deliverables

---

## 🏗️ Architecture

### Where It Lives

The report generation runs **entirely inside the existing FastAPI backend**. No new containers, services, or infrastructure are required.

```
┌──────────────────┐                                      ┌──────────────────┐
│    Frontend       │    GET /reports/generate/{fw_id}     │    Backend        │
│    (React)        │ ──────────────────────────────────►  │    (FastAPI)      │
│                   │                                      │                   │
│  "Generate Report"│   ◄── .docx file download ────────   │  1. Query DB      │
│   button          │                                      │  2. Load template │
│                   │                                      │  3. Render docxtpl│
│                   │                                      │  4. Return file   │
└──────────────────┘                                      └──────────────────┘
```

### Performance

| Step               | What Happens                              | Time       |
|--------------------|-------------------------------------------|------------|
| DB Query           | Fetch ~50-100 control rows                | ~50ms      |
| Load Template      | Read ~200KB `.docx` from disk             | ~5ms       |
| Render             | Jinja2 string substitution                | ~200ms     |
| Return File        | Stream ~300KB `.docx` to browser          | ~100ms     |
| **Total**          |                                           | **< 1 sec** |

> **Note:** This is lighter than loading the Auditor Dashboard. No background workers or task queues are needed.

---

## 📁 File Structure

```
backend/
├── app/
│   ├── routers/
│   │   └── report_router.py              ← API endpoint (NEW)
│   ├── services/
│   │   └── report_service.py             ← Core rendering logic (NEW)
│   └── templates/
│       └── reports/
│           ├── CSCRF_AIF_SC_Report.docx  ← CSCRF AIF Self-Certified template
│           ├── CSCRF_AIF_QRE_Report.docx ← CSCRF AIF Qualified RE template
│           ├── CSCRF_PMS_Report.docx     ← CSCRF PMS template
│           ├── ISO_27001_Report.docx     ← Future: ISO 27001 template
│           └── SOC2_Report.docx          ← Future: SOC 2 template
```

---

## 🔧 Setup

### 1. Install Dependency

```bash
pip install docxtpl
```

Add to `requirements.txt`:
```
docxtpl==0.18.0
```

### 2. Create the Word Template

Open Microsoft Word and design the report layout. Use **Jinja2 syntax** for dynamic fields:

#### Simple Variables
```
Company Name: {{ company_name }}
Audit Type: {{ audit_type }}
Financial Year: {{ target_fy }}
Generated On: {{ generated_date }}
```

#### Table with Loop (for the controls table)
In Word, create a table and use this syntax in the first data row:

| S.No | Clause | Description | Status | Risk | ... |
|------|--------|-------------|--------|------|-----|
| `{% for row in controls %}` | | | | | |
| `{{ row.sno }}` | `{{ row.clause }}` | `{{ row.description }}` | `{{ row.status }}` | `{{ row.risk }}` | ... |
| `{% endfor %}` | | | | | |

> **Important:** The `{% for %}` and `{% endfor %}` tags must be in their own rows. `docxtpl` will automatically replicate the data row for each item and remove the tag rows.

---

## 💻 Backend Implementation

### `report_router.py`

```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.services import report_service

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/generate/{framework_id}")
def generate_audit_report(
    framework_id: str,
    db: Session = Depends(get_db)
):
    """
    Generate a .docx audit report for the given framework.
    Returns the file as a downloadable attachment.
    """
    file_buffer, file_name = report_service.generate_report(db, framework_id)

    return StreamingResponse(
        file_buffer,
        media_type=(
            "application/vnd.openxmlformats-officedocument"
            ".wordprocessingml.document"
        ),
        headers={
            "Content-Disposition": f'attachment; filename="{file_name}"'
        }
    )
```

### `report_service.py`

```python
import io
import os
from datetime import datetime, timezone

from docxtpl import DocxTemplate
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.audit_framework import AuditFramework
from app.models.audit_control import AuditControl
from app.models.company import Company


# ─── Template Mapping ──────────────────────────────────────────────
# Maps (audit_type, audit_category, audit_subcategory) → template filename.
# Adding a new framework = adding one entry here + one .docx file.

TEMPLATE_MAP = {
    ("SEBI CSCRF", "AIF", "Self-Certified RE"): "CSCRF_AIF_SC_Report.docx",
    ("SEBI CSCRF", "AIF", "Qualified RE"):      "CSCRF_AIF_QRE_Report.docx",
    ("SEBI CSCRF", "PMS", None):                 "CSCRF_PMS_Report.docx",
    # Future frameworks:
    # ("ISO 27001", None, None):                 "ISO_27001_Report.docx",
    # ("SOC 2", "Type II", None):                "SOC2_Report.docx",
}

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates", "reports")


def _get_template_path(framework) -> str:
    """Resolve the correct .docx template for a given audit framework."""
    key = (framework.audit_type, framework.audit_category, framework.audit_subcategory)
    filename = TEMPLATE_MAP.get(key)

    if not filename:
        raise HTTPException(
            status_code=400,
            detail=f"No report template configured for: {key}"
        )

    path = os.path.join(TEMPLATES_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(
            status_code=500,
            detail=f"Template file missing: {filename}"
        )
    return path


def generate_report(db: Session, framework_id: str):
    """
    Main entry point. Fetches data, renders the template, returns
    an in-memory BytesIO buffer and a suggested filename.
    """

    # ── 1. Fetch framework + company ──────────────────────────────
    framework = (
        db.query(AuditFramework)
        .filter(AuditFramework.id == framework_id)
        .first()
    )
    if not framework:
        raise HTTPException(status_code=404, detail="Audit Framework not found")

    company = db.query(Company).filter(Company.id == framework.company_id).first()

    # ── 2. Fetch all audit controls for this framework ────────────
    controls = (
        db.query(AuditControl)
        .options(joinedload(AuditControl.control))
        .filter(AuditControl.framework_id == framework_id)
        .all()
    )

    # ── 3. Build template context ─────────────────────────────────
    controls_data = []
    for idx, ac in enumerate(controls, start=1):
        ctrl = ac.control  # The master Controls row
        controls_data.append({
            "sno":             idx,
            "clause":          ", ".join(ctrl.framework_rules) if ctrl else "",
            "description":     ctrl.control_desc if ctrl else "",
            "system":          "",               # ← Fill from DB or template
            "status":          ac.status,
            "risk":            "",               # ← Fill from DB or template
            "cia":             "",               # ← Fill from DB or template
            "test_cases":      "",               # ← Fill from DB or template
            "root_cause":      "",               # ← Auditor-filled
            "impact":          "",               # ← Auditor-filled
            "recommendations": "",               # ← Auditor-filled
            "days":            "",               # ← Auditor-filled
            "mgmt_response":   "",               # ← Auditor-filled
            "similar_issue":   "",               # ← Auditor-filled
            "evidence":        ", ".join(ctrl.primary_evidence or []) if ctrl else "",
        })

    context = {
        "company_name":   company.company_name if company else "N/A",
        "audit_type":     framework.audit_type,
        "audit_category": framework.audit_category or "",
        "audit_name":     framework.audit_name,
        "target_fy":      framework.target_fy,
        "generated_date": datetime.now(timezone.utc).strftime("%B %d, %Y"),
        "controls":       controls_data,
    }

    # ── 4. Render ─────────────────────────────────────────────────
    template_path = _get_template_path(framework)
    doc = DocxTemplate(template_path)
    doc.render(context)

    # ── 5. Save to in-memory buffer ───────────────────────────────
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    safe_name = (company.company_name if company else "Report").replace(" ", "_")
    file_name = f"{safe_name}_{framework.audit_name}_Report.docx"

    return buffer, file_name
```

### Register the Router in `main.py`

```python
from app.routers import report_router

app.include_router(report_router.router)
```

---

## 🖥️ Frontend Implementation

### API Function (`api.js`)

```javascript
export const generateReport = (frameworkId) => {
  const token = localStorage.getItem('cyberaries_token');
  const url = `${API_BASE_URL}/reports/generate/${frameworkId}`;
  
  // Open in new tab — browser will auto-download the .docx
  window.open(`${url}?token=${token}`, '_blank');
};
```

> **Note:** For authenticated downloads, you may need to pass the JWT token as a query parameter or use a short-lived download token.

### UI Button (in Dashboard or FrameworkManagement page)

```jsx
<button
  className="btn btn-primary"
  onClick={() => generateReport(frameworkId)}
  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
>
  <FileText size={16} />
  Generate Report
</button>
```

---

## 📊 Column Mapping Reference

Based on the CSCRF audit report format:

| # | Column Name                       | Source                | Editable in Word? |
|---|-----------------------------------|-----------------------|--------------------|
| 1 | S.No                              | Auto-incremented      | No                 |
| 2 | Clause (Framework Rules)          | `controls.framework_rules` | No            |
| 3 | Description of Finding(s)         | `controls.control_desc`    | No            |
| 4 | System (RE / Vendor)              | TBD — needs new DB field or template-level | Yes |
| 5 | Status                            | `audit_control.status`     | No            |
| 6 | Risk (C/H/M/L)                    | TBD — needs new DB field   | Yes           |
| 7 | C/I/A                             | TBD — needs new DB field   | Yes           |
| 8 | Test Cases Used                   | TBD — needs new DB field or template-level | Yes |
| 9 | Root Cause Analysis               | Auditor-filled             | Yes           |
| 10| Impact Analysis                   | Auditor-filled             | Yes           |
| 11| Recommendations / Corrective Actions | Auditor-filled          | Yes           |
| 12| Days                              | Auditor-filled             | Yes           |
| 13| Management Response               | Auditor-filled             | Yes           |
| 14| Similar Issue (Last 3 Audits)     | Auditor-filled             | Yes           |
| 15| Evidence Required                 | `controls.primary_evidence`| No            |

> **"Editable in Word?"** means the auditor will fill/modify this column manually after downloading the report. Columns marked "No" are auto-populated from the database.

---

## 🔄 Adding a New Framework (e.g., ISO 27001)

### Step 1: Design the Template
Create `ISO_27001_Report.docx` in Word with the appropriate table structure and Jinja2 tags.

### Step 2: Register the Template
Add one line to `TEMPLATE_MAP` in `report_service.py`:

```python
("ISO 27001", None, None): "ISO_27001_Report.docx",
```

### Step 3: Place the File
Save the `.docx` template to:
```
backend/app/templates/reports/ISO_27001_Report.docx
```

**That's it.** No other code changes needed.

---

## ⚠️ Important Notes

1. **Template Design:** The `.docx` template must be created in Word with proper Jinja2 tags. Test with a small dataset first.
2. **Encoding:** Ensure all database text is UTF-8 to avoid rendering errors in Word.
3. **Images/Logos:** `docxtpl` supports inserting images (company logos, etc.) using `InlineImage`. We can add this later.
4. **Alembic:** Any new database columns (like `risk`, `cia`, `test_cases`) will need proper migrations before deployment.
5. **Authentication:** The download endpoint should be protected with JWT authentication, same as all other endpoints.

---

## 📚 References

- [`docxtpl` Documentation](https://docxtpl.readthedocs.io/)
- [`python-docx` Documentation](https://python-docx.readthedocs.io/)
- [Jinja2 Template Syntax](https://jinja.palletsprojects.com/)

---

*This document is part of the CyberAries Audit Platform internal documentation.*
