from datetime import datetime, timezone
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.fraud.engine import evaluate_transaction_risk
from app.models.account import Account
from app.models.enums import AccountStatus, LedgerEntryType, TransactionStatus, TransactionType
from app.models.fraud_alert import FraudAlert
from app.models.ledger import LedgerEntry
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionImportItem, TransactionImportResponse


def create_transaction(
    db: Session, user_id: int, tx_in: TransactionCreate, custom_timestamp: datetime | None = None
) -> Transaction:
    """Execute an atomic financial transaction:
    1. Validate account ownership & active status.
    2. Enforce non-negative balance for DEBIT transactions.
    3. Evaluate composite fraud risk score & triggers.
    4. Mutate account balance atomically.
    5. Write Transaction and LedgerEntry.
    6. Automatically create FraudAlert if risk score crosses threshold (>= 30).
    """
    account = (
        db.query(Account)
        .filter(Account.id == tx_in.account_id, Account.user_id == user_id)
        .first()
    )
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {tx_in.account_id} not found or access denied.",
        )

    if account.status != AccountStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account {account.account_number} is not active ({account.status}).",
        )

    # Validate debit balance
    if tx_in.transaction_type == TransactionType.DEBIT and account.balance < tx_in.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient funds in account {account.account_number}. Current balance: ${account.balance:,.2f}",
        )

    now_time = custom_timestamp or datetime.now(timezone.utc)

    # Fetch recent transactions for fraud context
    recent_txs = (
        db.query(Transaction)
        .filter(Transaction.account_id == account.id)
        .order_by(Transaction.created_at.desc())
        .limit(20)
        .all()
    )

    # Evaluate Fraud Risk
    eval_result = evaluate_transaction_risk(
        amount=tx_in.amount,
        merchant=tx_in.merchant,
        transaction_time=now_time,
        recent_transactions=recent_txs,
    )

    # Update account balance
    if tx_in.transaction_type == TransactionType.CREDIT:
        account.balance += tx_in.amount
        entry_type = LedgerEntryType.CREDIT
    else:
        account.balance -= tx_in.amount
        entry_type = LedgerEntryType.DEBIT

    # Create Transaction record
    transaction = Transaction(
        account_id=account.id,
        transaction_type=tx_in.transaction_type,
        amount=tx_in.amount,
        merchant=tx_in.merchant,
        category=tx_in.category,
        description=tx_in.description,
        transaction_timestamp=now_time,
        status=TransactionStatus.COMPLETED,
        risk_score=eval_result.risk_score,
        created_at=now_time,
    )
    db.add(transaction)
    db.flush()  # Obtain transaction.id

    # Create Ledger Entry
    ledger_entry = LedgerEntry(
        account_id=account.id,
        transaction_id=transaction.id,
        entry_type=entry_type,
        amount=tx_in.amount,
        balance_after=account.balance,
        created_at=now_time,
    )
    db.add(ledger_entry)

    # Create FraudAlert if score threshold crossed (>= 30)
    if eval_result.risk_score >= 30:
        alert = FraudAlert(
            transaction_id=transaction.id,
            alert_type=eval_result.alert_type,
            severity=eval_result.severity,
            risk_score=eval_result.risk_score,
            reason=eval_result.reason,
            created_at=now_time,
        )
        db.add(alert)

    db.commit()
    db.refresh(transaction)

    # Attach dynamic risk properties to transaction object for response serialization
    transaction.risk_severity = eval_result.severity
    transaction.triggered_rules = eval_result.triggered_rules
    transaction.risk_reason = eval_result.reason
    transaction.location = tx_in.location

    return transaction


def get_user_transactions(
    db: Session,
    user_id: int,
    account_id: int | None = None,
    category: str | None = None,
    transaction_type: TransactionType | None = None,
    min_amount: Decimal | None = None,
    max_amount: Decimal | None = None,
    min_risk_score: int | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Transaction], int]:
    """Retrieve filtered, paginated transaction records owned by the user."""
    query = (
        db.query(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
    )

    if account_id is not None:
        query = query.filter(Transaction.account_id == account_id)
    if category is not None and category.strip():
        query = query.filter(Transaction.category.ilike(f"%{category.strip()}%"))
    if transaction_type is not None:
        query = query.filter(Transaction.transaction_type == transaction_type)
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)
    if min_risk_score is not None:
        query = query.filter(Transaction.risk_score >= min_risk_score)

    total_count = query.count()
    txs = query.order_by(Transaction.transaction_timestamp.desc()).offset(offset).limit(limit).all()

    # Populate dynamic evaluation properties for response mapping
    for tx in txs:
        if tx.risk_score >= 60:
            tx.risk_severity = "HIGH"
        elif tx.risk_score >= 30:
            tx.risk_severity = "MEDIUM"
        else:
            tx.risk_severity = "LOW"

        tx.triggered_rules = []
        tx.risk_reason = f"Risk score {tx.risk_score}/100"
        tx.location = "US"

    return txs, total_count


def get_transaction_by_id(db: Session, transaction_id: int, user_id: int) -> Transaction:
    """Fetch single transaction by ID verifying user ownership."""
    tx = (
        db.query(Transaction)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Transaction.id == transaction_id, Account.user_id == user_id)
        .first()
    )
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found.",
        )

    if tx.risk_score >= 60:
        tx.risk_severity = "HIGH"
    elif tx.risk_score >= 30:
        tx.risk_severity = "MEDIUM"
    else:
        tx.risk_severity = "LOW"

    tx.triggered_rules = []
    tx.risk_reason = f"Evaluated risk score: {tx.risk_score}"
    tx.location = "US"
    return tx


def batch_import_transactions(
    db: Session, user_id: int, items: list[TransactionImportItem]
) -> TransactionImportResponse:
    """Process batch transaction import array."""
    imported_count = 0
    flagged_fraud_count = 0
    total_amount = Decimal("0.00")

    for item in items:
        tx_in = TransactionCreate(
            account_id=item.account_id,
            transaction_type=item.transaction_type,
            amount=item.amount,
            merchant=item.merchant,
            category=item.category,
            description=item.description,
            location=item.location,
        )
        created_tx = create_transaction(
            db, user_id, tx_in, custom_timestamp=item.created_at
        )
        imported_count += 1
        total_amount += item.amount
        if created_tx.risk_score >= 30:
            flagged_fraud_count += 1

    return TransactionImportResponse(
        imported_count=imported_count,
        flagged_fraud_count=flagged_fraud_count,
        total_amount=total_amount,
    )
