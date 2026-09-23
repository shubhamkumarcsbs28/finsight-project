from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import Token, UserLogin, UserRegister, UserResponse
from app.services.auth_service import authenticate_user, register_user
from app.utils.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Annotated[Session, Depends(get_db)]):
    """Register a new user account."""
    return register_user(db, user_in)


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Annotated[Session, Depends(get_db)]):
    """Authenticate with email and password to receive a Bearer JWT token."""
    return authenticate_user(db, login_in)


@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    """OAuth2 compatible token login for Swagger UI authorization."""
    login_in = UserLogin(email=form_data.username, password=form_data.password)
    return authenticate_user(db, login_in)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Get profile information for the authenticated user."""
    return current_user
