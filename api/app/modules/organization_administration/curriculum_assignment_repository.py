import uuid

from sqlalchemy import delete, distinct, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.course_option import CourseOption
from app.models.organization_membership import OrganizationMembership
from app.models.organization_role import OrganizationRole
from app.models.student_study_option_enrollment import StudentStudyOptionEnrollment
from app.models.teacher_course_authorization import TeacherCourseAuthorization
from app.models.user import User


class CurriculumAssignmentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def is_active_member_with_role(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        role: OrganizationRole,
    ) -> bool:
        return (
            await self.db.scalar(
                select(OrganizationMembership.id)
                .join(User)
                .where(
                    OrganizationMembership.organization_id == organization_id,
                    OrganizationMembership.user_id == user_id,
                    OrganizationMembership.role == role,
                    OrganizationMembership.is_active.is_(True),
                    User.is_active.is_(True),
                )
            )
            is not None
        )

    async def get_valid_year_course_ids(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        course_ids: set[uuid.UUID],
    ) -> set[uuid.UUID]:
        if not course_ids:
            return set()
        result = await self.db.scalars(
            select(distinct(Course.id))
            .join(CourseOption)
            .where(
                Course.organization_id == organization_id,
                Course.id.in_(course_ids),
                CourseOption.academic_year_id == academic_year_id,
            )
        )
        return set(result.all())

    async def get_teacher_courses(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        teacher_id: uuid.UUID,
    ) -> list[tuple[uuid.UUID, str]]:
        rows = await self.db.execute(
            select(Course.id, Course.name)
            .join(
                TeacherCourseAuthorization,
                TeacherCourseAuthorization.course_id == Course.id,
            )
            .where(
                TeacherCourseAuthorization.organization_id == organization_id,
                TeacherCourseAuthorization.academic_year_id == academic_year_id,
                TeacherCourseAuthorization.teacher_id == teacher_id,
            )
            .order_by(Course.name.asc())
        )
        return list(rows.tuples().all())

    async def replace_teacher_courses(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        teacher_id: uuid.UUID,
        course_ids: set[uuid.UUID],
    ) -> None:
        await self.db.execute(
            delete(TeacherCourseAuthorization).where(
                TeacherCourseAuthorization.organization_id == organization_id,
                TeacherCourseAuthorization.academic_year_id == academic_year_id,
                TeacherCourseAuthorization.teacher_id == teacher_id,
            )
        )
        self.db.add_all(
            TeacherCourseAuthorization(
                organization_id=organization_id,
                academic_year_id=academic_year_id,
                teacher_id=teacher_id,
                course_id=course_id,
            )
            for course_id in course_ids
        )
        await self.db.flush()

    async def get_student_enrollment(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        student_id: uuid.UUID,
    ) -> StudentStudyOptionEnrollment | None:
        return await self.db.scalar(
            select(StudentStudyOptionEnrollment).where(
                StudentStudyOptionEnrollment.organization_id == organization_id,
                StudentStudyOptionEnrollment.academic_year_id == academic_year_id,
                StudentStudyOptionEnrollment.student_id == student_id,
            )
        )

    async def upsert_student_enrollment(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year_id: uuid.UUID,
        student_id: uuid.UUID,
        study_option_id: uuid.UUID,
        pathway_id: uuid.UUID | None,
    ) -> StudentStudyOptionEnrollment:
        enrollment = await self.get_student_enrollment(
            organization_id=organization_id,
            academic_year_id=academic_year_id,
            student_id=student_id,
        )
        if enrollment is None:
            enrollment = StudentStudyOptionEnrollment(
                organization_id=organization_id,
                academic_year_id=academic_year_id,
                student_id=student_id,
                study_option_id=study_option_id,
                pathway_id=pathway_id,
            )
            self.db.add(enrollment)
        else:
            enrollment.study_option_id = study_option_id
            enrollment.pathway_id = pathway_id
        await self.db.flush()
        return enrollment
