# FinSight — FinTech Transaction & Fraud Detection System

FinSight is a college/project-level full-stack demonstration platform for managing fictional financial accounts, recording transactions, maintaining a ledger, and explaining rule-based fraud risk. It is designed to look and behave like a realistic fintech dashboard without claiming to be production banking software.

> **Status:** Phase 1 foundation. The database model, FastAPI application shell, React/Vite frontend shell, documentation, and initial smoke test are in place. Authentication, transaction workflows, fraud rules, analytics, import, and the remaining UI pages are intentionally delivered incrementally.

## Architecture

```text
React + TypeScript + Vite
          │
          │ REST / JSON
          ▼
FastAPI + Pydantic + SQLAlchemy
          │
          ▼
PostgreSQL
```

Backend business logic will live in `backend/app/services`, while routers remain focused on HTTP concerns. The database layer is configured for PostgreSQL and uses SQLite automatically for the initial local smoke test when `DATABASE_URL` is not set.

See:

- [Architecture](docs/architecture.md)
- [Database schema](docs/database-schema.md)
- [API plan](docs/api.md)
- [Fraud detection methodology](docs/fraud-detection.md)

## Technology stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts, Axios, React Router
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy
- **Database:** PostgreSQL (SQLite fallback for local tests only)
- **Testing:** Pytest, FastAPI TestClient

## Repository structure

```text
backend/
  app/
    core/          Settings and application configuration
    models/        SQLAlchemy entities and enums
    routers/       HTTP route modules
    schemas/       Pydantic request/response schemas
    services/      Business logic modules
    fraud/         Rule-based fraud engine
    utils/         Shared backend utilities
    database.py
    main.py
  tests/
frontend/
  src/
    components/
    hooks/
    layouts/
    pages/
    services/
    types/
    utils/
scripts/
docs/
```

## Local setup

### 1. Configure the environment

```bash
cp .env.example .env
```

For the foundation smoke test, leaving `DATABASE_URL` unset uses a local SQLite database. For the intended application setup, point it at PostgreSQL as shown in `.env.example`.

### 2. Install backend dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### 3. Run the API

```bash
uvicorn app.main:app --reload --app-dir backend
```

Open Swagger at <http://localhost:8000/docs> and the health check at <http://localhost:8000/api/health>.

### 4. Install and run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects `VITE_API_BASE_URL=http://localhost:8000/api`.

### 5. Run tests

```bash
pytest -q
```

The initial test suite verifies that the FastAPI application loads and exposes its health endpoint. Feature-specific tests will be added alongside each implementation phase.

## Database and demo data

The normalized schema is defined in `backend/app/models`. Migrations and the demo seed script are reserved for the next implementation phases so that schema changes can be reviewed before data is generated.

Planned commands:

```bash
# Future migration command
alembic upgrade head

# Future fictional demo data command
python scripts/seed_data.py
```

No real personal or financial information belongs in this project. Any demo credentials and records will be clearly fictional.

## Planned API surface

The initial route is `GET /api/health`. The feature routes are documented in [docs/api.md](docs/api.md) and will be enabled incrementally:

- `/api/auth`
- `/api/accounts`
- `/api/transactions`
- `/api/alerts`
- `/api/analytics`

## Limitations and disclaimer

This is an educational demonstration. It does not provide production-grade banking authentication, compliance controls, fraud guarantees, payment processing, or financial advice. The risk score is explainable, configurable project logic—not a certified financial crime model.
