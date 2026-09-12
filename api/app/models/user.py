from fastapi_users.db import SQLAlchemyBaseUserTableUUID

from app.db.base import Base

# SQLAlchemyBaseUserTableUUID already contains :
# users
# ─────────────────────────────
# id                UUID
# email             VARCHAR
# hashed_password   VARCHAR
# is_active         BOOLEAN
# is_superuser      BOOLEAN
# is_verified       BOOLEAN

class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"