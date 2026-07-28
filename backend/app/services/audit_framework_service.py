from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.audit_framework import AuditFramework
from app.models.company import Company


def create_audit_framework(db: Session, audit_data):

    company = db.query(Company).filter(
        Company.id == audit_data.companyID
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
        companyID=audit_data.companyID
    )

    db.add(audit_framework)
    db.commit()
    db.refresh(audit_framework)

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

    for key,value in update_dict.items():
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