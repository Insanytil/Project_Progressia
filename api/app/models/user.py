from typing import TYPE_CHECKING

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy.orm import Mapped, relationship

from app.db.base import Base, TimestampMixin

# SQLAlchemyBaseUserTableUUID already contains :
# users
# ─────────────────────────────
# id                UUID
# email             VARCHAR
# hashed_password   VARCHAR
# is_active         BOOLEAN
# is_superuser      BOOLEAN
# is_verified       BOOLEAN

if TYPE_CHECKING:
    from app.models.auth_session import AuthSession
    from app.models.organization_membership import OrganizationMembership

class User(
    TimestampMixin,
    SQLAlchemyBaseUserTableUUID,
    Base,
):
    __tablename__ = "users"

    organization_memberships: Mapped[
        list["OrganizationMembership"]
    ] = relationship(
        back_populates="user",
        passive_deletes=True,
        lazy="raise",
    )

    sessions: Mapped[list["AuthSession"]] = relationship(
        back_populates="user",
        passive_deletes=True,
        lazy="raise",
    )