import uuid
from collections.abc import AsyncGenerator
from datetime import timedelta
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, Security, status
from fastapi.security import APIKeyCookie
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import verify_secret
from app.db.session import get_async_session
from app.models.user import User
from app.modules.auth.auth_service import (
    AuthService,
    AuthenticatedSession,
)
from app.modules.auth.exceptions import InvalidSessionError
from app.modules.auth.session_repository import AuthSessionRepository
from app.modules.auth.user_manager import UserManager

session_cookie_scheme = APIKeyCookie(
    name=settings.auth_session_cookie_name,
    scheme_name="SessionCookie",
    description="Progressia authentication session cookie",
    auto_error=False,
)

async def get_user_db(
    session: AsyncSession = Depends(get_async_session),
) -> AsyncGenerator[
    SQLAlchemyUserDatabase[User, uuid.UUID],
    None,
]:
    yield SQLAlchemyUserDatabase(
        session,
        User,
    )


async def get_user_manager(
    user_db: SQLAlchemyUserDatabase[
        User,
        uuid.UUID,
    ] = Depends(get_user_db),
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


async def get_auth_service(
    session: AsyncSession = Depends(get_async_session),
    user_manager: UserManager = Depends(get_user_manager),
) -> AuthService:
    return AuthService(
        db=session,
        user_manager=user_manager,
        session_repository=AuthSessionRepository(session),
        session_lifetime=timedelta(
            hours=settings.auth_session_lifetime_hours,
        ),
    )

async def get_authenticated_session(
    session_token: str | None = Security(
        session_cookie_scheme,
    ),
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthenticatedSession:
    if session_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        return await auth_service.authenticate_session(
            session_token,
        )
    except InvalidSessionError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        ) from None

SAFE_HTTP_METHODS = frozenset({
    "GET",
    "HEAD",
    "OPTIONS",
})

async def require_csrf(
    request: Request,
    authenticated_session: AuthenticatedSession = Depends(
        get_authenticated_session,
    ),
    csrf_token: str | None = Header(
        default=None,
        alias=settings.auth_csrf_header_name,
    ),
) -> AuthenticatedSession:
    if request.method.upper() in SAFE_HTTP_METHODS:
        return authenticated_session

    if csrf_token is None or not verify_secret(
        csrf_token,
        authenticated_session.session.csrf_token_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF validation failed",
        )

    return authenticated_session

async def get_current_user(
    authenticated_session: AuthenticatedSession = Depends(
        get_authenticated_session,
    ),
) -> User:
    return authenticated_session.user

CurrentUser = Annotated[
    User,
    Depends(get_current_user),
]

AuthenticatedSessionDep = Annotated[
    AuthenticatedSession,
    Depends(get_authenticated_session),
]

CsrfProtectedSession = Annotated[
    AuthenticatedSession,
    Depends(require_csrf),
]
