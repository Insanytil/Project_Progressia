from sqlalchemy import String, func, select, type_coerce
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization

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


