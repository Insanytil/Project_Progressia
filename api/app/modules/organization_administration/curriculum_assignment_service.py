import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization_role import OrganizationRole
from app.modules.academic_years.repository import AcademicYearRepository
from app.modules.organization_administration.curriculum_assignment_exceptions import (
    InvalidCurriculumAcademicYearError,
    InvalidCurriculumMemberError,
    InvalidStudentEnrollmentError,
    InvalidTeacherCoursesError,
)
from app.modules.organization_administration.curriculum_assignment_repository import (
    CurriculumAssignmentRepository,
)
from app.modules.organization_administration.curriculum_assignment_schemas import (
    CourseAuthorizationResponse,
    EnrollmentCourseResponse,
    StudentStudyOptionEnrollmentResponse,
    TeacherCourseAuthorizationsResponse,
    UpdateStudentStudyOptionEnrollmentRequest,
    UpdateTeacherCourseAuthorizationsRequest,
)
from app.modules.organization_administration.study_option_repository import (
    StudyOptionRepository,
)


class CurriculumAssignmentService:
    def __init__(
        self,
        db: AsyncSession,
        repository: CurriculumAssignmentRepository,
        academic_year_repository: AcademicYearRepository,
        study_option_repository: StudyOptionRepository,
    ):
        self.db = db
        self.repository = repository
        self.academic_year_repository = academic_year_repository
        self.study_option_repository = study_option_repository

    async def _validate_member(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        role: OrganizationRole,
    ) -> None:
        if not await self.repository.is_active_member_with_role(
            organization_id=organization_id,
            user_id=user_id,
            role=role,
        ):
            raise InvalidCurriculumMemberError()

    async def _validate_year(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
    ) -> None:
        if await self.academic_year_repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
        ) is None:
            raise InvalidCurriculumAcademicYearError()

    async def get_teacher_authorizations(
        self,
        *,
        organization_id: uuid.UUID,
        teacher_id: uuid.UUID,
        academic_year_id: uuid.UUID,
    ) -> TeacherCourseAuthorizationsResponse:
        await self._validate_member(
            organization_id=organization_id,
            user_id=teacher_id,
            role=OrganizationRole.TEACHER,
        )
        await self._validate_year(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
        )
        courses = await self.repository.get_teacher_courses(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
            teacher_id=teacher_id,
        )
        return TeacherCourseAuthorizationsResponse(
            academic_year_id=academic_year_id,
            courses=[
                CourseAuthorizationResponse(course_id=course_id, course_name=name)
                for course_id, name in courses
            ],
        )

    async def update_teacher_authorizations(
        self,
        *,
        organization_id: uuid.UUID,
        teacher_id: uuid.UUID,
        payload: UpdateTeacherCourseAuthorizationsRequest,
    ) -> TeacherCourseAuthorizationsResponse:
        await self.academic_year_repository.lock_organization(
            organization_id=organization_id,
        )
        await self._validate_member(
            organization_id=organization_id,
            user_id=teacher_id,
            role=OrganizationRole.TEACHER,
        )
        await self._validate_year(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
        )
        requested = set(payload.course_ids)
        valid = await self.repository.get_valid_year_course_ids(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            course_ids=requested,
        )
        if valid != requested:
            raise InvalidTeacherCoursesError()
        await self.repository.replace_teacher_courses(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            teacher_id=teacher_id,
            course_ids=requested,
        )
        await self.db.commit()
        return await self.get_teacher_authorizations(
            organization_id=organization_id,
            teacher_id=teacher_id,
            academic_year_id=payload.academic_year_id,
        )

    async def get_student_enrollment(
        self,
        *,
        organization_id: uuid.UUID,
        student_id: uuid.UUID,
        academic_year_id: uuid.UUID,
    ) -> StudentStudyOptionEnrollmentResponse | None:
        await self._validate_member(
            organization_id=organization_id,
            user_id=student_id,
            role=OrganizationRole.STUDENT,
        )
        await self._validate_year(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
        )
        enrollment = await self.repository.get_student_enrollment(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
            student_id=student_id,
        )
        if enrollment is None:
            return None
        study_option = await self.study_option_repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
            study_option_id=enrollment.study_option_id,
        )
        if study_option is None:
            raise InvalidStudentEnrollmentError()
        pathway = next(
            (item for item in study_option.pathways if item.id == enrollment.pathway_id),
            None,
        )
        if enrollment.pathway_id is not None and pathway is None:
            raise InvalidStudentEnrollmentError()
        courses = [
            EnrollmentCourseResponse(
                course_id=item.course_id,
                course_name=item.course_option.course.name,
                weekly_hours=item.course_option.weekly_hours,
                source="common",
            )
            for item in study_option.courses
        ]
        if pathway is not None:
            courses.extend(
                EnrollmentCourseResponse(
                    course_id=item.course_id,
                    course_name=item.course_option.course.name,
                    weekly_hours=item.course_option.weekly_hours,
                    source="pathway",
                )
                for item in pathway.courses
            )
        courses.sort(key=lambda item: item.course_name.casefold())
        return StudentStudyOptionEnrollmentResponse(
            academic_year_id=academic_year_id,
            study_option_id=study_option.id,
            study_option_name=study_option.name,
            pathway_id=pathway.id if pathway is not None else None,
            pathway_name=pathway.name if pathway is not None else None,
            courses=courses,
            total_weekly_hours=sum(
                (item.weekly_hours for item in courses),
                start=Decimal("0"),
            ),
        )

    async def update_student_enrollment(
        self,
        *,
        organization_id: uuid.UUID,
        student_id: uuid.UUID,
        payload: UpdateStudentStudyOptionEnrollmentRequest,
    ) -> StudentStudyOptionEnrollmentResponse:
        await self.academic_year_repository.lock_organization(
            organization_id=organization_id,
        )
        await self._validate_member(
            organization_id=organization_id,
            user_id=student_id,
            role=OrganizationRole.STUDENT,
        )
        study_option = await self.study_option_repository.get_by_id(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            study_option_id=payload.study_option_id,
        )
        if study_option is None:
            raise InvalidStudentEnrollmentError()
        pathway_ids = {item.id for item in study_option.pathways}
        if pathway_ids:
            if payload.pathway_id not in pathway_ids:
                raise InvalidStudentEnrollmentError()
        elif payload.pathway_id is not None:
            raise InvalidStudentEnrollmentError()
        await self.repository.upsert_student_enrollment(
            organization_id=organization_id,
            academic_year_id=payload.academic_year_id,
            student_id=student_id,
            study_option_id=payload.study_option_id,
            pathway_id=payload.pathway_id,
        )
        await self.db.commit()
        result = await self.get_student_enrollment(
            organization_id=organization_id,
            student_id=student_id,
            academic_year_id=payload.academic_year_id,
        )
        if result is None:
            raise RuntimeError("Updated student enrollment could not be reloaded")
        return result
