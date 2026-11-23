from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    account_number: str
    balance: Decimal
    currency: str
    status: str
    created_at: datetime


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    sender_account_id: int | None
    recipient_account_id: int | None
    transaction_type: str
    amount: Decimal
    currency: str
    status: str
    description: str | None
    created_at: datetime