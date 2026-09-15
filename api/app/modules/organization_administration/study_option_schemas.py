import uuid
from datetime import datetime
from decimal import Decimal
from typing import Self

from pydantic import BaseModel, Field, model_validator

from app.core.pagination import PagePaginationParams
from app.modules.organization_administration.course_schemas import WeeklyHours


class StudyOptionListParams(PagePaginationParams):
    academic_year_id: uuid.UUID
    search: str | None = Field(default=None, max_length=120)


class StudyOptionCourseInput(BaseModel):
    course_id: uuid.UUID
    course_option_id: uuid.UUID


class StudyOptionCourseResponse(BaseModel):
    course_id: uuid.UUID
    course_name: str
    course_option_id: uuid.UUID
    weekly_hours: WeeklyHours


class StudyOptionPathwayInput(BaseModel):
    id: uuid.UUID | None = None
    name: str = Field(min_length=1, max_length=160)
    courses: list[StudyOptionCourseInput] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def normalize_and_validate(self) -> Self:
        self.name = " ".join(self.name.split())
        if not self.name:
            raise ValueError("Pathway name is required")
        course_ids = [item.course_id for item in self.courses]
        option_ids = [item.course_option_id for item in self.courses]
        if len(set(course_ids)) != len(course_ids):
            raise ValueError("A pathway can only contain a course once")
        if len(set(option_ids)) != len(option_ids):
            raise ValueError("A pathway can only contain a course option once")
        return self


class StudyOptionPathwayResponse(BaseModel):
    id: uuid.UUID
    name: str
    courses: list[StudyOptionCourseResponse]
    weekly_hours: Decimal


class StudyOptionResponse(BaseModel):
    id: uuid.UUID
    name: str
    academic_year_id: uuid.UUID
    courses: list[StudyOptionCourseResponse]
    pathways: list[StudyOptionPathwayResponse]
    total_weekly_hours: Decimal
    created_at: datetime


class CreateStudyOptionRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    academic_year_id: uuid.UUID
    courses: list[StudyOptionCourseInput] = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def normalize_and_validate(self) -> Self:
        self.name = " ".join(self.name.split())
        if not self.name:
            raise ValueError("Study option name is required")
        course_ids = [item.course_id for item in self.courses]
        option_ids = [item.course_option_id for item in self.courses]
        if len(set(course_ids)) != len(course_ids):
            raise ValueError("A course can only be selected once")
        if len(set(option_ids)) != len(option_ids):
            raise ValueError("A course option can only be selected once")
        return self


class UpdateStudyOptionCoursesRequest(BaseModel):
    academic_year_id: uuid.UUID
    courses: list[StudyOptionCourseInput] = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def validate_courses(self) -> Self:
        course_ids = [item.course_id for item in self.courses]
        option_ids = [item.course_option_id for item in self.courses]
        if len(set(course_ids)) != len(course_ids):
            raise ValueError("A course can only be selected once")
        if len(set(option_ids)) != len(option_ids):
            raise ValueError("A course option can only be selected once")
        return self


class UpdateStudyOptionPathwaysRequest(BaseModel):
    academic_year_id: uuid.UUID
    pathways: list[StudyOptionPathwayInput] = Field(default_factory=list, max_length=30)

    @model_validator(mode="after")
    def validate_pathways(self) -> Self:
        normalized_names = [item.name.casefold() for item in self.pathways]
        if len(set(normalized_names)) != len(normalized_names):
            raise ValueError("Pathway names must be unique within a study option")
        ids = [item.id for item in self.pathways if item.id is not None]
        if len(set(ids)) != len(ids):
            raise ValueError("A pathway can only be submitted once")
        return self


class UpdateStudyOptionPathwayRequest(BaseModel):
    academic_year_id: uuid.UUID
    name: str = Field(min_length=1, max_length=160)
    courses: list[StudyOptionCourseInput] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def normalize_and_validate(self) -> Self:
        self.name = " ".join(self.name.split())
        if not self.name:
            raise ValueError("Pathway name is required")
        course_ids = [item.course_id for item in self.courses]
        option_ids = [item.course_option_id for item in self.courses]
        if len(set(course_ids)) != len(course_ids):
            raise ValueError("A pathway can only contain a course once")
        if len(set(option_ids)) != len(option_ids):
            raise ValueError("A pathway can only contain a course option once")
        return self
