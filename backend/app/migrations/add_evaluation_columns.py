"""
One-time migration: Add evaluation columns to controls & audit_control tables.

Run this ONCE against your existing database:
    python -m app.migrations.add_evaluation_columns

Safe to re-run — every ALTER TABLE uses IF NOT EXISTS (via exception handling).
"""
from sqlalchemy import text
from app.database import engine


MIGRATION_STATEMENTS = [
    # ── controls table: 3 new static/report columns ──
    "ALTER TABLE controls ADD COLUMN IF NOT EXISTS system_entity VARCHAR",
    "ALTER TABLE controls ADD COLUMN IF NOT EXISTS cia_classification VARCHAR",
    "ALTER TABLE controls ADD COLUMN IF NOT EXISTS test_procedure VARCHAR",

    # ── audit_control table: dynamic evaluation columns ──
    "ALTER TABLE audit_control ADD COLUMN IF NOT EXISTS compliance_status VARCHAR",
    "ALTER TABLE audit_control ADD COLUMN IF NOT EXISTS risk_rating VARCHAR",
    "ALTER TABLE audit_control ADD COLUMN IF NOT EXISTS similar_issue BOOLEAN",

    # ── audit_control table: observation columns & AI notes ──
    "ALTER TABLE audit_control ADD COLUMN IF NOT EXISTS root_cause_analysis TEXT",
    "ALTER TABLE audit_control ADD COLUMN IF NOT EXISTS impact_analysis TEXT",
    "ALTER TABLE audit_control ADD COLUMN IF NOT EXISTS recommendation TEXT",
    "ALTER TABLE audit_control ADD COLUMN IF NOT EXISTS remediation_days INTEGER",
    "ALTER TABLE audit_control ADD COLUMN IF NOT EXISTS management_response TEXT",
    "ALTER TABLE audit_control ADD COLUMN IF NOT EXISTS ai_notes TEXT",
]


def run_migration():
    print("[Migration] Adding evaluation columns...")
    with engine.begin() as conn:
        for stmt in MIGRATION_STATEMENTS:
            try:
                conn.execute(text(stmt))
                col_name = stmt.split("ADD COLUMN IF NOT EXISTS ")[1].split(" ")[0]
                table_name = stmt.split("ALTER TABLE ")[1].split(" ")[0]
                print(f"  ✓ {table_name}.{col_name}")
            except Exception as e:
                print(f"  ⚠ Skipped (may already exist): {e}")
    print("[Migration] Done.")


if __name__ == "__main__":
    run_migration()
