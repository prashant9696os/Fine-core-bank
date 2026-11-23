
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_customer
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.database import get_db
from app.models.entities import Account, Customer, EmailOTP
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    OTPResendRequest,
    OTPVerifyRequest,
    RegisterRequest,
    SendOTPRequest,
    TokenResponse,
)
from app.services.email_service import (
    send_otp_email,
    send_account_created_email,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def create_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def create_otp_record(email: str, otp: str) -> EmailOTP:
    return EmailOTP(
        email=email,
        otp_hash=hash_password(otp),
        expires_at=datetime.now(timezone.utc)
        + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        attempts=0,
        is_used=False,
    )


def invalidate_previous_otps(db: Session, email: str) -> None:
    previous_otps = db.scalars(
        select(EmailOTP).where(
            EmailOTP.email == email,
            EmailOTP.is_used.is_(False),
        )
    ).all()

    for previous_otp in previous_otps:
        previous_otp.is_used = True


def deliver_otp(db: Session, email: str) -> None:
    otp = create_otp()

    invalidate_previous_otps(db, email)
    db.add(create_otp_record(email, otp))
    db.flush()

    send_otp_email(email, otp)
    db.commit()


@router.post("/send-otp", response_model=MessageResponse)
def send_otp_to_any_email(
    data: SendOTPRequest,
    db: Session = Depends(get_db),
):
    email = str(data.email).strip().lower()

    try:
        deliver_otp(db, email)
    except Exception as exc:
        db.rollback()
        logger.exception("OTP email delivery failed for %s", email)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not send OTP. Check the email service.",
        ) from exc

    return {
        "message": "OTP sent successfully. Please check your email."
    }


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    email = str(data.email).strip().lower()
    mobile = data.mobile.strip()

    existing_customer = db.scalar(
        select(Customer).where(
            (Customer.email == email) | (Customer.mobile == mobile)
        )
    )

    if existing_customer:
        if (
            existing_customer.email == email
            and not existing_customer.is_verified
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This email is already registered but not verified. "
                    "Use /auth/resend-otp to receive a new OTP."
                ),
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or mobile number is already registered.",
        )

    customer = Customer(
        full_name=data.full_name.strip(),
        email=email,
        mobile=mobile,
        address=data.address.strip(),
        gender=data.gender.strip(),
        password_hash=hash_password(data.password),
        is_verified=False,
        is_admin=False,
        is_active=True,
    )

    try:
        db.add(customer)
        db.flush()
        deliver_otp(db, email)

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or mobile number is already registered.",
        ) from exc

    except Exception as exc:
        db.rollback()
        logger.exception("Registration or OTP delivery failed for %s", email)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not complete registration or send the OTP.",
        ) from exc

    return {
        "message": "Registration successful. Check your email for the OTP."
    }


@router.post("/resend-otp", response_model=MessageResponse)
def resend_otp(data: OTPResendRequest, db: Session = Depends(get_db)):
    email = str(data.email).strip().lower()

    try:
        deliver_otp(db, email)
    except Exception as exc:
        db.rollback()
        logger.exception("Resend OTP failed for %s", email)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not send OTP. Check the email service.",
        ) from exc

    return {
        "message": "OTP sent successfully. Please check your email."
    }


@router.post("/verify-otp")
def verify_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    email = str(data.email).strip().lower()

    customer = db.scalar(
        select(Customer).where(Customer.email == email)
    )

    otp_record = db.scalar(
        select(EmailOTP)
        .where(
            EmailOTP.email == email,
            EmailOTP.is_used.is_(False),
        )
        .order_by(EmailOTP.created_at.desc(), EmailOTP.id.desc())
        .limit(1)
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found. Request a new OTP.",
        )

    now = datetime.now(timezone.utc)
    expires_at = otp_record.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= now:
        otp_record.is_used = True
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired. Request a new OTP.",
        )

    if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
        otp_record.is_used = True
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Request a new OTP.",
        )

    if not verify_password(data.otp, otp_record.otp_hash):
        otp_record.attempts += 1

        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            otp_record.is_used = True

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP.",
        )

    if customer is None:
        otp_record.is_used = True
        db.commit()

        return {
            "message": (
                "Email OTP verified successfully. "
                "No bank customer account was created."
            )
        }

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive.",
        )

    account_created = False

    try:
        if not customer.is_verified:
            account = Account(
                account_number="FC" + secrets.token_hex(5).upper(),
                customer_id=customer.id,
                balance=0,
                currency="INR",
                status="active",
            )

            customer.is_verified = True
            db.add(account)
            account_created = True

        otp_record.is_used = True

        db.commit()
        db.refresh(customer)

    except Exception as exc:
        db.rollback()
        logger.exception(
            "OTP verification or account creation failed for %s",
            email,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not verify the email or create the account.",
        ) from exc

    if account_created:
        try:
            send_account_created_email(
                to_email=customer.email,
                full_name=customer.full_name,
            )
        except Exception:
            logger.exception(
                "Account-created email failed for customer ID %s",
                customer.id,
            )

    token = create_access_token(
        customer_id=customer.id,
        is_admin=customer.is_admin,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = str(data.email).strip().lower()

    customer = db.scalar(
        select(Customer).where(Customer.email == email)
    )

    if not customer or not verify_password(
        data.password,
        customer.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not customer.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Verify your email before logging in.",
        )

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive.",
        )

    token = create_access_token(
        customer_id=customer.id,
        is_admin=customer.is_admin,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.get("/me")
def get_me(
    current_customer: Customer = Depends(get_current_customer),
):
    return {
        "id": current_customer.id,
        "full_name": current_customer.full_name,
        "email": current_customer.email,
        "mobile": current_customer.mobile,
        "is_verified": current_customer.is_verified,
        "is_active": current_customer.is_active,
    }
