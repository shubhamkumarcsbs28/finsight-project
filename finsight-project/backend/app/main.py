from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import create_tables
from app.models import Account, FraudAlert, LedgerEntry, Transaction, User  # noqa: F401
from app.routers.accounts import router as accounts_router
from app.routers.alerts import router as alerts_router
from app.routers.analytics import router as analytics_router
from app.routers.auth import router as auth_router
from app.routers.health import router as health_router
from app.routers.transactions import router as transactions_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create tables automatically on startup for development environment
    create_tables()
    yield


app = FastAPI(
    title=settings.app_name,
    description=(
        "FinSight — FinTech transaction & explainable fraud detection API. "
        "Educational demonstration platform."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origin requests in dev for Vite & local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(accounts_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
