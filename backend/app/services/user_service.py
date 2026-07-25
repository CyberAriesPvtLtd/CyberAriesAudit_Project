import bcrypt
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.company import Company


def hash_password(password: str):
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def create_user(db: Session, user_data):

    existing_user = db.query(User).filter(
        User.username == user_data.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    company = db.query(Company).filter(
        Company.id == user_data.company_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    user = User(
        name=user_data.name,
        username=user_data.username,
        password=hash_password(user_data.password),
        role=user_data.role,
        companyID=user_data.company_id
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_all_users(db: Session):
    return db.query(User).all()


def get_user_by_id(db: Session, user_id: str):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


def update_user(db: Session, user_id: str, user_data):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    update_dict = user_data.model_dump(exclude_unset=True)

    if "password" in update_dict:
        update_dict["password"] = hash_password(update_dict["password"])

    for key,value in update_dict.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return user


def delete_user(db: Session, user_id: str):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return {
        "message": "User deleted successfully"
    }