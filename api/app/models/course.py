import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_entity import BaseEntity


if TYPE_CHECKING:
    from app.models.course_option import CourseOption


class Course(BaseEntity):
    __tablename__ = "courses"
    __table_args__ = (
        CheckConstraint(
            "char_length(trim(name)) > 0",
            name="ck_courses_name_not_empty",
        ),
        Index("ix_courses_organization_id", "organization_id"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)

    options: Mapped[list["CourseOption"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise",
    )


Index(
    "uq_courses_organization_name_normalized",
    Course.organization_id,
    func.lower(func.btrim(Course.name)),
    unique=True,
)
