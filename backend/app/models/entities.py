
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    mobile: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False
    )
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    gender: Mapped[str] = mapped_column(String(30), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    account: Mapped["Account | None"] = relationship(
        back_populates="customer",
        uselist=False,
    )


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    account_number: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False
    )
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id"), unique=True, nullable=False
    )
    balance: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), default=Decimal("0.00"), nullable=False
    )
    currency: Mapped[str] = mapped_column(
        String(3), default="INR", nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    customer: Mapped["Customer"] = relationship(back_populates="account")

    outgoing_transactions: Mapped[list["Transaction"]] = relationship(
        foreign_keys="Transaction.sender_account_id",
        back_populates="sender_account",
    )
    incoming_transactions: Mapped[list["Transaction"]] = relationship(
        foreign_keys="Transaction.recipient_account_id",
        back_populates="recipient_account",
    )


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("ix_transactions_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    reference: Mapped[str] = mapped_column(
        String(40), unique=True, index=True, nullable=False
    )
    sender_account_id: Mapped[int | None] = mapped_column(
        ForeignKey("accounts.id"), nullable=True
    )
    recipient_account_id: Mapped[int | None] = mapped_column(
        ForeignKey("accounts.id"), nullable=True
    )
    transaction_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False
    )
    currency: Mapped[str] = mapped_column(
        String(3), default="INR", nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="completed", nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    sender_account: Mapped["Account | None"] = relationship(
        foreign_keys=[sender_account_id],
        back_populates="outgoing_transactions",
    )
    recipient_account: Mapped["Account | None"] = relationship(
        foreign_keys=[recipient_account_id],
        back_populates="incoming_transactions",
    )


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(
        ForeignKey("customers.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )


class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    __table_args__ = (
        Index(
            "ix_beneficiaries_customer_account",
            "customer_id",
            "account_number",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id"),
        nullable=False,
    )
    beneficiary_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    account_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    bank_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
