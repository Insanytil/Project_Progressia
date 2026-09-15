import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.organization_membership import OrganizationMembership
from app.models.organization_role import OrganizationRole
from app.models.user import User
from app.models.student_study_option_enrollment import StudentStudyOptionEnrollment
from app.models.teacher_course_authorization import TeacherCourseAuthorization


class OrganizationMemberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, *, email: str) -> User | None:
        return await self.db.scalar(
            select(User).where(func.lower(User.email) == email.lower())
        )

    async def create_user(self, *, email: str, hashed_password: str) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=False,
            is_verified=False,
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def create_membership(
        self,
        *,
        user_id: uuid.UUID,
        organization_id: uuid.UUID,
        role: OrganizationRole,
    ) -> OrganizationMembership:
        membership = OrganizationMembership(
            user_id=user_id,
            organization_id=organization_id,
            role=role,
        )
        self.db.add(membership)
        await self.db.flush()
        return membership

    def _filtered_statement(
        self,
        *,
        organization_id: uuid.UUID,
        search: str | None,
        is_active: bool | None,
    ):
        statement = select(OrganizationMembership).join(
            OrganizationMembership.user,
        ).where(OrganizationMembership.organization_id == organization_id)
        if search and search.strip():
            statement = statement.where(
                func.lower(User.email).contains(search.strip().lower(), autoescape=True),
            )
        if is_active is not None:
            statement = statement.where(OrganizationMembership.is_active.is_(is_active))
        return statement

    async def get_paginated(
        self,
        *,
        organization_id: uuid.UUID,
        search: str | None,
        is_active: bool | None,
        offset: int,
        limit: int,
    ) -> list[OrganizationMembership]:
        statement = (
            self._filtered_statement(
                organization_id=organization_id,
                search=search,
                is_active=is_active,
            )
            .options(joinedload(OrganizationMembership.user))
            .order_by(User.email.asc())
            .offset(offset)
            .limit(limit)
        )
        return list((await self.db.scalars(statement)).all())

    async def count_filtered(
        self,
        *,
        organization_id: uuid.UUID,
        search: str | None,
        is_active: bool | None,
    ) -> int:
        statement = self._filtered_statement(
            organization_id=organization_id,
            search=search,
            is_active=is_active,
        ).with_only_columns(func.count()).order_by(None)
        return await self.db.scalar(statement) or 0

    async def get_member(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        for_update: bool = False,
    ) -> OrganizationMembership | None:
        statement = (
            select(OrganizationMembership)
            .options(joinedload(OrganizationMembership.user))
            .where(
                OrganizationMembership.organization_id == organization_id,
                OrganizationMembership.user_id == user_id,
            )
        )
        if for_update:
            statement = statement.with_for_update(of=OrganizationMembership)
        return await self.db.scalar(statement)

    async def clear_curriculum_assignments(
        self,
        *,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        await self.db.execute(
            delete(TeacherCourseAuthorization).where(
                TeacherCourseAuthorization.organization_id == organization_id,
                TeacherCourseAuthorization.teacher_id == user_id,
            )
        )
        await self.db.execute(
            delete(StudentStudyOptionEnrollment).where(
                StudentStudyOptionEnrollment.organization_id == organization_id,
                StudentStudyOptionEnrollment.student_id == user_id,
            )
        )
