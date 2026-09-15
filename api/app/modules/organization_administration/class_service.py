import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization_role import OrganizationRole
from app.models.school_class import SchoolClass
from app.models.school_class_membership import SchoolClassMembershipRole
from app.models.user import User
from app.modules.academic_years.repository import AcademicYearRepository
from app.modules.organization_administration.class_exceptions import (
    InvalidSchoolClassMembersError,
    SchoolClassAlreadyExistsError,
    SchoolClassNotFoundError,
    StudentsAlreadyAssignedError,
)
from app.modules.organization_administration.class_repository import (
    SchoolClassRepository,
)
from app.modules.organization_administration.class_schemas import (
    AssignableClassRole,
    CreateSchoolClassRequest,
    SchoolClassListParams,
    SchoolClassMemberResponse,
    SchoolClassResponse,
    UpdateSchoolClassMembersRequest,
)


class SchoolClassService:
    def __init__(
        self,
        db: AsyncSession,
        repository: SchoolClassRepository,
        academic_year_repository: AcademicYearRepository,
    ):
        self.db = db
        self.repository = repository
        self.academic_year_repository = academic_year_repository

    async def list_classes(
        self,
        *,
        organization_id: uuid.UUID,
        params: SchoolClassListParams,
    ) -> tuple[list[SchoolClass], int]:
        classes = await self.repository.get_paginated(
            organization_id=organization_id,
            search=params.search,
            academic_year=params.academic_year,
            offset=params.offset,
            limit=params.page_size,
        )
        total = await self.repository.count_filtered(
            organization_id=organization_id,
            search=params.search,
            academic_year=params.academic_year,
        )
        return classes, total

    async def list_member_options(
        self,
        *,
        organization_id: uuid.UUID,
        role: AssignableClassRole,
        search: str | None,
        academic_year: str | None,
        excluded_school_class_id: uuid.UUID | None,
        offset: int,
        limit: int,
    ) -> tuple[list[User], int]:
        organization_role = (
            OrganizationRole.TEACHER
            if role == AssignableClassRole.TEACHER
            else OrganizationRole.STUDENT
        )
        return await self.repository.get_member_options(
            organization_id=organization_id,
            role=organization_role,
            search=search,
            academic_year=academic_year,
            excluded_school_class_id=excluded_school_class_id,
            offset=offset,
            limit=limit,
        )

    async def create_class(
        self,
        *,
        organization_id: uuid.UUID,
        payload: CreateSchoolClassRequest,
    ) -> SchoolClass:
        await self.academic_year_repository.lock_organization(
            organization_id=organization_id,
        )
        if await self.repository.get_by_name_and_year(
            organization_id=organization_id,
            name=payload.name,
            academic_year=payload.academic_year,
        ):
            raise SchoolClassAlreadyExistsError()

        teacher_ids = set(payload.teacher_ids)
        student_ids = set(payload.student_ids)
        valid_teachers = await self.repository.get_assignable_member_ids(
            organization_id=organization_id,
            user_ids=teacher_ids,
            role=OrganizationRole.TEACHER,
        )
        valid_students = await self.repository.get_assignable_member_ids(
            organization_id=organization_id,
            user_ids=student_ids,
            role=OrganizationRole.STUDENT,
        )
        if valid_teachers != teacher_ids or valid_students != student_ids:
            raise InvalidSchoolClassMembersError(
                teacher_ids=teacher_ids - valid_teachers,
                student_ids=student_ids - valid_students,
            )
        assigned_student_ids = await self.repository.get_assigned_student_ids(
            organization_id=organization_id,
            academic_year=payload.academic_year,
            student_ids=student_ids,
        )
        if assigned_student_ids:
            raise StudentsAlreadyAssignedError(
                student_ids=assigned_student_ids,
            )

        start_year, end_year = (
            int(part) for part in payload.academic_year.split("-")
        )
        await self.academic_year_repository.get_or_create(
            organization_id=organization_id,
            start_year=start_year,
            end_year=end_year,
        )

        try:
            school_class = await self.repository.create(
                organization_id=organization_id,
                name=payload.name,
                academic_year=payload.academic_year,
                teacher_ids=teacher_ids,
                student_ids=student_ids,
            )
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            driver_error = getattr(exc.orig, "__cause__", None) or exc.orig
            if (
                getattr(driver_error, "constraint_name", None)
                == "uq_school_classes_organization_year_name_normalized"
            ):
                raise SchoolClassAlreadyExistsError() from None
            raise

        loaded = await self.repository.get_by_id(
            school_class_id=school_class.id,
            organization_id=organization_id,
        )
        if loaded is None:
            raise RuntimeError("Created class could not be reloaded")
        return loaded

    async def update_members(
        self,
        *,
        organization_id: uuid.UUID,
        school_class_id: uuid.UUID,
        payload: UpdateSchoolClassMembersRequest,
    ) -> SchoolClass:
        await self.academic_year_repository.lock_organization(
            organization_id=organization_id,
        )
        school_class = await self.repository.get_by_id(
            school_class_id=school_class_id,
            organization_id=organization_id,
            for_update=True,
        )
        if school_class is None:
            raise SchoolClassNotFoundError()

        teacher_ids = set(payload.teacher_ids)
        student_ids = set(payload.student_ids)
        valid_teachers = await self.repository.get_assignable_member_ids(
            organization_id=organization_id,
            user_ids=teacher_ids,
            role=OrganizationRole.TEACHER,
        )
        valid_students = await self.repository.get_assignable_member_ids(
            organization_id=organization_id,
            user_ids=student_ids,
            role=OrganizationRole.STUDENT,
        )
        if valid_teachers != teacher_ids or valid_students != student_ids:
            raise InvalidSchoolClassMembersError(
                teacher_ids=teacher_ids - valid_teachers,
                student_ids=student_ids - valid_students,
            )
        assigned_student_ids = await self.repository.get_assigned_student_ids(
            organization_id=organization_id,
            academic_year=school_class.academic_year,
            student_ids=student_ids,
            excluded_school_class_id=school_class.id,
        )
        if assigned_student_ids:
            raise StudentsAlreadyAssignedError(
                student_ids=assigned_student_ids,
            )

        await self.repository.replace_members(
            school_class=school_class,
            teacher_ids=teacher_ids,
            student_ids=student_ids,
        )
        await self.db.commit()
        updated = await self.repository.get_by_id(
            school_class_id=school_class.id,
            organization_id=organization_id,
        )
        if updated is None:
            raise RuntimeError("Updated class could not be reloaded")
        return updated

    @staticmethod
    def to_response(school_class: SchoolClass) -> SchoolClassResponse:
        teachers = []
        students = []
        for membership in school_class.memberships:
            member = SchoolClassMemberResponse(
                id=membership.user.id,
                email=membership.user.email,
            )
            if membership.role == SchoolClassMembershipRole.TITULAR_TEACHER:
                teachers.append(member)
            else:
                students.append(member)
        teachers.sort(key=lambda member: member.email.lower())
        students.sort(key=lambda member: member.email.lower())
        return SchoolClassResponse(
            id=school_class.id,
            name=school_class.name,
            academic_year=school_class.academic_year,
            teachers=teachers,
            students=students,
            created_at=school_class.created_at,
        )
