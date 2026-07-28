from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_audit_framework_id


class AuditFramework(Base):
    __tablename__ = "audit_framework"

    id = Column(String(30), primary_key=True, default=generate_audit_framework_id)
    audit_type = Column(String, nullable=False)
    audit_category = Column(String, nullable=True)
    audit_subcategory = Column(String, nullable=True)
    audit_name = Column(String, nullable=False)
    target_fy = Column(String, nullable=False)
    status = Column(String, nullable=False)

    company_id = Column(
        String,
        ForeignKey("company.id"),
        nullable=False
    )

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    company = relationship(
        "Company",
        back_populates="audit_frameworks"
    )
    
    audit_controls = relationship(
        "AuditControl",
        back_populates="audit_framework"
    )