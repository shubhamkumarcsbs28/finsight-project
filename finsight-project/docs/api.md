# API plan

The API is versioned by the `/api` prefix and exposes Swagger/OpenAPI automatically through FastAPI.

## Available now

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Verify that the service is available |

## Planned endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`

### Accounts

- `GET /api/accounts`
- `GET /api/accounts/{id}`
- `POST /api/accounts`
- `GET /api/accounts/{id}/balance`

### Transactions

- `GET /api/transactions`
- `GET /api/transactions/{id}`
- `POST /api/transactions`
- `POST /api/transactions/import`
- `GET /api/transactions/filter`

### Alerts

- `GET /api/alerts`
- `GET /api/alerts/{id}`
- `PATCH /api/alerts/{id}`

### Analytics

- `GET /api/analytics/summary`
- `GET /api/analytics/transactions`
- `GET /api/analytics/categories`
- `GET /api/analytics/fraud`

All protected endpoints will require a bearer token. Error responses will use a stable structured shape and will not expose raw database exceptions.
