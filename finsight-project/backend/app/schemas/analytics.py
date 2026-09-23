from decimal import Decimal
from pydantic import BaseModel


class SummaryAnalytics(BaseModel):
    total_volume: Decimal
    transaction_count: int
    active_accounts: int
    total_alerts: int
    open_alerts: int
    high_risk_alerts: int


class DailyTrendPoint(BaseModel):
    date: str
    amount: Decimal
    count: int


class CategorySpending(BaseModel):
    category: str
    total_amount: Decimal
    count: int


class FraudDistribution(BaseModel):
    severity: str
    count: int


class RuleTriggerCount(BaseModel):
    rule: str
    count: int
