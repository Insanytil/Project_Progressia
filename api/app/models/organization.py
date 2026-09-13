from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Index,
    String,
    UniqueConstraint,
    func,
    true,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_entity import BaseEntity


if TYPE_CHECKING:
    from app.models.organization_membership import OrganizationMembership


class Organization(BaseEntity):
    __tablename__ = "organizations"

    __table_args__ = (
        UniqueConstraint(
            "slug",
            name="uq_organizations_slug",
        ),
        CheckConstraint(
            "char_length(trim(name)) > 0",
            name="ck_organizations_name_not_empty",
        ),
        CheckConstraint(
            "slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'",
            name="ck_organizations_slug_format",
        ),
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    slug: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )

    memberships: Mapped[list["OrganizationMembership"]] = relationship(
        back_populates="organization",
        passive_deletes=True,
        lazy="raise",
    )

Index(
    "uq_organizations_name_normalized",
    func.lower(func.btrim(Organization.name)),
    unique=True,
)