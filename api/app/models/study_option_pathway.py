import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_entity import BaseEntity


if TYPE_CHECKING:
    from app.models.study_option import StudyOption
    from app.models.study_option_pathway_course import StudyOptionPathwayCourse


class StudyOptionPathway(BaseEntity):
    """A valid set of variable courses offered within a main study option."""

    __tablename__ = "study_option_pathways"
    __table_args__ = (
        CheckConstraint(
            "char_length(trim(name)) > 0",
            name="ck_study_option_pathways_name_not_empty",
        ),
        UniqueConstraint(
            "id",
            "study_option_id",
            name="uq_study_option_pathways_id_option",
        ),
        Index("ix_study_option_pathways_study_option_id", "study_option_id"),
    )

    study_option_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("study_options.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)

    study_option: Mapped["StudyOption"] = relationship(
        back_populates="pathways",
        lazy="raise",
    )
    courses: Mapped[list["StudyOptionPathwayCourse"]] = relationship(
        back_populates="pathway",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise",
    )


Index(
    "uq_study_option_pathways_option_name_normalized",
    StudyOptionPathway.study_option_id,
    func.lower(func.btrim(StudyOptionPathway.name)),
    unique=True,
)
