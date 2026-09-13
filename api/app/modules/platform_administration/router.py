from fastapi import APIRouter, Depends, HTTPException, status

from app.modules.authorisation.dependencies import (
    require_platform_admin,
)
from app.modules.platform_administration.exceptions import (
    OrganizationSlugAlreadyExistsError,
    OrganizationNameAlreadyExistsError,
)
from app.modules.platform_administration.schemas import (
    CreateOrganizationRequest,
    OrganizationResponse,
)

from app.modules.platform_administration.dependencies import (
    PlatformAdministrationServiceDep,
)


router = APIRouter(
    prefix="/platform",
    tags=["platform administration"],
    dependencies=[
        Depends(require_platform_admin),
    ],
)

@router.get("/organizations")

async def get_paginated_organizations():
    """
    Return a paginated list of all organizations ordered by slug asc
    (must be Platform Admin)

    """
    try:
        pass
    except Exception as Ex:
        pass

@router.post(
    "/organizations",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
    )
async def create_organization(
    payload: CreateOrganizationRequest,
    service: PlatformAdministrationServiceDep,
) -> OrganizationResponse:
    """ Allows to create an organization

        conditions :
         - Must be Platform Admin and must have valid [CRSF token]  as it's POST operation

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


@router.get("/organizations/{organization_id}")
async def get_organization():
    """
    Return a single organization (must be Platform Admin)
    """
    try:
        pass
    except Exception as ex:
        pass

@router.patch("/organizations/{organization_id}")
async def update_organization():
    """
    Update one organization (must be Platform Admin)
    """
    try:
        pass
    except Exception as Ex:
        pass

@router.get("/organizations/{organization_id}/members")
async def get_paginated_organization_members():
    """
    Return a paginated list of organization members (must be Platform Admin)
    :return:
    """
    try:
        pass
    except Exception as Ex:
        pass

@router.post("/organizations/{organization_id}/members")
async def create_organization_member():
    """
    Allows to create an organization member (must be Platform Admin)
    :return:
    """
    try:
        pass
    except Exception as Ex:
        pass

@router.patch("/organizations/{organization_id}/members/{user_id}")
async def update_organization_member():
    """
    Update one organization member (must be Platform Admin)
    :return:
    """
    try:
        pass
    except Exception as Ex:
        pass
