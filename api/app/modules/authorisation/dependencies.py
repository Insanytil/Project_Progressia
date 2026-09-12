from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.modules.auth.dependencies import CsrfProtectedSession


async def require_platform_admin(
    auth: CsrfProtectedSession,
) -> User:
    if not auth.user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform administrator access required",
        )

    return auth.user


PlatformAdmin = Annotated[
    User,
    Depends(require_platform_admin),
]