from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_evidence_type_id


class EvidenceType(Base):
    """
    A canonical, reusable kind of evidence (e.g. "Designated Officer / CISO
    Appointment Letter"). Multiple Controls rows across different audit
    frameworks can point at the same EvidenceType - that shared link is what
    lets one uploaded EvidenceItem satisfy several audits at once, instead of
    the client re-uploading the same document for each framework.

    Populated via app/utils/generate_evidence_types.py +
    app/utils/apply_evidence_types.py, run manually - see those files for the
    one-time review workflow. Not seeded automatically on app startup.
    """
    __tablename__ = "evidence_type"

    id = Column(String(30), primary_key=True, default=generate_evidence_type_id)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)  # e.g. "Governance", "Access Control"
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    control_links = relationship("ControlsEvidenceType", back_populates="evidence_type")
    evidence_items = relationship("EvidenceItem", back_populates="evidence_type")