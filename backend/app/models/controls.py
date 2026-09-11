from sqlalchemy.orm import relationship
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Column, String, DateTime, Index
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_control_id


class Controls(Base):
    __tablename__ = "controls"

    id = Column(String, primary_key=True, default=generate_control_id)
    audit_type = Column(String, nullable=False)          # e.g. "SEBI CSCRF"
    audit_category = Column(String, nullable=False)      # e.g. "PMS" | "AIF"
    audit_subcategory = Column(String, nullable=False)   # e.g. "Self-Certified RE"
    control_id = Column(String, unique=True, nullable=False) # e.g. CSCRF-AIF-Selfcert-GV.PO.S1
    framework_rules = Column(
        MutableList.as_mutable(ARRAY(String)), 
        nullable=False,
        server_default="{}"
    ) # array of SEBI codes like ["GV.PO.S1", "GV.PO.S2"]
    control_domain = Column(String, nullable=True)       # Governance / Identify / Protect / Detect / Respond / Recover
    control_desc = Column(String, nullable=False)
    primary_evidence = Column(
        MutableList.as_mutable(ARRAY(String)),
        nullable=False,
        server_default="{}",
        default=list,
    )
    secondary_evidence = Column(
        MutableList.as_mutable(ARRAY(String)),
        nullable=False,
        server_default="{}",
        default=list,
    )
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    audit_controls = relationship("AuditControl", back_populates="control")

    # Convenience for display / exports. Read-only — never write through these.
    @property
    def primary_evidence_text(self) -> str:
        return ", ".join(self.primary_evidence or [])

    @property
    def secondary_evidence_text(self) -> str:
        return ", ".join(self.secondary_evidence or [])

    __table_args__ = (
        Index(
            "ix_controls_scope",
            "audit_type",
            "audit_category",
            "audit_subcategory",
        ),
    )