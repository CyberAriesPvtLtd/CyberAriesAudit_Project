from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EvidenceFilesCreate(BaseModel):
    file_name: str
    file_url: str
    ai_notes: Optional[str] = None
    auditor_notes: Optional[str] = None
    status: str
    uploaded_by: str
    audit_control_id: str


class EvidenceFilesUpdate(BaseModel):
    file_name: Optional[str] = None
    ai_notes: Optional[str] = None
    auditor_notes: Optional[str] = None
    status: Optional[str] = None


class EvidenceFilesResponse(BaseModel):
    id: str
    file_name: str
    file_url: str
    ai_notes: Optional[str]
    auditor_notes: Optional[str]
    status: str
    uploaded_by: str
    audit_control_id: str
    create_at: datetime

    class Config:
        from_attributes = True