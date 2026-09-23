from datetime import datetime, timezone
from decimal import Decimal
from typing import Sequence

from app.fraud.rules import (
    FraudRuleResult,
    check_duplicate_transaction,
    check_high_frequency,
    check_large_transaction,
    check_unusual_timing,
)
from app.models.enums import AlertType, Severity
from app.models.transaction import Transaction


class EvaluationResult:

    def __init__(
        self,
        risk_score: int,
        severity: Severity,
        alert_type: AlertType,
        triggered_rules: list[str],
        reason: str,
    ):
        self.risk_score = risk_score
        self.severity = severity
        self.alert_type = alert_type
        self.triggered_rules = triggered_rules
        self.reason = reason


def evaluate_transaction_risk(
    amount: Decimal,
    merchant: str,
    transaction_time: datetime | None,
    recent_transactions: Sequence[Transaction],
) -> EvaluationResult:
    """Evaluate a transaction against rule definitions and compute explainable composite risk score."""
    if transaction_time is None:
        transaction_time = datetime.now(timezone.utc)
    elif transaction_time.tzinfo is None:
        transaction_time = transaction_time.replace(tzinfo=timezone.utc)

    triggered_rule_results: list[FraudRuleResult] = []

    # 1. Large transaction rule
    large_res = check_large_transaction(amount, recent_transactions)
    if large_res:
        triggered_rule_results.append(large_res)

    # 2. Duplicate transaction rule
    dup_res = check_duplicate_transaction(merchant, amount, transaction_time, recent_transactions)
    if dup_res:
        triggered_rule_results.append(dup_res)

    # 3. High frequency rule
    freq_res = check_high_frequency(transaction_time, recent_transactions)
    if freq_res:
        triggered_rule_results.append(freq_res)

    # 4. Unusual timing rule
    time_res = check_unusual_timing(transaction_time)
    if time_res:
        triggered_rule_results.append(time_res)

    # Calculate raw score
    raw_score = sum(r.score_weight for r in triggered_rule_results)

    # 5. Multiple signals multiplier (+15 if >=2 signals triggered)
    if len(triggered_rule_results) >= 2:
        raw_score += 15

    final_score = min(100, max(0, raw_score))

    # Determine Severity
    if final_score >= 60:
        severity = Severity.HIGH
    elif final_score >= 30:
        severity = Severity.MEDIUM
    else:
        severity = Severity.LOW

    # Determine primary AlertType
    if len(triggered_rule_results) >= 2:
        primary_alert_type = AlertType.MULTIPLE_SIGNALS
    elif len(triggered_rule_results) == 1:
        primary_alert_type = triggered_rule_results[0].alert_type
    else:
        primary_alert_type = AlertType.LARGE_TRANSACTION

    # Build triggered rule names and explanation string
    rule_names = [r.rule_name for r in triggered_rule_results]
    if len(triggered_rule_results) >= 2:
        rule_names.append("Multiple Signals Compound Risk")

    if not triggered_rule_results:
        reason = "Normal activity pattern. Standard risk parameters."
    else:
        explanations = [r.explanation for r in triggered_rule_results]
        if len(triggered_rule_results) >= 2:
            explanations.append("Compound risk penalty applied due to multiple simultaneous anomaly signals.")
        reason = " | ".join(explanations)

    return EvaluationResult(
        risk_score=final_score,
        severity=severity,
        alert_type=primary_alert_type,
        triggered_rules=rule_names,
        reason=reason,
    )
