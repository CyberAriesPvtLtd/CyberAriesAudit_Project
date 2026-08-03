from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.controls import Controls


def _scoped_query(db: Session, control_data, exclude_id: str = None):
    """
    Application-level duplicate guard.

    The database enforces uniqueness on `id` only - control_code is not unique
    at any scope, because seven CSCRF codes appear in both the PMS and AIF
    sheets. This check is the only thing preventing an accidental double-POST
    from putting the same question twice on an auditor's checklist.

    It is advisory, not a constraint. Delete the raise in create_control if you
    want the endpoint to accept duplicates freely.
    """
    query = db.query(Controls).filter(
        Controls.control_code == control_data.control_code,
        Controls.audit_type == control_data.audit_type,
        Controls.audit_category == control_data.audit_category,
        Controls.audit_subcategory == control_data.audit_subcategory,
    )
    if exclude_id is not None:
        query = query.filter(Controls.id != exclude_id)
    return query


def create_control(db: Session, control_data):

    existing_control = _scoped_query(db, control_data).first()

    if existing_control:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Control '{control_data.control_code}' already exists for "
                f"{control_data.audit_type} / {control_data.audit_category} / "
                f"{control_data.audit_subcategory}"
            ),
        )

    control = Controls(**control_data.model_dump())

    db.add(control)
    db.commit()
    db.refresh(control)

    return control


def get_all_controls(
    db: Session,
    audit_type: str = None,
    audit_category: str = None,
    audit_subcategory: str = None,
):
    query = db.query(Controls)

    if audit_type:
        query = query.filter(Controls.audit_type == audit_type)
    if audit_category:
        query = query.filter(Controls.audit_category == audit_category)
    if audit_subcategory:
        query = query.filter(Controls.audit_subcategory == audit_subcategory)

    return query.order_by(
        Controls.audit_category,
        Controls.sr_no,
    ).all()


def get_control_by_id(db: Session, control_id: str):

    control = db.query(Controls).filter(
        Controls.id == control_id
    ).first()

    if not control:
        raise HTTPException(
            status_code=404,
            detail="Control not found"
        )

    return control


def update_control(
    db: Session,
    control_id: str,
    control_data
):

    control = db.query(Controls).filter(
        Controls.id == control_id
    ).first()

    if not control:
        raise HTTPException(
            status_code=404,
            detail="Control not found"
        )

    update_dict = control_data.model_dump(exclude_unset=True)

    # Re-check the scoped uniqueness if any part of the key is changing.
    key_fields = (
        "control_code",
        "audit_type",
        "audit_category",
        "audit_subcategory",
    )
    if any(field in update_dict for field in key_fields):
        candidate = type(
            "ScopeCheck",
            (),
            {field: update_dict.get(field, getattr(control, field)) for field in key_fields},
        )
        if _scoped_query(db, candidate, exclude_id=control_id).first():
            raise HTTPException(
                status_code=400,
                detail="Another control with this code already exists in that scope",
            )

    for key, value in update_dict.items():
        setattr(control, key, value)

    db.commit()
    db.refresh(control)

    return control


def delete_control(
    db: Session,
    control_id: str
):

    control = db.query(Controls).filter(
        Controls.id == control_id
    ).first()

    if not control:
        raise HTTPException(
            status_code=404,
            detail="Control not found"
        )

    db.delete(control)
    db.commit()

    return {
        "message": "Control deleted successfully"
    }