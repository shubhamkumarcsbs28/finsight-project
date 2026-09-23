from enum import StrEnum


class AccountType(StrEnum):
    CHECKING = "CHECKING"
    SAVINGS = "SAVINGS"
    CREDIT = "CREDIT"


class AccountStatus(StrEnum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    CLOSED = "CLOSED"


class TransactionType(StrEnum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class TransactionStatus(StrEnum):
    COMPLETED = "COMPLETED"
    PENDING = "PENDING"
    DECLINED = "DECLINED"


class LedgerEntryType(StrEnum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class AlertType(StrEnum):
    DUPLICATE_TRANSACTION = "DUPLICATE_TRANSACTION"
    LARGE_TRANSACTION = "LARGE_TRANSACTION"
    HIGH_FREQUENCY = "HIGH_FREQUENCY"
    UNUSUAL_TIMING = "UNUSUAL_TIMING"
    MULTIPLE_SIGNALS = "MULTIPLE_SIGNALS"


class Severity(StrEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AlertStatus(StrEnum):
    OPEN = "OPEN"
    REVIEWED = "REVIEWED"
    RESOLVED = "RESOLVED"
