from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.modules.academic_years.repository import AcademicYearRepository
from app.modules.auth.dependencies import get_user_manager
from app.modules.auth.user_manager import UserManager
from app.modules.jobs.repository import BackgroundJobRepository
from app.modules.jobs.service import BackgroundJobService
from app.modules.organization_administration.class_repository import SchoolClassRepository
from app.modules.organization_administration.class_service import SchoolClassService
from app.modules.organization_administration.course_repository import CourseRepository
from app.modules.organization_administration.course_service import CourseService
from app.modules.organization_administration.curriculum_assignment_repository import CurriculumAssignmentRepository
from app.modules.organization_administration.curriculum_assignment_service import CurriculumAssignmentService
from app.modules.organization_administration.study_option_repository import StudyOptionRepository
from app.modules.organization_administration.study_option_service import StudyOptionService
from app.modules.organization_administration.repository import OrganizationMemberRepository
from app.modules.organization_administration.service import OrganizationAdministrationService


async def get_organization_administration_service(
    session: AsyncSession = Depends(get_async_session),
    user_manager: UserManager = Depends(get_user_manager),
) -> OrganizationAdministrationService:
    return OrganizationAdministrationService(
        db=session,
        repository=OrganizationMemberRepository(session),
        job_service=BackgroundJobService(
            session,
            BackgroundJobRepository(session),
        ),
        user_manager=user_manager,
    )


OrganizationAdministrationServiceDep = Annotated[
    OrganizationAdministrationService,
    Depends(get_organization_administration_service),
]


async def get_school_class_service(
    session: AsyncSession = Depends(get_async_session),
) -> SchoolClassService:
    return SchoolClassService(
        session,
        SchoolClassRepository(session),
        AcademicYearRepository(session),
    )


SchoolClassServiceDep = Annotated[
    SchoolClassService,
    Depends(get_school_class_service),
]


async def get_course_service(
    session: AsyncSession = Depends(get_async_session),
) -> CourseService:
    return CourseService(
        session,
        CourseRepository(session),
        AcademicYearRepository(session),
    )


CourseServiceDep = Annotated[
    CourseService,
    Depends(get_course_service),
]


async def get_study_option_service(
    session: AsyncSession = Depends(get_async_session),
) -> StudyOptionService:
    return StudyOptionService(
        session,
        StudyOptionRepository(session),
        AcademicYearRepository(session),
    )


StudyOptionServiceDep = Annotated[
    StudyOptionService,
    Depends(get_study_option_service),
]


async def get_curriculum_assignment_service(
    session: AsyncSession = Depends(get_async_session),
) -> CurriculumAssignmentService:
    return CurriculumAssignmentService(
        session,
        CurriculumAssignmentRepository(session),
        AcademicYearRepository(session),
        StudyOptionRepository(session),
    )


CurriculumAssignmentServiceDep = Annotated[
    CurriculumAssignmentService,
    Depends(get_curriculum_assignment_service),
]
