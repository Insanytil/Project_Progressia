import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.pagination import PagePaginationParams
from app.models.organization import Organization
from app.modules.platform_administration.exceptions import (
    OrganizationNameAlreadyExistsError,
    OrganizationNotFoundError,
    OrganizationSlugAlreadyExistsError,
)
from app.modules.platform_administration.filters import OrganizationFilters
from app.modules.platform_administration.repository import (
    OrganizationRepository,
)
from app.modules.platform_administration.schemas import (
    CreateOrganizationRequest,
    UpdateOrganizationRequest,
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
            name=payload.name,
        )

        if existing_name is not None:
            raise OrganizationNameAlreadyExistsError()

        existing_slug = await self.organization_repository.get_by_slug(
            slug=payload.slug,
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
            self._raise_organization_integrity_error(exc)
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
    ) -> Organization:
        organization = await self.organization_repository.get_by_id(
            organization_id=organization_id,
        )

        if organization is None:
            raise OrganizationNotFoundError()

        return organization

    async def update_organization(
        self,
        *,
        organization_id: uuid.UUID,
        payload: UpdateOrganizationRequest,
    ) -> Organization:
        organization = await self.organization_repository.get_by_id(
            organization_id=organization_id,
        )

        if organization is None:
            raise OrganizationNotFoundError()

        updates = payload.model_dump(
            exclude_unset=True,
        )

        changes = {
            field: value
            for field, value in updates.items()
            if getattr(organization, field) != value
        }

        if not changes:
            return organization

        if "name" in changes:
            existing_name = await self.organization_repository.get_by_name(
                name=changes["name"],
            )

            if (
                existing_name is not None
                and existing_name.id != organization.id
            ):
                raise OrganizationNameAlreadyExistsError()

        if "slug" in changes:
            existing_slug = await self.organization_repository.get_by_slug(
                slug=changes["slug"],
            )

            if (
                existing_slug is not None
                and existing_slug.id != organization.id
            ):
                raise OrganizationSlugAlreadyExistsError()

        for field, value in changes.items():
            setattr(organization, field, value)

        try:
            await self.db.commit()
            await self.db.refresh(organization)

            return organization

        except IntegrityError as exc:
            await self.db.rollback()
            self._raise_organization_integrity_error(exc)
            raise

    @staticmethod
    def _raise_organization_integrity_error(
        exc: IntegrityError,
    ) -> None:
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
