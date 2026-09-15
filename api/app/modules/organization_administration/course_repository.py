import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import Course
from app.models.course_option import CourseOption
from app.models.study_option_course import StudyOptionCourse
from app.models.study_option_pathway_course import StudyOptionPathwayCourse


class CourseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_name(
        self,
        *,
        organization_id: uuid.UUID,
        name: str,
    ) -> Course | None:
        return await self.db.scalar(
            select(Course).where(
                Course.organization_id == organization_id,
                func.lower(func.btrim(Course.name)) == name.strip().lower(),
            )
        )

    async def get_paginated(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        search: str | None,
        offset: int,
        limit: int,
    ) -> list[Course]:
        statement = select(Course).where(
            Course.organization_id == organization_id
        )
        if search and search.strip():
            statement = statement.where(
                func.lower(Course.name).contains(
                    search.strip().lower(),
                    autoescape=True,
                )
            )
        statement = (
            statement
            .options(
                selectinload(
                    Course.options.and_(
                        CourseOption.academic_year_id == academic_year_id
                    )
                )
            )
            .order_by(func.lower(Course.name).asc())
            .offset(offset)
            .limit(limit)
        )
        return list((await self.db.scalars(statement)).all())

    async def count_filtered(
        self,
        *,
        organization_id: uuid.UUID,
        search: str | None,
    ) -> int:
        statement = select(func.count()).select_from(Course).where(
            Course.organization_id == organization_id
        )
        if search and search.strip():
            statement = statement.where(
                func.lower(Course.name).contains(
                    search.strip().lower(),
                    autoescape=True,
                )
            )
        return await self.db.scalar(statement) or 0

    async def create(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        name: str,
        weekly_hours: list[Decimal],
    ) -> Course:
        course = Course(organization_id=organization_id, name=name)
        course.options = [
            CourseOption(
                academic_year_id=academic_year_id,
                weekly_hours=hours,
            )
            for hours in weekly_hours
        ]
        self.db.add(course)
        await self.db.flush()
        return course

    async def get_by_id(
        self,
        *,
        organization_id: uuid.UUID,
        course_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        for_update: bool = False,
    ) -> Course | None:
        statement = (
            select(Course)
            .options(
                selectinload(
                    Course.options.and_(
                        CourseOption.academic_year_id == academic_year_id
                    )
                )
            )
            .where(
                Course.id == course_id,
                Course.organization_id == organization_id,
            )
        )
        if for_update:
            statement = statement.with_for_update(of=Course)
        return await self.db.scalar(
            statement.execution_options(populate_existing=True)
        )

    async def replace_options(
        self,
        *,
        course: Course,
        academic_year_id: uuid.UUID,
        weekly_hours: list[Decimal],
    ) -> None:
        requested = set(weekly_hours)
        existing = {
            option.weekly_hours: option
            for option in course.options
            if option.academic_year_id == academic_year_id
        }
        for hours, option in existing.items():
            if hours not in requested:
                course.options.remove(option)
            else:
                requested.remove(hours)
        course.options.extend(
            CourseOption(
                academic_year_id=academic_year_id,
                weekly_hours=hours,
            )
            for hours in requested
        )
        await self.db.flush()

    async def get_used_option_ids(
        self,
        *,
        option_ids: set[uuid.UUID],
    ) -> set[uuid.UUID]:
        if not option_ids:
            return set()
        result = await self.db.scalars(
            select(StudyOptionCourse.course_option_id).where(
                StudyOptionCourse.course_option_id.in_(option_ids)
            )
        )
        pathway_result = await self.db.scalars(
            select(StudyOptionPathwayCourse.course_option_id).where(
                StudyOptionPathwayCourse.course_option_id.in_(option_ids)
            )
        )
        return set(result.all()).union(pathway_result.all())
