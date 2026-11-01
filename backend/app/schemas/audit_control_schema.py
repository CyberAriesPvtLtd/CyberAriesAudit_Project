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


class AuditControlEvaluate(BaseModel):
    """Schema for auditor evaluation — all fields optional so partial saves work."""
    compliance_status: Optional[str] = None       # Compliant / Partially Compliant / Non-Compliant / Not Applicable
    risk_rating: Optional[str] = None             # Critical / High / Medium / Low
    similar_issue: Optional[bool] = None          # Yes / No
    root_cause_analysis: Optional[str] = None
    impact_analysis: Optional[str] = None
    recommendation: Optional[str] = None
    remediation_days: Optional[int] = None
    management_response: Optional[str] = None
    auditor_notes: Optional[str] = None
    ai_notes: Optional[str] = None


class AISynthesizeRequest(BaseModel):
    """Request payload to generate AI observation and report notes."""
    raw_note: Optional[str] = ""
    compliance_status: Optional[str] = "Non-Compliant"
    refresh_count: Optional[int] = 0


class AISynthesizeResponse(BaseModel):
    """Standardized AI observation output for all-in-one adoption."""
    success: bool
    control_id: str
    compliance_status: str
    report_note: str
    root_cause_analysis: Optional[str] = None
    impact_analysis: Optional[str] = None
    recommendation: Optional[str] = None
    remediation_days: Optional[int] = None
    is_mock: bool = False


class AuditControlResponse(BaseModel):
    id: str
    status: str
    assigned_to: Optional[str] = None
    auditor_notes: Optional[str] = None
    ai_notes: Optional[str] = None
    evaluated_at: Optional[datetime] = None
    framework_id: str
    control_id: str
    created_at: datetime
    control: Optional[ControlsResponse] = None

    # ── Evaluation fields ──
    compliance_status: Optional[str] = None
    risk_rating: Optional[str] = None
    similar_issue: Optional[bool] = None
    root_cause_analysis: Optional[str] = None
    impact_analysis: Optional[str] = None
    recommendation: Optional[str] = None
    remediation_days: Optional[int] = None
    management_response: Optional[str] = None

    class Config:
        from_attributes = True
