from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_audit_control_evidence_id


class AuditControlEvidence(Base):
    """
    Many-to-many link: one EvidenceItem can satisfy many AuditControl rows
    across different audits, and one AuditControl can (rarely) have more
    than one EvidenceItem attached. This is the table that makes "upload
    once, applies everywhere" possible.
    """
    __tablename__ = "audit_control_evidence"

    id = Column(String(30), primary_key=True, default=generate_audit_control_evidence_id)
    audit_control_id = Column(String, ForeignKey("audit_control.id"), nullable=False, index=True)
    evidence_item_id = Column(String, ForeignKey("evidence_files.id"), nullable=False, index=True)

    # "auto" = created by the system's evidence-type matching logic.
    # "manual" = a human explicitly attached this evidence to this control.
    linked_by_type = Column(String, nullable=False, default="manual")
    linked_by_user = Column(String, ForeignKey("user.id"), nullable=True)
    linked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    audit_control = relationship("AuditControl", back_populates="evidence_links")
    evidence_item = relationship("EvidenceItem", back_populates="audit_control_links")

    __table_args__ = (
        UniqueConstraint("audit_control_id", "evidence_item_id", name="uq_audit_control_evidence"),
    )