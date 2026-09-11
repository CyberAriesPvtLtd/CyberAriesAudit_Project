"""
Loads the SEBI CSCRF control checklists from app/data/controls/*.xlsx into the
`controls` table.

Evidence is stored as a Postgres array — one element per requirement — because
evidence text contains commas of its own and cannot be reliably re-split from a
delimited string.

Idempotent: re-running updates existing rows in place and inserts only what is
new. Rows are matched on control_id.

Pointer Indexing: When the same SEBI clause (e.g. GV.PO.S1) appears on
multiple rows (each being a separate "pointer" / implementation step), the
control_id gets a suffix: GV.PO.S1-1, GV.PO.S1-2, etc. This suffix is
applied to EVERY row for consistency, even if a clause appears only once.

Usage:
    python -m app.utils.seed_controls              # load all sheets
    python -m app.utils.seed_controls --dry-run    # parse and report, no writes
"""

import argparse
import re
from collections import defaultdict
from pathlib import Path

import openpyxl
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.controls import Controls


# --------------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------------

CONTROLS_DIR = Path(__file__).resolve().parents[1] / "data" / "controls"


# --------------------------------------------------------------------------
# Column Alias Dictionary
# Maps each schema field → all known Excel header variations.
# All comparisons are done on normalized (lowercase, alphanum only) strings.
# --------------------------------------------------------------------------

COLUMN_ALIASES = {
    "framework_rules": [
        "sebiclausestandardcode", "sebiclaustandardcode", "sebiclause",
        "standardcode", "frameworkrules", "frameworkrule", "rule",
        "controlname", "clausestandardcode",
    ],
    "control_domain": ["controldomain", "domain"],
    "control_desc": ["controldescription", "description", "controldesc"],
    "audit_type": [
        "auditframwork", "auditframework", "auditfrawmork",
        "framework", "frameworktype",
    ],
    "audit_category": ["auditcategory", "category", "frameworkcategory"],
    "audit_subcategory": [
        "auditsubcategory", "subcategory", "frameworksubcategory",
    ],
    "primary_evidence": [
        "primarymandatoryevidence", "primaryevidence",
        "primarydocuments", "mandatoryevidence",
    ],
    "secondary_evidence": [
        "secondarysupportingevidence", "secondaryevidence",
        "secondarydocuments", "supportingevidence",
    ],
}


# --------------------------------------------------------------------------
# Canonical Value Dictionary
# Maps normalized cell values → the single canonical string stored in the DB.
# Handles typos + casing differences across different Excel files.
# --------------------------------------------------------------------------

CANONICAL_VALUES = {
    "audit_type": {
        "cscrf": "CSCRF",
        "sebicscrf": "CSCRF",
        "sebi": "CSCRF",
    },
    "audit_category": {
        "aif": "AIF",
        "alternativeinvestmentfund": "AIF",
        "pms": "PMS",
        "portfoliomanagementservice": "PMS",
        "portfoliomanagementservices": "PMS",
        "stockbroker": "Stock Broker",
        "stockbrokers": "Stock Broker",
        "depository": "Depository",
        "mf": "Mutual Fund",
        "mutualfund": "Mutual Fund",
    },
    "audit_subcategory": {
        "selfcertified": "Self-Certified",
        "selfcertifiedre": "Self-Certified",
        "selfcert": "Self-Certified",
        "mediumsize": "Medium-Size",
        "mediumsizere": "Medium-Size",
        "medium": "Medium-Size",
        "midsize": "Medium-Size",
        "qualifiedre": "Qualified",
        "qualified": "Qualified",
        "smallsizere": "Small-Size",
        "smallsize": "Small-Size",
        "small": "Small-Size",
    },
    "control_domain": {
        "governance": "Governance",
        "govern": "Governance",
        "gv": "Governance",
        "identify": "Identify",
        "id": "Identify",
        "protect": "Protect",
        "pr": "Protect",
        "detect": "Detect",
        "de": "Detect",
        "respond": "Respond",
        "rs": "Respond",
        "recover": "Recover",
        "rc": "Recover",
        "evolve": "Evolve",
        "ev": "Evolve",
    },
}


# Fields refreshed on an existing row when the sheet changes.
UPDATABLE_FIELDS = (
    "framework_rules",
    "control_domain",
    "control_desc",
    "primary_evidence",
    "secondary_evidence",
)


# --------------------------------------------------------------------------
# Normalization helpers
# --------------------------------------------------------------------------

def _normalize_key(s: str) -> str:
    """Lowercase + strip all non-alphanumeric chars."""
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


def canonicalize(field: str, raw_value) -> str | None:
    """
    Given a raw cell value and a field name, return the canonical value
    if a match exists. If no canonical match, return the raw value trimmed.
    """
    if raw_value is None:
        return None
    norm = _normalize_key(raw_value)
    mapping = CANONICAL_VALUES.get(field, {})
    if norm in mapping:
        return mapping[norm]
    return str(raw_value).strip()


# --------------------------------------------------------------------------
# Parsing helpers
# --------------------------------------------------------------------------

# Evidence is split on ";" or newlines. Commas are NOT separators — they
# occur inside individual evidence items.
_SPLIT_RE = re.compile(r"[;\n]+")
_SPLIT_SEBI_RE = re.compile(r"[,;\n]+")


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
    """Split framework rules by comma, semicolon, or newline."""
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


def build_column_resolver(header_row):
    """
    Build a resolver map: field_name → column index.
    Uses the COLUMN_ALIASES dictionary with normalized header matching.
    """
    # Normalize all headers
    normalized = []
    for i, cell in enumerate(header_row):
        text = clean_text(cell)
        if text:
            normalized.append((i, _normalize_key(text)))
        else:
            normalized.append((i, ""))

    resolver = {}
    for field, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            for col_idx, norm_header in normalized:
                if norm_header == alias:
                    resolver[field] = col_idx
                    break
            if field in resolver:
                break

    return resolver


# --------------------------------------------------------------------------
# Parsing
# --------------------------------------------------------------------------

def parse_workbook(path: Path):
    """Return a list of control dicts from one workbook."""
    worksheet = openpyxl.load_workbook(path, data_only=True).active

    header_row = next(worksheet.iter_rows(min_row=1, max_row=1, values_only=True))

    # Build column resolver using normalized aliases
    resolver = build_column_resolver(header_row)

    # Verify all required fields are resolved
    required = [
        "framework_rules", "control_domain", "control_desc",
        "audit_type", "audit_category", "audit_subcategory",
        "primary_evidence", "secondary_evidence",
    ]
    missing = [f for f in required if f not in resolver]
    if missing:
        raw_headers = [clean_text(c) for c in header_row if clean_text(c)]
        raise ValueError(
            f"{path.name}: could not resolve columns for {missing}. "
            f"Found headers: {raw_headers}"
        )

    def get(row, field):
        idx = resolver.get(field)
        if idx is None or idx >= len(row):
            return None
        return row[idx]

    # ── First pass: collect all rows and count occurrences of each rule ──
    raw_rows = []
    rule_counter = defaultdict(int)  # tracks how many times each base-key appears

    for row_number, row in enumerate(
        worksheet.iter_rows(min_row=2, values_only=True), start=2
    ):
        audit_type = canonicalize("audit_type", clean_text(get(row, "audit_type")))
        audit_category = canonicalize("audit_category", clean_text(get(row, "audit_category")))
        audit_subcategory = canonicalize("audit_subcategory", clean_text(get(row, "audit_subcategory")))

        framework_rules = split_framework_rules(get(row, "framework_rules"))
        control_desc = clean_text(get(row, "control_desc"))

        # Skip blank spacer rows
        if not framework_rules or not control_desc or not audit_type:
            continue

        first_rule = framework_rules[0] if framework_rules else "UNKNOWN"

        # Base key (without pointer index) for counting
        base_key = f"{audit_type}-{audit_category}-{audit_subcategory}-{first_rule}".replace(" ", "")

        rule_counter[base_key] += 1
        pointer_index = rule_counter[base_key]

        control_id = f"{base_key}-{pointer_index}"

        raw_rows.append({
            "audit_type": audit_type,
            "audit_category": audit_category,
            "audit_subcategory": audit_subcategory,
            "control_id": control_id,
            "framework_rules": framework_rules,
            "control_domain": canonicalize("control_domain", clean_text(get(row, "control_domain"))),
            "control_desc": control_desc,
            "primary_evidence": split_evidence(get(row, "primary_evidence")),
            "secondary_evidence": split_evidence(get(row, "secondary_evidence")),
            "_source": f"{path.name}:{row_number}",
        })

    return raw_rows


def load_all_controls():
    """Parse every .xlsx workbook in data/controls and fail on duplicate IDs."""
    parsed, seen = [], {}

    if not CONTROLS_DIR.exists():
        print(f"[CyberAries] Controls directory does not exist: {CONTROLS_DIR}")
        return parsed

    xlsx_files = sorted(CONTROLS_DIR.glob("*.xlsx"))
    if not xlsx_files:
        print(f"[CyberAries] No .xlsx files found in {CONTROLS_DIR}")
        return parsed

    for path in xlsx_files:
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

    if not parsed:
        print("[CyberAries] No controls to seed.")
        return {"parsed": 0, "inserted": 0, "updated": 0, "unchanged": 0}

    existing, duplicates = {}, []
    for row in db.query(Controls).order_by(Controls.created_at).all():
        key = row.control_id
        if key in existing:
            duplicates.append(key)
            continue
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