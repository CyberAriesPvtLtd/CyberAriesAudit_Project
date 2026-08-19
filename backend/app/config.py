from dotenv import load_dotenv
import os

# Load variables from .env
load_dotenv()

# Read DATABASE_URL for PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in the environment.")

# JWT Configuration (used later for authentication)
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY is not set in the environment.")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Admin Default Credentials
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_DEFAULT_PASSWORD = os.getenv("ADMIN_DEFAULT_PASSWORD")

# MinIO / S3-compatible object storage configuration.
# Kept as plain env-driven config (not vendor-specific) so switching from
# self-hosted MinIO to AWS S3 later only means changing these values -
# the S3-compatible API means storage_service.py does not need to change.
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "evidence")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

if not MINIO_ACCESS_KEY or not MINIO_SECRET_KEY:
    raise ValueError("MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be set in the environment.")
