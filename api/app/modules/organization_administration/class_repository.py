import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.organization_membership import OrganizationMembership
from app.models.organization_role import OrganizationRole
from app.models.school_class import SchoolClass
from app.models.school_class_membership import (
    SchoolClassMembership,
    SchoolClassMembershipRole,
)
from app.models.user import User


class SchoolClassRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _filtered_statement(
        self,
        *,
        organization_id: uuid.UUID,
        search: str | None,
        academic_year: str | None,
    ):
        statement = select(SchoolClass).where(
            SchoolClass.organization_id == organization_id
        )
        if search and search.strip():
            statement = statement.where(
                func.lower(SchoolClass.name).contains(
                    search.strip().lower(),
                    autoescape=True,
                )
            )
        if academic_year:
            statement = statement.where(
                SchoolClass.academic_year == academic_year
            )
        return statement

    async def get_assigned_student_ids(
        self,
        *,
        organization_id: uuid.UUID,
        academic_year: str,
        student_ids: set[uuid.UUID],
        excluded_school_class_id: uuid.UUID | None = None,
    ) -> set[uuid.UUID]:
        if not student_ids:
            return set()
        statement = (
            select(SchoolClassMembership.user_id)
            .join(SchoolClass)
            .where(
                SchoolClass.organization_id == organization_id,
                SchoolClass.academic_year == academic_year,
                SchoolClassMembership.role == SchoolClassMembershipRole.STUDENT,
                SchoolClassMembership.user_id.in_(student_ids),
            )
        )
        if excluded_school_class_id is not None:
            statement = statement.where(
                SchoolClassMembership.school_class_id
                != excluded_school_class_id
            )
        return set((await self.db.scalars(statement)).all())

    async def get_by_name_and_year(
        self,
        *,
        organization_id: uuid.UUID,
        name: str,
        academic_year: str,
    ) -> SchoolClass | None:
        return await self.db.scalar(
            select(SchoolClass).where(
                SchoolClass.organization_id == organization_id,
                SchoolClass.academic_year == academic_year,
                func.lower(func.btrim(SchoolClass.name)) == name.strip().lower(),
            )
        )

    async def get_paginated(
        self,
        *,
        organization_id: uuid.UUID,
        search: str | None,
        academic_year: str | None,
        offset: int,
        limit: int,
    ) -> list[SchoolClass]:
        statement = (
            self._filtered_statement(
                organization_id=organization_id,
                search=search,
                academic_year=academic_year,
            )
            .options(
                selectinload(SchoolClass.memberships).joinedload(
                    SchoolClassMembership.user
                )
            )
            .order_by(
                SchoolClass.academic_year.desc(),
                func.lower(SchoolClass.name).asc(),
            )
            .offset(offset)
            .limit(limit)
        )
        return list((await self.db.scalars(statement)).all())

    async def count_filtered(
        self,
        *,
        organization_id: uuid.UUID,
        search: str | None,
        academic_year: str | None,
    ) -> int:
        statement = self._filtered_statement(
            organization_id=organization_id,
            search=search,
            academic_year=academic_year,
        ).with_only_columns(func.count()).order_by(None)
        return await self.db.scalar(statement) or 0

    async def get_assignable_member_ids(
        self,
        *,
        organization_id: uuid.UUID,
        user_ids: set[uuid.UUID],
        role: OrganizationRole,
    ) -> set[uuid.UUID]:
        if not user_ids:
            return set()
        result = await self.db.scalars(
            select(OrganizationMembership.user_id)
            .join(OrganizationMembership.user)
            .where(
                OrganizationMembership.organization_id == organization_id,
                OrganizationMembership.user_id.in_(user_ids),
                OrganizationMembership.role == role,
                OrganizationMembership.is_active.is_(True),
                User.is_active.is_(True),
            )
        )
        return set(result.all())

    async def get_member_options(
        self,
        *,
        organization_id: uuid.UUID,
        role: OrganizationRole,
        search: str | None,
        academic_year: str | None,
        excluded_school_class_id: uuid.UUID | None,
        offset: int,
        limit: int,
    ) -> tuple[list[User], int]:
        statement = (
            select(User)
            .join(OrganizationMembership)
            .where(
                OrganizationMembership.organization_id == organization_id,
                OrganizationMembership.role == role,
                OrganizationMembership.is_active.is_(True),
                User.is_active.is_(True),
            )
        )
        if search and search.strip():
            statement = statement.where(
                func.lower(User.email).contains(
                    search.strip().lower(),
                    autoescape=True,
                )
            )
        if role == OrganizationRole.STUDENT and academic_year:
            assigned_to_another_class = (
                select(SchoolClassMembership.id)
                .join(SchoolClass)
                .where(
                    SchoolClassMembership.user_id == User.id,
                    SchoolClassMembership.role
                    == SchoolClassMembershipRole.STUDENT,
                    SchoolClass.organization_id == organization_id,
                    SchoolClass.academic_year == academic_year,
                )
            )
            if excluded_school_class_id is not None:
                assigned_to_another_class = assigned_to_another_class.where(
                    SchoolClassMembership.school_class_id
                    != excluded_school_class_id
                )
            statement = statement.where(~assigned_to_another_class.exists())
        total = await self.db.scalar(
            statement.with_only_columns(func.count()).order_by(None)
        ) or 0
        users = await self.db.scalars(
            statement.order_by(User.email.asc()).offset(offset).limit(limit)
        )
        return list(users.all()), total

    async def create(
        self,
        *,
        organization_id: uuid.UUID,
        name: str,
        academic_year: str,
        teacher_ids: set[uuid.UUID],
        student_ids: set[uuid.UUID],
    ) -> SchoolClass:
        school_class = SchoolClass(
            organization_id=organization_id,
            name=name,
            academic_year=academic_year,
        )
        self.db.add(school_class)
        await self.db.flush()
        self.db.add_all(
            [
                SchoolClassMembership(
                    school_class_id=school_class.id,
                    user_id=user_id,
                    role=SchoolClassMembershipRole.TITULAR_TEACHER,
                )
                for user_id in teacher_ids
            ]
            + [
                SchoolClassMembership(
                    school_class_id=school_class.id,
                    user_id=user_id,
                    role=SchoolClassMembershipRole.STUDENT,
                )
                for user_id in student_ids
            ]
        )
        await self.db.flush()
        return school_class

    async def replace_members(
        self,
        *,
        school_class: SchoolClass,
        teacher_ids: set[uuid.UUID],
        student_ids: set[uuid.UUID],
    ) -> None:
        requested_roles = {
            **{
                user_id: SchoolClassMembershipRole.TITULAR_TEACHER
                for user_id in teacher_ids
            },
            **{
                user_id: SchoolClassMembershipRole.STUDENT
                for user_id in student_ids
            },
        }
        existing_memberships = {
            membership.user_id: membership
            for membership in school_class.memberships
        }

        for user_id, membership in existing_memberships.items():
            requested_role = requested_roles.pop(user_id, None)
            if requested_role is None:
                school_class.memberships.remove(membership)
            elif membership.role != requested_role:
                membership.role = requested_role

        school_class.memberships.extend(
            SchoolClassMembership(user_id=user_id, role=role)
            for user_id, role in requested_roles.items()
        )
        await self.db.flush()

    async def get_by_id(
        self,
        *,
        school_class_id: uuid.UUID,
        organization_id: uuid.UUID,
        for_update: bool = False,
    ) -> SchoolClass | None:
        statement = (
            select(SchoolClass)
            .options(
                selectinload(SchoolClass.memberships).joinedload(
                    SchoolClassMembership.user
                )
            )
            .where(
                SchoolClass.id == school_class_id,
                SchoolClass.organization_id == organization_id,
            )
        )
        if for_update:
            statement = statement.with_for_update(of=SchoolClass)
        return await self.db.scalar(
            statement.execution_options(populate_existing=True)
        )
