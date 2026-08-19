from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.audit_framework import AuditFramework
from app.models.company import Company
from app.models.controls import Controls
from app.models.audit_control import AuditControl
from app.models.controls_evidence_type import ControlsEvidenceType
from app.models.evidence_files import EvidenceItem
from app.services.evidence_files_service import _link_evidence_to_control


def create_audit_framework(db: Session, audit_data):

    company = db.query(Company).filter(
        Company.id == audit_data.company_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    audit_framework = AuditFramework(
        audit_type=audit_data.audit_type,
        audit_category=audit_data.audit_category,
        audit_subcategory=audit_data.audit_subcategory,
        audit_name=audit_data.audit_name,
        target_fy=audit_data.target_fy,
        status=audit_data.status,
        company_id=audit_data.company_id,
        assigned_auditors=audit_data.assigned_auditors
    )

    db.add(audit_framework)
    db.commit()
    db.refresh(audit_framework)

    matching_controls = (
        db.query(Controls)
        .filter(
            Controls.audit_type == audit_framework.audit_type,
            Controls.audit_category == audit_framework.audit_category,
            Controls.audit_subcategory == audit_framework.audit_subcategory
        )
        .all()
    )

    new_audit_controls = []
    for control in matching_controls:
        audit_control = AuditControl(
            framework_id=audit_framework.id,
            control_id=control.id,
            status="Pending",
            assigned_to=None,
            auditor_notes=None,
            evaluated_at=None
        )

        db.add(audit_control)
        new_audit_controls.append((audit_control, control))

    db.commit()

    # Pre-link existing evidence: if this company already has evidence on
    # file that satisfies one of this new audit's controls (via a shared
    # EvidenceType), attach it immediately - so a newly started audit can
    # show some requirements already met from day one, instead of asking
    # the client to re-upload something they submitted for another audit.
    for audit_control, control in new_audit_controls:
        required_type_ids = [
            row.evidence_type_id for row in
            db.query(ControlsEvidenceType)
            .filter(ControlsEvidenceType.control_id == control.id)
            .all()
        ]
        if not required_type_ids:
            continue

        existing_evidence = (
            db.query(EvidenceItem)
            .filter(
                EvidenceItem.company_id == audit_data.company_id,
                EvidenceItem.evidence_type_id.in_(required_type_ids),
            )
            .all()
        )
        for evidence in existing_evidence:
            _link_evidence_to_control(
                db, evidence.id, audit_control.id,
                linked_by_type="auto", linked_by_user=None,
            )

    db.commit()

    return audit_framework


def get_all_audit_frameworks(db: Session):
    return db.query(AuditFramework).all()


def get_audit_framework_by_id(db: Session, audit_framework_id: str):

    audit_framework = db.query(AuditFramework).filter(
        AuditFramework.id == audit_framework_id
    ).first()

    if not audit_framework:
        raise HTTPException(
            status_code=404,
            detail="Audit Framework not found"
        )

    return audit_framework


def update_audit_framework(
    db: Session,
    audit_framework_id: str,
    audit_data
):

    audit_framework = db.query(AuditFramework).filter(
        AuditFramework.id == audit_framework_id
    ).first()

    if not audit_framework:
        raise HTTPException(
            status_code=404,
            detail="Audit Framework not found"
        )

    update_dict = audit_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        setattr(audit_framework, key, value)

    db.commit()
    db.refresh(audit_framework)

    return audit_framework


def delete_audit_framework(
    db: Session,
    audit_framework_id: str
):

    audit_framework = db.query(AuditFramework).filter(
        AuditFramework.id == audit_framework_id
    ).first()

    if not audit_framework:
        raise HTTPException(
            status_code=404,
            detail="Audit Framework not found"
        )

    db.delete(audit_framework)
    db.commit()

    return {
        "message": "Audit Framework deleted successfully"
    }