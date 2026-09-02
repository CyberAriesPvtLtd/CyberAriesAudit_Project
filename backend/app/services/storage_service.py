"""
Thin wrapper around the MinIO SDK. All evidence-storage code talks to MinIO
only through this module - nothing else imports the minio package directly.

MinIO speaks the S3 API, so if this project ever moves from self-hosted
MinIO to AWS S3 (or any other S3-compatible provider), only the MINIO_*
values in config.py / .env change. This file, the database schema, and
every route that calls it stay exactly the same.
"""

from datetime import timedelta
from minio import Minio
from minio.error import S3Error

from app.config import (
    MINIO_ENDPOINT,
    MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY,
    MINIO_BUCKET,
    MINIO_SECURE,
)

_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE,
)


def ensure_bucket_exists():
    """Called once at app startup. Safe to call repeatedly."""
    if not _client.bucket_exists(MINIO_BUCKET):
        _client.make_bucket(MINIO_BUCKET)


def build_storage_key(company_id: str, evidence_item_id: str, file_name: str) -> str:
    """
    Company-scoped key prefix. This is the tenant-isolation boundary: every
    object lives under its owning company's id, so listing or presigning
    always happens within one company's namespace.
    """
    safe_name = file_name.replace("/", "_").replace("\\", "_")
    return f"evidence/{company_id}/{evidence_item_id}/{safe_name}"


def get_presigned_upload_url(storage_key: str, expires_minutes: int = 15) -> str:
    """
    Returns a URL the client can PUT the file bytes to directly, without the
    file passing through the FastAPI server. Preferred for evidence uploads
    since files can be up to 100MB (see ControlDetails.jsx's existing limit).
    """
    return _client.presigned_put_object(
        MINIO_BUCKET,
        storage_key,
        expires=timedelta(minutes=expires_minutes),
    )


def get_presigned_download_url(storage_key: str, expires_minutes: int = 15) -> str:
    """Returns a temporary, authenticated URL for viewing/downloading a file."""
    return _client.presigned_get_object(
        MINIO_BUCKET,
        storage_key,
        expires=timedelta(minutes=expires_minutes),
    )


def delete_object(storage_key: str):
    try:
        _client.remove_object(MINIO_BUCKET, storage_key)
    except S3Error as e:
        # Object already gone is not an error worth surfacing to the caller.
        if e.code != "NoSuchKey":
            raise


def object_exists(storage_key: str) -> bool:
    try:
        _client.stat_object(MINIO_BUCKET, storage_key)
        return True
    except S3Error:
        return False