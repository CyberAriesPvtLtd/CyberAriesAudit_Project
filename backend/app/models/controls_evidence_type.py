from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_audit_control_evidence_id


class ControlsEvidenceType(Base):
    """
    Join table: which EvidenceType(s) satisfy a given Controls row, and
    whether each is mandatory or supporting.

    This is purely additive - Controls.primary_evidence / secondary_evidence
    (the original free-text arrays) are untouched and keep working exactly
    as before for the existing admin control-library UI. This table is a
    separate, structured layer used only by the evidence auto-linking logic.
    """
    __tablename__ = "controls_evidence_type"

    id = Column(String(30), primary_key=True, default=generate_audit_control_evidence_id)
    control_id = Column(String, ForeignKey("controls.id"), nullable=False, index=True)
    evidence_type_id = Column(String, ForeignKey("evidence_type.id"), nullable=False, index=True)
    is_mandatory = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    control = relationship("Controls", back_populates="evidence_type_links")
    evidence_type = relationship("EvidenceType", back_populates="control_links")

    __table_args__ = (
        UniqueConstraint("control_id", "evidence_type_id", name="uq_control_evidence_type"),
    )