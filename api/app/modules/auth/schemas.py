# app/modules/auth/schemas.py

import uuid

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=320,
    )
    password: str = Field(
        min_length=1,
        max_length=1024,
    )


class CurrentUserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: uuid.UUID
    email: str
    is_superuser: bool
    is_verified: bool