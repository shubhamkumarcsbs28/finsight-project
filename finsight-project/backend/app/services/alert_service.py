from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.enums import AlertStatus, Severity
from app.models.fraud_alert import FraudAlert
from app.models.transaction import Transaction
from app.schemas.alert import FraudAlertUpdate


def get_user_alerts(
    db: Session,
    user_id: int,
    status_filter: AlertStatus | None = None,
    severity_filter: Severity | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[FraudAlert], int]:
    """Retrieve fraud alert records for a user's accounts."""
    query = (
        db.query(FraudAlert)
        .join(Transaction, FraudAlert.transaction_id == Transaction.id)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
    )

    if status_filter is not None:
        query = query.filter(FraudAlert.status == status_filter)
    if severity_filter is not None:
        query = query.filter(FraudAlert.severity == severity_filter)

    total_count = query.count()
    alerts = (
        query.order_by(FraudAlert.created_at.desc()).offset(offset).limit(limit).all()
    )

    for alert in alerts:
        if alert.transaction:
            alert.transaction.risk_severity = alert.severity.value
            alert.transaction.triggered_rules = []
            alert.transaction.risk_reason = alert.reason
            alert.transaction.location = "US"

    return alerts, total_count


def get_alert_by_id(db: Session, alert_id: int, user_id: int) -> FraudAlert:
    """Retrieve single fraud alert record verifying user account authorization."""
    alert = (
        db.query(FraudAlert)
        .join(Transaction, FraudAlert.transaction_id == Transaction.id)
        .join(Account, Transaction.account_id == Account.id)
        .filter(FraudAlert.id == alert_id, Account.user_id == user_id)
        .first()
    )
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fraud alert {alert_id} not found.",
        )

    if alert.transaction:
        alert.transaction.risk_severity = alert.severity.value
        alert.transaction.triggered_rules = []
        alert.transaction.risk_reason = alert.reason
        alert.transaction.location = "US"

    return alert


def update_alert_status(
    db: Session, alert_id: int, user_id: int, alert_in: FraudAlertUpdate
) -> FraudAlert:
    """Update fraud alert resolution status and review notes."""
    alert = get_alert_by_id(db, alert_id, user_id)
    alert.status = alert_in.status
    if alert_in.resolution_notes is not None:
        alert.resolution_notes = alert_in.resolution_notes
    db.commit()
    db.refresh(alert)
    return alert
