
import sys

sys.path.insert(0, "backend")

from app.db.database import SessionLocal
from app.models.entities import Customer

db = SessionLocal()

try:
    customers = db.query(Customer).all()

    if not customers:
        print("No customers found.")

    for customer in customers:
        print(f"Customer ID: {customer.id}")
        print(f"Email: {customer.email}")
        print(f"Mobile: {customer.mobile}")
        print(f"Verified: {customer.is_verified}")
        print("-" * 30)

finally:
    db.close()
