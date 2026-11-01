from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone

from app.models.audit_control import AuditControl
from app.models.user import User
from app.models.controls import Controls
from app.models.audit_framework import AuditFramework


def create_audit_control(db: Session, audit_control_data):

    if audit_control_data.assigned_to:
        user = db.query(User).filter(
            User.id == audit_control_data.assigned_to
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

    framework = db.query(AuditFramework).filter(
        AuditFramework.id == audit_control_data.framework_id
    ).first()

    if not framework:
        raise HTTPException(
            status_code=404,
            detail="Audit Framework not found"
        )

    control = db.query(Controls).filter(
        Controls.id == audit_control_data.control_id
    ).first()

    if not control:
        raise HTTPException(
            status_code=404,
            detail="Control not found"
        )

    audit_control = AuditControl(
        status=audit_control_data.status,
        assigned_to=audit_control_data.assigned_to,
        auditor_notes=audit_control_data.auditor_notes,
        evaluated_at=audit_control_data.evaluated_at,
        framework_id=audit_control_data.framework_id,
        control_id=audit_control_data.control_id
    )

    db.add(audit_control)
    db.commit()
    db.refresh(audit_control)

    return audit_control


def get_all_audit_controls(db: Session):
    return db.query(AuditControl).options(joinedload(AuditControl.control)).all()


def get_audit_control_by_id(db: Session, audit_control_id: str):

    audit_control = db.query(AuditControl).filter(
        AuditControl.id == audit_control_id
    ).options(joinedload(AuditControl.control)).first()

    if not audit_control:
        raise HTTPException(
            status_code=404,
            detail="Audit Control not found"
        )

    return audit_control


def get_audit_controls_by_framework(db: Session, framework_id: str):
    return db.query(AuditControl).join(Controls, AuditControl.control_id == Controls.id).filter(
        AuditControl.framework_id == framework_id
    ).options(joinedload(AuditControl.control)).order_by(Controls.created_at.asc()).all()


def update_audit_control(
    db: Session,
    audit_control_id: str,
    audit_control_data
):

    audit_control = db.query(AuditControl).filter(
        AuditControl.id == audit_control_id
    ).first()

    if not audit_control:
        raise HTTPException(
            status_code=404,
            detail="Audit Control not found"
        )

    update_dict = audit_control_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        setattr(audit_control, key, value)

    db.commit()
    db.refresh(audit_control)

    return audit_control


def delete_audit_control(
    db: Session,
    audit_control_id: str
):

    audit_control = db.query(AuditControl).filter(
        AuditControl.id == audit_control_id
    ).first()

    if not audit_control:
        raise HTTPException(
            status_code=404,
            detail="Audit Control not found"
        )

    db.delete(audit_control)
    db.commit()

    return None


def evaluate_audit_control(
    db: Session,
    audit_control_id: str,
    evaluation_data,
    current_user = None
):
    """
    Auditor evaluates a control — sets compliance_status, risk_rating,
    and optionally the non-compliance fields (root_cause, impact, etc.).
    """
    audit_control = db.query(AuditControl).filter(
        AuditControl.id == audit_control_id
    ).options(joinedload(AuditControl.control)).first()

    if not audit_control:
        raise HTTPException(
            status_code=404,
            detail="Audit Control not found"
        )

    # Verify the auditor is actually assigned to this control
    if audit_control.assigned_to != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not assigned to this control."
        )

    # Apply all provided evaluation fields
    update_dict = evaluation_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(audit_control, key, value)

    # Auto-set timestamp and workflow status
    audit_control.evaluated_at = datetime.now(timezone.utc)
    if evaluation_data.compliance_status:
        audit_control.status = "Completed"

    db.commit()
    db.refresh(audit_control)

    return audit_control


def synthesize_control_ai(
    db: Session,
    audit_control_id: str,
    raw_note: str,
    compliance_status: str,
    current_user = None
):
    audit_control = db.query(AuditControl).filter(
        AuditControl.id == audit_control_id
    ).options(joinedload(AuditControl.control)).first()

    if not audit_control:
        raise HTTPException(
            status_code=404,
            detail="Audit Control not found"
        )

    # In AI Copilot drafting assistance mode, generate findings for the control without blocking

    control = audit_control.control
    control_id = getattr(control, "control_id", "CONTROL") if control else "CONTROL"
    control_name = getattr(control, "control_name", "Cybersecurity Control") if control else "Cybersecurity Control"
    control_requirement = getattr(control, "control_desc", None) or getattr(control, "name", None) or "SEBI CSCRF compliance baseline requirement."

    from app.services.ai_service import ai_service
    synthesis = ai_service.synthesize_control_evaluation(
        control_id=control_id,
        control_name=control_name,
        control_requirement=control_requirement,
        compliance_status=compliance_status,
        raw_note=raw_note
    )

    # Persist the synthesized note into audit_control.ai_notes
    if synthesis.get("report_note"):
        audit_control.ai_notes = synthesis["report_note"]
        db.commit()
        db.refresh(audit_control)

    return {
        "success": True,
        "control_id": control_id,
        "compliance_status": compliance_status,
        "report_note": synthesis.get("report_note", ""),
        "root_cause_analysis": synthesis.get("root_cause_analysis"),
        "impact_analysis": synthesis.get("impact_analysis"),
        "recommendation": synthesis.get("recommendation"),
        "remediation_days": synthesis.get("remediation_days"),
        "is_mock": synthesis.get("is_mock", False)
    }
