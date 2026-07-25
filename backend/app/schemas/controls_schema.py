from pydantic import BaseModel
from typing import Optional

class ControlsCreate(BaseModel):
    control_code: str
    control_desc: str
    audit_category: str
    audit_subcategory: str
    audit_type: str


class ControlsUpdate(BaseModel):
    control_code: Optional[str] = None
    control_desc: Optional[str] = None
    audit_category: Optional[str] = None
    audit_subcategory: Optional[str] = None
    audit_type: Optional[str] = None


class ControlsResponse(BaseModel):
    id: str
    control_code: str
    control_desc: str
    audit_category: str
    audit_subcategory: str
    audit_type: str

    class Config:
        from_attributes = True