from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.modules.auth.dependencies import get_user_manager
from app.modules.auth.user_manager import UserManager
from app.modules.jobs.repository import BackgroundJobRepository
from app.modules.jobs.service import BackgroundJobService
from app.modules.organization_administration.repository import OrganizationMemberRepository
from app.modules.organization_administration.service import OrganizationAdministrationService


async def get_organization_administration_service(
    session: AsyncSession = Depends(get_async_session),
    user_manager: UserManager = Depends(get_user_manager),
) -> OrganizationAdministrationService:
    return OrganizationAdministrationService(
        db=session,
        repository=OrganizationMemberRepository(session),
        job_service=BackgroundJobService(
            session,
            BackgroundJobRepository(session),
        ),
        user_manager=user_manager,
    )


OrganizationAdministrationServiceDep = Annotated[
    OrganizationAdministrationService,
    Depends(get_organization_administration_service),
]
