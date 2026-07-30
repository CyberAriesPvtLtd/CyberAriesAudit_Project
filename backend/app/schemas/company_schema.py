from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CompanyCreate(BaseModel):
    company_name: str
    registration_no: str

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    registration_no: Optional[str] = None

class CompanyResponse(BaseModel):
    id: str
    company_name: str
    registration_no: str
    created_at: datetime

    class Config:
        from_attributes = True