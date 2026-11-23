
from sqlalchemy import select
from app.db.database import SessionLocal
from app.models.entities import Customer

email = input("Enter your registered email: ").strip().lower()

with SessionLocal() as db:
    customer = db.scalar(
        select(Customer).where(Customer.email == email)
    )

    if customer is None:
        print("Customer account not found.")
    else:
        customer.is_admin = True
        db.commit()
        print(f"Admin access enabled for: {customer.email}")
