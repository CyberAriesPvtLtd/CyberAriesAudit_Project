from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.audit_control import AuditControl
from app.models.user import User
from app.models.controls import Controls
from app.models.audit_framework import AuditFramework


def create_audit_control(db: Session, audit_control_data):

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
    return db.query(AuditControl).all()


def get_audit_control_by_id(db: Session, audit_control_id: str):

    audit_control = db.query(AuditControl).filter(
        AuditControl.id == audit_control_id
    ).first()

    if not audit_control:
        raise HTTPException(
            status_code=404,
            detail="Audit Control not found"
        )

    return audit_control


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

    return {
        "message": "Audit Control deleted successfully"
    }