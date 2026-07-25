from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.company import Company


def create_company(db: Session, company_data):

    existing_company = db.query(Company).filter(
        Company.company_name == company_data.company_name
    ).first()

    if existing_company:
        raise HTTPException(
            status_code=400,
            detail="Company already exists"
        )

    company = Company(
        company_name=company_data.company_name,
        registration_no=company_data.registration_no
    )

    db.add(company)
    db.commit()
    db.refresh(company)

    return company


def get_all_companies(db: Session):
    return db.query(Company).all()


def get_company_by_id(db: Session, company_id: str):

    company = db.query(Company).filter(
        Company.id == company_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    return company


def update_company(db: Session, company_id: str, company_data):

    company = db.query(Company).filter(
        Company.id == company_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    company.company_name = company_data.company_name
    company.registration_no = company_data.registration_no

    db.commit()
    db.refresh(company)

    return company

def delete_company(db: Session, company_id: str):

    company = db.query(Company).filter(
        Company.id == company_id
    ).first()

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )

    db.delete(company)
    db.commit()

    return {"message": "Company deleted successfully"}