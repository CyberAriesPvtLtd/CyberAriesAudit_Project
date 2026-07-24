from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.controls import Controls


def create_control(db: Session, control_data):

    existing_control = db.query(Controls).filter(
        Controls.control_code == control_data.control_code
    ).first()

    if existing_control:
        raise HTTPException(
            status_code=400,
            detail="Control Code already exists"
        )

    control = Controls(
        control_code=control_data.control_code,
        control_desc=control_data.control_desc,
        audit_category=control_data.audit_category,
        audit_subcategory=control_data.audit_subcategory,
        audit_type=control_data.audit_type
    )

    db.add(control)
    db.commit()
    db.refresh(control)

    return control


def get_all_controls(db: Session):
    return db.query(Controls).all()


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

    update_dict = control_data.model_dump(exclude_unset = True)

    for key,value in update_dict.items():
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