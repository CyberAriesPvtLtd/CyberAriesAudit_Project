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

# We no longer hardcode files. The script will automatically scan all .xlsx files

# Map database fields to possible Excel column headers (case-insensitive)
COLUMNS = {
    "framework_rules": ["sebi clause/standard code", "iso clause", "standard code"],
    "control_domain": ["control domain"],
    "control_desc": ["control description"],
    "primary_evidence": ["primary (mandatory) evidence"],
    "secondary_evidence": ["secondary (supporting) evidence"],
    "audit_type": ["audit_framework", "audit_framwork"],
    "audit_category": ["audit_category"],
    "audit_subcategory": ["audit_subcategory"],
}

# Fields refreshed on an existing row when the sheet changes.
UPDATABLE_FIELDS = (
    "framework_rules",
    "control_domain",
    "control_desc",
    "primary_evidence",
    "secondary_evidence",
)

# The source sheets separate multiple evidence items with ";" or a newline.
# Commas are NOT separators — they occur inside individual evidence items.
_SPLIT_RE = re.compile(r"[;\n]+")
_SPLIT_SEBI_RE = re.compile(r"[,;\n]+")


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


def split_framework_rules(value):
    """
    Split framework rules by comma, semicolon, or newline.
    """
    if value is None:
        return []
    items, seen = [], set()
    for chunk in _SPLIT_SEBI_RE.split(str(value)):
        item = clean_text(chunk)
        if not item:
            continue
        key = item.upper()
        if key in seen:
            continue
        seen.add(key)
        items.append(key)
    return items


def parse_workbook(path: Path):
    """Return a list of control dicts from one workbook."""
    worksheet = openpyxl.load_workbook(path, data_only=True).active

    header_row = next(worksheet.iter_rows(min_row=1, max_row=1, values_only=True))
    header = [clean_text(cell).lower() for cell in header_row if clean_text(cell)]

    index = {}
    for field, possibilities in COLUMNS.items():
        found = False
        for title in possibilities:
            if title in header:
                index[field] = header.index(title)
                found = True
                break
        if not found:
            raise ValueError(
                f"{path.name}: expected column for '{field}' but found {header}"
            )

    controls = []
    for row_number, row in enumerate(
        worksheet.iter_rows(min_row=2, values_only=True), start=2
    ):
        audit_type = clean_text(row[index["audit_type"]])
        audit_category = clean_text(row[index["audit_category"]])
        audit_subcategory = clean_text(row[index["audit_subcategory"]])
        
        framework_rules = split_framework_rules(row[index["framework_rules"]])
        control_desc = clean_text(row[index["control_desc"]])

        # Skip blank spacer rows rather than inserting junk.
        if not framework_rules or not control_desc or not audit_type:
            continue

        first_rule = framework_rules[0] if framework_rules else "UNKNOWN"
        control_id_raw = f"{audit_type}-{audit_category}-{audit_subcategory}-{first_rule}"
        control_id = control_id_raw.replace(" ", "")

        controls.append(
            {
                "audit_type": audit_type,
                "audit_category": audit_category,
                "audit_subcategory": audit_subcategory,
                "control_id": control_id,
                "framework_rules": framework_rules,
                "control_domain": clean_text(row[index["control_domain"]]),
                "control_desc": control_desc,
                "primary_evidence": split_evidence(row[index["primary_evidence"]]),
                "secondary_evidence": split_evidence(row[index["secondary_evidence"]]),
                "_source": f"{path.name}:{row_number}",
            }
        )

    return controls


def load_all_controls():
    """Parse every configured workbook and fail on duplicate scoped keys."""
    parsed, seen = [], {}

    # Read all .xlsx files dynamically except cross reference maps
    for path in CONTROLS_DIR.glob("*.xlsx"):
        if "CrossReference" in path.name:
            continue
            
        print(f"[CyberAries] Parsing {path.name}...")

        for control in parse_workbook(path):
            key = control["control_id"]
            if key in seen:
                raise ValueError(
                    f"Duplicate control_id {key} at {control['_source']} "
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
        key = row.control_id
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
        key = payload["control_id"]

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