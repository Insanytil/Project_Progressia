from datetime import timedelta
from typing import Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.email import SmtpEmailSender
from app.db.session import get_async_session
from app.modules.auth.dependencies import get_user_manager
from app.modules.auth.invitation_repository import UserInvitationRepository
from app.modules.auth.password_reset_repository import PasswordResetTokenRepository
from app.modules.auth.user_manager import UserManager
from app.modules.platform_administration.repository import (
    OrganizationRepository,
)
from app.modules.platform_administration.service import (
    PlatformAdministrationService,
)
from app.modules.platform_administration.user_repository import PlatformUserRepository
from app.modules.platform_administration.user_service import PlatformUserAdministrationService


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


async def get_platform_user_administration_service(
    session: AsyncSession = Depends(get_async_session),
    user_manager: UserManager = Depends(get_user_manager),
) -> PlatformUserAdministrationService:
    return PlatformUserAdministrationService(
        db=session,
        user_repository=PlatformUserRepository(session),
        organization_repository=OrganizationRepository(session),
        invitation_repository=UserInvitationRepository(session),
        password_reset_repository=PasswordResetTokenRepository(session),
        user_manager=user_manager,
        email_sender=SmtpEmailSender(
            host=settings.smtp_host,
            port=settings.smtp_port,
            sender_email=settings.smtp_sender_email,
            frontend_base_url=settings.frontend_base_url,
        ),
        invitation_lifetime=timedelta(
            hours=settings.invitation_lifetime_hours,
        ),
        password_reset_lifetime=timedelta(
            minutes=settings.password_reset_lifetime_minutes,
        ),
    )


PlatformUserAdministrationServiceDep = Annotated[
    PlatformUserAdministrationService,
    Depends(get_platform_user_administration_service),
]
