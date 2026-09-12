import uuid
from collections.abc import AsyncGenerator
from datetime import timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_async_session
from app.models.user import User
from app.modules.auth.auth_service import (
    AuthService,
    AuthenticatedSession,
)
from app.modules.auth.exceptions import InvalidSessionError
from app.modules.auth.session_repository import AuthSessionRepository
from app.modules.auth.user_manager import UserManager


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
    request: Request,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthenticatedSession:
    session_token = request.cookies.get(
        settings.auth_session_cookie_name,
    )

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