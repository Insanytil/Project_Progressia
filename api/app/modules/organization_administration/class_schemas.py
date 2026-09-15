import re
import uuid
from datetime import datetime
from enum import StrEnum
from typing import Self

from pydantic import BaseModel, Field, model_validator

from app.core.pagination import PagePaginationParams


ACADEMIC_YEAR_PATTERN = re.compile(r"^(\d{4})-(\d{4})$")


class AssignableClassRole(StrEnum):
    TEACHER = "teacher"
    STUDENT = "student"


class SchoolClassListParams(PagePaginationParams):
    search: str | None = Field(default=None, max_length=120)
    academic_year: str | None = Field(default=None, max_length=9)


class SchoolClassMemberOptionListParams(PagePaginationParams):
    role: AssignableClassRole
    search: str | None = Field(default=None, max_length=320)
    academic_year: str | None = Field(default=None, max_length=9)
    school_class_id: uuid.UUID | None = None


class SchoolClassMemberOptionResponse(BaseModel):
    id: uuid.UUID
    email: str


class SchoolClassMemberResponse(BaseModel):
    id: uuid.UUID
    email: str


class SchoolClassResponse(BaseModel):
    id: uuid.UUID
    name: str
    academic_year: str
    teachers: list[SchoolClassMemberResponse]
    students: list[SchoolClassMemberResponse]
    created_at: datetime


class CreateSchoolClassRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    academic_year: str = Field(min_length=9, max_length=9)
    teacher_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)
    student_ids: list[uuid.UUID] = Field(default_factory=list, max_length=500)

    @model_validator(mode="after")
    def normalize_and_validate(self) -> Self:
        self.name = " ".join(self.name.split())
        if not self.name:
            raise ValueError("Class name is required")
        match = ACADEMIC_YEAR_PATTERN.fullmatch(self.academic_year)
        if match is None or int(match.group(2)) != int(match.group(1)) + 1:
            raise ValueError("Academic year must use the YYYY-YYYY format")

        teachers = set(self.teacher_ids)
        students = set(self.student_ids)
        if len(teachers) != len(self.teacher_ids):
            raise ValueError("A titular teacher can only be selected once")
        if len(students) != len(self.student_ids):
            raise ValueError("A student can only be selected once")
        if teachers & students:
            raise ValueError("A user cannot be both teacher and student")
        return self


class UpdateSchoolClassMembersRequest(BaseModel):
    teacher_ids: list[uuid.UUID] = Field(max_length=50)
    student_ids: list[uuid.UUID] = Field(max_length=500)

    @model_validator(mode="after")
    def validate_members(self) -> Self:
        teachers = set(self.teacher_ids)
        students = set(self.student_ids)
        if len(teachers) != len(self.teacher_ids):
            raise ValueError("A titular teacher can only be selected once")
        if len(students) != len(self.student_ids):
            raise ValueError("A student can only be selected once")
        if teachers & students:
            raise ValueError("A user cannot be both teacher and student")
        return self
