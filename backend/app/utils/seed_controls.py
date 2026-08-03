"""
Loads the SEBI CSCRF control checklists from app/data/controls/*.xlsx into the
`controls` table.

Evidence is stored as a Postgres array — one element per requirement — because
evidence text contains commas of its own and cannot be reliably re-split from a
delimited string.

Idempotent: re-running updates existing rows in place and inserts only what is
new. Rows are matched on (control_code, audit_type, audit_category,
audit_subcategory). That match is done in Python - the database enforces
uniqueness on `id` only.

Usage:
    python -m app.utils.seed_controls              # load both sheets
    python -m app.utils.seed_controls --dry-run    # parse and report, no writes
"""

import argparse
import re
from pathlib import Path

import openpyxl
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.controls import Controls


# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

CONTROLS_DIR = Path(__file__).resolve().parents[1] / "data" / "controls"

# Which scope each workbook maps to. Add a new entry per sheet you onboard.
FILE_CONFIG = {
    "PMS_Controls_Self_Certified_RE.xlsx": {
        "audit_type": "SEBI CSCRF",
        "audit_category": "PMS",
        "audit_subcategory": "Self-Certified RE",
    },
    "AIF_Controls_Self_Certified_RE.xlsx": {
        "audit_type": "SEBI CSCRF",
        "audit_category": "AIF",
        "audit_subcategory": "Self-Certified RE",
    },
}

# Excel header -> model field. Headers are matched exactly (after whitespace
# normalisation), so a renamed column fails loudly instead of loading nulls.
COLUMNS = {
    "sr_no": "S.No",
    "control_code": "SEBI Clause/Standard Code",
    "control_domain": "Control Domain",
    "control_desc": "Control Description",
    "primary_evidence": "Primary (Mandatory) Evidence",
    "secondary_evidence": "Secondary (Supporting) Evidence",
}

# Fields refreshed on an existing row when the sheet changes.
UPDATABLE_FIELDS = (
    "sr_no",
    "control_domain",
    "control_desc",
    "primary_evidence",
    "secondary_evidence",
)

# The source sheets separate multiple evidence items with ";" or a newline.
# Commas are NOT separators — they occur inside individual evidence items.
_SPLIT_RE = re.compile(r"[;\n]+")


# --------------------------------------------------------------------------
# Parsing
# --------------------------------------------------------------------------

def clean_text(value):
    """Collapse runs of spaces/tabs, strip, return None for empties."""
    if value is None:
        return None
    text = re.sub(r"[ \t]+", " ", str(value)).strip()
    return text or None


def split_evidence(value):
    """
    Split a multi-item evidence cell into a list, dropping blanks and
    case-insensitive duplicates while preserving sheet order.

        "Board Resolution; Defined roles, responsibilities"
        -> ["Board Resolution", "Defined roles, responsibilities"]
    """
    if value is None:
        return []

    items, seen = [], set()
    for chunk in _SPLIT_RE.split(str(value)):
        item = clean_text(chunk.strip(" ;"))
        if not item:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        items.append(item)

    return items


def parse_workbook(path: Path):
    """Return a list of control dicts from one workbook."""
    config = FILE_CONFIG.get(path.name)
    if config is None:
        raise ValueError(f"No FILE_CONFIG entry for '{path.name}'")

    worksheet = openpyxl.load_workbook(path, data_only=True).active

    header_row = next(worksheet.iter_rows(min_row=1, max_row=1, values_only=True))
    header = [clean_text(cell) for cell in header_row]

    index = {}
    for field, title in COLUMNS.items():
        if title not in header:
            raise ValueError(
                f"{path.name}: expected column '{title}' but found {header}"
            )
        index[field] = header.index(title)

    controls = []
    for row_number, row in enumerate(
        worksheet.iter_rows(min_row=2, values_only=True), start=2
    ):
        control_code = clean_text(row[index["control_code"]])
        control_desc = clean_text(row[index["control_desc"]])

        # Skip blank spacer rows rather than inserting junk.
        if not control_code or not control_desc:
            continue

        sr_no = row[index["sr_no"]]
        controls.append(
            {
                "sr_no": int(sr_no) if isinstance(sr_no, (int, float)) else None,
                "control_code": control_code,
                "control_domain": clean_text(row[index["control_domain"]]),
                "control_desc": control_desc,
                "primary_evidence": split_evidence(row[index["primary_evidence"]]),
                "secondary_evidence": split_evidence(row[index["secondary_evidence"]]),
                "_source": f"{path.name}:{row_number}",
                **config,
            }
        )

    return controls


def load_all_controls():
    """Parse every configured workbook and fail on duplicate scoped keys."""
    parsed, seen = [], {}

    for filename in FILE_CONFIG:
        path = CONTROLS_DIR / filename
        if not path.exists():
            raise FileNotFoundError(f"Control workbook not found: {path}")

        for control in parse_workbook(path):
            key = (
                control["control_code"],
                control["audit_type"],
                control["audit_category"],
                control["audit_subcategory"],
            )
            if key in seen:
                raise ValueError(
                    f"Duplicate control {key} at {control['_source']} "
                    f"(already seen at {seen[key]})"
                )
            seen[key] = control["_source"]
            parsed.append(control)

    return parsed


# --------------------------------------------------------------------------
# Seeding
# --------------------------------------------------------------------------

def seed_controls(db: Session, dry_run: bool = False):
    parsed = load_all_controls()

    # `id` is the only unique key in the database, so nothing stops duplicate
    # (code, scope) rows from existing. Match on the scope key anyway - that is
    # what makes re-seeding idempotent - but surface any duplicates found so a
    # bad import does not silently persist.
    existing, duplicates = {}, []
    for row in db.query(Controls).order_by(Controls.create_at).all():
        key = (
            row.control_code,
            row.audit_type,
            row.audit_category,
            row.audit_subcategory,
        )
        if key in existing:
            duplicates.append(key)
            continue  # keep the oldest, ignore the rest
        existing[key] = row

    if duplicates:
        print(
            f"[CyberAries] WARNING: {len(duplicates)} duplicate control(s) "
            f"already in the database; updating the oldest of each. "
            f"Examples: {duplicates[:3]}"
        )

    inserted = updated = unchanged = 0

    for control in parsed:
        payload = {k: v for k, v in control.items() if not k.startswith("_")}
        key = (
            payload["control_code"],
            payload["audit_type"],
            payload["audit_category"],
            payload["audit_subcategory"],
        )

        row = existing.get(key)
        if row is None:
            if not dry_run:
                db.add(Controls(**payload))
            inserted += 1
            continue

        changes = {}
        for field in UPDATABLE_FIELDS:
            current = getattr(row, field)
            incoming = payload[field]
            # ARRAY columns come back as list-likes; compare by value.
            if isinstance(incoming, list):
                if list(current or []) != incoming:
                    changes[field] = incoming
            elif current != incoming:
                changes[field] = incoming

        if not changes:
            unchanged += 1
            continue

        if not dry_run:
            for field, value in changes.items():
                setattr(row, field, value)
        updated += 1

    if dry_run:
        db.rollback()
        print("[CyberAries] DRY RUN - nothing written.")
    else:
        db.commit()

    print(
        f"[CyberAries] Controls seed: {len(parsed)} parsed | "
        f"{inserted} inserted | {updated} updated | {unchanged} unchanged"
    )

    return {
        "parsed": len(parsed),
        "inserted": inserted,
        "updated": updated,
        "unchanged": unchanged,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed controls from Excel.")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    with SessionLocal() as session:
        seed_controls(session, dry_run=args.dry_run)