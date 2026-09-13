from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.pagination import (
    PagePaginatedResponse,
    PagePaginationMeta,
)
from app.modules.authorisation.dependencies import (
    require_platform_admin,
)
from app.modules.platform_administration.dependencies import (
    PlatformAdministrationServiceDep,
)
from app.modules.platform_administration.exceptions import (
    OrganizationNameAlreadyExistsError,
    OrganizationSlugAlreadyExistsError,
    OrganizationNotFoundError,
)
from app.modules.platform_administration.filters import (
    OrganizationListParams,
)
from app.modules.platform_administration.schemas import (
    CreateOrganizationRequest,
    OrganizationResponse,
)


router = APIRouter(
    prefix="/platform",
    tags=["platform administration"],
    dependencies=[
        Depends(require_platform_admin),
    ],
)


@router.get(
    "/organizations",
    response_model=PagePaginatedResponse[OrganizationResponse],
)
async def get_paginated_organizations(
    params: Annotated[
        OrganizationListParams,
        Query(),
    ],
    service: PlatformAdministrationServiceDep,
) -> PagePaginatedResponse[OrganizationResponse]:
    organizations, total = await service.get_organizations(
        filters=params,
        pagination=params,
    )

    total_pages = (
        total + params.page_size - 1
    ) // params.page_size

    return PagePaginatedResponse(
        items=[
            OrganizationResponse.model_validate(organization)
            for organization in organizations
        ],
        pagination=PagePaginationMeta(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=total_pages,
        ),
    )


@router.post(
    "/organizations",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_organization(
    payload: CreateOrganizationRequest,
    service: PlatformAdministrationServiceDep,
) -> OrganizationResponse:
    """Create an organization.

    Requires a platform administrator session and a valid CSRF token.
    """
    try:
        organization = await service.create_organization(
            payload,
        )
    except OrganizationSlugAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization slug already exists",
        ) from None
    except OrganizationNameAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization name already exists",
        ) from None

    return OrganizationResponse.model_validate(
        organization,
    )


@router.get(
    "/organizations/{organization_id}",
    response_model=OrganizationResponse,
    status_code=status.HTTP_200_OK
)
async def get_organization(
        organization_id: uuid.UUID,
        service: PlatformAdministrationServiceDep,
) -> OrganizationResponse | None:
    try:
        organization = service.get_organization_by_id(
            organization_id = organization_id
        )

    except OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
        )
    """Return a single organization (must be Platform Admin)."""



@router.patch("/organizations/{organization_id}")
async def update_organization():
    """Update one organization (must be Platform Admin)."""
    pass


@router.get("/organizations/{organization_id}/members")
async def get_paginated_organization_members():
    """Return a paginated list of organization members."""
    pass


@router.post("/organizations/{organization_id}/members")
async def create_organization_member():
    """Create an organization member."""
    pass


@router.patch("/organizations/{organization_id}/members/{user_id}")
async def update_organization_member():
    """Update one organization member."""
    pass
