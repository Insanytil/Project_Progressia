from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.modules.platform_administration.exceptions import (
    OrganizationSlugAlreadyExistsError,
)

from app.modules.platform_administration.repository import (
    OrganizationRepository,
)

from app.modules.platform_administration.schemas import (
    CreateOrganizationRequest,
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
        existing_organization = (
            await self.organization_repository.get_by_slug(
                payload.slug,
            )
        )

        if existing_organization is not None:
            raise OrganizationSlugAlreadyExistsError()

        organization = await self.organization_repository.create(
            name=payload.name,
            slug=payload.slug,
        )

        await self.db.commit()
        return organization
