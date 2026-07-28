from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.evidence_files import EvidenceFiles
from app.models.user import User
from app.models.audit_control import AuditControl


def create_evidence_file(db: Session, evidence_data):

    user = db.query(User).filter(
        User.id == evidence_data.uploaded_by
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    audit_control = db.query(AuditControl).filter(
        AuditControl.id == evidence_data.audit_control_id
    ).first()

    if not audit_control:
        raise HTTPException(
            status_code=404,
            detail="Audit Control not found"
        )

    evidence = EvidenceFiles(
        file_name=evidence_data.file_name,
        file_url=evidence_data.file_url,
        ai_notes=evidence_data.ai_notes,
        auditor_notes=evidence_data.auditor_notes,
        status=evidence_data.status,
        uploaded_by=evidence_data.uploaded_by,
        audit_control_id=evidence_data.audit_control_id
    )

    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    return evidence


def get_all_evidence_files(db: Session):
    return db.query(EvidenceFiles).all()


def get_evidence_file_by_id(
    db: Session,
    evidence_id: str
):

    evidence = db.query(EvidenceFiles).filter(
        EvidenceFiles.id == evidence_id
    ).first()

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Evidence File not found"
        )

    return evidence


def update_evidence_file(
    db: Session,
    evidence_id: str,
    evidence_data
):

    evidence = db.query(EvidenceFiles).filter(
        EvidenceFiles.id == evidence_id
    ).first()

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Evidence File not found"
        )

    update_dict = evidence_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        setattr(evidence, key, value)

    db.commit()
    db.refresh(evidence)

    return evidence


def delete_evidence_file(
    db: Session,
    evidence_id: str
):

    evidence = db.query(EvidenceFiles).filter(
        EvidenceFiles.id == evidence_id
    ).first()

    if not evidence:
        raise HTTPException(
            status_code=404,
            detail="Evidence File not found"
        )

    db.delete(evidence)
    db.commit()

    return {
        "message": "Evidence File deleted successfully"
    }