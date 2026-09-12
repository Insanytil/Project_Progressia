# app/modules/auth/dependencies.py

import uuid
from collections.abc import AsyncGenerator

from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.models.user import User
from app.modules.auth.user_manager import UserManager

from datetime import timedelta

from app.core.config import settings
from app.modules.auth.auth_service import AuthService
from app.modules.auth.session_repository import AuthSessionRepository


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