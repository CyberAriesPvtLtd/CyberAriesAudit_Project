from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database_dependency import get_db

from app.schemas.evidence_files_schema import (
    PresignRequest,
    PresignResponse,
    EvidenceItemConfirm,
    EvidenceItemUpdate,
    EvidenceItemResponse,
    AuditControlEvidenceLink,
    AuditControlEvidenceResponse,
)

from app.services.evidence_files_service import (
    create_presigned_upload,
    confirm_evidence_upload,
    get_company_evidence,
    get_evidence_for_audit_control,
    manually_link_evidence,
    unlink_evidence,
    update_evidence_item,
    delete_evidence_item,
)

router = APIRouter(
    prefix="/evidence-files",
    tags=["Evidence Files"]
)


@router.post("/presign", response_model=PresignResponse)
def presign_evidence_upload(
    company_id: str,
    payload: PresignRequest,
    db: Session = Depends(get_db)
):
    """
    Step 1: client asks for a URL to upload directly to MinIO. Returns the
    storage_key to send back in the confirm step below.
    """
    evidence_item_id, storage_key, upload_url = create_presigned_upload(
        db, company_id, payload.file_name, payload.mime_type
    )
    return PresignResponse(
        upload_url=upload_url, storage_key=storage_key, evidence_item_id=evidence_item_id
    )


@router.post("/confirm/{evidence_item_id}")
def confirm_upload(
    evidence_item_id: str,
    payload: EvidenceItemConfirm,
    db: Session = Depends(get_db)
):
    """
    Step 2: client confirms the file was PUT to MinIO successfully. Creates
    the EvidenceItem row and runs the auto-link logic across matching
    AuditControl rows in the same company.
    """
    return confirm_evidence_upload(db, evidence_item_id, payload)


@router.get("/company/{company_id}", response_model=list[EvidenceItemResponse])
def fetch_company_evidence(
    company_id: str,
    db: Session = Depends(get_db)
):
    """The company's evidence library, for the 'reuse existing evidence?' picker."""
    return get_company_evidence(db, company_id)


@router.get("/audit-control/{audit_control_id}", response_model=list[AuditControlEvidenceResponse])
def fetch_evidence_for_audit_control(
    audit_control_id: str,
    db: Session = Depends(get_db)
):
    return get_evidence_for_audit_control(db, audit_control_id)


@router.post("/link", response_model=AuditControlEvidenceResponse)
def link_evidence(
    payload: AuditControlEvidenceLink,
    db: Session = Depends(get_db)
):
    """Manually attach an existing evidence item to an audit control -
    for cases the auto-linker doesn't catch."""
    return manually_link_evidence(db, payload)


@router.delete("/link/{audit_control_evidence_id}")
def remove_evidence_link(
    audit_control_evidence_id: str,
    db: Session = Depends(get_db)
):
    return unlink_evidence(db, audit_control_evidence_id)


@router.put("/{evidence_item_id}", response_model=EvidenceItemResponse)
def edit_evidence_item(
    evidence_item_id: str,
    payload: EvidenceItemUpdate,
    db: Session = Depends(get_db)
):
    return update_evidence_item(db, evidence_item_id, payload)


@router.delete("/{evidence_item_id}")
def remove_evidence_item(
    evidence_item_id: str,
    db: Session = Depends(get_db)
):
    return delete_evidence_item(db, evidence_item_id)