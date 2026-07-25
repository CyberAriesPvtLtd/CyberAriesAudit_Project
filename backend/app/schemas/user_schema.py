from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: str
    username: str
    password: str
    role: str
    company_id: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    username: str
    role: str
    company_id: str

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None