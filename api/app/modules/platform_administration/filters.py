from pydantic import BaseModel, ConfigDict, Field


class OrganizationFilters(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
    )

    search: str | None = Field(
        default=None,
        max_length=255,
    )

    name_eq: str | None = Field(
        default=None,
        alias="name__eq",
        max_length=255,
    )

    slug_eq: str | None = Field(
        default=None,
        alias="slug__eq",
        max_length=100,
    )

    is_active_eq: bool | None = Field(
        default=None,
        alias="is_active__eq",
    )