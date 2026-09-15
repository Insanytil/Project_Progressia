import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Index, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_entity import BaseEntity


if TYPE_CHECKING:
    from app.models.organization import Organization


class OrganizationAcademicYear(BaseEntity):
    __tablename__ = "organization_academic_years"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "start_year",
            "end_year",
            name="uq_organization_academic_years_period",
        ),
        CheckConstraint(
            "end_year = start_year + 1",
            name="ck_organization_academic_years_consecutive",
        ),
        CheckConstraint(
            "start_year BETWEEN 1900 AND 2200",
            name="ck_organization_academic_years_start_year_range",
        ),
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    start_year: Mapped[int] = mapped_column(Integer, nullable=False)
    end_year: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    organization: Mapped["Organization"] = relationship(
        back_populates="academic_years",
        lazy="raise",
    )

    @property
    def label(self) -> str:
        return f"{self.start_year}-{self.end_year}"


Index(
    "uq_organization_academic_years_one_active",
    OrganizationAcademicYear.organization_id,
    unique=True,
    postgresql_where=OrganizationAcademicYear.is_active.is_(True),
)
