from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base
from app.utils.nanoid import generate_evidence_file_id


class EvidenceFiles(Base):
    __tablename__ = "evidence_files"

    id = Column(String,primary_key=True,default=generate_evidence_file_id)
    file_name = Column(String,nullable=False)
    file_url = Column(String,nullable=False)
    ai_notes = Column(String,nullable=True)
    auditor_notes = Column(String,nullable=True)
    status = Column(String,nullable=False)
    uploaded_by = Column(String,ForeignKey("user.id"),nullable=False)
    audit_control_id = Column(String,ForeignKey("audit_control.id"),nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User",back_populates="uploaded_evidence_files")
    audit_control = relationship("AuditControl",back_populates="evidence_files")