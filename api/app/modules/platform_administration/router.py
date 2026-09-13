from fastapi import APIRouter, Depends

from app.modules.authorisation.dependencies import require_platform_admin


router = APIRouter(
    prefix="/platform",
    tags=["platform administration"],
    dependencies=[
        Depends(require_platform_admin),
    ],
)

@router.get("/organisations")

async def get_paginated_organizations():
    """
    Return a paginated list of all organizations ordered by slug asc
    (must be Platform Admin)

    """
    try:
        pass
    except Exception as Ex:
        pass

@router.post("/organizations")
async def create_organization():
    """
    Allows to create an organization (must be Platform Admin)

    """
    try:
        pass
    except Exception as Ex:
        pass

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
