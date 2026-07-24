from dotenv import load_dotenv
import os

# Load variables from .env
load_dotenv()

# Read DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

# JWT Configuration (used later for authentication)
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))