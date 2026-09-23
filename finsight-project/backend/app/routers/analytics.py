from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.analytics import CategorySpending, DailyTrendPoint, SummaryAnalytics
from app.services.analytics_service import (
    get_category_analytics,
    get_fraud_analytics,
    get_summary_analytics,
    get_transaction_trends,
)
from app.utils.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=SummaryAnalytics)
def summary_metrics(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get high-level summary metrics for executive dashboard."""
    return get_summary_analytics(db, current_user.id)


@router.get("/transactions", response_model=list[DailyTrendPoint])
def transaction_trends(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get daily transaction volume and count timeline trends."""
    return get_transaction_trends(db, current_user.id)


@router.get("/categories", response_model=list[CategorySpending])
def category_spending(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get spending distribution aggregated by transaction category."""
    return get_category_analytics(db, current_user.id)


@router.get("/fraud", response_model=dict)
def fraud_analytics(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Get fraud severity distribution and rule trigger frequency statistics."""
    return get_fraud_analytics(db, current_user.id)
