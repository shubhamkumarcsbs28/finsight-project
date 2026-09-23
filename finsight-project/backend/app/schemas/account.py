from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AccountStatus, AccountType


class AccountCreate(BaseModel):
    account_type: AccountType = AccountType.CHECKING
    currency: str = Field(default="USD", max_length=3)
    initial_balance: Decimal = Field(default=Decimal("1000.00"), ge=Decimal("0.00"))


class AccountResponse(BaseModel):
    id: int
    user_id: int
    account_number: str
    account_type: AccountType
    status: AccountStatus
    balance: Decimal
    currency: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BalanceResponse(BaseModel):
    account_id: int
    account_number: str
    balance: Decimal
    currency: str
