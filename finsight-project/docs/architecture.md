# Architecture

## Current foundation

FinSight is split into a React/Vite client and a FastAPI service. The client owns navigation and presentation. The API will own authentication, validation, transaction atomicity, risk rules, and analytics. PostgreSQL is the target persistence layer.

```text
frontend/src
  ├── pages and layouts
  ├── components
  ├── services/api.ts
  └── types

backend/app
  ├── main.py              FastAPI composition and middleware
  ├── database.py          Engine, sessions, and local table bootstrap
  ├── core/config.py       Environment-backed settings
  ├── models/              SQLAlchemy entities
  ├── schemas/             Pydantic contracts
  ├── routers/             HTTP endpoints
  ├── services/            Use-case/business logic
  └── fraud/               Explainable rule engine
```

## Design decisions

1. **Business logic is not placed in routes.** Routers should parse requests, call a service, and shape a response.
2. **Money uses decimal database types.** Amounts and balances use `NUMERIC(14, 2)`, not floating point.
3. **The account balance and ledger are one unit of work.** Transaction creation will lock or otherwise safely update the account, write the transaction, update the balance, and create the ledger entry in one database transaction.
4. **Fraud rules are transparent.** The first version will store the triggered rules and explanation alongside the risk score.
5. **Local bootstrapping is temporary.** `create_all` keeps the foundation easy to run; versioned migrations should replace it before a production-like deployment.

## Planned request flow

```text
POST /api/transactions
  → request schema validation
  → transaction service
  → account status and balance checks
  → fraud engine evaluates historical context
  → atomic transaction + balance + ledger write
  → alert write when threshold is crossed
  → response schema
```
