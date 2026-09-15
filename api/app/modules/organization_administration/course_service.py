import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.modules.academic_years.repository import AcademicYearRepository
from app.modules.organization_administration.course_exceptions import (
    CourseAcademicYearNotFoundError,
    CourseAlreadyExistsError,
    CourseNotFoundError,
    CourseOptionInUseError,
)
from app.modules.organization_administration.course_repository import CourseRepository
from app.modules.organization_administration.course_schemas import (
    CourseListParams,
    CourseOptionResponse,
    CourseResponse,
    CreateCourseRequest,
    UpdateCourseOptionsRequest,
)


class CourseService:
    def __init__(
        self,
        db: AsyncSession,
        repository: CourseRepository,
        academic_year_repository: AcademicYearRepository,
    ):
        self.db = db
        self.repository = repository
        self.academic_year_repository = academic_year_repository

    async def _require_academic_year(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
    ) -> None:
        if await self.academic_year_repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
        ) is None:
            raise CourseAcademicYearNotFoundError()

    async def list_courses(
        self,
        *,
        organization_id: uuid.UUID,
        params: CourseListParams,
    ) -> tuple[list[Course], int]:
        await self._require_academic_year(
            organization_id=organization_id,
            academic_year_id=params.academic_year_id,
        )
        courses = await self.repository.get_paginated(
            organization_id=organization_id,
            academic_year_id=params.academic_year_id,
            search=params.search,
            offset=params.offset,
            limit=params.page_size,
        )
        total = await self.repository.count_filtered(
            organization_id=organization_id,
            search=params.search,
        )
        return courses, total

    async def create_course(
        self,
        *,
        organization_id: uuid.UUID,
        payload: CreateCourseRequest,
    ) -> Course:
        await self.academic_year_repository.lock_organization(
            organization_id=organization_id,
        )
        await self._require_academic_year(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
        )
        if await self.repository.get_by_name(
            organization_id=organization_id,
            name=payload.name,
        ) is not None:
            raise CourseAlreadyExistsError()
        try:
            course = await self.repository.create(
                organization_id=organization_id,
                academic_year_id=payload.academic_year_id,
                name=payload.name,
                weekly_hours=payload.options,
            )
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise CourseAlreadyExistsError() from None
        loaded = await self.repository.get_by_id(
            organization_id=organization_id,
            course_id=course.id,
            academic_year_id=payload.academic_year_id,
        )
        if loaded is None:
            raise RuntimeError("Created course could not be reloaded")
        return loaded

    async def update_options(
        self,
        *,
        organization_id: uuid.UUID,
        course_id: uuid.UUID,
        payload: UpdateCourseOptionsRequest,
    ) -> Course:
        await self.academic_year_repository.lock_organization(
            organization_id=organization_id,
        )
        await self._require_academic_year(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
        )
        course = await self.repository.get_by_id(
            organization_id=organization_id,
            course_id=course_id,
            academic_year_id=payload.academic_year_id,
            for_update=True,
        )
        if course is None:
            raise CourseNotFoundError()
        requested_hours = set(payload.options)
        removed_option_ids = {
            option.id
            for option in course.options
            if option.weekly_hours not in requested_hours
        }
        if await self.repository.get_used_option_ids(
            option_ids=removed_option_ids,
        ):
            raise CourseOptionInUseError()
        await self.repository.replace_options(
            course=course,
            academic_year_id=payload.academic_year_id,
            weekly_hours=payload.options,
        )
        await self.db.commit()
        updated = await self.repository.get_by_id(
            organization_id=organization_id,
            course_id=course_id,
            academic_year_id=payload.academic_year_id,
        )
        if updated is None:
            raise RuntimeError("Updated course could not be reloaded")
        return updated

    @staticmethod
    def to_response(course: Course, academic_year_id: uuid.UUID) -> CourseResponse:
        return CourseResponse(
            id=course.id,
            name=course.name,
            academic_year_id=academic_year_id,
            options=sorted(
                [
                    CourseOptionResponse(
                        id=item.id,
                        weekly_hours=item.weekly_hours,
                    )
                    for item in course.options
                ],
                key=lambda item: item.weekly_hours,
            ),
            created_at=course.created_at,
        )
