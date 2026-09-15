import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_entity import BaseEntity


if TYPE_CHECKING:
    from app.models.school_class_membership import SchoolClassMembership


class SchoolClass(BaseEntity):
    __tablename__ = "school_classes"
    __table_args__ = (
        CheckConstraint(
            "char_length(trim(name)) > 0",
            name="ck_school_classes_name_not_empty",
        ),
        CheckConstraint(
            "academic_year ~ '^[0-9]{4}-[0-9]{4}$'",
            name="ck_school_classes_academic_year_format",
        ),
        CheckConstraint(
            "CAST(substring(academic_year, 6, 4) AS INTEGER) = "
            "CAST(substring(academic_year, 1, 4) AS INTEGER) + 1",
            name="ck_school_classes_academic_year_consecutive",
        ),
        Index("ix_school_classes_organization_id", "organization_id"),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    
    academic_year: Mapped[str] = mapped_column(String(9), nullable=False)

    memberships: Mapped[list["SchoolClassMembership"]] = relationship(
        back_populates="school_class",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="raise",
    )


Index(
    "uq_school_classes_organization_year_name_normalized",
    SchoolClass.organization_id,
    SchoolClass.academic_year,
    func.lower(func.btrim(SchoolClass.name)),
    unique=True,
)
