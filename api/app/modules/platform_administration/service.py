import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PagePaginationParams
from app.models.organization import Organization
from app.modules.platform_administration.exceptions import (
    OrganizationNameAlreadyExistsError,
    OrganizationSlugAlreadyExistsError,
)
from app.modules.platform_administration.filters import OrganizationFilters
from app.modules.platform_administration.repository import (
    OrganizationRepository,
)
from app.modules.platform_administration.schemas import (
    CreateOrganizationRequest,
    OrganizationResponse
)


class PlatformAdministrationService:
    def __init__(
        self,
        db: AsyncSession,
        organization_repository: OrganizationRepository,
    ):
        self.db = db
        self.organization_repository = organization_repository

    async def create_organization(
        self,
        payload: CreateOrganizationRequest,
    ) -> Organization:
        existing_name = await self.organization_repository.get_by_name(
            payload.name,
        )

        if existing_name is not None:
            raise OrganizationNameAlreadyExistsError()

        existing_slug = await self.organization_repository.get_by_slug(
            payload.slug,
        )

        if existing_slug is not None:
            raise OrganizationSlugAlreadyExistsError()

        try:
            organization = await self.organization_repository.create(
                name=payload.name,
                slug=payload.slug,
            )

            await self.db.commit()

            return organization

        except IntegrityError as exc:
            await self.db.rollback()

            driver_error = getattr(
                exc.orig,
                "__cause__",
                None,
            ) or exc.orig

            constraint_name = getattr(
                driver_error,
                "constraint_name",
                None,
            )

            if constraint_name == "uq_organizations_slug":
                raise OrganizationSlugAlreadyExistsError() from None

            if constraint_name == "uq_organizations_name_normalized":
                raise OrganizationNameAlreadyExistsError() from None

            raise

    async def get_organizations(
        self,
        *,
        filters: OrganizationFilters,
        pagination: PagePaginationParams,
    ) -> tuple[list[Organization], int]:
        organizations = await self.organization_repository.get_paginated(
            filters=filters,
            offset=pagination.offset,
            limit=pagination.page_size,
        )

        total = await self.organization_repository.count_filtered(
            filters,
        )

        return organizations, total

    async def get_organization_by_id(
        self,
        *,
        organization_id: uuid.UUID,
    ) ->  OrganizationResponse :

        organization = await self.organization_repository.get_organization_by_id(
            organization_id,
        )

        return organization | None


