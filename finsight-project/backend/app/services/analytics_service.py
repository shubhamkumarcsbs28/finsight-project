from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.enums import AccountStatus, AlertStatus, Severity
from app.models.fraud_alert import FraudAlert
from app.models.transaction import Transaction
from app.schemas.analytics import (
    CategorySpending,
    DailyTrendPoint,
    FraudDistribution,
    RuleTriggerCount,
    SummaryAnalytics,
)


def get_summary_analytics(db: Session, user_id: int) -> SummaryAnalytics:
    """Calculate executive dashboard metrics for a user."""
    # Active accounts count
    active_accounts = (
        db.query(func.count(Account.id))
        .filter(Account.user_id == user_id, Account.status == AccountStatus.ACTIVE)
        .scalar()
        or 0
    )

    # Transaction aggregates
    tx_stats = (
        db.query(
            func.count(Transaction.id).label("cnt"),
            func.coalesce(func.sum(Transaction.amount), 0).label("vol"),
        )
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .first()
    )

    tx_count = tx_stats.cnt if tx_stats else 0
    tx_vol = Decimal(str(tx_stats.vol)) if tx_stats else Decimal("0.00")

    # Alert stats
    total_alerts = (
        db.query(func.count(FraudAlert.id))
        .join(Transaction, FraudAlert.transaction_id == Transaction.id)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .scalar()
        or 0
    )

    open_alerts = (
        db.query(func.count(FraudAlert.id))
        .join(Transaction, FraudAlert.transaction_id == Transaction.id)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id, FraudAlert.status == AlertStatus.OPEN)
        .scalar()
        or 0
    )

    high_risk_alerts = (
        db.query(func.count(FraudAlert.id))
        .join(Transaction, FraudAlert.transaction_id == Transaction.id)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id, FraudAlert.severity == Severity.HIGH)
        .scalar()
        or 0
    )

    return SummaryAnalytics(
        total_volume=tx_vol,
        transaction_count=tx_count,
        active_accounts=active_accounts,
        total_alerts=total_alerts,
        open_alerts=open_alerts,
        high_risk_alerts=high_risk_alerts,
    )


def get_transaction_trends(db: Session, user_id: int) -> list[DailyTrendPoint]:
    """Calculate daily transaction volume and count trends."""
    date_col = func.date(Transaction.transaction_timestamp)
    rows = (
        db.query(
            date_col.label("tx_date"),
            func.coalesce(func.sum(Transaction.amount), 0).label("amt"),
            func.count(Transaction.id).label("cnt"),
        )
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .group_by(date_col)
        .order_by(date_col.asc())
        .all()
    )

    return [
        DailyTrendPoint(
            date=str(row.tx_date) if row.tx_date else "Unknown",
            amount=Decimal(str(row.amt)),
            count=row.cnt,
        )
        for row in rows
    ]


def get_category_analytics(db: Session, user_id: int) -> list[CategorySpending]:
    """Calculate aggregate spending breakdown grouped by transaction category."""
    rows = (
        db.query(
            func.coalesce(Transaction.category, "General").label("cat"),
            func.coalesce(func.sum(Transaction.amount), 0).label("amt"),
            func.count(Transaction.id).label("cnt"),
        )
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )

    return [
        CategorySpending(
            category=row.cat,
            total_amount=Decimal(str(row.amt)),
            count=row.cnt,
        )
        for row in rows
    ]


def get_fraud_analytics(db: Session, user_id: int) -> dict:
    """Calculate fraud risk severity breakdown and alert rule trigger statistics."""
    severity_rows = (
        db.query(
            FraudAlert.severity,
            func.count(FraudAlert.id).label("cnt"),
        )
        .join(Transaction, FraudAlert.transaction_id == Transaction.id)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .group_by(FraudAlert.severity)
        .all()
    )

    severity_dist = [
        FraudDistribution(severity=s.value if hasattr(s, "value") else str(s), count=cnt)
        for s, cnt in severity_rows
    ]

    rule_rows = (
        db.query(
            FraudAlert.alert_type,
            func.count(FraudAlert.id).label("cnt"),
        )
        .join(Transaction, FraudAlert.transaction_id == Transaction.id)
        .join(Account, Transaction.account_id == Account.id)
        .filter(Account.user_id == user_id)
        .group_by(FraudAlert.alert_type)
        .all()
    )

    rule_triggers = [
        RuleTriggerCount(
            rule=r.value.replace("_", " ").title() if hasattr(r, "value") else str(r), count=cnt
        )
        for r, cnt in rule_rows
    ]

    return {
        "severity_distribution": severity_dist,
        "rule_triggers": rule_triggers,
    }
