import uuid
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from app.core.pagination import PagePaginatedResponse, PagePaginationMeta
from app.modules.authorisation.dependencies import OrganizationAdminScope
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
from app.modules.organization_administration.dependencies import (
    OrganizationAdministrationServiceDep,
)
from app.modules.organization_administration.exceptions import (
    OrganizationMemberEmailAlreadyExistsError,
    OrganizationMemberNotFoundError,
    OrganizationMemberNotVerifiedError,
)
from app.modules.organization_administration.schemas import (
    CreateOrganizationMemberRequest,
    CreateOrganizationMemberResponse,
    EmailDispatchResponse,
    OrganizationMemberListParams,
    OrganizationMemberResponse,
    UpdateOrganizationMemberRequest,
)


router = APIRouter(
    prefix="/organization-administration",
    tags=["organization administration"],
)


@router.get(
    "/jobs",
    response_model=PagePaginatedResponse[BackgroundJobGroupResponse],
)
async def get_organization_jobs(
    params: Annotated[BackgroundJobListParams, Query()],
    scope: OrganizationAdminScope,
    service: BackgroundJobServiceDep,
) -> PagePaginatedResponse[BackgroundJobGroupResponse]:
    jobs, total = await service.list_jobs(
        params=params,
        organization_id=scope.organization.id,
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
async def get_organization_job_batch(
    batch_id: uuid.UUID,
    scope: OrganizationAdminScope,
    service: BackgroundJobServiceDep,
) -> list[BackgroundJobResponse]:
    return await service.list_batch_jobs(
        batch_id=batch_id,
        organization_id=scope.organization.id,
    )


@router.post("/jobs/{job_id}/retry", response_model=EmailDispatchResponse)
async def retry_organization_job(
    job_id: uuid.UUID,
    scope: OrganizationAdminScope,
    service: BackgroundJobServiceDep,
) -> EmailDispatchResponse:
    try:
        queued = await service.retry(
            job_id=job_id,
            organization_id=scope.organization.id,
        )
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
async def cancel_organization_job(
    job_id: uuid.UUID,
    scope: OrganizationAdminScope,
    service: BackgroundJobServiceDep,
) -> None:
    try:
        await service.cancel(
            job_id=job_id,
            organization_id=scope.organization.id,
        )
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
    "/member-imports/{role}/preview",
    response_model=BulkMemberPreviewResponse,
)
async def preview_member_import(
    role: BulkMemberRole,
    payload: BulkMemberPreviewRequest,
    scope: OrganizationAdminScope,
    service: BulkMemberImportServiceDep,
) -> BulkMemberPreviewResponse:
    return await service.preview(payload.emails)


@router.post(
    "/member-imports/{role}/preview-file",
    response_model=BulkMemberPreviewResponse,
)
async def preview_member_import_file(
    role: BulkMemberRole,
    scope: OrganizationAdminScope,
    service: BulkMemberImportServiceDep,
    file: UploadFile = File(...),
) -> BulkMemberPreviewResponse:
    try:
        emails = extract_emails_from_excel(await file.read())
    except InvalidMemberImportFileError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from None
    return await service.preview(emails)


@router.post(
    "/member-imports/{role}",
    response_model=BulkMemberCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_member_import(
    role: BulkMemberRole,
    payload: BulkMemberCreateRequest,
    scope: OrganizationAdminScope,
    service: BulkMemberImportServiceDep,
) -> BulkMemberCreateResponse:
    try:
        created, queued = await service.create(
            organization_id=scope.organization.id,
            emails=payload.emails,
            role=role,
            triggered_by_user_id=scope.user.id,
        )
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


@router.post(
    "/members",
    response_model=CreateOrganizationMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_member(
    payload: CreateOrganizationMemberRequest,
    scope: OrganizationAdminScope,
    service: OrganizationAdministrationServiceDep,
) -> CreateOrganizationMemberResponse:
    try:
        membership, invitation_queued = await service.create_member(
            organization_id=scope.organization.id,
            email=payload.email,
            role=payload.role,
            triggered_by_user_id=scope.user.id,
        )
    except OrganizationMemberEmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        ) from None
    return CreateOrganizationMemberResponse(
        member=service.to_response(membership),
        invitation_queued=invitation_queued,
    )


@router.get(
    "/members",
    response_model=PagePaginatedResponse[OrganizationMemberResponse],
)
async def get_members(
    params: Annotated[OrganizationMemberListParams, Query()],
    scope: OrganizationAdminScope,
    service: OrganizationAdministrationServiceDep,
) -> PagePaginatedResponse[OrganizationMemberResponse]:
    members, total = await service.get_members(
        organization_id=scope.organization.id,
        params=params,
    )
    return PagePaginatedResponse(
        items=[service.to_response(member) for member in members],
        pagination=PagePaginationMeta(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=(total + params.page_size - 1) // params.page_size,
        ),
    )


@router.patch(
    "/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def update_member(
    user_id: uuid.UUID,
    payload: UpdateOrganizationMemberRequest,
    scope: OrganizationAdminScope,
    service: OrganizationAdministrationServiceDep,
) -> None:
    try:
        await service.update_member(
            organization_id=scope.organization.id,
            user_id=user_id,
            role=payload.role,
            is_active=payload.is_active,
        )
    except OrganizationMemberNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization member not found",
        ) from None


@router.post(
    "/members/{user_id}/password-reset-email",
    response_model=EmailDispatchResponse,
)
async def send_member_password_reset(
    user_id: uuid.UUID,
    scope: OrganizationAdminScope,
    service: OrganizationAdministrationServiceDep,
) -> EmailDispatchResponse:
    try:
        queued = await service.send_password_reset(
            organization_id=scope.organization.id,
            user_id=user_id,
            triggered_by_user_id=scope.user.id,
        )
    except OrganizationMemberNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization member not found",
        ) from None
    except OrganizationMemberNotVerifiedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization member must verify their account first",
        ) from None
    return EmailDispatchResponse(queued=queued)
