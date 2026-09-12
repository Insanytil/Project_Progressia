import uuid

from fastapi.security import OAuth2PasswordRequestForm
from fastapi_users import BaseUserManager, UUIDIDMixin

from app.models.user import User


class UserManager(
    UUIDIDMixin,
    BaseUserManager[User, uuid.UUID],
):
    async def authenticate_email_password(
            self,
            *,
            email: str,
            password: str,
    ) -> User | None:
        credentials = OAuth2PasswordRequestForm(
            username=email.strip(),
            password=password,
        )

        return await self.authenticate(credentials)