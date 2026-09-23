from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import TransactionType
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionImportItem,
    TransactionImportResponse,
    TransactionResponse,
)
from app.services.transaction_service import (
    batch_import_transactions,
    create_transaction,
    get_transaction_by_id,
    get_user_transactions,
)
from app.utils.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=dict)
def list_transactions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    account_id: int | None = Query(default=None),
    category: str | None = Query(default=None),
    transaction_type: TransactionType | None = Query(default=None),
    min_amount: Decimal | None = Query(default=None),
    max_amount: Decimal | None = Query(default=None),
    min_risk_score: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Retrieve filtered, paginated transaction records."""
    txs, total_count = get_user_transactions(
        db,
        user_id=current_user.id,
        account_id=account_id,
        category=category,
        transaction_type=transaction_type,
        min_amount=min_amount,
        max_amount=max_amount,
        min_risk_score=min_risk_score,
        limit=limit,
        offset=offset,
    )
    return {
        "items": [TransactionResponse.model_validate(tx) for tx in txs],
        "total": total_count,
        "limit": limit,
        "offset": offset,
    }


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def record_transaction(
    tx_in: TransactionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Submit a transaction. Evaluates fraud risk score and creates ledger entry atomically."""
    return create_transaction(db, current_user.id, tx_in)


@router.post("/import", response_model=TransactionImportResponse)
def import_csv_transactions(
    items: list[TransactionImportItem],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Batch import transactions from CSV payload."""
    return batch_import_transactions(db, current_user.id, items)


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction_details(
    transaction_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Retrieve transaction details by ID."""
    return get_transaction_by_id(db, transaction_id, current_user.id)
