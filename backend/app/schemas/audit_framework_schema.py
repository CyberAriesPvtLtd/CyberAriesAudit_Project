from pydantic import BaseModel
from typing import Optional

class AuditFrameworkCreate(BaseModel):
    audit_type: str
    audit_category: str
    audit_subcategory: str
    audit_name: str
    target_fy: str
    status: str
    companyID: str


class AuditFrameworkResponse(BaseModel):
    id: str
    audit_type: str
    audit_category: str
    audit_subcategory: str
    audit_name: str
    target_fy: str
    status: str
    companyID: str

    class Config:
        from_attributes = True


class AuditFrameworkUpdate(BaseModel):
    audit_type: Optional[str] = None
    audit_category: Optional[str] = None
    audit_subcategory: Optional[str] = None
    audit_name: Optional[str] = None
    target_fy: Optional[str] = None

class AuditFramworkStatusOverride(BaseModel):
    status: str # only admin / auditor has the access to update the status