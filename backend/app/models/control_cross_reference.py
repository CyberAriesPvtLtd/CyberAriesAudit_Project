from sqlalchemy import Column, String, JSON
from nanoid import generate
from app.database import Base

def generate_cross_reference_id():
    return f"cx_{generate(size=12)}"


class ControlCrossReference(Base):
    __tablename__ = "control_cross_reference"

    id = Column(String, primary_key=True, default=generate_cross_reference_id)
    
    # E.g., 'CSCRF-AIF-Medium-Size-GV.RR.S3-1'
    source_control_code = Column(String, nullable=False, index=True)
    # E.g., 'CSCRF-PMS-Self-Certified-GV.RR.S3-1'
    target_control_code = Column(String, nullable=False, index=True)
    
    match_type = Column(String, nullable=False)  # "Exact Match" or "Partial Match"
    auto_compliance_rule = Column(String, nullable=True)
    other_rules_needed = Column(JSON, nullable=True)
