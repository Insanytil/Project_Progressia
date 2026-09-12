# app/modules/auth/dependencies.py

import uuid
from collections.abc import AsyncGenerator

from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.models.user import User
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