from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str
    email: str
    username: str
    password: str
    role: UserRole
    company_id: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str = Field(validation_alias="email_id")
    username: str
    role: UserRole
    company_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None


class UserAdminCompanyUpdate(BaseModel):
    company_id: Optional[str] = None
