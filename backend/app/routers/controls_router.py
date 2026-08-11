from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database_dependency import get_db

from app.schemas.controls_schema import (
    ControlsCreate,
    ControlsResponse,
    ControlsUpdate,
)

from app.services.controls_service import (
    create_control,
    get_all_controls,
    get_control_by_id,
    update_control,
    delete_control,
)

router = APIRouter(
    prefix="/controls",
    tags=["Controls"]
)


@router.post("/", response_model=ControlsResponse)
def add_control(
    control: ControlsCreate,
    db: Session = Depends(get_db)
):
    return create_control(db, control)


@router.get("/", response_model=list[ControlsResponse])
def fetch_controls(
    audit_type: str | None = None,
    audit_category: str | None = None,
    audit_subcategory: str | None = None,
    db: Session = Depends(get_db),
):
    return get_all_controls(db, audit_type, audit_category, audit_subcategory)


@router.put("/{id}", response_model=ControlsResponse)
def edit_control(
    id: str,
    control: ControlsUpdate,
    db: Session = Depends(get_db)
):
    return update_control(
        db,
        id,
        control
    )


@router.delete("/{id}")
def remove_control(
    id: str,
    db: Session = Depends(get_db)
):
    return delete_control(
        db,
        id
    )
