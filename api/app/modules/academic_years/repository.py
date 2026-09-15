import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.organization_academic_year import OrganizationAcademicYear


class AcademicYearRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def lock_organization(self, *, organization_id: uuid.UUID) -> None:
        await self.db.scalar(
            select(Organization.id)
            .where(Organization.id == organization_id)
            .with_for_update()
        )

    async def list_for_organization(
        self,
        *,
        organization_id: uuid.UUID,
    ) -> list[OrganizationAcademicYear]:
        result = await self.db.scalars(
            select(OrganizationAcademicYear)
            .where(OrganizationAcademicYear.organization_id == organization_id)
            .order_by(OrganizationAcademicYear.start_year.desc())
        )
        return list(result.all())

    async def get_by_id(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
    ) -> OrganizationAcademicYear | None:
        return await self.db.scalar(
            select(OrganizationAcademicYear).where(
                OrganizationAcademicYear.id == academic_year_id,
                OrganizationAcademicYear.organization_id == organization_id,
            )
        )

    async def get_by_period(
        self,
        *,
        organization_id: uuid.UUID,
        start_year: int,
        end_year: int,
    ) -> OrganizationAcademicYear | None:
        return await self.db.scalar(
            select(OrganizationAcademicYear).where(
                OrganizationAcademicYear.organization_id == organization_id,
                OrganizationAcademicYear.start_year == start_year,
                OrganizationAcademicYear.end_year == end_year,
            )
        )

    async def get_or_create(
        self,
        *,
        organization_id: uuid.UUID,
        start_year: int,
        end_year: int,
    ) -> OrganizationAcademicYear:
        academic_year = await self.get_by_period(
            organization_id=organization_id,
            start_year=start_year,
            end_year=end_year,
        )
        if academic_year is not None:
            return academic_year

        has_active_year = await self.db.scalar(
            select(OrganizationAcademicYear.id).where(
                OrganizationAcademicYear.organization_id == organization_id,
                OrganizationAcademicYear.is_active.is_(True),
            )
        )
        academic_year = OrganizationAcademicYear(
            organization_id=organization_id,
            start_year=start_year,
            end_year=end_year,
            is_active=has_active_year is None,
        )
        self.db.add(academic_year)
        await self.db.flush()
        return academic_year

    async def activate(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year: OrganizationAcademicYear,
    ) -> None:
        await self.db.execute(
            update(OrganizationAcademicYear)
            .where(
                OrganizationAcademicYear.organization_id == organization_id,
                OrganizationAcademicYear.id != academic_year.id,
                OrganizationAcademicYear.is_active.is_(True),
            )
            .values(is_active=False)
        )
        academic_year.is_active = True
        await self.db.flush()
