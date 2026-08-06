from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.controls import Controls


def create_control(db: Session, control_data):
    existing_control = db.query(Controls).filter(Controls.control_id == control_data.control_id).first()

    if existing_control:
        raise HTTPException(
            status_code=400,
            detail=f"Control '{control_data.control_id}' already exists."
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
        Controls.control_id,
    ).all()


def get_control_by_id(db: Session, db_id: str):

    control = db.query(Controls).filter(
        Controls.id == db_id
    ).first()

    if not control:
        raise HTTPException(
            status_code=404,
            detail="Control not found"
        )

    return control


def update_control(
    db: Session,
    db_id: str,
    control_data
):

    control = db.query(Controls).filter(
        Controls.id == db_id
    ).first()

    if not control:
        raise HTTPException(
            status_code=404,
            detail="Control not found"
        )

    update_dict = control_data.model_dump(exclude_unset=True)

    # Re-check uniqueness if control_id is changing.
    if "control_id" in update_dict and update_dict["control_id"] != control.control_id:
        if db.query(Controls).filter(Controls.control_id == update_dict["control_id"]).first():
            raise HTTPException(
                status_code=400,
                detail="Another control with this control_id already exists."
            )

    for key, value in update_dict.items():
        setattr(control, key, value)

    db.commit()
    db.refresh(control)

    return control


def delete_control(
    db: Session,
    db_id: str
):

    control = db.query(Controls).filter(
        Controls.id == db_id
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