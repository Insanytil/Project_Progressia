import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_entity import BaseEntity


if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.organization_academic_year import OrganizationAcademicYear


class CourseOption(BaseEntity):
    __tablename__ = "course_options"
    __table_args__ = (
        CheckConstraint(
            "weekly_hours > 0 AND weekly_hours <= 99 AND mod(weekly_hours, 0.5) = 0",
            name="ck_course_options_weekly_hours_range",
        ),
        UniqueConstraint(
            "course_id",
            "academic_year_id",
            "weekly_hours",
            name="uq_course_options_course_year_weekly_hours",
        ),
        UniqueConstraint(
            "id",
            "course_id",
            name="uq_course_options_id_course",
        ),
        Index("ix_course_options_academic_year_id", "academic_year_id"),
    )

    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    academic_year_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organization_academic_years.id", ondelete="CASCADE"),
        nullable=False,
    )
    weekly_hours: Mapped[Decimal] = mapped_column(
        Numeric(4, 1),
        nullable=False,
    )

    course: Mapped["Course"] = relationship(
        back_populates="options",
        lazy="raise",
    )
    academic_year: Mapped["OrganizationAcademicYear"] = relationship(
        lazy="raise",
    )
