
import os
from pathlib import Path

import requests
from dotenv import load_dotenv

PROJECT_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = PROJECT_DIR / ".env"

load_dotenv(ENV_FILE, override=True)


def send_email(to_email: str, subject: str, content: str) -> bool:
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("BREVO_SENDER_EMAIL")

    if not api_key or not sender_email:
        raise RuntimeError(
            f"BREVO_API_KEY or BREVO_SENDER_EMAIL is missing in {ENV_FILE}"
        )

    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json",
        },
        json={
            "sender": {
                "name": "Fine Core Banking",
                "email": sender_email,
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "textContent": content,
        },
        timeout=20,
    )

    if not response.ok:
        raise RuntimeError(
            f"Brevo email failed: {response.status_code} - {response.text}"
        )

    return True


def send_otp_email(to_email: str, otp: str) -> bool:
    return send_email(
        to_email,
        "Fine Core Banking - Verification Code",
        f"Your verification code is {otp}.\n\n"
        "This code expires in 5 minutes. Do not share it with anyone.",
    )


def send_notification_email(
    to_email: str,
    subject: str,
    message: str,
) -> bool:
    return send_email(to_email, subject, message)


def send_account_created_email(
    to_email: str,
    full_name: str,
) -> bool:
    return send_email(
        to_email,
        "Fine Core Banking - Account Created",
        f"Hello {full_name},\n\n"
        "Your Fine Core Banking account has been created successfully.\n\n"
        "Thank you for registering.",
    )
