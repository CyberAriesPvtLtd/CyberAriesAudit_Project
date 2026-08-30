from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
import shutil

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

from app.utils.seed_controls import seed_controls, CONTROLS_DIR

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


@router.post("/upload-excel")
def upload_controls_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload an Excel (.xlsx) file of controls.
    The file is saved to backend/app/data/controls/ and then parsed +
    seeded into the database. On future backend restarts, this file will
    be automatically re-seeded if the controls table is empty.
    """
    # Validate file extension
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx and .xls files are supported.",
        )

    # Ensure the controls directory exists
    CONTROLS_DIR.mkdir(parents=True, exist_ok=True)

    # Save the uploaded file
    dest = CONTROLS_DIR / file.filename
    try:
        with open(dest, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save file: {str(e)}",
        )

    # Run the seeder (processes ALL files in the directory, idempotent)
    try:
        result = seed_controls(db)
    except ValueError as e:
        # If parsing fails, remove the bad file so it doesn't block future seeds
        dest.unlink(missing_ok=True)
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse Excel file: {str(e)}",
        )

    return {
        "message": f"Successfully processed {file.filename}",
        "file_saved": str(dest.name),
        **result,
    }
