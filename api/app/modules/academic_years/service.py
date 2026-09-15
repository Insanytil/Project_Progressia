import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization_academic_year import OrganizationAcademicYear
from app.modules.academic_years.repository import AcademicYearRepository
from app.modules.academic_years.schemas import AcademicYearResponse


class AcademicYearNotFoundError(Exception):
    pass


class AcademicYearAlreadyExistsError(Exception):
    pass


class AcademicYearService:
    def __init__(self, db: AsyncSession, repository: AcademicYearRepository):
        self.db = db
        self.repository = repository

    async def list_for_organization(
        self,
        *,
        organization_id: uuid.UUID,
    ) -> list[OrganizationAcademicYear]:
        return await self.repository.list_for_organization(
            organization_id=organization_id,
        )

    async def activate(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
    ) -> OrganizationAcademicYear:
        await self.repository.lock_organization(
            organization_id=organization_id,
        )
        academic_year = await self.repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
        )
        if academic_year is None:
            raise AcademicYearNotFoundError()
        await self.repository.activate(
            organization_id=organization_id,
            academic_year=academic_year,
        )
        await self.db.commit()
        return academic_year

    async def create(
        self,
        *,
        organization_id: uuid.UUID,
        start_year: int,
        end_year: int,
    ) -> OrganizationAcademicYear:
        await self.repository.lock_organization(
            organization_id=organization_id,
        )
        if await self.repository.get_by_period(
            organization_id=organization_id,
            start_year=start_year,
            end_year=end_year,
        ) is not None:
            raise AcademicYearAlreadyExistsError()
        academic_year = await self.repository.get_or_create(
            organization_id=organization_id,
            start_year=start_year,
            end_year=end_year,
        )
        await self.db.commit()
        return academic_year

    @staticmethod
    def to_response(academic_year: OrganizationAcademicYear) -> AcademicYearResponse:
        return AcademicYearResponse(
            id=academic_year.id,
            start_year=academic_year.start_year,
            end_year=academic_year.end_year,
            label=academic_year.label,
            is_active=academic_year.is_active,
        )
