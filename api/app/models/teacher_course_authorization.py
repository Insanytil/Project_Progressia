import uuid

from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_entity import BaseEntity


class TeacherCourseAuthorization(BaseEntity):
    __tablename__ = "teacher_course_authorizations"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "academic_year_id",
            "teacher_id",
            "course_id",
            name="uq_teacher_course_authorizations_scope",
        ),
        Index(
            "ix_teacher_course_authorizations_teacher_year",
            "teacher_id",
            "academic_year_id",
        ),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    academic_year_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organization_academic_years.id", ondelete="CASCADE"),
        nullable=False,
    )
    teacher_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
