import uuid
from decimal import Decimal
from typing import Literal

from typing import Self

from pydantic import BaseModel, Field, model_validator

from app.modules.organization_administration.course_schemas import WeeklyHours


class CourseAuthorizationResponse(BaseModel):
    course_id: uuid.UUID
    course_name: str


class TeacherCourseAuthorizationsResponse(BaseModel):
    academic_year_id: uuid.UUID
    courses: list[CourseAuthorizationResponse]


class UpdateTeacherCourseAuthorizationsRequest(BaseModel):
    academic_year_id: uuid.UUID
    course_ids: list[uuid.UUID] = Field(default_factory=list, max_length=100)

    @model_validator(mode="after")
    def validate_unique_courses(self) -> Self:
        if len(set(self.course_ids)) != len(self.course_ids):
            raise ValueError("A course can only be selected once")
        return self


class EnrollmentCourseResponse(BaseModel):
    course_id: uuid.UUID
    course_name: str
    weekly_hours: WeeklyHours
    source: Literal["common", "pathway"]


class StudentStudyOptionEnrollmentResponse(BaseModel):
    academic_year_id: uuid.UUID
    study_option_id: uuid.UUID
    study_option_name: str
    pathway_id: uuid.UUID | None
    pathway_name: str | None
    courses: list[EnrollmentCourseResponse]
    total_weekly_hours: Decimal


class UpdateStudentStudyOptionEnrollmentRequest(BaseModel):
    academic_year_id: uuid.UUID
    study_option_id: uuid.UUID
    pathway_id: uuid.UUID | None = None
