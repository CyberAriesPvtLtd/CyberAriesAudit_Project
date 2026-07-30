from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database_dependency import get_db
from app.schemas.auth_schema import LoginRequest, LoginResponse, ChangePasswordRequest
from app.services.auth_service import authenticate_user, change_user_password

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    return authenticate_user(db, login_data)

@router.put("/change-password/{user_id}")
def change_password(user_id: str, password_data: ChangePasswordRequest, db: Session = Depends(get_db)):
    return change_user_password(db, user_id, password_data)
