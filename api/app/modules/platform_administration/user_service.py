import uuid
from collections.abc import Awaitable, Callable
from datetime import timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.email import SmtpEmailSender
from app.core.security import generate_secret, hash_secret, session_expiry
from app.models.organization_role import OrganizationRole
from app.models.user import User
from app.modules.auth.invitation_repository import UserInvitationRepository
from app.modules.auth.password_reset_repository import PasswordResetTokenRepository
from app.modules.auth.user_manager import UserManager
from app.modules.platform_administration.exceptions import (
    OrganizationNotFoundError,
    OrganizationMembershipAlreadyExistsError,
    OrganizationMembershipNotFoundError,
    PlatformUserNotFoundError,
    UserAlreadyVerifiedError,
    UserEmailAlreadyExistsError,
    UserNotVerifiedError,
)
from app.modules.platform_administration.repository import OrganizationRepository
from app.modules.platform_administration.user_repository import PlatformUserRepository
from app.modules.platform_administration.user_schemas import (
    CreatePlatformUserRequest,
    PlatformUserListParams,
    PlatformUserResponse,
    UserMembershipResponse,
)


class PlatformUserAdministrationService:
    def __init__(
        self,
        *,
        db: AsyncSession,
        user_repository: PlatformUserRepository,
        organization_repository: OrganizationRepository,
        invitation_repository: UserInvitationRepository,
        password_reset_repository: PasswordResetTokenRepository,
        user_manager: UserManager,
        email_sender: SmtpEmailSender,
        invitation_lifetime: timedelta,
        password_reset_lifetime: timedelta,
    ):
        self.db = db
        self.user_repository = user_repository
        self.organization_repository = organization_repository
        self.invitation_repository = invitation_repository
        self.password_reset_repository = password_reset_repository
        self.user_manager = user_manager
        self.email_sender = email_sender
        self.invitation_lifetime = invitation_lifetime
        self.password_reset_lifetime = password_reset_lifetime

    async def create_user(
        self,
        payload: CreatePlatformUserRequest,
    ) -> tuple[User, bool]:
        if await self.user_repository.get_by_email(email=payload.email):
            raise UserEmailAlreadyExistsError()

        if payload.organization_id is not None:
            organization = await self.organization_repository.get_by_id(
                organization_id=payload.organization_id,
            )
            if organization is None:
                raise OrganizationNotFoundError()

        invitation_token = generate_secret()
        placeholder_password = generate_secret()

        try:
            user = await self.user_repository.create(
                email=payload.email,
                hashed_password=self.user_manager.password_helper.hash(
                    placeholder_password
                ),
            )

            if payload.organization_id is not None and payload.role is not None:
                await self.user_repository.create_membership(
                    user_id=user.id,
                    organization_id=payload.organization_id,
                    role=payload.role,
                )

            await self.invitation_repository.create(
                user_id=user.id,
                token_hash=hash_secret(invitation_token),
                expires_at=session_expiry(self.invitation_lifetime),
            )
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            if "email" in str(exc.orig).lower():
                raise UserEmailAlreadyExistsError() from None
            raise

        user = await self.user_repository.get_by_id_with_memberships(
            user_id=user.id,
        )
        invitation_sent = True
        try:
            await self.email_sender.send_account_invitation(
                recipient_email=user.email,
                token=invitation_token,
            )
        except OSError:
            invitation_sent = False

        return user, invitation_sent

    async def get_users(
        self,
        params: PlatformUserListParams,
    ) -> tuple[list[User], int]:
        users = await self.user_repository.get_paginated(
            search=params.search,
            organization_id=params.organization_id,
            is_active=params.is_active,
            offset=params.offset,
            limit=params.page_size,
        )
        total = await self.user_repository.count_filtered(
            search=params.search,
            organization_id=params.organization_id,
            is_active=params.is_active,
        )
        return users, total

    async def set_user_active(
        self,
        *,
        user_id: uuid.UUID,
        is_active: bool,
    ) -> None:
        user = await self._get_managed_user(user_id=user_id)
        user.is_active = is_active
        await self.db.commit()

    async def set_organization_access(
        self,
        *,
        user_id: uuid.UUID,
        organization_id: uuid.UUID,
        is_active: bool,
    ) -> None:
        if await self.user_repository.get_managed_by_id(user_id=user_id) is None:
            raise PlatformUserNotFoundError()
        membership = await self.user_repository.get_membership(
            user_id=user_id,
            organization_id=organization_id,
        )
        if membership is None:
            raise OrganizationMembershipNotFoundError()
        membership.is_active = is_active
        await self.db.commit()

    async def add_to_organization(
        self,
        *,
        user_id: uuid.UUID,
        organization_id: uuid.UUID,
        role: OrganizationRole,
    ) -> None:
        await self._get_managed_user(user_id=user_id)
        organization = await self.organization_repository.get_by_id(
            organization_id=organization_id,
        )
        if organization is None:
            raise OrganizationNotFoundError()
        if await self.user_repository.get_membership(
            user_id=user_id,
            organization_id=organization_id,
        ) is not None:
            raise OrganizationMembershipAlreadyExistsError()

        try:
            await self.user_repository.create_membership(
                user_id=user_id,
                organization_id=organization_id,
                role=role,
            )
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise OrganizationMembershipAlreadyExistsError() from None

    async def resend_verification_email(self, *, user_id: uuid.UUID) -> bool:
        user = await self._get_managed_user(user_id=user_id, for_update=True)
        if user.is_verified:
            raise UserAlreadyVerifiedError()

        token = generate_secret()
        await self.invitation_repository.replace_for_user(
            user_id=user.id,
            token_hash=hash_secret(token),
            expires_at=session_expiry(self.invitation_lifetime),
        )
        await self.db.commit()
        return await self._send_email(
            self.email_sender.send_account_invitation,
            recipient_email=user.email,
            token=token,
        )

    async def send_password_reset_email(self, *, user_id: uuid.UUID) -> bool:
        user = await self._get_managed_user(user_id=user_id, for_update=True)
        if not user.is_verified:
            raise UserNotVerifiedError()

        token = generate_secret()
        await self.password_reset_repository.create_or_replace(
            user_id=user.id,
            token_hash=hash_secret(token),
            expires_at=session_expiry(self.password_reset_lifetime),
        )
        await self.db.commit()
        return await self._send_email(
            self.email_sender.send_password_reset,
            recipient_email=user.email,
            token=token,
        )

    async def _get_managed_user(
        self,
        *,
        user_id: uuid.UUID,
        for_update: bool = False,
    ) -> User:
        user = await self.user_repository.get_managed_by_id(
            user_id=user_id,
            for_update=for_update,
        )
        if user is None:
            raise PlatformUserNotFoundError()
        return user

    @staticmethod
    async def _send_email(
        send: Callable[..., Awaitable[None]],
        **kwargs: str,
    ) -> bool:
        try:
            await send(**kwargs)
        except OSError:
            return False
        return True

    @staticmethod
    def to_response(user: User) -> PlatformUserResponse:
        return PlatformUserResponse(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            memberships=[
                UserMembershipResponse(
                    organization_id=membership.organization_id,
                    organization_name=membership.organization.name,
                    organization_slug=membership.organization.slug,
                    role=OrganizationRole(membership.role),
                    is_active=membership.is_active,
                )
                for membership in sorted(
                    user.organization_memberships,
                    key=lambda item: item.organization.name.casefold(),
                )
            ],
        )
