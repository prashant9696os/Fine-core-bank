
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.entities import Account, Beneficiary
from app.core.dependencies import get_current_customer

router = APIRouter(prefix="/beneficiaries", tags=["Beneficiaries"])


class BeneficiaryCreate(BaseModel):
    beneficiary_name: str = Field(min_length=2, max_length=100)
    account_number: str = Field(min_length=1, max_length=20)
    bank_name: str = Field(min_length=2, max_length=100)


@router.get("/")
def get_beneficiaries(
    db: Session = Depends(get_db),
    customer=Depends(get_current_customer),
):
    return (
        db.query(Beneficiary)
        .filter(Beneficiary.customer_id == customer.id)
        .order_by(Beneficiary.created_at.desc())
        .all()
    )


@router.post("/")
def add_beneficiary(
    data: BeneficiaryCreate,
    db: Session = Depends(get_db),
    customer=Depends(get_current_customer),
):
    account_number = data.account_number.strip()

    if customer.account and customer.account.account_number == account_number:
        raise HTTPException(
            status_code=400,
            detail="You cannot add your own account as a beneficiary.",
        )

    existing = (
        db.query(Beneficiary)
        .filter(
            Beneficiary.customer_id == customer.id,
            Beneficiary.account_number == account_number,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="This beneficiary already exists.",
        )

    beneficiary = Beneficiary(
        customer_id=customer.id,
        beneficiary_name=data.beneficiary_name.strip(),
        account_number=account_number,
        bank_name=data.bank_name.strip(),
    )

    db.add(beneficiary)
    db.commit()
    db.refresh(beneficiary)

    return {
        "message": "Beneficiary added successfully.",
        "beneficiary": beneficiary,
    }


@router.delete("/{beneficiary_id}")
def delete_beneficiary(
    beneficiary_id: int,
    db: Session = Depends(get_db),
    customer=Depends(get_current_customer),
):
    beneficiary = (
        db.query(Beneficiary)
        .filter(
            Beneficiary.id == beneficiary_id,
            Beneficiary.customer_id == customer.id,
        )
        .first()
    )

    if not beneficiary:
        raise HTTPException(
            status_code=404,
            detail="Beneficiary not found.",
        )

    db.delete(beneficiary)
    db.commit()

    return {"message": "Beneficiary deleted successfully."}
