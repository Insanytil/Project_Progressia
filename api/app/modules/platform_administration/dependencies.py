from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.modules.platform_administration.repository import (
    OrganizationRepository,
)
from app.modules.platform_administration.service import (
    PlatformAdministrationService,
)


async def get_platform_administration_service(
    session: AsyncSession = Depends(get_async_session),
) -> PlatformAdministrationService:
    return PlatformAdministrationService(
        db=session,
        organization_repository=OrganizationRepository(session),
    )
PlatformAdministrationServiceDep = Annotated[
    PlatformAdministrationService,
    Depends(get_platform_administration_service),
]