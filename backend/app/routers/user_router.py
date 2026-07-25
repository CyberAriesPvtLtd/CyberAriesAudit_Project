from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database_dependency import get_db
from app.schemas.user_schema import (
    UserCreate,
    UserResponse,
    UserUpdate,
)

from app.services.user_service import (
    create_user,
    get_all_users,
    get_user_by_id,
    update_user,
    delete_user,
)

router = APIRouter(
    prefix="/user",
    tags=["User"]
)


@router.post("/", response_model=UserResponse)
def add_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    return create_user(db, user)


@router.get("/", response_model=list[UserResponse])
def fetch_users(
    db: Session = Depends(get_db)
):
    return get_all_users(db)


@router.get("/{user_id}", response_model=UserResponse)
def fetch_user(
    user_id: str,
    db: Session = Depends(get_db)
):
    return get_user_by_id(db, user_id)


@router.put("/{user_id}", response_model=UserResponse)
def edit_user(
    user_id: str,
    user: UserUpdate,
    db: Session = Depends(get_db)
):
    return update_user(db, user_id, user)


@router.delete("/{user_id}")
def remove_user(
    user_id: str,
    db: Session = Depends(get_db)
):
    return delete_user(db, user_id)