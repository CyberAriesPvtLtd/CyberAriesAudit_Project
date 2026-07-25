from fastapi import FastAPI
from sqlalchemy import text

from app.database import Base, engine

# Import Models
from app.models import (
    Company,
    User,
    AuditFramework,
    Controls,
    AuditControl,
    EvidenceFiles,
)

# Import Routers
from app.routers.company_router import router as company_router
from app.routers.user_router import router as user_router
from app.routers.audit_framework_router import router as audit_framework_router
from app.routers.controls_router import router as controls_router
from app.routers.audit_control_router import router as audit_control_router
from app.routers.evidence_files_router import router as evidence_files_router

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Aries Audit Backend",
    version="1.0.0"
)

# Register Routers
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