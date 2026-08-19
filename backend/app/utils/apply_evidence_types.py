"""
Reads a review file produced (and then edited by a human) from
generate_evidence_types.py, and creates EvidenceType rows +
ControlsEvidenceType links accordingly.

Every row marked "yes" in the review file merges its two evidence strings
into one EvidenceType (using the "Canonical name" column, or string A's
text if left blank). Every row marked "no", left blank, or not present in
the review file at all still gets an EvidenceType - just its own, not
merged with anything. This means every control ends up with full evidence-
type coverage: the review only decides which strings share a type, not
whether a string gets one at all.

Idempotent: re-running with the same review file does not create duplicate
EvidenceType rows. Matching for "does this already exist" is done by
EvidenceType.name.

Usage:
    python -m app.utils.apply_evidence_types --in review_evidence_types.xlsx
    python -m app.utils.apply_evidence_types --in review_evidence_types.xlsx --dry-run
"""

import argparse
from pathlib import Path

import openpyxl
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.controls import Controls
from app.models.evidence_type import EvidenceType
from app.models.controls_evidence_type import ControlsEvidenceType
from app.utils.generate_evidence_types import collect_evidence_strings


def read_review_file(path: Path):
    """Returns {(text_a, text_b): canonical_name_or_None} for every row marked yes."""
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb.active

    approved = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row or not row[0]:
            continue
        decision = str(row[0]).strip().lower()
        if decision != "yes":
            continue
        text_a, text_b, canonical = row[3], row[5], row[7]
        approved[(text_a, text_b)] = (canonical or text_a or "").strip() or text_a
    return approved


def get_or_create_evidence_type(db: Session, name: str, cache: dict, dry_run: bool):
    if name in cache:
        return cache[name]

    existing = db.query(EvidenceType).filter(EvidenceType.name == name).first()
    if existing:
        cache[name] = existing
        return existing

    et = EvidenceType(name=name)
    if not dry_run:
        db.add(et)
        db.flush()
    cache[name] = et
    return et


def link_control_to_type(db: Session, control_id: str, evidence_type, is_mandatory: bool, dry_run: bool):
    if evidence_type.id is None:
        # dry-run: evidence_type has no id yet since nothing was flushed
        return
    existing = (
        db.query(ControlsEvidenceType)
        .filter(
            ControlsEvidenceType.control_id == control_id,
            ControlsEvidenceType.evidence_type_id == evidence_type.id,
        )
        .first()
    )
    if existing:
        return
    if not dry_run:
        db.add(ControlsEvidenceType(
            control_id=control_id,
            evidence_type_id=evidence_type.id,
            is_mandatory=is_mandatory,
        ))


def apply(db: Session, review_path: Path, dry_run: bool = False):
    approved_pairs = read_review_file(review_path)

    # Union-find, but ONLY over pairs explicitly marked "yes" in the review
    # file - never inferred from score. This is the human-reviewed merge
    # graph, not the candidate graph from the generator.
    by_text = collect_evidence_strings(db, only_untagged=True)
    all_texts = list(by_text.keys())
    parent = {t: t for t in all_texts}
    canonical_name_for = {}

    def find(t):
        while parent.get(t, t) != t:
            parent[t] = parent.get(parent[t], parent[t])
            t = parent[t]
        return t

    def union(a, b, name):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
        canonical_name_for[find(b)] = name

    for (text_a, text_b), name in approved_pairs.items():
        if text_a in parent and text_b in parent:
            union(text_a, text_b, name)

    type_cache = {}
    created_types = 0
    created_links = 0

    for text in all_texts:
        root = find(text)
        name = canonical_name_for.get(root, root)
        et = get_or_create_evidence_type(db, name, type_cache, dry_run)
        if et.id is None:
            created_types += 1

        for (control_id, _code, _t, _cat, _sub, kind) in by_text[text]:
            is_mandatory = (kind == "primary")
            before = len(db.new) if not dry_run else 0
            link_control_to_type(db, control_id, et, is_mandatory, dry_run)
            created_links += 1

    if dry_run:
        db.rollback()
        print("[CyberAries] DRY RUN - nothing written.")
    else:
        db.commit()

    print(f"[CyberAries] {len(set(canonical_name_for.get(find(t), find(t)) for t in all_texts))} "
          f"distinct EvidenceType names resolved from {len(all_texts)} evidence strings.")
    print(f"[CyberAries] {len(approved_pairs)} approved merge pair(s) applied.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Apply a reviewed evidence-type merge file.")
    parser.add_argument("--in", dest="in_path", required=True, help="Path to the reviewed .xlsx file")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    with SessionLocal() as session:
        apply(session, Path(args.in_path), dry_run=args.dry_run)


#command to run the scripts in order:
# Step 1 - generate the review spreadsheet (reads Controls, writes nothing)
#python -m app.utils.generate_evidence_types --out review_evidence_types.xlsx

# Step 2 - open review_evidence_types.xlsx, fill in "Merge? (yes/no)" for
# every row, and "Canonical name" for any row you mark yes. Save it.

# Step 3 - preview what would be created, without writing anything
#python -m app.utils.apply_evidence_types --in review_evidence_types.xlsx --dry-run

# Step 4 - actually apply it
#python -m app.utils.apply_evidence_types --in review_evidence_types.xlsx
