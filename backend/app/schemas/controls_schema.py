from pydantic import BaseModel, computed_field, field_validator
from typing import List, Optional


def _coerce_evidence(value):
    """
    Accept either a list or a delimited string on input, so existing API
    clients that still post "A; B" or "A, B" keep working.

    Note: a comma-delimited string is split on commas, which will over-split
    evidence text that legitimately contains commas. Prefer sending a list.
    """
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    text = str(value)
    delimiter = ";" if ";" in text else ","
    return [part.strip() for part in text.split(delimiter) if part.strip()]


class ControlsCreate(BaseModel):
    control_code: str
    control_desc: str
    audit_type: str
    audit_category: str
    audit_subcategory: str
    control_domain: Optional[str] = None
    primary_evidence: List[str] = []
    secondary_evidence: List[str] = []
    sr_no: Optional[int] = None

    @field_validator("primary_evidence", "secondary_evidence", mode="before")
    @classmethod
    def _normalize(cls, value):
        return _coerce_evidence(value)


class ControlsUpdate(BaseModel):
    control_code: Optional[str] = None
    control_desc: Optional[str] = None
    audit_type: Optional[str] = None
    audit_category: Optional[str] = None
    audit_subcategory: Optional[str] = None
    control_domain: Optional[str] = None
    primary_evidence: Optional[List[str]] = None
    secondary_evidence: Optional[List[str]] = None
    sr_no: Optional[int] = None

    @field_validator("primary_evidence", "secondary_evidence", mode="before")
    @classmethod
    def _normalize(cls, value):
        return None if value is None else _coerce_evidence(value)


class ControlsResponse(BaseModel):
    id: str
    control_code: str
    control_desc: str
    audit_type: str
    audit_category: str
    audit_subcategory: str
    control_domain: Optional[str] = None
    primary_evidence: List[str] = []
    secondary_evidence: List[str] = []
    sr_no: Optional[int] = None

    # Comma-joined convenience fields for tables and exports. The arrays above
    # remain the source of truth.
    @computed_field
    @property
    def primary_evidence_text(self) -> str:
        return ", ".join(self.primary_evidence or [])

    @computed_field
    @property
    def secondary_evidence_text(self) -> str:
        return ", ".join(self.secondary_evidence or [])

    class Config:
        from_attributes = True