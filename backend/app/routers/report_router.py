from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database_dependency import get_db
from app.models.user import User
from app.services import report_service
from app.utils.security import get_current_user

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)

DOCX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


@router.get("/generate/{framework_id}")
def generate_audit_report(
    framework_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a .docx audit report for the given audit framework.

    Requires a valid JWT (Authorization: Bearer <token>). Admins may generate
    any report; auditors only for audits they are assigned to; clients are
    not permitted. The file is returned as a downloadable attachment.
    """
    file_buffer, file_name = report_service.generate_report(db, framework_id, current_user)

    return StreamingResponse(
        file_buffer,
        media_type=DOCX_MEDIA_TYPE,
        headers={
            "Content-Disposition": f'attachment; filename="{file_name}"',
            # Lets the browser JS read the filename from a cross-origin response.
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )