import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Self

from pydantic import BaseModel, Field, model_validator

from app.core.pagination import PagePaginationParams


WeeklyHours = Annotated[
    Decimal,
    Field(gt=0, le=99, decimal_places=1),
]


def validate_weekly_hours(values: list[WeeklyHours]) -> list[WeeklyHours]:
    if any(value % Decimal("0.5") != 0 for value in values):
        raise ValueError("Weekly hours must use half-hour increments")
    if len(set(values)) != len(values):
        raise ValueError("Weekly hour choices must be unique")
    return values


class CourseListParams(PagePaginationParams):
    academic_year_id: uuid.UUID
    search: str | None = Field(default=None, max_length=120)


class CourseOptionResponse(BaseModel):
    id: uuid.UUID
    weekly_hours: Decimal


class CourseResponse(BaseModel):
    id: uuid.UUID
    name: str
    academic_year_id: uuid.UUID
    options: list[CourseOptionResponse]
    created_at: datetime


class CreateCourseRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    academic_year_id: uuid.UUID
    options: list[WeeklyHours] = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def normalize(self) -> Self:
        self.name = " ".join(self.name.split())
        if not self.name:
            raise ValueError("Course name is required")
        self.options = validate_weekly_hours(self.options)
        return self


class UpdateCourseOptionsRequest(BaseModel):
    academic_year_id: uuid.UUID
    options: list[WeeklyHours] = Field(max_length=50)

    @model_validator(mode="after")
    def normalize(self) -> Self:
        self.options = validate_weekly_hours(self.options)
        return self
