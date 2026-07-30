from pydantic import BaseModel
from app.schemas.user_schema import UserResponse

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    must_change_password: bool

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
