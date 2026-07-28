import os
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.utils.security import get_password_hash
from app.config import ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD

def seed_default_admin(db: Session):
    # Check if any admin exists
    admin_exists = db.query(User).filter(User.role == UserRole.ADMIN).first()
    
    if not admin_exists:
        print("[CyberAries] No admin found. Seeding default admin user...")
        
        if not ADMIN_EMAIL or not ADMIN_DEFAULT_PASSWORD:
            raise ValueError("ADMIN_EMAIL and ADMIN_DEFAULT_PASSWORD must be set in .env to seed the database.")
        
        hashed_password = get_password_hash(ADMIN_DEFAULT_PASSWORD)
        
        default_admin = User(
            name="Administrator",
            email_id=ADMIN_EMAIL,
            username="admin",
            password=hashed_password,
            role=UserRole.ADMIN,
            must_change_password=False,
            company_id=None
        )
        
        db.add(default_admin)
        db.commit()
        db.refresh(default_admin)
        print(f"[CyberAries] Default admin seeded successfully. ID: {default_admin.id}")
        print(f"[CyberAries] Login with username 'admin' and the default password to continue.")
    else:
        print("[CyberAries] Admin user already exists. Skipping seed.")
