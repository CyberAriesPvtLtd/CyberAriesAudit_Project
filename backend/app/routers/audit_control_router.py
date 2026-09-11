from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.security import require_admin

from app.database_dependency import get_db

from app.schemas.audit_control_schema import (
    AuditControlCreate,
    AuditControlUpdate,
    AuditControlResponse,
)

from app.services.audit_control_service import (
    create_audit_control,
    get_all_audit_controls,
    get_audit_control_by_id,
    get_audit_controls_by_framework,
    update_audit_control,
    delete_audit_control,
)

router = APIRouter(
    prefix="/audit-control",
    tags=["Audit Control"]
)


@router.post("/", response_model=AuditControlResponse, dependencies=[Depends(require_admin)])
def add_audit_control(
    audit_control: AuditControlCreate,
    db: Session = Depends(get_db)
):
    return create_audit_control(db, audit_control)


@router.get("/", response_model=list[AuditControlResponse])
def fetch_audit_controls(
    db: Session = Depends(get_db)
):
    return get_all_audit_controls(db)


@router.get("/framework/{framework_id}", response_model=list[AuditControlResponse])
def fetch_audit_controls_by_framework(
    framework_id: str,
    db: Session = Depends(get_db)
):
    return get_audit_controls_by_framework(db, framework_id)


@router.get("/{audit_control_id}", response_model=AuditControlResponse)
def fetch_audit_control(
    audit_control_id: str,
    db: Session = Depends(get_db)
):
    return get_audit_control_by_id(
        db,
        audit_control_id
    )


@router.put("/{audit_control_id}", response_model=AuditControlResponse, dependencies=[Depends(require_admin)])
def edit_audit_control(
    audit_control_id: str,
    audit_control: AuditControlUpdate,
    db: Session = Depends(get_db)
):
    return update_audit_control(
        db,
        audit_control_id,
        audit_control
    )


@router.delete("/{audit_control_id}")
def remove_audit_control(
    audit_control_id: str,
    db: Session = Depends(get_db)
):
    return delete_audit_control(
        db,
        audit_control_id
    )