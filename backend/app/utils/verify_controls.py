"""
Post-seed verification for the `controls` table.

Run from the backend/ directory, after the migration and the seeder:

    python -m app.utils.verify_controls

Exits 0 if everything checks out, 1 if any check fails, so it can be dropped
into CI. Read-only - it never writes to the database.
"""

import sys
from collections import Counter

from sqlalchemy import inspect, text

from app.database import SessionLocal, engine
from app.models.controls import Controls
from app.utils.seed_controls import load_all_controls


PASS = "  [PASS]"
FAIL = "  [FAIL]"

# What the two shipped workbooks should produce.
EXPECTED_COUNTS = {"PMS": 20, "AIF": 29}

# Codes that appear in BOTH sheets - the reason control_code cannot be unique.
SHARED_CODES = [
    "GV.RR.S3", "PR.DS.S4", "PR.IP.S1", "PR.IP.S15",
    "RC.RP.S2", "RS.IM.S1", "RS.IM.S2",
]


def main():
    failures = []

    def check(ok, message):
        print((PASS if ok else FAIL), message)
        if not ok:
            failures.append(message)

    # ---------------------------------------------------------------- schema
    print("\n1. Schema")

    inspector = inspect(engine)
    columns = {c["name"]: c for c in inspector.get_columns("controls")}

    for name in (
        "sr_no", "control_domain", "control_desc", "control_code",
        "audit_type", "audit_category", "audit_subcategory",
        "primary_evidence", "secondary_evidence",
    ):
        check(name in columns, f"column '{name}' exists")

    for name in ("primary_evidence", "secondary_evidence"):
        if name in columns:
            type_name = str(columns[name]["type"]).upper()
            check("ARRAY" in type_name or "[]" in type_name,
                  f"'{name}' is an array (got {type_name})")

    with engine.connect() as conn:
        unique_indexes = conn.execute(text("""
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'controls'
              AND indexdef LIKE '%UNIQUE%'
        """)).scalars().all()

    check(
        unique_indexes == ["controls_pkey"],
        f"'id' is the only unique key (found: {unique_indexes or 'none'})",
    )

    has_scope_index = any(
        i["name"] == "ix_controls_scope"
        for i in inspector.get_indexes("controls")
    )
    check(has_scope_index, "lookup index 'ix_controls_scope' exists")

    # ------------------------------------------------------------------ data
    print("\n2. Row counts")

    with SessionLocal() as db:
        rows = db.query(Controls).all()

        by_category = Counter(r.audit_category for r in rows)
        for category, expected in EXPECTED_COUNTS.items():
            actual = by_category.get(category, 0)
            check(actual == expected,
                  f"{category}: {actual} controls (expected {expected})")

        parsed = load_all_controls()
        check(len(rows) >= len(parsed),
              f"table holds {len(rows)} rows, workbooks parse to {len(parsed)}")

        # ------------------------------------------------------- duplicates
        print("\n3. Duplicates")

        keys = Counter(
            (r.control_code, r.audit_type, r.audit_category, r.audit_subcategory)
            for r in rows
        )
        dupes = [k for k, n in keys.items() if n > 1]
        check(not dupes, f"no duplicate (code, scope) rows{'' if not dupes else f': {dupes[:5]}'}")

        # --------------------------------------------------- shared codes
        print("\n4. Shared codes across sheets")

        for code in SHARED_CODES:
            scopes = sorted({
                r.audit_category for r in rows if r.control_code == code
            })
            check(
                "PMS" in scopes and "AIF" in scopes,
                f"{code} present in both PMS and AIF (found: {scopes})",
            )

        # -------------------------------------------------------- evidence
        print("\n5. Evidence integrity")

        missing_primary = [
            r.control_code for r in rows if not r.primary_evidence
        ]
        check(not missing_primary,
              f"every control has primary evidence{'' if not missing_primary else f' (missing: {missing_primary[:5]})'}")

        # The canary: this cell has 2 evidence items but 4 commas. If it comes
        # back as 4 items, evidence got flattened into a delimited string
        # somewhere and re-split on commas.
        canary = next(
            (r for r in rows
             if r.control_code == "GV.RR.S3" and r.audit_category == "PMS"),
            None,
        )
        if canary is None:
            check(False, "canary control GV.RR.S3/PMS found")
        else:
            n = len(canary.secondary_evidence or [])
            check(n == 2,
                  f"GV.RR.S3/PMS secondary evidence has {n} items (expected 2, "
                  f"despite containing 4 commas)")
            print(f"         -> {canary.secondary_evidence}")

        blank_items = [
            r.control_code for r in rows
            if any(not item.strip() for item in (r.primary_evidence or []))
            or any(not item.strip() for item in (r.secondary_evidence or []))
        ]
        check(not blank_items, "no blank evidence items")

        # ------------------------------------------------ array queryability
        print("\n6. Array queries")

        hits = db.query(Controls).filter(
            Controls.primary_evidence.any("BCP")
        ).all()
        check(len(hits) >= 1,
              f"evidence-based lookup works ('BCP' -> {[h.control_code for h in hits]})")

        # ------------------------------------------------------------ order
        print("\n7. Ordering")

        aif = [r for r in rows if r.audit_category == "AIF"]
        aif_sorted = sorted(aif, key=lambda r: (r.sr_no or 0))
        check(
            [r.sr_no for r in aif_sorted] == list(range(1, len(aif) + 1)),
            "AIF sr_no runs 1..n with no gaps",
        )

    # --------------------------------------------------------------- summary
    print("\n" + "-" * 62)
    if failures:
        print(f"{len(failures)} check(s) FAILED:")
        for f in failures:
            print(f"  - {f}")
        return 1

    print("All checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())