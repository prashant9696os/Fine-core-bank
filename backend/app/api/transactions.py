
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_customer
from app.db.database import get_db
from app.models.entities import Account, Customer, Transaction


router = APIRouter(
    prefix="/transactions",
    tags=["Transaction History"],
)


def get_customer_account(
    current_customer: Customer,
    db: Session,
):
    account = db.scalar(
        select(Account).where(
            Account.customer_id == current_customer.id
        )
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Bank account not found.",
        )

    return account


def serialize_transaction(transaction, account_id):
    direction = (
        "debit"
        if transaction.sender_account_id == account_id
        else "credit"
    )

    return {
        "reference": transaction.reference,
        "type": transaction.transaction_type,
        "direction": direction,
        "amount": transaction.amount,
        "currency": transaction.currency,
        "status": transaction.status,
        "description": transaction.description,
        "created_at": transaction.created_at,
    }


@router.get("/me")
def get_my_transactions(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    account = get_customer_account(current_customer, db)

    transactions = db.scalars(
        select(Transaction)
        .where(
            or_(
                Transaction.sender_account_id == account.id,
                Transaction.recipient_account_id == account.id,
            )
        )
        .order_by(Transaction.created_at.desc())
    ).all()

    history = [
        serialize_transaction(transaction, account.id)
        for transaction in transactions
    ]

    return {
        "account_number": account.account_number,
        "total_transactions": len(history),
        "transactions": history,
    }


@router.get("/recent")
def get_recent_transactions(
    limit: int = Query(default=5, ge=1, le=50),
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    account = get_customer_account(current_customer, db)

    transactions = db.scalars(
        select(Transaction)
        .where(
            or_(
                Transaction.sender_account_id == account.id,
                Transaction.recipient_account_id == account.id,
            )
        )
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    ).all()

    return {
        "account_number": account.account_number,
        "total_transactions": len(transactions),
        "transactions": [
            serialize_transaction(transaction, account.id)
            for transaction in transactions
        ],
    }
