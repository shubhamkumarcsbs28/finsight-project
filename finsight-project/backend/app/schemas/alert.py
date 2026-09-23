from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AlertStatus, AlertType, Severity
from app.schemas.transaction import TransactionResponse


class FraudAlertUpdate(BaseModel):
    status: AlertStatus
    resolution_notes: str | None = Field(default=None, max_length=500)


class FraudAlertResponse(BaseModel):
    id: int
    transaction_id: int
    alert_type: AlertType
    severity: Severity
    status: AlertStatus
    risk_score: int
    reason: str
    resolution_notes: str | None
    created_at: datetime
    updated_at: datetime
    transaction: TransactionResponse | None = None

    model_config = ConfigDict(from_attributes=True)
