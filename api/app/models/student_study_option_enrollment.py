import uuid

from sqlalchemy import ForeignKey, ForeignKeyConstraint, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_entity import BaseEntity


class StudentStudyOptionEnrollment(BaseEntity):
    __tablename__ = "student_study_option_enrollments"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "academic_year_id",
            "student_id",
            name="uq_student_study_option_enrollments_scope",
        ),
        ForeignKeyConstraint(
            ["pathway_id", "study_option_id"],
            ["study_option_pathways.id", "study_option_pathways.study_option_id"],
            name="fk_student_enrollments_pathway_option",
            ondelete="RESTRICT",
        ),
        Index(
            "ix_student_study_option_enrollments_option",
            "study_option_id",
        ),
        Index(
            "ix_student_study_option_enrollments_pathway",
            "pathway_id",
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
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    study_option_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("study_options.id", ondelete="RESTRICT"),
        nullable=False,
    )
    pathway_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
