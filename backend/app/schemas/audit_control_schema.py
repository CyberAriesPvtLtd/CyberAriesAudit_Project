from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditControlCreate(BaseModel):
    status: str
    assigned_to: str
    auditor_notes: Optional[str] = None
    evaluated_at: Optional[datetime] = None
    framework_id: str
    control_id: str


class AuditControlUpdate(BaseModel):
    status: str
    auditor_notes: Optional[str] = None
    evaluated_at: Optional[datetime] = None

class AuditControlAdminReassign(BaseModel):
    assigned_to: str

class AuditControlResponse(BaseModel):
    id: str
    status: str
    assigned_to: str
    auditor_notes: Optional[str]
    evaluated_at: Optional[datetime]
    framework_id: str
    control_id: str
    created_at: datetime

    class Config:
        from_attributes = True