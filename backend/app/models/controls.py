from sqlalchemy.orm import relationship
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Column, String, Integer, DateTime, Index
from datetime import datetime, timezone

from app.database import Base
from app.utils.nanoid import generate_control_id


class Controls(Base):
    __tablename__ = "controls"

    id = Column(String, primary_key=True, default=generate_control_id)

    # Scope: which checklist this control belongs to.
    # A framework resolves its control set on (audit_type, audit_category,
    # audit_subcategory).
    audit_type = Column(String, nullable=False)          # e.g. "SEBI CSCRF"
    audit_category = Column(String, nullable=False)      # e.g. "PMS" | "AIF"
    audit_subcategory = Column(String, nullable=False)   # e.g. "Self-Certified RE"

    # The control itself
    sr_no = Column(Integer, nullable=True)               # display order from the sheet
    control_code = Column(String, nullable=False)        # "SEBI Clause/Standard Code"
    control_domain = Column(String, nullable=True)       # Governance / Identify / Protect / Detect / Respond / Recover
    control_desc = Column(String, nullable=False)

    # Evidence expectations, stored as true lists.
    #
    # Evidence text legitimately contains commas ("Clearly defined roles,
    # responsibilities, and reporting lines"), so a delimited string cannot be
    # split back into items. An array keeps each requirement addressable —
    # which matters for per-item evidence matching and AI notes later.
    #
    # MutableList makes in-place edits (.append(...)) dirty the row; a plain
    # ARRAY only detects whole-list reassignment.
    primary_evidence = Column(
        MutableList.as_mutable(ARRAY(String)),
        nullable=False,
        server_default="{}",
        default=list,
    )
    secondary_evidence = Column(
        MutableList.as_mutable(ARRAY(String)),
        nullable=False,
        server_default="{}",
        default=list,
    )

    create_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    audit_controls = relationship("AuditControl", back_populates="control")

    # Convenience for display / exports. Read-only — never write through these.
    @property
    def primary_evidence_text(self) -> str:
        return ", ".join(self.primary_evidence or [])

    @property
    def secondary_evidence_text(self) -> str:
        return ", ".join(self.secondary_evidence or [])

    __table_args__ = (
        # `id` is the only unique key on this table.
        #
        # control_code is deliberately NOT unique, at any scope. Seven CSCRF
        # codes (GV.RR.S3, PR.DS.S4, PR.IP.S1, PR.IP.S15, RC.RP.S2, RS.IM.S1,
        # RS.IM.S2) appear in both the PMS and AIF sheets, and a code may also
        # legitimately repeat within a sheet as checklists evolve.
        #
        # This index is for lookups only - it resolves a framework to its
        # control set. It enforces nothing.
        Index(
            "ix_controls_scope",
            "audit_type",
            "audit_category",
            "audit_subcategory",
        ),
    )