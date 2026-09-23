# Database schema

The model is normalized around a user-owned account, account transactions, immutable-ish ledger entries, and fraud alerts.

## Tables

| Table | Purpose | Important constraints |
| --- | --- | --- |
| `users` | Demo user identity and password hash | Unique indexed email |
| `accounts` | Account identity, status, currency, and current balance | Unique indexed account number; user foreign key |
| `transactions` | Credit/debit activity and calculated risk score | Account foreign key; positive amount enforced by service/schema |
| `ledger_entries` | Balance movement audit record | One entry per transaction; stores `balance_after` |
| `fraud_alerts` | Rule-triggered review work | Transaction foreign key; status lifecycle |

## Integrity rules

- Foreign keys use cascading deletes for demo data cleanup.
- Money is stored as `NUMERIC(14, 2)`.
- Account numbers and user emails are unique.
- Transaction and alert lookup columns are indexed.
- A debit cannot be committed if it would make the account balance negative.
- Balance updates and ledger creation are committed atomically with the transaction.

The SQLAlchemy source of truth is under `backend/app/models`. Alembic migrations will be added once the initial feature set stabilizes.
