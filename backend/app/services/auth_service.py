from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth_schema import LoginRequest, ChangePasswordRequest
from app.utils.security import verify_password, get_password_hash, create_access_token
from app.schemas.auth_schema import LoginResponse

def authenticate_user(db: Session, login_data: LoginRequest) -> LoginResponse:
    # Try username first, then fall back to email
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user:
        user = db.query(User).filter(User.email_id == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})
    
    return LoginResponse(
        access_token=access_token,
        user=user,
        must_change_password=user.must_change_password
    )

def change_user_password(db: Session, user_id: str, password_data: ChangePasswordRequest):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if not verify_password(password_data.current_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
        
    user.password = get_password_hash(password_data.new_password)
    user.must_change_password = False
    
    db.commit()
    db.refresh(user)
    
    return {"message": "Password updated successfully", "must_change_password": user.must_change_password}
