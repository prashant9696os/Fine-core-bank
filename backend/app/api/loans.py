
import logging
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import Date, ForeignKey, Numeric, String, select
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.core.dependencies import get_current_customer
from app.db.database import Base, get_db
from app.models.entities import Customer
from app.services.email_service import send_notification_email

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/loans",
    tags=["Loan Management"],
)


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        nullable=False,
    )
    purpose: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )
    term_months: Mapped[int] = mapped_column(
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False,
    )
    applied_on: Mapped[date] = mapped_column(
        Date,
        default=date.today,
    )


class LoanApplication(BaseModel):
    amount: Decimal = Field(
        gt=0,
        le=Decimal("10000000"),
        max_digits=12,
        decimal_places=2,
    )
    purpose: str = Field(
        min_length=3,
        max_length=200,
    )
    term_months: int = Field(
        ge=1,
        le=360,
    )


def send_loan_notification(
    customer: Customer,
    subject: str,
    message: str,
) -> None:
    try:
        send_notification_email(
            customer.email,
            subject,
            message,
        )
    except Exception:
        logger.exception(
            "Loan notification email failed for customer ID %s",
            customer.id,
        )


@router.post("/apply")
def apply_for_loan(
    data: LoanApplication,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    loan = Loan(
        customer_id=current_customer.id,
        amount=data.amount,
        purpose=data.purpose.strip(),
        term_months=data.term_months,
    )

    try:
        db.add(loan)
        db.commit()
        db.refresh(loan)
    except Exception as exc:
        db.rollback()
        logger.exception("Loan application could not be saved")
        raise HTTPException(
            status_code=500,
            detail="Loan application failed. Please try again.",
        ) from exc

    send_loan_notification(
        current_customer,
        "Fine Core Banking - Loan Application Submitted",
        f"Hello {current_customer.full_name},\n\n"
        "Your loan application has been submitted successfully.\n\n"
        f"Loan ID: {loan.id}\n"
        f"Amount: INR {loan.amount:,.2f}\n"
        f"Purpose: {loan.purpose}\n"
        f"Loan term: {loan.term_months} months\n"
        f"Status: {loan.status}\n"
        f"Applied on: {loan.applied_on}\n\n"
        "We will notify you when your application status changes.\n\n"
        "Thank you for banking with Fine Core.",
    )

    return {
        "message": "Loan application submitted successfully.",
        "loan_id": loan.id,
        "amount": loan.amount,
        "purpose": loan.purpose,
        "term_months": loan.term_months,
        "status": loan.status,
    }


@router.get("/me")
def get_my_loans(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    loans = db.scalars(
        select(Loan)
        .where(Loan.customer_id == current_customer.id)
        .order_by(Loan.id.desc())
    ).all()

    return {
        "total_loans": len(loans),
        "loans": [
            {
                "loan_id": loan.id,
                "amount": loan.amount,
                "purpose": loan.purpose,
                "term_months": loan.term_months,
                "status": loan.status,
                "applied_on": loan.applied_on,
            }
            for loan in loans
        ],
    }
