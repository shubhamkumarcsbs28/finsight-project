from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Sequence

from app.models.enums import AlertType
from app.models.transaction import Transaction


class FraudRuleResult:

    def __init__(self, rule_name: str, alert_type: AlertType, score_weight: int, explanation: str):
        self.rule_name = rule_name
        self.alert_type = alert_type
        self.score_weight = score_weight
        self.explanation = explanation


def check_large_transaction(
    amount: Decimal, recent_transactions: Sequence[Transaction]
) -> FraudRuleResult | None:
    """Flag transactions exceeding absolute threshold ($5,000) or 3x historical average."""
    large_threshold = Decimal("5000.00")
    if amount >= large_threshold:
        return FraudRuleResult(
            rule_name="Large Transaction Amount",
            alert_type=AlertType.LARGE_TRANSACTION,
            score_weight=35,
            explanation=f"Transaction amount (${amount:,.2f}) exceeds the high-value threshold (${large_threshold:,.2f}).",
        )

    if recent_transactions:
        amounts = [t.amount for t in recent_transactions]
        avg_amount = sum(amounts) / Decimal(len(amounts))
        if avg_amount > Decimal("0.00") and amount >= (avg_amount * Decimal("3.00")):
            return FraudRuleResult(
                rule_name="High Deviation From History",
                alert_type=AlertType.LARGE_TRANSACTION,
                score_weight=35,
                explanation=f"Transaction amount (${amount:,.2f}) is over 3x the account historical average (${avg_amount:,.2f}).",
            )
    return None


def check_high_frequency(
    current_time: datetime, recent_transactions: Sequence[Transaction]
) -> FraudRuleResult | None:
    """Flag >3 transactions within a 10-minute window."""
    ten_minutes_ago = current_time - timedelta(minutes=10)
    count = sum(
        1
        for t in recent_transactions
        if (
            t.created_at.replace(tzinfo=timezone.utc)
            if t.created_at.tzinfo is None
            else t.created_at
        )
        >= ten_minutes_ago
    )
    if count >= 3:
        return FraudRuleResult(
            rule_name="High Velocity Transactions",
            alert_type=AlertType.HIGH_FREQUENCY,
            score_weight=25,
            explanation=f"Detected high activity burst with {count} transactions in under 10 minutes.",
        )
    return None


def check_duplicate_transaction(
    merchant: str, amount: Decimal, current_time: datetime, recent_transactions: Sequence[Transaction]
) -> FraudRuleResult | None:
    """Flag identical merchant + amount within 5 minutes."""
    five_minutes_ago = current_time - timedelta(minutes=5)
    for t in recent_transactions:
        t_time = (
            t.created_at.replace(tzinfo=timezone.utc)
            if t.created_at.tzinfo is None
            else t.created_at
        )
        if (
            t_time >= five_minutes_ago
            and t.merchant.lower() == merchant.lower()
            and t.amount == amount
        ):
            return FraudRuleResult(
                rule_name="Duplicate Transaction",
                alert_type=AlertType.DUPLICATE_TRANSACTION,
                score_weight=40,
                explanation=f"Duplicate transaction detected for '{merchant}' (${amount:,.2f}) within 5 minutes.",
            )
    return None


def check_unusual_timing(current_time: datetime) -> FraudRuleResult | None:
    """Flag transactions occurring between 1:00 AM and 5:00 AM local/UTC time."""
    hour = current_time.hour
    if 1 <= hour < 5:
        return FraudRuleResult(
            rule_name="Unusual Hours Activity",
            alert_type=AlertType.UNUSUAL_TIMING,
            score_weight=15,
            explanation=f"Transaction attempted during unusual off-hours window ({hour:02d}:00).",
        )
    return None
