from pydantic import BaseModel


class CompanyCreate(BaseModel):
    company_name: str
    registration_no: str


class CompanyResponse(BaseModel):
    id: str
    company_name: str
    registration_no: str

    class Config:
        from_attributes = True