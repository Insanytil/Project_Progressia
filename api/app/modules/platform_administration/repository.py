from sqlalchemy import String, func, or_, select, type_coerce
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.modules.platform_administration.filters import OrganizationFilters

class OrganizationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_slug(
        self,
        slug: str,
    ) -> Organization | None:

        return await self.db.scalar(select(Organization).where(Organization.slug == slug,))

    async def get_by_name(
            self,
            name: str,
    ) -> Organization | None:
        normalized_name = name.strip().lower()

        normalized_name_column = type_coerce(
            func.lower(
                func.btrim(Organization.name)
            ),
            String,
        )

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
        normalized_name_column = type_coerce(
            func.lower(
                func.btrim(Organization.name)
            ),
            String,
        )

        statement = select(Organization)

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
            statement = statement.where(
                normalized_name_column
                == filters.name_eq.strip().lower()
            )

        if filters.slug_eq:
            statement = statement.where(
                Organization.slug
                == filters.slug_eq.strip().lower()
            )

        if filters.is_active_eq is not None:
            statement = statement.where(
                Organization.is_active
                == filters.is_active_eq
            )

        statement = (
            statement
            .order_by(Organization.slug.asc())
            .offset(offset)
            .limit(limit)
        )

        result = await self.db.scalars(statement)

        return list(result.all())

