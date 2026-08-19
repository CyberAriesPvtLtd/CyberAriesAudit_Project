from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_evidence_file_id


class EvidenceItem(Base):
    """
    One physical file the company has on record. Owned by the company, not
    by any single audit - that is the change that makes reuse possible.
    Which audit-control(s) it satisfies is tracked separately in
    AuditControlEvidence (many-to-many), so the same upload can be linked to
    CSCRF-AIF and CSCRF-PMS at once instead of being uploaded twice.
    """
    __tablename__ = "evidence_files"

    id = Column(String, primary_key=True, default=generate_evidence_file_id)
    file_name = Column(String, nullable=False)
    storage_key = Column(String, nullable=False, unique=True)  # MinIO object key
    file_size = Column(Integer, nullable=True)  # bytes
    mime_type = Column(String, nullable=True)
    ai_notes = Column(String, nullable=True)
    auditor_notes = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Pending Review")

    company_id = Column(String, ForeignKey("company.id"), nullable=False, index=True)
    evidence_type_id = Column(String, ForeignKey("evidence_type.id"), nullable=True, index=True)
    uploaded_by = Column(String, ForeignKey("user.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company", back_populates="evidence_items")
    evidence_type = relationship("EvidenceType", back_populates="evidence_items")
    user = relationship("User", back_populates="uploaded_evidence_items")
    audit_control_links = relationship(
        "AuditControlEvidence",
        back_populates="evidence_item",
        cascade="all, delete-orphan",
    )


# Backwards-compatible alias. The class is renamed to EvidenceItem because it
# no longer represents "a file on one audit control" - it is company-owned.
# The alias exists only so any stray `from app.models.evidence_files import
# EvidenceFiles` import fails loudly at startup instead of silently, making
# it easy to grep and fix rather than a runtime surprise.
EvidenceFiles = EvidenceItem