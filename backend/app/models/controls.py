from sqlalchemy.orm import relationship
from sqlalchemy import Column, String, DateTime
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_control_id


class Controls(Base):
    __tablename__ = "controls"

    id = Column(String,primary_key=True,default=generate_control_id)
    control_code = Column(String,unique=True,nullable=False)
    control_desc = Column(String,nullable=False)
    audit_category = Column(String,nullable=False)
    audit_subcategory = Column(String,nullable=False)
    audit_type = Column(String,nullable=False)
    create_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    audit_controls = relationship("AuditControl",back_populates="control")