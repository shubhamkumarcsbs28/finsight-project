from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse, BalanceResponse
from app.services.account_service import (
    create_account,
    get_account_balance,
    get_account_by_id,
    get_user_accounts,
)
from app.utils.deps import get_current_user

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.get("", response_model=list[AccountResponse])
def list_accounts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Retrieve all accounts owned by the current user."""
    return get_user_accounts(db, current_user.id)


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def create_new_account(
    account_in: AccountCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Create a new account for the current user."""
    return create_account(db, current_user.id, account_in)


@router.get("/{account_id}", response_model=AccountResponse)
def get_account_details(
    account_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Retrieve details for a specific account."""
    return get_account_by_id(db, account_id, current_user.id)


@router.get("/{account_id}/balance", response_model=BalanceResponse)
def check_balance(
    account_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Retrieve the current balance for an account."""
    return get_account_balance(db, account_id, current_user.id)
