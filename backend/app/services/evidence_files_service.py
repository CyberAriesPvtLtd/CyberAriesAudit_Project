from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.evidence_files import EvidenceItem
from app.models.audit_control_evidence import AuditControlEvidence
from app.models.audit_control import AuditControl
from app.models.controls_evidence_type import ControlsEvidenceType
from app.models.user import User
from app.models.company import Company
from app.services import storage_service
from app.utils.nanoid import generate_evidence_file_id


def create_presigned_upload(db: Session, company_id: str, file_name: str, mime_type: str | None):
    """
    Step 1 of upload: generate an id + storage key + presigned URL, before
    any bytes have moved. The EvidenceItem row itself is only created once
    the client confirms the upload succeeded (see confirm_evidence_upload).
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    evidence_item_id = generate_evidence_file_id()
    storage_key = storage_service.build_storage_key(company_id, evidence_item_id, file_name)
    upload_url = storage_service.get_presigned_upload_url(storage_key)

    return evidence_item_id, storage_key, upload_url


def confirm_evidence_upload(db: Session, evidence_item_id: str, data):
    """
    Step 2 of upload: the client has PUT the file to MinIO successfully and
    now confirms it. Creates the EvidenceItem row, then runs the auto-link
    logic: any AuditControl (in the same company) whose Controls row
    requires this evidence_type_id gets automatically linked, in addition
    to whichever control the upload happened from.
    """
    user = db.query(User).filter(User.id == data.uploaded_by).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    company = db.query(Company).filter(Company.id == data.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if not storage_service.object_exists(data.storage_key):
        raise HTTPException(
            status_code=400,
            detail="Upload not found in storage. The presigned upload may have failed or expired."
        )

    evidence = EvidenceItem(
        id=evidence_item_id,
        file_name=data.file_name,
        storage_key=data.storage_key,
        file_size=data.file_size,
        mime_type=data.mime_type,
        status="Pending Review",
        company_id=data.company_id,
        evidence_type_id=data.evidence_type_id,
        uploaded_by=data.uploaded_by,
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)

    links_created = []

    # Link 1: the control the client was uploading from (if given), always
    # linked directly regardless of evidence_type_id.
    if data.audit_control_id:
        links_created.append(
            _link_evidence_to_control(
                db, evidence.id, data.audit_control_id,
                linked_by_type="manual", linked_by_user=data.uploaded_by,
            )
        )

    # Link 2 (the reuse feature): auto-link every OTHER AuditControl in this
    # company whose Controls row requires the same evidence_type_id.
    if data.evidence_type_id:
        matching_control_ids = (
            db.query(ControlsEvidenceType.control_id)
            .filter(ControlsEvidenceType.evidence_type_id == data.evidence_type_id)
            .subquery()
        )
        matching_audit_controls = (
            db.query(AuditControl)
            .join(AuditControl.audit_framework)
            .filter(
                AuditControl.control_id.in_(matching_control_ids),
                AuditControl.audit_framework.has(company_id=data.company_id),
            )
            .all()
        )
        for ac in matching_audit_controls:
            if ac.id == data.audit_control_id:
                continue  # already linked above
            links_created.append(
                _link_evidence_to_control(
                    db, evidence.id, ac.id,
                    linked_by_type="auto", linked_by_user=None,
                )
            )

    db.commit()

    return {
        "evidence": evidence,
        "linked_audit_control_ids": [l.audit_control_id for l in links_created if l],
    }


def _link_evidence_to_control(db: Session, evidence_item_id: str, audit_control_id: str,
                               linked_by_type: str, linked_by_user):
    """Idempotent: does nothing if this exact link already exists."""
    existing = (
        db.query(AuditControlEvidence)
        .filter(
            AuditControlEvidence.evidence_item_id == evidence_item_id,
            AuditControlEvidence.audit_control_id == audit_control_id,
        )
        .first()
    )
    if existing:
        return existing

    link = AuditControlEvidence(
        audit_control_id=audit_control_id,
        evidence_item_id=evidence_item_id,
        linked_by_type=linked_by_type,
        linked_by_user=linked_by_user,
    )
    db.add(link)
    db.flush()
    return link


def get_company_evidence(db: Session, company_id: str):
    """The company's full evidence library - used by the frontend's
    'you already have this evidence, reuse it?' picker."""
    return (
        db.query(EvidenceItem)
        .filter(EvidenceItem.company_id == company_id)
        .order_by(EvidenceItem.created_at.desc())
        .all()
    )


def get_evidence_for_audit_control(db: Session, audit_control_id: str):
    return (
        db.query(AuditControlEvidence)
        .options(joinedload(AuditControlEvidence.evidence_item))
        .filter(AuditControlEvidence.audit_control_id == audit_control_id)
        .all()
    )


def manually_link_evidence(db: Session, data):
    audit_control = db.query(AuditControl).filter(AuditControl.id == data.audit_control_id).first()
    if not audit_control:
        raise HTTPException(status_code=404, detail="Audit Control not found")

    evidence = db.query(EvidenceItem).filter(EvidenceItem.id == data.evidence_item_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence Item not found")

    link = _link_evidence_to_control(
        db, data.evidence_item_id, data.audit_control_id,
        linked_by_type="manual", linked_by_user=data.linked_by_user,
    )
    db.commit()
    db.refresh(link)
    return link


def unlink_evidence(db: Session, audit_control_evidence_id: str):
    link = db.query(AuditControlEvidence).filter(
        AuditControlEvidence.id == audit_control_evidence_id
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    db.delete(link)
    db.commit()

    return {"message": "Evidence unlinked from this audit control"}


def update_evidence_item(db: Session, evidence_item_id: str, data):
    evidence = db.query(EvidenceItem).filter(EvidenceItem.id == evidence_item_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence Item not found")

    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(evidence, key, value)

    db.commit()
    db.refresh(evidence)
    return evidence


def delete_evidence_item(db: Session, evidence_item_id: str):
    evidence = db.query(EvidenceItem).filter(EvidenceItem.id == evidence_item_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence Item not found")

    storage_service.delete_object(evidence.storage_key)
    db.delete(evidence)  # cascades to audit_control_links
    db.commit()

    return {"message": "Evidence Item deleted successfully"}
