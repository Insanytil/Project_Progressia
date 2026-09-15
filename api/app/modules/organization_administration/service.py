import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import generate_secret
from app.models.background_job import BackgroundJobType
from app.models.organization_membership import OrganizationMembership
from app.models.organization_role import OrganizationRole
from app.modules.auth.user_manager import UserManager
from app.modules.jobs.service import BackgroundJobService
from app.modules.organization_administration.exceptions import (
    OrganizationMemberEmailAlreadyExistsError,
    OrganizationMemberNotFoundError,
    OrganizationMemberNotVerifiedError,
)
from app.modules.organization_administration.repository import OrganizationMemberRepository
from app.modules.organization_administration.schemas import (
    OrganizationMemberListParams,
    OrganizationMemberResponse,
)


class OrganizationAdministrationService:
    def __init__(
        self,
        *,
        db: AsyncSession,
        repository: OrganizationMemberRepository,
        job_service: BackgroundJobService,
        user_manager: UserManager,
    ):
        self.db = db
        self.repository = repository
        self.job_service = job_service
        self.user_manager = user_manager

    async def create_member(
        self,
        *,
        organization_id: uuid.UUID,
        email: str,
        role: OrganizationRole,
        triggered_by_user_id: uuid.UUID,
    ) -> tuple[OrganizationMembership, bool]:
        if await self.repository.get_user_by_email(email=email):
            raise OrganizationMemberEmailAlreadyExistsError()

        try:
            user = await self.repository.create_user(
                email=email,
                hashed_password=self.user_manager.password_helper.hash(generate_secret()),
            )
            membership = await self.repository.create_membership(
                user_id=user.id,
                organization_id=organization_id,
                role=role,
            )
            job = self.job_service.create_email_job(
                job_type=BackgroundJobType.ACCOUNT_VERIFICATION_EMAIL,
                recipient_email=user.email,
                subject_user_id=user.id,
                organization_id=organization_id,
                triggered_by_user_id=triggered_by_user_id,
            )
            await self.db.flush()
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise OrganizationMemberEmailAlreadyExistsError() from None

        membership = await self.repository.get_member(
            organization_id=organization_id,
            user_id=user.id,
        )
        if membership is None:
            raise RuntimeError("Created organization member could not be reloaded")

        invitation_queued = await self.job_service.dispatch(job)
        return membership, invitation_queued

    async def get_members(
        self,
        *,
        organization_id: uuid.UUID,
        params: OrganizationMemberListParams,
    ) -> tuple[list[OrganizationMembership], int]:
        members = await self.repository.get_paginated(
            organization_id=organization_id,
            search=params.search,
            is_active=params.is_active,
            offset=params.offset,
            limit=params.page_size,
        )
        total = await self.repository.count_filtered(
            organization_id=organization_id,
            search=params.search,
            is_active=params.is_active,
        )
        return members, total

    async def update_member(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        role: OrganizationRole | None,
        is_active: bool | None,
    ) -> None:
        membership = await self._get_member(
            organization_id=organization_id,
            user_id=user_id,
        )
        if role is not None:
            membership.role = role
        if is_active is not None:
            membership.is_active = is_active
        await self.db.commit()

    async def send_password_reset(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        triggered_by_user_id: uuid.UUID,
    ) -> bool:
        membership = await self._get_member(
            organization_id=organization_id,
            user_id=user_id,
            for_update=True,
        )
        if not membership.user.is_verified:
            raise OrganizationMemberNotVerifiedError()

        job = self.job_service.create_email_job(
            job_type=BackgroundJobType.PASSWORD_RESET_EMAIL,
            recipient_email=membership.user.email,
            subject_user_id=membership.user_id,
            organization_id=organization_id,
            triggered_by_user_id=triggered_by_user_id,
        )
        await self.db.flush()
        await self.db.commit()
        return await self.job_service.dispatch(job)

    async def _get_member(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        for_update: bool = False,
    ) -> OrganizationMembership:
        membership = await self.repository.get_member(
            organization_id=organization_id,
            user_id=user_id,
            for_update=for_update,
        )
        if membership is None:
            raise OrganizationMemberNotFoundError()
        return membership

    @staticmethod
    def to_response(membership: OrganizationMembership) -> OrganizationMemberResponse:
        return OrganizationMemberResponse(
            id=membership.user.id,
            email=membership.user.email,
            is_active=membership.user.is_active,
            is_verified=membership.user.is_verified,
            created_at=membership.user.created_at,
            role=membership.role,
            membership_is_active=membership.is_active,
        )
