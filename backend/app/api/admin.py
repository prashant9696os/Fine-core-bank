
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_customer
from app.db.database import get_db
from app.models.entities import Account, AuditLog, Customer, Transaction
from app.api.loans import Loan
from app.services.email_service import send_notification_email

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"],
)


def require_admin(
    current_customer: Customer = Depends(get_current_customer),
):
    if not current_customer.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )
    return current_customer


def send_loan_status_email(
    customer: Customer,
    loan: Loan,
) -> None:
    try:
        send_notification_email(
            customer.email,
            f"Fine Core Banking - Loan {loan.status.title()}",
            f"Hello {customer.full_name},\n\n"
            f"Your loan application has been {loan.status}.\n\n"
            f"Loan ID: {loan.id}\n"
            f"Loan amount: INR {loan.amount:,.2f}\n"
            f"Purpose: {loan.purpose}\n"
            f"Loan term: {loan.term_months} months\n"
            f"Status: {loan.status.title()}\n\n"
            "Thank you for banking with Fine Core.",
        )
    except Exception:
        logger.exception(
            "Loan status email failed for customer ID %s",
            customer.id,
        )


@router.get("/customers")
def get_all_customers(
    admin: Customer = Depends(require_admin),
    db: Session = Depends(get_db),
):
    customers = db.scalars(
        select(Customer).order_by(Customer.id.desc())
    ).all()

    return {
        "total_customers": len(customers),
        "customers": [
            {
                "id": customer.id,
                "full_name": customer.full_name,
                "email": customer.email,
                "mobile": customer.mobile,
                "is_verified": customer.is_verified,
                "is_active": customer.is_active,
                "is_admin": customer.is_admin,
                "created_at": customer.created_at,
            }
            for customer in customers
        ],
    }


@router.get("/accounts")
def get_all_accounts(
    admin: Customer = Depends(require_admin),
    db: Session = Depends(get_db),
):
    accounts = db.scalars(
        select(Account).order_by(Account.id.desc())
    ).all()

    return {
        "total_accounts": len(accounts),
        "accounts": [
            {
                "id": account.id,
                "customer_id": account.customer_id,
                "account_number": account.account_number,
                "balance": account.balance,
                "currency": account.currency,
                "status": account.status,
                "created_at": account.created_at,
            }
            for account in accounts
        ],
    }


@router.get("/transactions")
def get_all_transactions(
    admin: Customer = Depends(require_admin),
    db: Session = Depends(get_db),
):
    transactions = db.scalars(
        select(Transaction).order_by(Transaction.id.desc())
    ).all()

    return {
        "total_transactions": len(transactions),
        "transactions": [
            {
                "id": transaction.id,
                "reference": transaction.reference,
                "sender_account_id": transaction.sender_account_id,
                "recipient_account_id": transaction.recipient_account_id,
                "transaction_type": transaction.transaction_type,
                "amount": transaction.amount,
                "currency": transaction.currency,
                "status": transaction.status,
                "description": transaction.description,
                "created_at": transaction.created_at,
            }
            for transaction in transactions
        ],
    }


@router.get("/loans")
def get_all_loan_applications(
    admin: Customer = Depends(require_admin),
    db: Session = Depends(get_db),
):
    loans = db.scalars(
        select(Loan).order_by(Loan.id.desc())
    ).all()

    return {
        "total_loans": len(loans),
        "loans": [
            {
                "loan_id": loan.id,
                "customer_id": loan.customer_id,
                "amount": loan.amount,
                "purpose": loan.purpose,
                "term_months": loan.term_months,
                "status": loan.status,
                "applied_on": loan.applied_on,
            }
            for loan in loans
        ],
    }


@router.patch("/loans/{loan_id}/{decision}")
def decide_loan(
    loan_id: int,
    decision: str,
    admin: Customer = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if decision not in ("approve", "reject"):
        raise HTTPException(
            status_code=400,
            detail="Decision must be approve or reject.",
        )

    loan = db.scalar(
        select(Loan).where(Loan.id == loan_id)
    )

    if not loan:
        raise HTTPException(
            status_code=404,
            detail="Loan application not found.",
        )

    if loan.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="This loan application has already been reviewed.",
        )

    customer = db.get(Customer, loan.customer_id)

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Loan applicant not found.",
        )

    loan.status = "approved" if decision == "approve" else "rejected"

    db.add(
        AuditLog(
            customer_id=admin.id,
            action=f"loan_{decision}",
            details=f"Loan ID {loan.id}; customer ID {loan.customer_id}",
        )
    )

    db.commit()
    db.refresh(loan)

    send_loan_status_email(customer, loan)

    return {
        "message": f"Loan application {loan.status}.",
        "loan_id": loan.id,
        "status": loan.status,
    }


@router.get("/audit-logs")
def get_audit_logs(
    admin: Customer = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.scalars(
        select(AuditLog).order_by(AuditLog.id.desc())
    ).all()

    return {
        "total_logs": len(logs),
        "audit_logs": [
            {
                "id": log.id,
                "customer_id": log.customer_id,
                "action": log.action,
                "details": log.details,
                "created_at": log.created_at,
            }
            for log in logs
        ],
    }


@router.patch("/customers/{customer_id}/deactivate")
def deactivate_customer(
    customer_id: int,
    admin: Customer = Depends(require_admin),
    db: Session = Depends(get_db),
):
    customer = db.scalar(
        select(Customer).where(Customer.id == customer_id)
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found.",
        )

    if customer.id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account.",
        )

    customer.is_active = False

    db.add(
        AuditLog(
            customer_id=admin.id,
            action="customer_deactivated",
            details=f"Customer ID {customer.id}",
        )
    )

    db.commit()

    return {
        "message": "Customer deactivated successfully.",
        "customer_id": customer.id,
        "is_active": customer.is_active,
    }
