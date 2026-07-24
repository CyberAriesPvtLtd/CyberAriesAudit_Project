from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database_dependency import get_db

from app.schemas.evidence_files_schema import (
    EvidenceFilesCreate,
    EvidenceFilesUpdate,
    EvidenceFilesResponse,
)

from app.services.evidence_files_service import (
    create_evidence_file,
    get_all_evidence_files,
    get_evidence_file_by_id,
    update_evidence_file,
    delete_evidence_file,
)

router = APIRouter(
    prefix="/evidence-files",
    tags=["Evidence Files"]
)


@router.post("/", response_model=EvidenceFilesResponse)
def add_evidence_file(
    evidence: EvidenceFilesCreate,
    db: Session = Depends(get_db)
):
    return create_evidence_file(db, evidence)


@router.get("/", response_model=list[EvidenceFilesResponse])
def fetch_evidence_files(
    db: Session = Depends(get_db)
):
    return get_all_evidence_files(db)


@router.get("/{evidence_id}", response_model=EvidenceFilesResponse)
def fetch_evidence_file(
    evidence_id: str,
    db: Session = Depends(get_db)
):
    return get_evidence_file_by_id(
        db,
        evidence_id
    )


@router.put("/{evidence_id}", response_model=EvidenceFilesResponse)
def edit_evidence_file(
    evidence_id: str,
    evidence: EvidenceFilesUpdate,
    db: Session = Depends(get_db)
):
    return update_evidence_file(
        db,
        evidence_id,
        evidence
    )


@router.delete("/{evidence_id}")
def remove_evidence_file(
    evidence_id: str,
    db: Session = Depends(get_db)
):
    return delete_evidence_file(
        db,
        evidence_id
    )