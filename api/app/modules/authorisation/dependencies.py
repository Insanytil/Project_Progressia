import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.session import get_async_session
from app.models.organization import Organization
from app.models.organization_membership import OrganizationMembership
from app.models.organization_role import OrganizationRole
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


@dataclass(frozen=True, slots=True)
class OrganizationScope:
    organization: Organization
    user: User
    role: OrganizationRole | None


async def require_organization_scope(
    organization_id: Annotated[
        uuid.UUID,
        Header(alias="X-Organization-ID"),
    ],
    auth: CsrfProtectedSession,
    session: AsyncSession = Depends(get_async_session),
) -> OrganizationScope:
    organization = await session.scalar(
        select(Organization).where(
            Organization.id == organization_id,
            Organization.is_active.is_(True),
        )
    )
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    if auth.user.is_superuser:
        return OrganizationScope(
            organization=organization,
            user=auth.user,
            role=None,
        )

    membership = await session.scalar(
        select(OrganizationMembership)
        .options(joinedload(OrganizationMembership.organization))
        .where(
            OrganizationMembership.organization_id == organization_id,
            OrganizationMembership.user_id == auth.user.id,
            OrganizationMembership.is_active.is_(True),
        )
    )
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active organization membership required",
        )

    return OrganizationScope(
        organization=membership.organization,
        user=auth.user,
        role=membership.role,
    )


CurrentOrganizationScope = Annotated[
    OrganizationScope,
    Depends(require_organization_scope),
]


async def require_organization_admin(
    scope: CurrentOrganizationScope,
) -> OrganizationScope:
    if scope.role != OrganizationRole.ORGANIZATION_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization administrator access required",
        )
    return scope


OrganizationAdminScope = Annotated[
    OrganizationScope,
    Depends(require_organization_admin),
]
