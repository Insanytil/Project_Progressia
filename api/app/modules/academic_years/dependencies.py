from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.modules.academic_years.repository import AcademicYearRepository
from app.modules.academic_years.service import AcademicYearService


async def get_academic_year_service(
    session: AsyncSession = Depends(get_async_session),
) -> AcademicYearService:
    return AcademicYearService(session, AcademicYearRepository(session))


AcademicYearServiceDep = Annotated[
    AcademicYearService,
    Depends(get_academic_year_service),
]
