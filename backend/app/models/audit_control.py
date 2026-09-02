from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_audit_control_id


class AuditControl(Base):
    __tablename__ = "audit_control"

    id = Column(String,primary_key=True,default=generate_audit_control_id)
    status = Column(String,nullable=False)
    assigned_to = Column(String,ForeignKey("user.id"),nullable=True,index=True)
    auditor_notes = Column(String,nullable=True)
    evaluated_at = Column(DateTime,nullable=True)
    framework_id = Column(String,ForeignKey("audit_framework.id"),nullable=False,index=True)
    control_id = Column(String,ForeignKey("controls.id"),nullable=False,index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User",back_populates="assigned_audit_controls")
    audit_framework = relationship("AuditFramework",back_populates="audit_controls")
    control = relationship("Controls",back_populates="audit_controls")
    evidence_links = relationship("AuditControlEvidence",back_populates="audit_control")