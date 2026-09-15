import uuid
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SqlEnum
from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_entity import BaseEntity


if TYPE_CHECKING:
    from app.models.school_class import SchoolClass
    from app.models.user import User


class SchoolClassMembershipRole(StrEnum):
    TITULAR_TEACHER = "titular_teacher"
    STUDENT = "student"


class SchoolClassMembership(BaseEntity):
    __tablename__ = "school_class_memberships"
    __table_args__ = (
        UniqueConstraint(
            "school_class_id",
            "user_id",
            name="uq_school_class_memberships_class_user",
        ),
        Index(
            "ix_school_class_memberships_school_class_role",
            "school_class_id",
            "role",
        ),
        Index("ix_school_class_memberships_user_id", "user_id"),
    )

    school_class_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("school_classes.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[SchoolClassMembershipRole] = mapped_column(
        SqlEnum(
            SchoolClassMembershipRole,
            name="school_class_membership_role",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
            values_callable=lambda enum_class: [member.value for member in enum_class],
        ),
        nullable=False,
    )

    school_class: Mapped["SchoolClass"] = relationship(
        back_populates="memberships",
        lazy="raise",
    )
    user: Mapped["User"] = relationship(lazy="raise")
