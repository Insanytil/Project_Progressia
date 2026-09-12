import uuid

from fastapi_users import BaseUserManager, UUIDIDMixin

from app.models.user import User


class UserManager(
    UUIDIDMixin,
    BaseUserManager[User, uuid.UUID],
):
    pass