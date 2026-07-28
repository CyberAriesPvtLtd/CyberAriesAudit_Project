from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_company_id


class Company(Base):
    __tablename__ = "company"

    id = Column(String(30), primary_key=True, default=generate_company_id)
    company_name = Column(String, unique=True, nullable=False)
    registration_no = Column(String, nullable=False)
    create_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="company")

    audit_frameworks = relationship(
        "AuditFramework",
        back_populates="company"
    )