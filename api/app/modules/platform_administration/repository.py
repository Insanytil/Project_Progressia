from sqlalchemy import select
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


