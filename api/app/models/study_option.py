import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_entity import BaseEntity


if TYPE_CHECKING:
    from app.models.study_option_course import StudyOptionCourse
    from app.models.study_option_pathway import StudyOptionPathway


class StudyOption(BaseEntity):
    __tablename__ = "study_options"
    __table_args__ = (
        CheckConstraint(
            "char_length(trim(name)) > 0",
            name="ck_study_options_name_not_empty",
        ),
        Index("ix_study_options_organization_id", "organization_id"),
        Index("ix_study_options_academic_year_id", "academic_year_id"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    academic_year_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organization_academic_years.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)

    courses: Mapped[list["StudyOptionCourse"]] = relationship(
        back_populates="study_option",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise",
    )
    pathways: Mapped[list["StudyOptionPathway"]] = relationship(
        back_populates="study_option",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise",
    )


Index(
    "uq_study_options_organization_year_name_normalized",
    StudyOption.organization_id,
    StudyOption.academic_year_id,
    func.lower(func.btrim(StudyOption.name)),
    unique=True,
)
