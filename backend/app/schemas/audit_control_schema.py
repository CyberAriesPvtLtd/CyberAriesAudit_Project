from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.controls_schema import ControlsResponse


class AuditControlCreate(BaseModel):
    status: str
    assigned_to: Optional[str] = None
    auditor_notes: Optional[str] = None
    evaluated_at: Optional[datetime] = None
    framework_id: str
    control_id: str


class AuditControlUpdate(BaseModel):
    status: str
    assigned_to: Optional[str] = None
    auditor_notes: Optional[str] = None
    evaluated_at: Optional[datetime] = None


class AuditControlAdminReassign(BaseModel):
    assigned_to: str


class AuditControlResponse(BaseModel):
    id: str
    status: str
    assigned_to: Optional[str] = None
    auditor_notes: Optional[str] = None
    evaluated_at: Optional[datetime] = None
    framework_id: str
    control_id: str
    created_at: datetime
    control: Optional[ControlsResponse] = None

    class Config:
        from_attributes = True