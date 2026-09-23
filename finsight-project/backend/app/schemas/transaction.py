from datetime import datetime
from decimal import Decimal
from typing import Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Severity, TransactionStatus, TransactionType


class TransactionCreate(BaseModel):
    account_id: int
    transaction_type: TransactionType
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    merchant: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="General", max_length=50)
    description: str | None = Field(default=None, max_length=255)
    location: str | None = Field(default="US", max_length=50)


class TransactionResponse(BaseModel):
    id: int
    account_id: int
    transaction_type: TransactionType
    amount: Decimal
    merchant: str
    category: str
    description: str | None = None
    location: str | None = "US"
    status: TransactionStatus
    risk_score: int = 0
    risk_severity: Severity = Severity.LOW
    triggered_rules: list[str] | Any = Field(default_factory=list)
    risk_reason: str | None = "Evaluated risk score"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionImportItem(BaseModel):
    account_id: int
    transaction_type: TransactionType
    amount: Decimal
    merchant: str
    category: str = "General"
    description: str | None = None
    location: str | None = "US"
    created_at: datetime | None = None


class TransactionImportResponse(BaseModel):
    imported_count: int
    flagged_fraud_count: int
    total_amount: Decimal
