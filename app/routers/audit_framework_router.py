from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database_dependency import get_db

from app.schemas.audit_framework_schema import (
    AuditFrameworkCreate,
    AuditFrameworkResponse,
    AuditFrameworkUpdate,
)

from app.services.audit_framework_service import (
    create_audit_framework,
    get_all_audit_frameworks,
    get_audit_framework_by_id,
    update_audit_framework,
    delete_audit_framework,
)

router = APIRouter(
    prefix="/audit-framework",
    tags=["Audit Framework"]
)


@router.post("/", response_model=AuditFrameworkResponse)
def add_audit_framework(
    audit_framework: AuditFrameworkCreate,
    db: Session = Depends(get_db)
):
    return create_audit_framework(db, audit_framework)


@router.get("/", response_model=list[AuditFrameworkResponse])
def fetch_audit_frameworks(
    db: Session = Depends(get_db)
):
    return get_all_audit_frameworks(db)


@router.get("/{audit_framework_id}", response_model=AuditFrameworkResponse)
def fetch_audit_framework(
    audit_framework_id: str,
    db: Session = Depends(get_db)
):
    return get_audit_framework_by_id(db,audit_framework_id)


@router.put("/{audit_framework_id}", response_model=AuditFrameworkResponse)
def edit_audit_framework(
    audit_framework_id: str,
    audit_framework: AuditFrameworkUpdate,
    db: Session = Depends(get_db)
):
    return update_audit_framework(db,audit_framework_id,audit_framework)


@router.delete("/{audit_framework_id}")
def remove_audit_framework(
    audit_framework_id: str,
    db: Session = Depends(get_db)
):
    return delete_audit_framework(db,audit_framework_id)