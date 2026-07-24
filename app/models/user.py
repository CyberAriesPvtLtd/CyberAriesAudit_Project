from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_user_id


class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True, default=generate_user_id)
    name = Column(String, nullable=False)
    email_id = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String,nullable=False)
    create_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    company_id = Column(
        String, ForeignKey("company.id"), nullable=False
    )

    # Relationships
    company = relationship("Company", back_populates="users")
    assigned_audit_controls = relationship("AuditControl",back_populates="user")
    uploaded_evidence_files = relationship("EvidenceFiles",back_populates="user")