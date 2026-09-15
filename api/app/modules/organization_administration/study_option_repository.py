import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.course import Course
from app.models.course_option import CourseOption
from app.models.study_option import StudyOption
from app.models.study_option_course import StudyOptionCourse
from app.models.study_option_pathway import StudyOptionPathway
from app.models.study_option_pathway_course import StudyOptionPathwayCourse
from app.models.student_study_option_enrollment import StudentStudyOptionEnrollment


class StudyOptionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _load_structure():
        return (
            selectinload(StudyOption.courses)
            .joinedload(StudyOptionCourse.course_option)
            .joinedload(CourseOption.course),
            selectinload(StudyOption.pathways)
            .selectinload(StudyOptionPathway.courses)
            .joinedload(StudyOptionPathwayCourse.course_option)
            .joinedload(CourseOption.course),
        )

    async def get_by_name(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        name: str,
    ) -> StudyOption | None:
        return await self.db.scalar(
            select(StudyOption).where(
                StudyOption.organization_id == organization_id,
                StudyOption.academic_year_id == academic_year_id,
                func.lower(func.btrim(StudyOption.name)) == name.strip().lower(),
            )
        )

    async def get_valid_course_options(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        option_ids: set[uuid.UUID],
    ) -> dict[uuid.UUID, uuid.UUID]:
        if not option_ids:
            return {}
        rows = await self.db.execute(
            select(CourseOption.id, CourseOption.course_id)
            .join(Course)
            .where(
                Course.organization_id == organization_id,
                CourseOption.academic_year_id == academic_year_id,
                CourseOption.id.in_(option_ids),
            )
        )
        return {option_id: course_id for option_id, course_id in rows.all()}

    async def get_paginated(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        search: str | None,
        offset: int,
        limit: int,
    ) -> list[StudyOption]:
        statement = select(StudyOption).where(
            StudyOption.organization_id == organization_id,
            StudyOption.academic_year_id == academic_year_id,
        )
        if search and search.strip():
            statement = statement.where(
                func.lower(StudyOption.name).contains(
                    search.strip().lower(),
                    autoescape=True,
                )
            )
        result = await self.db.scalars(
            statement
            .options(*self._load_structure())
            .order_by(func.lower(StudyOption.name).asc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.all())

    async def count_filtered(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        search: str | None,
    ) -> int:
        statement = select(func.count()).select_from(StudyOption).where(
            StudyOption.organization_id == organization_id,
            StudyOption.academic_year_id == academic_year_id,
        )
        if search and search.strip():
            statement = statement.where(
                func.lower(StudyOption.name).contains(
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
        courses: dict[uuid.UUID, uuid.UUID],
    ) -> StudyOption:
        study_option = StudyOption(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
            name=name,
        )
        study_option.courses = [
            StudyOptionCourse(course_id=course_id, course_option_id=option_id)
            for course_id, option_id in courses.items()
        ]
        self.db.add(study_option)
        await self.db.flush()
        return study_option

    async def get_by_id(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        study_option_id: uuid.UUID,
        for_update: bool = False,
    ) -> StudyOption | None:
        statement = (
            select(StudyOption)
            .options(*self._load_structure())
            .where(
                StudyOption.id == study_option_id,
                StudyOption.organization_id == organization_id,
                StudyOption.academic_year_id == academic_year_id,
            )
        )
        if for_update:
            statement = statement.with_for_update(of=StudyOption)
        return await self.db.scalar(statement.execution_options(populate_existing=True))

    async def replace_courses(
        self,
        *,
        study_option: StudyOption,
        courses: dict[uuid.UUID, uuid.UUID],
    ) -> None:
        existing = {item.course_id: item for item in study_option.courses}
        requested = dict(courses)
        for course_id, item in existing.items():
            option_id = requested.pop(course_id, None)
            if option_id is None:
                study_option.courses.remove(item)
            elif item.course_option_id != option_id:
                item.course_option_id = option_id
        study_option.courses.extend(
            StudyOptionCourse(course_id=course_id, course_option_id=option_id)
            for course_id, option_id in requested.items()
        )
        await self.db.flush()

    async def replace_pathways(
        self,
        *,
        study_option: StudyOption,
        pathways: list[tuple[uuid.UUID | None, str, dict[uuid.UUID, uuid.UUID]]],
    ) -> None:
        existing = {item.id: item for item in study_option.pathways}
        retained_ids = {item_id for item_id, _, _ in pathways if item_id is not None}

        for pathway in list(study_option.pathways):
            if pathway.id not in retained_ids:
                study_option.pathways.remove(pathway)

        for pathway_id, name, courses in pathways:
            pathway = existing.get(pathway_id) if pathway_id is not None else None
            if pathway is None:
                pathway = StudyOptionPathway(name=name)
                study_option.pathways.append(pathway)
            else:
                pathway.name = name

            existing_courses = {item.course_id: item for item in pathway.courses}
            requested = dict(courses)
            for course_id, item in existing_courses.items():
                option_id = requested.pop(course_id, None)
                if option_id is None:
                    pathway.courses.remove(item)
                elif item.course_option_id != option_id:
                    item.course_option_id = option_id
            pathway.courses.extend(
                StudyOptionPathwayCourse(
                    course_id=course_id,
                    course_option_id=option_id,
                )
                for course_id, option_id in requested.items()
            )
        await self.db.flush()

    async def get_assigned_pathway_ids(
        self,
        *,
        pathway_ids: set[uuid.UUID],
    ) -> set[uuid.UUID]:
        if not pathway_ids:
            return set()
        result = await self.db.scalars(
            select(StudentStudyOptionEnrollment.pathway_id).where(
                StudentStudyOptionEnrollment.pathway_id.in_(pathway_ids)
            )
        )
        return {item for item in result.all() if item is not None}

    async def update_pathway(
        self,
        *,
        pathway: StudyOptionPathway,
        name: str,
        courses: dict[uuid.UUID, uuid.UUID],
    ) -> None:
        pathway.name = name
        existing = {item.course_id: item for item in pathway.courses}
        requested = dict(courses)
        for course_id, item in existing.items():
            option_id = requested.pop(course_id, None)
            if option_id is None:
                pathway.courses.remove(item)
            elif item.course_option_id != option_id:
                item.course_option_id = option_id
        pathway.courses.extend(
            StudyOptionPathwayCourse(
                course_id=course_id,
                course_option_id=option_id,
            )
            for course_id, option_id in requested.items()
        )
        await self.db.flush()

    async def clear_pathway_assignments(
        self,
        *,
        study_option_id: uuid.UUID,
    ) -> None:
        await self.db.execute(
            update(StudentStudyOptionEnrollment)
            .where(
                StudentStudyOptionEnrollment.study_option_id == study_option_id,
                StudentStudyOptionEnrollment.pathway_id.is_not(None),
            )
            .values(pathway_id=None)
        )
