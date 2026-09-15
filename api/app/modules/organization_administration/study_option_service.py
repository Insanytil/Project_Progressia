import uuid
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.study_option import StudyOption
from app.modules.academic_years.repository import AcademicYearRepository
from app.modules.organization_administration.study_option_exceptions import (
    InvalidStudyOptionCoursesError,
    InvalidStudyOptionPathwaysError,
    StudyOptionAlreadyExistsError,
    StudyOptionNotFoundError,
    StudyOptionPathwayInUseError,
)
from app.modules.organization_administration.study_option_repository import (
    StudyOptionRepository,
)
from app.modules.organization_administration.study_option_schemas import (
    CreateStudyOptionRequest,
    StudyOptionCourseInput,
    StudyOptionCourseResponse,
    StudyOptionListParams,
    StudyOptionResponse,
    StudyOptionPathwayResponse,
    UpdateStudyOptionCoursesRequest,
    UpdateStudyOptionPathwaysRequest,
    UpdateStudyOptionPathwayRequest,
)


class StudyOptionService:
    def __init__(
        self,
        db: AsyncSession,
        repository: StudyOptionRepository,
        academic_year_repository: AcademicYearRepository,
    ):
        self.db = db
        self.repository = repository
        self.academic_year_repository = academic_year_repository

    async def _validate_courses(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        courses: list[StudyOptionCourseInput],
    ) -> dict[uuid.UUID, uuid.UUID]:
        requested = {
            item.course_id: item.course_option_id
            for item in courses
        }
        valid = await self.repository.get_valid_course_options(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
            option_ids=set(requested.values()),
        )
        if any(
            valid.get(option_id) != course_id
            for course_id, option_id in requested.items()
        ):
            raise InvalidStudyOptionCoursesError()
        return requested

    async def list_study_options(
        self,
        *,
        organization_id: uuid.UUID,
        params: StudyOptionListParams,
    ) -> tuple[list[StudyOption], int]:
        if await self.academic_year_repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=params.academic_year_id,
        ) is None:
            raise InvalidStudyOptionCoursesError()
        items = await self.repository.get_paginated(
            organization_id=organization_id,
            academic_year_id=params.academic_year_id,
            search=params.search,
            offset=params.offset,
            limit=params.page_size,
        )
        total = await self.repository.count_filtered(
            organization_id=organization_id,
            academic_year_id=params.academic_year_id,
            search=params.search,
        )
        return items, total

    async def create(
        self,
        *,
        organization_id: uuid.UUID,
        payload: CreateStudyOptionRequest,
    ) -> StudyOption:
        await self.academic_year_repository.lock_organization(
            organization_id=organization_id,
        )
        if await self.academic_year_repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
        ) is None:
            raise InvalidStudyOptionCoursesError()
        if await self.repository.get_by_name(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            name=payload.name,
        ) is not None:
            raise StudyOptionAlreadyExistsError()
        courses = await self._validate_courses(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            courses=payload.courses,
        )
        try:
            study_option = await self.repository.create(
                organization_id=organization_id,
                academic_year_id=payload.academic_year_id,
                name=payload.name,
                courses=courses,
            )
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise StudyOptionAlreadyExistsError() from None
        loaded = await self.repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            study_option_id=study_option.id,
        )
        if loaded is None:
            raise RuntimeError("Created study option could not be reloaded")
        return loaded

    async def update_courses(
        self,
        *,
        organization_id: uuid.UUID,
        study_option_id: uuid.UUID,
        payload: UpdateStudyOptionCoursesRequest,
    ) -> StudyOption:
        await self.academic_year_repository.lock_organization(
            organization_id=organization_id,
        )
        courses = await self._validate_courses(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            courses=payload.courses,
        )
        study_option = await self.repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            study_option_id=study_option_id,
            for_update=True,
        )
        if study_option is None:
            raise StudyOptionNotFoundError()
        pathway_course_ids = {
            item.course_id
            for pathway in study_option.pathways
            for item in pathway.courses
        }
        if pathway_course_ids.intersection(courses):
            raise InvalidStudyOptionPathwaysError()
        await self.repository.replace_courses(
            study_option=study_option,
            courses=courses,
        )
        await self.db.commit()
        updated = await self.repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            study_option_id=study_option_id,
        )
        if updated is None:
            raise RuntimeError("Updated study option could not be reloaded")
        return updated

    async def update_pathways(
        self,
        *,
        organization_id: uuid.UUID,
        study_option_id: uuid.UUID,
        payload: UpdateStudyOptionPathwaysRequest,
    ) -> StudyOption:
        await self.academic_year_repository.lock_organization(
            organization_id=organization_id,
        )
        study_option = await self.repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            study_option_id=study_option_id,
            for_update=True,
        )
        if study_option is None:
            raise StudyOptionNotFoundError()

        existing_ids = {item.id for item in study_option.pathways}
        submitted_ids = {
            item.id for item in payload.pathways if item.id is not None
        }
        if not submitted_ids.issubset(existing_ids):
            raise InvalidStudyOptionPathwaysError()
        removed_ids = existing_ids - submitted_ids
        assigned_removed_ids = await self.repository.get_assigned_pathway_ids(
            pathway_ids=removed_ids,
        )
        if assigned_removed_ids:
            if payload.pathways:
                raise StudyOptionPathwayInUseError()
            await self.repository.clear_pathway_assignments(
                study_option_id=study_option.id,
            )

        base_course_ids = {item.course_id for item in study_option.courses}
        validated_pathways = []
        for pathway in payload.pathways:
            courses = await self._validate_courses(
                organization_id=organization_id,
                academic_year_id=payload.academic_year_id,
                courses=pathway.courses,
            )
            if base_course_ids.intersection(courses):
                raise InvalidStudyOptionPathwaysError()
            validated_pathways.append((pathway.id, pathway.name, courses))

        try:
            await self.repository.replace_pathways(
                study_option=study_option,
                pathways=validated_pathways,
            )
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise InvalidStudyOptionPathwaysError() from None

        updated = await self.repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            study_option_id=study_option_id,
        )
        if updated is None:
            raise RuntimeError("Updated study option could not be reloaded")
        return updated

    async def update_pathway(
        self,
        *,
        organization_id: uuid.UUID,
        study_option_id: uuid.UUID,
        pathway_id: uuid.UUID,
        payload: UpdateStudyOptionPathwayRequest,
    ) -> StudyOption:
        await self.academic_year_repository.lock_organization(
            organization_id=organization_id,
        )
        study_option = await self.repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            study_option_id=study_option_id,
            for_update=True,
        )
        if study_option is None:
            raise StudyOptionNotFoundError()
        pathway = next(
            (item for item in study_option.pathways if item.id == pathway_id),
            None,
        )
        if pathway is None:
            raise InvalidStudyOptionPathwaysError()
        courses = await self._validate_courses(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            courses=payload.courses,
        )
        if {item.course_id for item in study_option.courses}.intersection(courses):
            raise InvalidStudyOptionPathwaysError()
        try:
            await self.repository.update_pathway(
                pathway=pathway,
                name=payload.name,
                courses=courses,
            )
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise InvalidStudyOptionPathwaysError() from None
        updated = await self.repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            study_option_id=study_option_id,
        )
        if updated is None:
            raise RuntimeError("Updated study option could not be reloaded")
        return updated

    @staticmethod
    def to_response(study_option: StudyOption) -> StudyOptionResponse:
        courses = sorted(
            [
                StudyOptionCourseResponse(
                    course_id=item.course_id,
                    course_name=item.course_option.course.name,
                    course_option_id=item.course_option_id,
                    weekly_hours=item.course_option.weekly_hours,
                )
                for item in study_option.courses
            ],
            key=lambda item: item.course_name.casefold(),
        )
        pathways = []
        for pathway in sorted(
            study_option.pathways,
            key=lambda item: item.name.casefold(),
        ):
            pathway_courses = sorted(
                [
                    StudyOptionCourseResponse(
                        course_id=item.course_id,
                        course_name=item.course_option.course.name,
                        course_option_id=item.course_option_id,
                        weekly_hours=item.course_option.weekly_hours,
                    )
                    for item in pathway.courses
                ],
                key=lambda item: item.course_name.casefold(),
            )
            pathways.append(
                StudyOptionPathwayResponse(
                    id=pathway.id,
                    name=pathway.name,
                    courses=pathway_courses,
                    weekly_hours=sum(
                        (item.weekly_hours for item in pathway_courses),
                        start=Decimal("0"),
                    ),
                )
            )
        return StudyOptionResponse(
            id=study_option.id,
            name=study_option.name,
            academic_year_id=study_option.academic_year_id,
            courses=courses,
            pathways=pathways,
            total_weekly_hours=sum(
                (item.weekly_hours for item in courses),
                start=Decimal("0"),
            ),
            created_at=study_option.created_at,
        )
