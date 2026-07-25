from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database_dependency import get_db
from app.schemas.company_schema import CompanyCreate, CompanyResponse
from app.services.company_service import (
    create_company,
    get_all_companies,
    get_company_by_id,
    update_company,
    delete_company,
)

router = APIRouter(
    prefix="/company",
    tags=["Company"]
)


@router.post("/", response_model=CompanyResponse)
def add_company(
    company: CompanyCreate,
    db: Session = Depends(get_db)
):
    return create_company(db, company)


@router.get("/", response_model=list[CompanyResponse])
def fetch_companies(
    db: Session = Depends(get_db)
):
    return get_all_companies(db)


@router.get("/{company_id}", response_model=CompanyResponse)
def fetch_company(
    company_id: str,
    db: Session = Depends(get_db)
):
    return get_company_by_id(db, company_id)


@router.put("/{company_id}", response_model=CompanyResponse)
def edit_company(
    company_id: str,
    company: CompanyCreate,
    db: Session = Depends(get_db)
):
    return update_company(db, company_id, company)

@router.delete("/{company_id}")
def remove_company(
    company_id: str,
    db: Session = Depends(get_db)
):
    return delete_company(db, company_id)