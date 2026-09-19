import io
import os
import re
from datetime import datetime, timezone

from docxtpl import DocxTemplate
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.audit_control import AuditControl
from app.models.audit_framework import AuditFramework
from app.models.company import Company
from app.models.controls import Controls
from app.models.user import User, UserRole


# ─── Template Mapping ──────────────────────────────────────────────
# Maps (audit_type, audit_category, audit_subcategory) → template filename.
# Adding a new framework = adding one entry here + one .docx file.
#
# NOTE: `audit_subcategory` values must match the strings stored in the
# `controls` / `audit_framework` tables (see the seeded Excel files).

TEMPLATE_MAP = {
    ("SEBI CSCRF", "AIF", "Self-Certified RE"): "CSCRF_AIF_SC_Report.docx",
    ("SEBI CSCRF", "AIF", "Qualified RE"): "CSCRF_AIF_QRE_Report.docx",
    ("SEBI CSCRF", "PMS", None): "CSCRF_PMS_Report.docx",
    # Future frameworks:
    # ("ISO 27001", None, None): "ISO_27001_Report.docx",
    # ("SOC 2", "Type II", None): "SOC2_Report.docx",
}

# Fallback used while a framework-specific template has not been designed yet.
DEFAULT_TEMPLATE = "Default_Audit_Report.docx"

TEMPLATES_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "templates", "reports"
)


def _get_template_path(framework: AuditFramework) -> str:
    """Resolve the .docx template for an audit framework.

    Falls back to the generic default template when no framework-specific
    template is registered, so report generation works for every framework
    from day one.
    """
    key = (
        framework.audit_type,
        framework.audit_category,
        framework.audit_subcategory,
    )
    filename = TEMPLATE_MAP.get(key, DEFAULT_TEMPLATE)

    path = os.path.normpath(os.path.join(TEMPLATES_DIR, filename))

    # Registered template missing on disk -> fall back to the default one.
    if not os.path.exists(path) and filename != DEFAULT_TEMPLATE:
        path = os.path.normpath(os.path.join(TEMPLATES_DIR, DEFAULT_TEMPLATE))

    if not os.path.exists(path):
        raise HTTPException(
            status_code=500,
            detail=f"Report template file missing: {filename}",
        )
    return path


def _safe_filename(text: str) -> str:
    """Strip characters that are unsafe in a Content-Disposition filename."""
    return re.sub(r"[^A-Za-z0-9._-]+", "_", text).strip("_") or "Report"


def _fmt_date(value) -> str:
    return value.strftime("%d %b %Y") if value else ""


def _build_controls_context(audit_controls: list[AuditControl]) -> list[dict]:
    """Turn AuditControl rows into the dict rows the Word table loops over."""
    rows = []
    for idx, ac in enumerate(audit_controls, start=1):
        ctrl = ac.control  # master Controls row
        rows.append(
            {
                "sno": idx,
                "clause": ", ".join(ctrl.framework_rules or []) if ctrl else "",
                "control_id": ctrl.control_id if ctrl else "",
                "domain": (ctrl.control_domain or "") if ctrl else "",
                "description": ctrl.control_desc if ctrl else "",
                "status": ac.status or "",
                "auditor_notes": ac.auditor_notes or "",
                "evaluated_at": _fmt_date(ac.evaluated_at),
                "evidence": ", ".join(ctrl.primary_evidence or []) if ctrl else "",
                # ── Columns with no DB source yet (README "TBD") ──
                # Left blank so the auditor completes them in Word after download.
                "system": "",
                "risk": "",
                "cia": "",
                "test_cases": "",
                "root_cause": "",
                "impact": "",
                "recommendations": "",
                "days": "",
                "mgmt_response": "",
                "similar_issue": "",
            }
        )
    return rows


def _build_summary(audit_controls: list[AuditControl]) -> dict:
    """Aggregate status counts for the report's executive summary."""
    total = len(audit_controls)
    counts: dict[str, int] = {}
    for ac in audit_controls:
        key = (ac.status or "Unknown").strip()
        counts[key] = counts.get(key, 0) + 1

    return {
        "total_controls": total,
        "status_counts": [
            {"status": status, "count": count}
            for status, count in sorted(counts.items())
        ],
    }


def _assert_can_generate(db: Session, user: User, framework: AuditFramework) -> None:
    """Authorisation for report generation.

    * admin   -> any framework
    * auditor -> only frameworks they work on. The app has TWO independent
                 notions of "auditor works on this audit", and they are not
                 kept in sync by the backend:
                   1. framework.assigned_auditors  (set by admin at audit creation)
                   2. audit_control.assigned_to    (set per control; this is what
                      the auditor UI uses to decide which audits to show)
                 Either one grants access, so an auditor can always generate the
                 report for any audit visible on their own dashboard.
    * client  -> never (reports are an auditor/admin deliverable, and a client
                 must not be able to pull another company's audit data)
    """
    if user.role == UserRole.ADMIN:
        return

    if user.role == UserRole.AUDITOR:
        if user.id in (framework.assigned_auditors or []):
            return

        owns_a_control = (
            db.query(AuditControl.id)
            .filter(
                AuditControl.framework_id == framework.id,
                AuditControl.assigned_to == user.id,
            )
            .first()
            is not None
        )
        if owns_a_control:
            return

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to generate a report for this audit.",
    )


def generate_report(db: Session, framework_id: str, current_user: User):
    """Main entry point.

    Fetches data, renders the template, and returns an in-memory BytesIO
    buffer plus a suggested filename.
    """

    # ── 1. Fetch framework + company ──────────────────────────────
    framework = (
        db.query(AuditFramework).filter(AuditFramework.id == framework_id).first()
    )
    if not framework:
        raise HTTPException(status_code=404, detail="Audit Framework not found")

    _assert_can_generate(db, current_user, framework)

    company = db.query(Company).filter(Company.id == framework.company_id).first()

    # ── 2. Fetch all audit controls for this framework ────────────
    # Ordered the same way as the UI (audit_control_service) so the
    # report matches what the auditor sees on screen.
    audit_controls = (
        db.query(AuditControl)
        .join(Controls, AuditControl.control_id == Controls.id)
        .options(joinedload(AuditControl.control))
        .filter(AuditControl.framework_id == framework_id)
        .order_by(Controls.created_at.asc())
        .all()
    )

    if not audit_controls:
        raise HTTPException(
            status_code=400,
            detail="This audit framework has no controls to report on yet.",
        )

    # ── 3. Build template context ─────────────────────────────────
    summary = _build_summary(audit_controls)

    context = {
        "company_name": company.company_name if company else "N/A",
        "registration_no": company.registration_no if company else "",
        "audit_type": framework.audit_type,
        "audit_category": framework.audit_category or "",
        "audit_subcategory": framework.audit_subcategory or "",
        "audit_name": framework.audit_name,
        "target_fy": framework.target_fy,
        "audit_status": framework.status,
        "generated_date": datetime.now(timezone.utc).strftime("%B %d, %Y"),
        "total_controls": summary["total_controls"],
        "status_counts": summary["status_counts"],
        "controls": _build_controls_context(audit_controls),
    }

    # ── 4. Render ─────────────────────────────────────────────────
    template_path = _get_template_path(framework)
    try:
        doc = DocxTemplate(template_path)
        # autoescape=True is REQUIRED: control text can contain <, > or &
        # (e.g. "response time <24 hours"). Without it those characters are
        # written raw into the Word XML, which silently truncates the text and
        # drops every table row after it - with no error raised.
        doc.render(context, autoescape=True)
    except Exception as exc:  # jinja2 syntax errors, corrupt template, etc.
        raise HTTPException(
            status_code=500,
            detail=f"Failed to render report template: {exc}",
        )

    # ── 5. Save to in-memory buffer ───────────────────────────────
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    file_name = (
        f"{_safe_filename(context['company_name'])}_"
        f"{_safe_filename(framework.audit_name)}_Report.docx"
    )
    return buffer, file_name