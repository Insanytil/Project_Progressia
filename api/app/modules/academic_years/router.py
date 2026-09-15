import uuid

from fastapi import APIRouter, HTTPException, status

from app.modules.academic_years.dependencies import AcademicYearServiceDep
from app.modules.academic_years.schemas import AcademicYearResponse, CreateAcademicYearRequest
from app.modules.academic_years.service import (
    AcademicYearAlreadyExistsError,
    AcademicYearNotFoundError,
)
from app.modules.authorisation.dependencies import (
    CurrentOrganizationScope,
    OrganizationAdminScope,
)


router = APIRouter(prefix="/academic-years", tags=["academic years"])


@router.post("", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
async def create_academic_year(
    payload: CreateAcademicYearRequest,
    scope: OrganizationAdminScope,
    service: AcademicYearServiceDep,
) -> AcademicYearResponse:
    try:
        academic_year = await service.create(
            organization_id=scope.organization.id,
            start_year=payload.start_year,
            end_year=payload.end_year,
        )
    except AcademicYearAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Academic year already exists",
        ) from None
    return service.to_response(academic_year)


@router.get("", response_model=list[AcademicYearResponse])
async def list_academic_years(
    scope: CurrentOrganizationScope,
    service: AcademicYearServiceDep,
) -> list[AcademicYearResponse]:
    academic_years = await service.list_for_organization(
        organization_id=scope.organization.id,
    )
    return [service.to_response(item) for item in academic_years]


@router.put("/{academic_year_id}/activate", response_model=AcademicYearResponse)
async def activate_academic_year(
    academic_year_id: uuid.UUID,
    scope: OrganizationAdminScope,
    service: AcademicYearServiceDep,
) -> AcademicYearResponse:
    try:
        academic_year = await service.activate(
            organization_id=scope.organization.id,
            academic_year_id=academic_year_id,
        )
    except AcademicYearNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found",
        ) from None
    return service.to_response(academic_year)
