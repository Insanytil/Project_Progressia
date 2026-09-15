import uuid

from typing import Self

from pydantic import BaseModel, Field, model_validator


class AcademicYearResponse(BaseModel):
    id: uuid.UUID
    start_year: int
    end_year: int
    label: str
    is_active: bool


class CreateAcademicYearRequest(BaseModel):
    start_year: int = Field(ge=1900, le=2200)
    end_year: int = Field(ge=1901, le=2201)

    @model_validator(mode="after")
    def validate_period(self) -> Self:
        if self.end_year != self.start_year + 1:
            raise ValueError("Academic years must be consecutive")
        return self
