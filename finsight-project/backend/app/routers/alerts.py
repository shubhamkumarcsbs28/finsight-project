from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import AlertStatus, Severity
from app.models.user import User
from app.schemas.alert import FraudAlertResponse, FraudAlertUpdate
from app.services.alert_service import get_alert_by_id, get_user_alerts, update_alert_status
from app.utils.deps import get_current_user

router = APIRouter(prefix="/alerts", tags=["Fraud Alerts"])


@router.get("", response_model=dict)
def list_alerts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    status: AlertStatus | None = Query(default=None),
    severity: Severity | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    """Retrieve fraud alert queue with optional status and severity filtering."""
    alerts, total_count = get_user_alerts(
        db,
        user_id=current_user.id,
        status_filter=status,
        severity_filter=severity,
        limit=limit,
        offset=offset,
    )
    return {
        "items": [FraudAlertResponse.model_validate(a) for a in alerts],
        "total": total_count,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{alert_id}", response_model=FraudAlertResponse)
def get_alert_details(
    alert_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Retrieve details for a single fraud alert."""
    return get_alert_by_id(db, alert_id, current_user.id)


@router.patch("/{alert_id}", response_model=FraudAlertResponse)
def modify_alert(
    alert_id: int,
    alert_in: FraudAlertUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Update fraud alert status (OPEN -> REVIEWED -> RESOLVED) and add resolution notes."""
    return update_alert_status(db, alert_id, current_user.id, alert_in)
