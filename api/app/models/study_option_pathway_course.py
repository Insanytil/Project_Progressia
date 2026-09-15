import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, ForeignKeyConstraint, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_entity import BaseEntity


if TYPE_CHECKING:
    from app.models.course_option import CourseOption
    from app.models.study_option_pathway import StudyOptionPathway


class StudyOptionPathwayCourse(BaseEntity):
    __tablename__ = "study_option_pathway_courses"
    __table_args__ = (
        ForeignKeyConstraint(
            ["course_option_id", "course_id"],
            ["course_options.id", "course_options.course_id"],
            name="fk_study_option_pathway_courses_option_course",
            ondelete="NO ACTION",
            deferrable=True,
            initially="DEFERRED",
        ),
        UniqueConstraint(
            "pathway_id",
            "course_id",
            name="uq_study_option_pathway_courses_pathway_course",
        ),
        Index(
            "ix_study_option_pathway_courses_course_option_id",
            "course_option_id",
        ),
    )

    pathway_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("study_option_pathways.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    course_option_id: Mapped[uuid.UUID] = mapped_column(nullable=False)

    pathway: Mapped["StudyOptionPathway"] = relationship(
        back_populates="courses",
        lazy="raise",
    )
    course_option: Mapped["CourseOption"] = relationship(
        foreign_keys=[course_option_id, course_id],
        lazy="raise",
    )
