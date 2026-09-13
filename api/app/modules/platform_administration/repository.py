import uuid
from typing import Any

from sqlalchemy import String, func, or_, select, type_coerce
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.core.filtering import apply_eq_filter
from app.models.organization import Organization
from app.modules.platform_administration.filters import OrganizationFilters


class OrganizationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _normalized_name_column():
        return type_coerce(
            func.lower(
                func.btrim(Organization.name)
            ),
            String,
        )

    def _apply_filters(
        self,
        statement: Select[Any],
        filters: OrganizationFilters,
    ) -> Select[Any]:
        normalized_name_column = self._normalized_name_column()

        if filters.search:
            search = filters.search.strip().lower()

            if search:
                statement = statement.where(
                    or_(
                        normalized_name_column.contains(
                            search,
                            autoescape=True,
                        ),
                        Organization.slug.contains(
                            search,
                            autoescape=True,
                        ),
                    )
                )

        if filters.name_eq:
            statement = apply_eq_filter(
                statement,
                normalized_name_column,
                filters.name_eq.strip().lower(),
            )

        if filters.slug_eq:
            statement = apply_eq_filter(
                statement,
                Organization.slug,
                filters.slug_eq.strip().lower(),
            )

        statement = apply_eq_filter(
            statement,
            Organization.is_active,
            filters.is_active_eq,
        )

        return statement

    async def get_by_slug(
        self,
        *,
        slug: str,
    ) -> Organization | None:
        return await self.db.scalar(
            select(Organization).where(
                Organization.slug == slug,
            )
        )

    async def get_by_name(
        self,
        *,
        name: str,
    ) -> Organization | None:
        normalized_name = name.strip().lower()
        normalized_name_column = self._normalized_name_column()

        return await self.db.scalar(
            select(Organization).where(
                normalized_name_column == normalized_name,
            )
        )

    async def create(
        self,
        *,
        name: str,
        slug: str,
    ) -> Organization:
        organization = Organization(
            name=name,
            slug=slug,
        )

        self.db.add(organization)
        await self.db.flush()

        return organization

    async def get_paginated(
        self,
        *,
        filters: OrganizationFilters,
        offset: int,
        limit: int,
    ) -> list[Organization]:
        statement = self._apply_filters(
            select(Organization),
            filters,
        )

        statement = (
            statement
            .order_by(Organization.slug.asc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.scalars(statement)

        return list(result.all())

    async def count_filtered(
        self,
        filters: OrganizationFilters,
    ) -> int:
        statement = self._apply_filters(
            select(func.count()).select_from(Organization),
            filters,
        )

        total = await self.db.scalar(statement)

        return total or 0

    async def get_by_id(
        self,
        *,
        organization_id: uuid.UUID,
    ) -> Organization | None:

        return await self.db.scalar(
            select(Organization)
                .where(
                    Organization.id == organization_id,
                )
        )

