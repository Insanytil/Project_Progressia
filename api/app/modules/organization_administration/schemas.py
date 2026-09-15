import re
import uuid
from datetime import datetime
from typing import Self

from pydantic import BaseModel, Field, model_validator

from app.core.pagination import PagePaginationParams
from app.models.organization_role import OrganizationRole


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class OrganizationMemberListParams(PagePaginationParams):
    search: str | None = Field(default=None, max_length=320)
    is_active: bool | None = None


class OrganizationMemberResponse(BaseModel):
    id: uuid.UUID
    email: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    role: OrganizationRole
    membership_is_active: bool


class CreateOrganizationMemberRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    role: OrganizationRole

    @model_validator(mode="after")
    def normalize_and_validate_email(self) -> Self:
        self.email = self.email.strip().lower()
        if not EMAIL_PATTERN.fullmatch(self.email):
            raise ValueError("Invalid email address")
        return self


class CreateOrganizationMemberResponse(BaseModel):
    member: OrganizationMemberResponse
    invitation_queued: bool


class UpdateOrganizationMemberRequest(BaseModel):
    role: OrganizationRole | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_changes(self) -> Self:
        if self.role is None and self.is_active is None:
            raise ValueError("At least one membership change is required")
        return self


class EmailDispatchResponse(BaseModel):
    queued: bool
