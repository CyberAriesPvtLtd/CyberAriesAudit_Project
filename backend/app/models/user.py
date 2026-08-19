<<<<<<< Updated upstream
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    CLIENT = "client"
    AUDITOR = "auditor"


from app.database import Base
from app.utils.nanoid import generate_user_id


class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True, default=generate_user_id)
    name = Column(String, nullable=False)
    email_id = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    must_change_password = Column(Boolean, default=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    company_id = Column(
        String, ForeignKey("company.id"), nullable=True
    )

    @property
    def email(self):
        return self.email_id

    @email.setter
    def email(self, value):
        self.email_id = value

    # Relationships
    company = relationship("Company", back_populates="users")
    assigned_audit_controls = relationship("AuditControl", back_populates="user")
    uploaded_evidence_files = relationship("EvidenceFiles", back_populates="user")
=======
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    CLIENT = "client"
    AUDITOR = "auditor"


from app.database import Base
from app.utils.nanoid import generate_user_id


class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True, default=generate_user_id)
    name = Column(String, nullable=False)
    email_id = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    must_change_password = Column(Boolean, default=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    company_id = Column(
        String, ForeignKey("company.id"), nullable=True, index=True
    )

    @property
    def email(self):
        return self.email_id

    @email.setter
    def email(self, value):
        self.email_id = value

    # Relationships
    company = relationship("Company", back_populates="users")
    assigned_audit_controls = relationship("AuditControl", back_populates="user")
    uploaded_evidence_items = relationship("EvidenceItem", back_populates="user")
>>>>>>> Stashed changes
