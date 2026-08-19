"""
Reads every primary_evidence / secondary_evidence string currently in the
`controls` table, fuzzy-matches them pairwise, and writes an .xlsx review
file for a human to approve/reject each candidate merge.

This does NOT write anything to the database and does NOT touch the
Controls table or its primary_evidence/secondary_evidence columns - it only
reads them. Nothing here is wired into app startup; run it manually.

Matching is pairwise only, never transitive - if A matches B and B matches
C, that does not imply A matches C in the output. Transitive clustering was
tried during design and produced false merges (e.g. a generic "Appointment
letter" string pairing with an unrelated "Appointment letter of the CERT-In
empanelled auditor" through a shared third string). Pairwise-only output
means every merge decision is reviewed on its own evidence, not inherited
from another pair's approval.

Re-runnable: run again after adding a new framework's controls (e.g. SOC 2,
ISO 27001) and it will only surface new candidate pairs - matches you've
already approved and applied (see apply_evidence_types.py) are skipped
because their strings are already linked to an EvidenceType by then.

Usage:
    python -m app.utils.generate_evidence_types --out review_evidence_types.xlsx
    python -m app.utils.generate_evidence_types --out review.xlsx --threshold 90
"""

import argparse
import re
from pathlib import Path

import openpyxl
from openpyxl.styles import Font
from rapidfuzz import fuzz
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.controls import Controls
from app.models.controls_evidence_type import ControlsEvidenceType

DEFAULT_THRESHOLD = 88
SHORT_STRING_LEN = 5  # strings this short or shorter get a false-merge-risk flag


def _norm(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def collect_evidence_strings(db: Session, only_untagged: bool = True):
    """
    Returns {text: [(control_id, control_code, audit_type, audit_category,
    audit_subcategory, kind), ...]} for every primary/secondary evidence
    string in the controls table.

    only_untagged=True (the default) skips any evidence string belonging to
    a control that already has ANY ControlsEvidenceType row - this is what
    makes re-running the script after adding a new framework only surface
    genuinely new candidates instead of re-asking about strings you already
    reviewed and applied in an earlier pass.
    """
    already_tagged_control_ids = {
        row.control_id for row in db.query(ControlsEvidenceType.control_id).all()
    }

    by_text = {}
    for control in db.query(Controls).all():
        if only_untagged and control.id in already_tagged_control_ids:
            continue

        for kind, values in (
            ("primary", control.primary_evidence or []),
            ("secondary", control.secondary_evidence or []),
        ):
            for text in values:
                by_text.setdefault(text, []).append((
                    control.id, control.control_id, control.audit_type,
                    control.audit_category, control.audit_subcategory, kind,
                ))
    return by_text


def find_candidate_pairs(by_text: dict, threshold: int):
    texts = list(by_text.keys())
    normed = [_norm(t) for t in texts]
    n = len(texts)

    pairs = []
    for i in range(n):
        for j in range(i + 1, n):
            score = fuzz.token_set_ratio(normed[i], normed[j])
            if score >= threshold:
                pairs.append({
                    "score": round(score, 1),
                    "a": texts[i], "a_uses": by_text[texts[i]],
                    "b": texts[j], "b_uses": by_text[texts[j]],
                    "risky": len(texts[i]) <= SHORT_STRING_LEN or len(texts[j]) <= SHORT_STRING_LEN,
                })
    pairs.sort(key=lambda p: -p["score"])
    return pairs


def _format_uses(uses):
    return "; ".join(
        f"{a_type}/{a_cat}/{a_sub} [{code}] ({kind})"
        for (_id, code, a_type, a_cat, a_sub, kind) in uses
    )


def write_review_file(pairs, singleton_count: int, out_path: Path):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Candidate merges"

    headers = [
        "Merge? (yes/no)", "Score", "Risk flag",
        "Evidence text A", "Used by (A)",
        "Evidence text B", "Used by (B)",
        "Canonical name (if merging)",
    ]
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)

    for p in pairs:
        ws.append([
            "",  # left blank for review
            p["score"],
            "high - short string" if p["risky"] else "",
            p["a"], _format_uses(p["a_uses"]),
            p["b"], _format_uses(p["b_uses"]),
            "",  # left blank - fill in only if merging
        ])

    for col, width in zip("ABCDEFGH", [16, 8, 18, 40, 45, 40, 45, 40]):
        ws.column_dimensions[col].width = width

    wb.save(out_path)

    print(f"[CyberAries] {len(pairs)} candidate pairs written to {out_path}")
    print(f"[CyberAries] {singleton_count} evidence strings had no candidate match "
          f"and will become their own EvidenceType automatically when applied.")
    print("[CyberAries] Open the file, fill in 'Merge? (yes/no)' for every row, "
          "and 'Canonical name' for any row marked yes, then run apply_evidence_types.py.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate evidence-type merge candidates for review.")
    parser.add_argument("--out", required=True, help="Path to write the .xlsx review file")
    parser.add_argument("--threshold", type=int, default=DEFAULT_THRESHOLD,
                         help=f"Similarity threshold 0-100 (default {DEFAULT_THRESHOLD})")
    parser.add_argument("--include-tagged", action="store_true",
                         help="Also include controls that already have an EvidenceType "
                              "(by default, already-tagged controls are skipped)")
    args = parser.parse_args()

    with SessionLocal() as session:
        by_text = collect_evidence_strings(session, only_untagged=not args.include_tagged)
        pairs = find_candidate_pairs(by_text, args.threshold)
        matched_texts = {p["a"] for p in pairs} | {p["b"] for p in pairs}
        singleton_count = len(by_text) - len(matched_texts)
        write_review_file(pairs, singleton_count, Path(args.out))