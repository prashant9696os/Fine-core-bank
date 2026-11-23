
import secrets
import logging
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from prometheus_client import Counter

from app.core.dependencies import get_current_customer
from app.db.database import get_db
from app.models.entities import Account, Customer, Transaction
from app.services.email_service import send_notification_email


router = APIRouter(
    prefix="/accounts",
    tags=["Bank Accounts"],
)

logger = logging.getLogger(__name__)

# Prometheus metrics for successful banking transactions.
banking_transactions_total = Counter(
    "fincore_banking_transactions_total",
    "Total successful banking transactions by transaction type",
    ["transaction_type"],
)


class MoneyRequest(BaseModel):
    amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2,
    )


class TransferRequest(MoneyRequest):
    recipient_account_number: str = Field(
        min_length=3,
        max_length=30,
    )


def send_transaction_email(
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
            "Transaction email failed for customer ID %s",
            customer.id,
        )


def format_money(amount: Decimal, currency: str) -> str:
    return f"{currency} {amount:,.2f}"


@router.get("/me")
def get_my_account(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
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

    send_transaction_email(
        current_customer,
        "Fine Core Banking - Balance Statement",
        f"Hello {current_customer.full_name},\n\n"
        "Your balance enquiry was successful.\n\n"
        f"Account number: {account.account_number}\n"
        f"Available balance: {format_money(account.balance, account.currency)}\n"
        f"Account status: {account.status}\n"
        f"Date and time: {datetime.now().strftime('%d-%m-%Y %H:%M:%S')}\n\n"
        "Thank you for banking with Fine Core.",
    )

    return {
        "account_number": account.account_number,
        "balance": account.balance,
        "currency": account.currency,
        "status": account.status,
        "created_at": account.created_at,
    }


@router.post("/deposit")
def deposit_money(
    data: MoneyRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    try:
        account = db.scalar(
            select(Account)
            .where(Account.customer_id == current_customer.id)
            .with_for_update()
        )

        if not account:
            raise HTTPException(
                status_code=404,
                detail="Bank account not found.",
            )

        if account.status != "active":
            raise HTTPException(
                status_code=400,
                detail="Your bank account is not active.",
            )

        account.balance += data.amount

        transaction = Transaction(
            reference="FC" + secrets.token_hex(10).upper(),
            sender_account_id=None,
            recipient_account_id=account.id,
            transaction_type="deposit",
            amount=data.amount,
            currency=account.currency,
            status="completed",
            description="Cash deposit",
        )

        db.add(transaction)
        db.commit()

        # Count only after the database transaction succeeds.
        banking_transactions_total.labels(
            transaction_type="deposit"
        ).inc()

        db.refresh(account)
        db.refresh(transaction)

        response = {
            "message": "Money deposited successfully.",
            "transaction_reference": transaction.reference,
            "deposited_amount": transaction.amount,
            "new_balance": account.balance,
            "currency": account.currency,
        }

        send_transaction_email(
            current_customer,
            "Fine Core Banking - Deposit Successful",
            f"Hello {current_customer.full_name},\n\n"
            "Your deposit was successful.\n\n"
            f"Amount deposited: {format_money(transaction.amount, account.currency)}\n"
            f"Account number: {account.account_number}\n"
            f"Updated balance: {format_money(account.balance, account.currency)}\n"
            f"Transaction reference: {transaction.reference}\n"
            f"Date and time: {transaction.created_at}\n\n"
            "Thank you for banking with Fine Core.",
        )

        return response

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Deposit failed. Please try again.",
        ) from exc


@router.post("/withdraw")
def withdraw_money(
    data: MoneyRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    try:
        account = db.scalar(
            select(Account)
            .where(Account.customer_id == current_customer.id)
            .with_for_update()
        )

        if not account:
            raise HTTPException(
                status_code=404,
                detail="Bank account not found.",
            )

        if account.status != "active":
            raise HTTPException(
                status_code=400,
                detail="Your bank account is not active.",
            )

        if account.balance < data.amount:
            raise HTTPException(
                status_code=400,
                detail="Insufficient balance.",
            )

        account.balance -= data.amount

        transaction = Transaction(
            reference="FC" + secrets.token_hex(10).upper(),
            sender_account_id=account.id,
            recipient_account_id=None,
            transaction_type="withdrawal",
            amount=data.amount,
            currency=account.currency,
            status="completed",
            description="Cash withdrawal",
        )

        db.add(transaction)
        db.commit()

        banking_transactions_total.labels(
            transaction_type="withdrawal"
        ).inc()

        db.refresh(account)
        db.refresh(transaction)

        response = {
            "message": "Money withdrawn successfully.",
            "transaction_reference": transaction.reference,
            "withdrawn_amount": transaction.amount,
            "new_balance": account.balance,
            "currency": account.currency,
        }

        send_transaction_email(
            current_customer,
            "Fine Core Banking - Withdrawal Successful",
            f"Hello {current_customer.full_name},\n\n"
            "Your withdrawal was successful.\n\n"
            f"Amount withdrawn: {format_money(transaction.amount, account.currency)}\n"
            f"Account number: {account.account_number}\n"
            f"Remaining balance: {format_money(account.balance, account.currency)}\n"
            f"Transaction reference: {transaction.reference}\n"
            f"Date and time: {transaction.created_at}\n\n"
            "Thank you for banking with Fine Core.",
        )

        return response

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Withdrawal failed. Please try again.",
        ) from exc


@router.post("/transfer")
def transfer_money(
    data: TransferRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db),
):
    try:
        sender = db.scalar(
            select(Account).where(
                Account.customer_id == current_customer.id
            )
        )

        if not sender:
            raise HTTPException(
                status_code=404,
                detail="Your bank account was not found.",
            )

        recipient = db.scalar(
            select(Account).where(
                Account.account_number
                == data.recipient_account_number.strip()
            )
        )

        if not recipient:
            raise HTTPException(
                status_code=404,
                detail="Recipient account was not found.",
            )

        if sender.id == recipient.id:
            raise HTTPException(
                status_code=400,
                detail="You cannot transfer money to your own account.",
            )

        # Lock both accounts in a consistent order to reduce deadlock risk.
        accounts = db.scalars(
            select(Account)
            .where(Account.id.in_([sender.id, recipient.id]))
            .order_by(Account.id)
            .with_for_update()
        ).all()

        locked_accounts = {
            account.id: account for account in accounts
        }

        sender = locked_accounts.get(sender.id)
        recipient = locked_accounts.get(recipient.id)

        if not sender or not recipient:
            raise HTTPException(
                status_code=404,
                detail="One of the bank accounts was not found.",
            )

        if sender.status != "active" or recipient.status != "active":
            raise HTTPException(
                status_code=400,
                detail="Both bank accounts must be active.",
            )

        if sender.currency != recipient.currency:
            raise HTTPException(
                status_code=400,
                detail="Transfers between different currencies are not supported.",
            )

        if sender.balance < data.amount:
            raise HTTPException(
                status_code=400,
                detail="Insufficient balance.",
            )

        recipient_customer = db.scalar(
            select(Customer).where(
                Customer.id == recipient.customer_id
            )
        )

        if not recipient_customer:
            raise HTTPException(
                status_code=404,
                detail="Recipient customer was not found.",
            )

        sender.balance -= data.amount
        recipient.balance += data.amount

        transaction = Transaction(
            reference="FC" + secrets.token_hex(10).upper(),
            sender_account_id=sender.id,
            recipient_account_id=recipient.id,
            transaction_type="transfer",
            amount=data.amount,
            currency=sender.currency,
            status="completed",
            description="Account-to-account transfer",
        )

        db.add(transaction)
        db.commit()

        banking_transactions_total.labels(
            transaction_type="transfer"
        ).inc()

        db.refresh(sender)
        db.refresh(recipient)
        db.refresh(transaction)

        amount_text = format_money(
            transaction.amount,
            sender.currency,
        )

        send_transaction_email(
            current_customer,
            "Fine Core Banking - Transfer Successful",
            f"Hello {current_customer.full_name},\n\n"
            "Your money transfer was successful.\n\n"
            f"Amount transferred: {amount_text}\n"
            f"Recipient account: {recipient.account_number}\n"
            f"Remaining balance: {format_money(sender.balance, sender.currency)}\n"
            f"Transaction reference: {transaction.reference}\n"
            f"Date and time: {transaction.created_at}\n\n"
            "Thank you for banking with Fine Core.",
        )

        send_transaction_email(
            recipient_customer,
            "Fine Core Banking - Money Received",
            f"Hello {recipient_customer.full_name},\n\n"
            "You have received a bank transfer.\n\n"
            f"Amount received: {amount_text}\n"
            f"Your account number: {recipient.account_number}\n"
            f"Updated balance: {format_money(recipient.balance, recipient.currency)}\n"
            f"Transaction reference: {transaction.reference}\n"
            f"Date and time: {transaction.created_at}\n\n"
            "Thank you for banking with Fine Core.",
        )

        return {
            "message": "Money transferred successfully.",
            "transaction_reference": transaction.reference,
            "recipient_account_number": recipient.account_number,
            "transferred_amount": transaction.amount,
            "sender_new_balance": sender.balance,
            "currency": sender.currency,
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Transfer failed. Please try again.",
        ) from exc
