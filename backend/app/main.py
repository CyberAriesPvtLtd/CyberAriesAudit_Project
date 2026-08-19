from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine, SessionLocal
from app.utils.seed import seed_default_admin
from app.utils.seed_controls import seed_controls
from app.services.storage_service import ensure_bucket_exists

# Import Models
from app.models import (
    Company,
    User,
    AuditFramework,
    Controls,
    AuditControl,
    EvidenceType,
    ControlsEvidenceType,
    EvidenceItem,
    AuditControlEvidence,
)

# Import Routers
from app.routers.company_router import router as company_router
from app.routers.user_router import router as user_router
from app.routers.auth_router import router as auth_router
from app.routers.audit_framework_router import router as audit_framework_router
from app.routers.controls_router import router as controls_router
from app.routers.audit_control_router import router as audit_control_router
from app.routers.evidence_files_router import router as evidence_files_router

# Create all database tables
Base.metadata.create_all(bind=engine)

# Seed default admin user and controls if empty
with SessionLocal() as db:
    seed_default_admin(db)
    
    # Automatically seed controls if the table is empty
    if not db.query(Controls).first():
        print("[CyberAries] Controls table is empty. Auto-seeding from Excel files...")
        seed_controls(db)
    else:
        print("[CyberAries] Controls table already populated. Skipping auto-seed.")


# Make sure the MinIO bucket for evidence files exists before accepting uploads
ensure_bucket_exists()

# Make sure the MinIO bucket for evidence files exists before accepting uploads
ensure_bucket_exists()

app = FastAPI(
    title="Aries Audit Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(company_router)
app.include_router(user_router)
app.include_router(audit_framework_router)
app.include_router(controls_router)
app.include_router(audit_control_router)
app.include_router(evidence_files_router)


@app.get("/")
def home():
    return {
        "message": "Aries Audit Backend is Running"
    }


@app.get("/test-db")
def test_db():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "message": "PostgreSQL Connected Successfully"
        }
    except Exception as e:
        return {
            "error": str(e)
        }