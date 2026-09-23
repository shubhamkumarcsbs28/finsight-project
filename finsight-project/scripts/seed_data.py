from datetime import datetime, timedelta, timezone
from decimal import Decimal
import os
import sys

# Ensure backend folder is on python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.security import get_password_hash
from app.database import SessionLocal, create_tables
from app.models.account import Account
from app.models.enums import AccountStatus, AccountType, TransactionType
from app.models.user import User
from app.schemas.transaction import TransactionCreate
from app.services.transaction_service import create_transaction


def seed():
    """Populate database with demo user accounts, transactions, ledger records, and fraud alerts."""
    print("Creating database tables...")
    create_tables()

    db = SessionLocal()
    try:
        # Check if seed user already exists
        demo_email = "demo@finsight.dev"
        user = db.query(User).filter(User.email == demo_email).first()
        if not user:
            print(f"Creating demo user: {demo_email}...")
            user = User(
                email=demo_email,
                full_name="Alex Morgan",
                hashed_password=get_password_hash("Password123!"),
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create demo accounts if none exist
        accounts = db.query(Account).filter(Account.user_id == user.id).all()
        if not accounts:
            print("Creating primary demo accounts (Checking, Savings, Credit)...")
            checking = Account(
                user_id=user.id,
                account_number="ACC-9847102938",
                account_type=AccountType.CHECKING,
                balance=Decimal("65000.00"),
                currency="USD",
                status=AccountStatus.ACTIVE,
            )
            savings = Account(
                user_id=user.id,
                account_number="ACC-1204983021",
                account_type=AccountType.SAVINGS,
                balance=Decimal("48500.00"),
                currency="USD",
                status=AccountStatus.ACTIVE,
            )
            credit = Account(
                user_id=user.id,
                account_number="ACC-5591029384",
                account_type=AccountType.CREDIT,
                balance=Decimal("2100.00"),
                currency="USD",
                status=AccountStatus.ACTIVE,
            )
            db.add_all([checking, savings, credit])
            db.commit()
            accounts = [checking, savings, credit]

        checking_acc = accounts[0]
        now = datetime.now(timezone.utc)

        # List of sample historical transactions to generate
        sample_data = [
            # Legitimate everyday spending
            (TransactionType.DEBIT, Decimal("4.75"), "Blue Bottle Coffee", "Dining", "Morning Espresso", now - timedelta(days=12, hours=2)),
            (TransactionType.DEBIT, Decimal("64.20"), "Whole Foods Market", "Groceries", "Weekly groceries", now - timedelta(days=11, hours=5)),
            (TransactionType.CREDIT, Decimal("5500.00"), "TechCorp Payroll", "Income", "Direct Deposit Salary", now - timedelta(days=10, hours=1)),
            (TransactionType.DEBIT, Decimal("12.99"), "Netflix Subscription", "Entertainment", "Monthly streaming", now - timedelta(days=9, hours=4)),
            (TransactionType.DEBIT, Decimal("120.00"), "Chevron Gas Station", "Transport", "Fuel fill-up", now - timedelta(days=8, hours=3)),
            (TransactionType.DEBIT, Decimal("45.00"), "Uber Trip", "Transport", "Ride to airport", now - timedelta(days=7, hours=6)),
            (TransactionType.DEBIT, Decimal("89.50"), "Amazon.com", "Shopping", "Office supplies", now - timedelta(days=6, hours=2)),
            (TransactionType.DEBIT, Decimal("210.00"), "Target Superstore", "Shopping", "Household items", now - timedelta(days=5, hours=4)),
            (TransactionType.CREDIT, Decimal("1200.00"), "Venmo Transfer", "Transfer", "Split trip refund", now - timedelta(days=4, hours=1)),

            # Fraud Trigger 1: Large Transaction ($12,500 Wire Transfer)
            (TransactionType.DEBIT, Decimal("12500.00"), "Overseas Escrow LLC", "Wire Transfer", "Offshore property deposit", now - timedelta(days=3, hours=3)),

            # Fraud Trigger 2: High Frequency Burst (3 transactions within 4 minutes)
            (TransactionType.DEBIT, Decimal("499.00"), "Crypto Exchange Global", "Investment", "Crypto purchase #1", now - timedelta(days=2, hours=1, minutes=10)),
            (TransactionType.DEBIT, Decimal("499.00"), "Crypto Exchange Global", "Investment", "Crypto purchase #2", now - timedelta(days=2, hours=1, minutes=8)),
            (TransactionType.DEBIT, Decimal("499.00"), "Crypto Exchange Global", "Investment", "Crypto purchase #3", now - timedelta(days=2, hours=1, minutes=6)),

            # Fraud Trigger 3: Duplicate Transaction ($850.00 Luxury Retailer within 2 minutes)
            (TransactionType.DEBIT, Decimal("850.00"), "Gucci Boutique NY", "Luxury Goods", "Designer handbag", now - timedelta(days=1, hours=4, minutes=5)),
            (TransactionType.DEBIT, Decimal("850.00"), "Gucci Boutique NY", "Luxury Goods", "Designer handbag duplicate", now - timedelta(days=1, hours=4, minutes=3)),

            # Fraud Trigger 4: Unusual Off-Hours Timing (2:30 AM transfer)
            (TransactionType.DEBIT, Decimal("2800.00"), "Unverified Peer Transfer", "Transfer", "Late night P2P payout", now.replace(hour=2, minute=30) - timedelta(days=1)),

            # Recent normal activity
            (TransactionType.DEBIT, Decimal("18.50"), "Chipotle Mexican Grill", "Dining", "Lunch burrito bowl", now - timedelta(hours=3)),
            (TransactionType.DEBIT, Decimal("78.00"), "Trader Joe's", "Groceries", "Evening snacks", now - timedelta(minutes=45)),
        ]

        print(f"Generating {len(sample_data)} seed transactions with automated fraud evaluation...")
        for tx_type, amt, merch, cat, desc, timestamp in sample_data:
            tx_in = TransactionCreate(
                account_id=checking_acc.id,
                transaction_type=tx_type,
                amount=amt,
                merchant=merch,
                category=cat,
                description=desc,
                location="US",
            )
            create_transaction(db, user_id=user.id, tx_in=tx_in, custom_timestamp=timestamp)

        print("Seeding completed successfully!")
        print(f"Demo Credentials -> Email: {demo_email} | Password: Password123!")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
