import random
import string
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.enums import AccountStatus
from app.schemas.account import AccountCreate, BalanceResponse


def generate_account_number() -> str:
    """Generate a unique 12-digit financial account number string."""
    digits = "".join(random.choices(string.digits, k=10))
    return f"ACC-{digits}"


def create_account(db: Session, user_id: int, account_in: AccountCreate) -> Account:
    """Create a new financial account for the user."""
    # Ensure generated account_number is unique
    account_number = generate_account_number()
    while db.query(Account).filter(Account.account_number == account_number).first():
        account_number = generate_account_number()

    account = Account(
        user_id=user_id,
        account_number=account_number,
        account_type=account_in.account_type,
        currency=account_in.currency.upper(),
        balance=account_in.initial_balance,
        status=AccountStatus.ACTIVE,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def get_user_accounts(db: Session, user_id: int) -> list[Account]:
    """Retrieve all accounts owned by a user."""
    return db.query(Account).filter(Account.user_id == user_id).all()


def get_account_by_id(db: Session, account_id: int, user_id: int | None = None) -> Account:
    """Retrieve an account by ID, optionally enforcing user ownership."""
    query = db.query(Account).filter(Account.id == account_id)
    if user_id is not None:
        query = query.filter(Account.user_id == user_id)
    account = query.first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with ID {account_id} not found.",
        )
    return account


def get_account_balance(db: Session, account_id: int, user_id: int) -> BalanceResponse:
    """Retrieve the current balance of a user account."""
    account = get_account_by_id(db, account_id, user_id)
    return BalanceResponse(
        account_id=account.id,
        account_number=account.account_number,
        balance=account.balance,
        currency=account.currency,
    )
