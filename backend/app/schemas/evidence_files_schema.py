from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class PresignRequest(BaseModel):
    file_name: str
    mime_type: Optional[str] = None


class PresignResponse(BaseModel):
    upload_url: str
    storage_key: str
    evidence_item_id: str


class EvidenceItemConfirm(BaseModel):
    """Sent after the client has PUT the file to the presigned URL."""
    file_name: str
    storage_key: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None

    uploaded_by: str
    company_id: str
    # Control this upload was made from - used to also create the direct
    # link immediately, in addition to whatever auto-linking runs.
    audit_control_id: Optional[str] = None


class EvidenceItemUpdate(BaseModel):
    file_name: Optional[str] = None

    ai_notes: Optional[str] = None
    auditor_notes: Optional[str] = None
    status: Optional[str] = None
    reviewed_by: Optional[str] = None


class EvidenceItemUserResponse(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class EvidenceItemResponse(BaseModel):
    id: str
    file_name: str
    storage_key: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    ai_notes: Optional[str] = None
    auditor_notes: Optional[str] = None
    status: str
    company_id: str

    uploaded_by: str
    user: Optional[EvidenceItemUserResponse] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditControlEvidenceLink(BaseModel):
    audit_control_id: str
    evidence_item_id: str
    linked_by_user: Optional[str] = None


class AuditControlEvidenceResponse(BaseModel):
    id: str
    audit_control_id: str
    evidence_item_id: str
    linked_by_type: str
    linked_by_user: Optional[str] = None
    linked_at: datetime
    evidence_item: Optional[EvidenceItemResponse] = None

    class Config:
        from_attributes = True