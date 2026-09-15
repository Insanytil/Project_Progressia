import re
from enum import StrEnum
from typing import Self

from pydantic import BaseModel, Field, model_validator

from app.models.organization_role import OrganizationRole


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
MAX_IMPORT_SIZE = 500


class BulkMemberRole(StrEnum):
    TEACHER = "teacher"
    STUDENT = "student"

    def to_organization_role(self) -> OrganizationRole:
        return OrganizationRole(self.value)


class BulkMemberPreviewRequest(BaseModel):
    emails: list[str] = Field(min_length=1, max_length=MAX_IMPORT_SIZE)


class BulkMemberPreviewRow(BaseModel):
    row: int
    email: str
    is_valid: bool
    error: str | None = None


class BulkMemberPreviewResponse(BaseModel):
    rows: list[BulkMemberPreviewRow]
    total: int
    valid: int
    invalid: int
    can_confirm: bool


class BulkMemberCreateRequest(BaseModel):
    emails: list[str] = Field(min_length=1, max_length=MAX_IMPORT_SIZE)

    @model_validator(mode="after")
    def normalize_and_validate_emails(self) -> Self:
        normalized = [email.strip().lower() for email in self.emails]
        if any(not EMAIL_PATTERN.fullmatch(email) for email in normalized):
            raise ValueError("Every email address must be valid")
        if len(set(normalized)) != len(normalized):
            raise ValueError("Email addresses must be unique")
        self.emails = normalized
        return self


class BulkMemberCreateResponse(BaseModel):
    created: int
    invitations_queued: int
