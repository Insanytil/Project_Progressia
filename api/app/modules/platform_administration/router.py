from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.core.pagination import (
    PagePaginatedResponse,
    PagePaginationMeta,
)
from app.modules.authorisation.dependencies import (
    PlatformAdmin,
    require_platform_admin,
)
from app.modules.member_imports.dependencies import BulkMemberImportServiceDep
from app.modules.member_imports.excel import (
    InvalidMemberImportFileError,
    extract_emails_from_excel,
)
from app.modules.member_imports.exceptions import BulkMemberEmailConflictError
from app.modules.member_imports.schemas import (
    BulkMemberCreateRequest,
    BulkMemberCreateResponse,
    BulkMemberPreviewRequest,
    BulkMemberPreviewResponse,
    BulkMemberRole,
)
from app.modules.jobs.dependencies import BackgroundJobServiceDep
from app.modules.jobs.exceptions import (
    BackgroundJobActionNotAllowedError,
    BackgroundJobNotFoundError,
)
from app.modules.jobs.schemas import (
    BackgroundJobGroupResponse,
    BackgroundJobListParams,
    BackgroundJobResponse,
)
from app.modules.platform_administration.dependencies import (
    PlatformAdministrationServiceDep,
    PlatformUserAdministrationServiceDep,
)
from app.modules.platform_administration.exceptions import (
    OrganizationHasMembersError,
    OrganizationMembershipAlreadyExistsError,
    OrganizationMembershipNotFoundError,
    OrganizationNameAlreadyExistsError,
    OrganizationNotFoundError,
    OrganizationSlugAlreadyExistsError,
    PlatformUserNotFoundError,
    UserAlreadyVerifiedError,
    UserEmailAlreadyExistsError,
    UserNotVerifiedError,
)
from app.modules.platform_administration.filters import (
    OrganizationListParams,
)
from app.modules.platform_administration.schemas import (
    CreateOrganizationRequest,
    OrganizationResponse,
    UpdateOrganizationRequest,
)
from app.modules.platform_administration.user_schemas import (
    AddOrganizationMemberRequest,
    CreatePlatformUserRequest,
    CreatePlatformUserResponse,
    EmailDispatchResponse,
    PlatformUserListParams,
    PlatformUserResponse,
    UpdateOrganizationAccessRequest,
    UpdatePlatformUserRequest,
)


router = APIRouter(
    prefix="/platform",
    tags=["platform administration"],
    dependencies=[
        Depends(require_platform_admin),
    ],
)


@router.get(
    "/jobs",
    response_model=PagePaginatedResponse[BackgroundJobGroupResponse],
)
async def get_platform_jobs(
    params: Annotated[BackgroundJobListParams, Query()],
    service: BackgroundJobServiceDep,
) -> PagePaginatedResponse[BackgroundJobGroupResponse]:
    jobs, total = await service.list_jobs(
        params=params,
        organization_id=params.organization_id,
    )
    return PagePaginatedResponse(
        items=jobs,
        pagination=PagePaginationMeta(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=(total + params.page_size - 1) // params.page_size,
        ),
    )


@router.get(
    "/jobs/batches/{batch_id}",
    response_model=list[BackgroundJobResponse],
)
async def get_platform_job_batch(
    batch_id: uuid.UUID,
    service: BackgroundJobServiceDep,
) -> list[BackgroundJobResponse]:
    return await service.list_batch_jobs(batch_id=batch_id, organization_id=None)


@router.post("/jobs/{job_id}/retry", response_model=EmailDispatchResponse)
async def retry_platform_job(
    job_id: uuid.UUID,
    service: BackgroundJobServiceDep,
) -> EmailDispatchResponse:
    try:
        queued = await service.retry(job_id=job_id, organization_id=None)
    except BackgroundJobNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Background job not found",
        ) from None
    except BackgroundJobActionNotAllowedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only failed or cancelled jobs can be retried",
        ) from None
    return EmailDispatchResponse(queued=queued)


@router.post(
    "/jobs/{job_id}/cancel",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def cancel_platform_job(
    job_id: uuid.UUID,
    service: BackgroundJobServiceDep,
) -> None:
    try:
        await service.cancel(job_id=job_id, organization_id=None)
    except BackgroundJobNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Background job not found",
        ) from None
    except BackgroundJobActionNotAllowedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only queued jobs can be cancelled",
        ) from None


@router.post(
    "/organizations/{organization_id}/member-imports/{role}/preview",
    response_model=BulkMemberPreviewResponse,
)
async def preview_platform_member_import(
    organization_id: uuid.UUID,
    role: BulkMemberRole,
    payload: BulkMemberPreviewRequest,
    platform_service: PlatformAdministrationServiceDep,
    import_service: BulkMemberImportServiceDep,
) -> BulkMemberPreviewResponse:
    try:
        await platform_service.get_organization_by_id(
            organization_id=organization_id
        )
    except OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None
    return await import_service.preview(payload.emails)


@router.post(
    "/organizations/{organization_id}/member-imports/{role}/preview-file",
    response_model=BulkMemberPreviewResponse,
)
async def preview_platform_member_import_file(
    organization_id: uuid.UUID,
    role: BulkMemberRole,
    platform_service: PlatformAdministrationServiceDep,
    import_service: BulkMemberImportServiceDep,
    file: UploadFile = File(...),
) -> BulkMemberPreviewResponse:
    try:
        await platform_service.get_organization_by_id(
            organization_id=organization_id
        )
        emails = extract_emails_from_excel(await file.read())
    except OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None
    except InvalidMemberImportFileError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from None
    return await import_service.preview(emails)


@router.post(
    "/organizations/{organization_id}/member-imports/{role}",
    response_model=BulkMemberCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_platform_member_import(
    organization_id: uuid.UUID,
    role: BulkMemberRole,
    payload: BulkMemberCreateRequest,
    platform_service: PlatformAdministrationServiceDep,
    import_service: BulkMemberImportServiceDep,
    admin: PlatformAdmin,
) -> BulkMemberCreateResponse:
    try:
        await platform_service.get_organization_by_id(
            organization_id=organization_id
        )
        created, queued = await import_service.create(
            organization_id=organization_id,
            emails=payload.emails,
            role=role,
            triggered_by_user_id=admin.id,
        )
    except OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None
    except BulkMemberEmailConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Some email addresses already exist",
                "emails": exc.emails,
            },
        ) from None
    return BulkMemberCreateResponse(
        created=created,
        invitations_queued=queued,
    )


@router.get(
    "/users",
    response_model=PagePaginatedResponse[PlatformUserResponse],
)
async def get_paginated_users(
    params: Annotated[PlatformUserListParams, Query()],
    service: PlatformUserAdministrationServiceDep,
) -> PagePaginatedResponse[PlatformUserResponse]:
    users, total = await service.get_users(params)
    total_pages = (total + params.page_size - 1) // params.page_size

    return PagePaginatedResponse(
        items=[service.to_response(user) for user in users],
        pagination=PagePaginationMeta(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=total_pages,
        ),
    )


@router.post(
    "/users",
    response_model=CreatePlatformUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_platform_user(
    payload: CreatePlatformUserRequest,
    service: PlatformUserAdministrationServiceDep,
    admin: PlatformAdmin,
) -> CreatePlatformUserResponse:
    try:
        user, invitation_queued = await service.create_user(
            payload,
            triggered_by_user_id=admin.id,
        )
    except UserEmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        ) from None
    except OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None

    return CreatePlatformUserResponse(
        user=service.to_response(user),
        invitation_queued=invitation_queued,
    )


@router.patch(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def update_platform_user(
    user_id: uuid.UUID,
    payload: UpdatePlatformUserRequest,
    service: PlatformUserAdministrationServiceDep,
) -> None:
    try:
        await service.set_user_active(
            user_id=user_id,
            is_active=payload.is_active,
        )
    except PlatformUserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        ) from None


@router.patch(
    "/users/{user_id}/organizations/{organization_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def update_user_organization_access(
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    payload: UpdateOrganizationAccessRequest,
    service: PlatformUserAdministrationServiceDep,
) -> None:
    try:
        await service.set_organization_access(
            user_id=user_id,
            organization_id=organization_id,
            is_active=payload.is_active,
            role=payload.role,
        )
    except PlatformUserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        ) from None
    except OrganizationMembershipNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization membership not found",
        ) from None


@router.post(
    "/users/{user_id}/verification-email",
    response_model=EmailDispatchResponse,
)
async def resend_user_verification_email(
    user_id: uuid.UUID,
    service: PlatformUserAdministrationServiceDep,
    admin: PlatformAdmin,
) -> EmailDispatchResponse:
    try:
        queued = await service.resend_verification_email(
            user_id=user_id,
            triggered_by_user_id=admin.id,
        )
    except PlatformUserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        ) from None
    except UserAlreadyVerifiedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already verified",
        ) from None
    return EmailDispatchResponse(queued=queued)


@router.post(
    "/users/{user_id}/password-reset-email",
    response_model=EmailDispatchResponse,
)
async def send_user_password_reset_email(
    user_id: uuid.UUID,
    service: PlatformUserAdministrationServiceDep,
    admin: PlatformAdmin,
) -> EmailDispatchResponse:
    try:
        queued = await service.send_password_reset_email(
            user_id=user_id,
            triggered_by_user_id=admin.id,
        )
    except PlatformUserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        ) from None
    except UserNotVerifiedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User must verify their account first",
        ) from None
    return EmailDispatchResponse(queued=queued)


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
    status_code=status.HTTP_200_OK,
)
async def get_organization(
    organization_id: uuid.UUID,
    service: PlatformAdministrationServiceDep,
) -> OrganizationResponse:
    """Return a single organization."""
    try:
        organization = await service.get_organization_by_id(
            organization_id=organization_id,
        )
    except OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None

    return OrganizationResponse.model_validate(
        organization,
    )


@router.patch(
    "/organizations/{organization_id}",
    response_model=OrganizationResponse,
    status_code=status.HTTP_200_OK,
)
async def update_organization(
    organization_id: uuid.UUID,
    payload: UpdateOrganizationRequest,
    service: PlatformAdministrationServiceDep,
) -> OrganizationResponse:
    """Update only the provided organization fields that actually changed."""
    try:
        organization = await service.update_organization(
            organization_id=organization_id,
            payload=payload,
        )
    except OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None
    except OrganizationNameAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization name already exists",
        ) from None
    except OrganizationSlugAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization slug already exists",
        ) from None

    return OrganizationResponse.model_validate(
        organization,
    )


@router.delete(
    "/organizations/{organization_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_organization(
    organization_id: uuid.UUID,
    service: PlatformAdministrationServiceDep,
) -> None:
    """Delete an organization only when it has no memberships."""
    try:
        await service.delete_organization(
            organization_id=organization_id,
        )
    except OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None
    except OrganizationHasMembersError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization cannot be deleted while it has members",
        ) from None


@router.get("/organizations/{organization_id}/members")
async def get_paginated_organization_members():
    """Return a paginated list of organization members."""
    pass


@router.post(
    "/organizations/{organization_id}/members",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def create_organization_member(
    organization_id: uuid.UUID,
    payload: AddOrganizationMemberRequest,
    service: PlatformUserAdministrationServiceDep,
) -> None:
    """Add an existing platform user to an organization."""
    try:
        await service.add_to_organization(
            user_id=payload.user_id,
            organization_id=organization_id,
            role=payload.role,
        )
    except PlatformUserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        ) from None
    except OrganizationNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        ) from None
    except OrganizationMembershipAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already belongs to this organization",
        ) from None


@router.patch("/organizations/{organization_id}/members/{user_id}")
async def update_organization_member():
    """Update one organization member."""
    pass
