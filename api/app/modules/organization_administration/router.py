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
    CourseServiceDep,
    CurriculumAssignmentServiceDep,
    OrganizationAdministrationServiceDep,
    SchoolClassServiceDep,
    StudyOptionServiceDep,
)
from app.modules.organization_administration.curriculum_assignment_exceptions import (
    InvalidCurriculumAcademicYearError,
    InvalidCurriculumMemberError,
    InvalidStudentEnrollmentError,
    InvalidTeacherCoursesError,
)
from app.modules.organization_administration.curriculum_assignment_schemas import (
    StudentStudyOptionEnrollmentResponse,
    TeacherCourseAuthorizationsResponse,
    UpdateStudentStudyOptionEnrollmentRequest,
    UpdateTeacherCourseAuthorizationsRequest,
)
from app.modules.organization_administration.course_exceptions import (
    CourseAcademicYearNotFoundError,
    CourseAlreadyExistsError,
    CourseNotFoundError,
    CourseOptionInUseError,
)
from app.modules.organization_administration.course_schemas import (
    CourseListParams,
    CourseResponse,
    CreateCourseRequest,
    UpdateCourseOptionsRequest,
)
from app.modules.organization_administration.class_exceptions import (
    InvalidSchoolClassMembersError,
    SchoolClassAlreadyExistsError,
    SchoolClassNotFoundError,
    StudentsAlreadyAssignedError,
)
from app.modules.organization_administration.class_schemas import (
    CreateSchoolClassRequest,
    SchoolClassListParams,
    SchoolClassMemberOptionListParams,
    SchoolClassMemberOptionResponse,
    SchoolClassResponse,
    UpdateSchoolClassMembersRequest,
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
from app.modules.organization_administration.study_option_exceptions import (
    InvalidStudyOptionCoursesError,
    InvalidStudyOptionPathwaysError,
    StudyOptionAlreadyExistsError,
    StudyOptionNotFoundError,
    StudyOptionPathwayInUseError,
)
from app.modules.organization_administration.study_option_schemas import (
    CreateStudyOptionRequest,
    StudyOptionListParams,
    StudyOptionResponse,
    UpdateStudyOptionCoursesRequest,
    UpdateStudyOptionPathwaysRequest,
    UpdateStudyOptionPathwayRequest,
)


router = APIRouter(
    prefix="/organization-administration",
    tags=["organization administration"],
)


@router.get(
    "/members/{teacher_id}/teaching-authorizations",
    response_model=TeacherCourseAuthorizationsResponse,
)
async def get_teacher_course_authorizations(
    teacher_id: uuid.UUID,
    academic_year_id: uuid.UUID,
    scope: OrganizationAdminScope,
    service: CurriculumAssignmentServiceDep,
) -> TeacherCourseAuthorizationsResponse:
    try:
        return await service.get_teacher_authorizations(
            organization_id=scope.organization.id,
            teacher_id=teacher_id,
            academic_year_id=academic_year_id,
        )
    except (InvalidCurriculumMemberError, InvalidCurriculumAcademicYearError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher or academic year not found in this organization",
        ) from None


@router.put(
    "/members/{teacher_id}/teaching-authorizations",
    response_model=TeacherCourseAuthorizationsResponse,
)
async def update_teacher_course_authorizations(
    teacher_id: uuid.UUID,
    payload: UpdateTeacherCourseAuthorizationsRequest,
    scope: OrganizationAdminScope,
    service: CurriculumAssignmentServiceDep,
) -> TeacherCourseAuthorizationsResponse:
    try:
        return await service.update_teacher_authorizations(
            organization_id=scope.organization.id,
            teacher_id=teacher_id,
            payload=payload,
        )
    except (InvalidCurriculumMemberError, InvalidCurriculumAcademicYearError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher or academic year not found in this organization",
        ) from None
    except InvalidTeacherCoursesError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Every course must be offered by this organization for the selected year",
        ) from None


@router.get(
    "/members/{student_id}/study-option-enrollment",
    response_model=StudentStudyOptionEnrollmentResponse | None,
)
async def get_student_study_option_enrollment(
    student_id: uuid.UUID,
    academic_year_id: uuid.UUID,
    scope: OrganizationAdminScope,
    service: CurriculumAssignmentServiceDep,
) -> StudentStudyOptionEnrollmentResponse | None:
    try:
        return await service.get_student_enrollment(
            organization_id=scope.organization.id,
            student_id=student_id,
            academic_year_id=academic_year_id,
        )
    except (InvalidCurriculumMemberError, InvalidCurriculumAcademicYearError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student or academic year not found in this organization",
        ) from None


@router.put(
    "/members/{student_id}/study-option-enrollment",
    response_model=StudentStudyOptionEnrollmentResponse,
)
async def update_student_study_option_enrollment(
    student_id: uuid.UUID,
    payload: UpdateStudentStudyOptionEnrollmentRequest,
    scope: OrganizationAdminScope,
    service: CurriculumAssignmentServiceDep,
) -> StudentStudyOptionEnrollmentResponse:
    try:
        return await service.update_student_enrollment(
            organization_id=scope.organization.id,
            student_id=student_id,
            payload=payload,
        )
    except InvalidCurriculumMemberError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found in this organization",
        ) from None
    except InvalidStudentEnrollmentError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The option and pathway must belong to the selected academic year",
        ) from None


@router.get(
    "/study-options",
    response_model=PagePaginatedResponse[StudyOptionResponse],
)
async def get_study_options(
    params: Annotated[StudyOptionListParams, Query()],
    scope: OrganizationAdminScope,
    service: StudyOptionServiceDep,
) -> PagePaginatedResponse[StudyOptionResponse]:
    try:
        items, total = await service.list_study_options(
            organization_id=scope.organization.id,
            params=params,
        )
    except InvalidStudyOptionCoursesError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found",
        ) from None
    return PagePaginatedResponse(
        items=[service.to_response(item) for item in items],
        pagination=PagePaginationMeta(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=(total + params.page_size - 1) // params.page_size,
        ),
    )


@router.post(
    "/study-options",
    response_model=StudyOptionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_study_option(
    payload: CreateStudyOptionRequest,
    scope: OrganizationAdminScope,
    service: StudyOptionServiceDep,
) -> StudyOptionResponse:
    try:
        item = await service.create(
            organization_id=scope.organization.id,
            payload=payload,
        )
    except StudyOptionAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A study option with this name already exists for this year",
        ) from None
    except InvalidStudyOptionCoursesError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Every selected course option must belong to the organization and academic year",
        ) from None
    return service.to_response(item)


@router.put(
    "/study-options/{study_option_id}/courses",
    response_model=StudyOptionResponse,
)
async def update_study_option_courses(
    study_option_id: uuid.UUID,
    payload: UpdateStudyOptionCoursesRequest,
    scope: OrganizationAdminScope,
    service: StudyOptionServiceDep,
) -> StudyOptionResponse:
    try:
        item = await service.update_courses(
            organization_id=scope.organization.id,
            study_option_id=study_option_id,
            payload=payload,
        )
    except StudyOptionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study option not found",
        ) from None
    except (InvalidStudyOptionCoursesError, InvalidStudyOptionPathwaysError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Base courses must belong to the year and cannot also be part of a pathway",
        ) from None
    return service.to_response(item)


@router.put(
    "/study-options/{study_option_id}/pathways",
    response_model=StudyOptionResponse,
)
async def update_study_option_pathways(
    study_option_id: uuid.UUID,
    payload: UpdateStudyOptionPathwaysRequest,
    scope: OrganizationAdminScope,
    service: StudyOptionServiceDep,
) -> StudyOptionResponse:
    try:
        item = await service.update_pathways(
            organization_id=scope.organization.id,
            study_option_id=study_option_id,
            payload=payload,
        )
    except StudyOptionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study option not found",
        ) from None
    except StudyOptionPathwayInUseError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pathway assigned to a student cannot be removed",
        ) from None
    except (InvalidStudyOptionCoursesError, InvalidStudyOptionPathwaysError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Each pathway must contain valid yearly courses distinct from the common curriculum",
        ) from None
    return service.to_response(item)


@router.put(
    "/study-options/{study_option_id}/pathways/{pathway_id}",
    response_model=StudyOptionResponse,
)
async def update_study_option_pathway(
    study_option_id: uuid.UUID,
    pathway_id: uuid.UUID,
    payload: UpdateStudyOptionPathwayRequest,
    scope: OrganizationAdminScope,
    service: StudyOptionServiceDep,
) -> StudyOptionResponse:
    try:
        item = await service.update_pathway(
            organization_id=scope.organization.id,
            study_option_id=study_option_id,
            pathway_id=pathway_id,
            payload=payload,
        )
    except StudyOptionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study option not found",
        ) from None
    except (InvalidStudyOptionCoursesError, InvalidStudyOptionPathwaysError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The pathway must contain valid yearly courses distinct from the common curriculum",
        ) from None
    return service.to_response(item)


@router.get(
    "/courses",
    response_model=PagePaginatedResponse[CourseResponse],
)
async def get_courses(
    params: Annotated[CourseListParams, Query()],
    scope: OrganizationAdminScope,
    service: CourseServiceDep,
) -> PagePaginatedResponse[CourseResponse]:
    try:
        courses, total = await service.list_courses(
            organization_id=scope.organization.id,
            params=params,
        )
    except CourseAcademicYearNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found",
        ) from None
    return PagePaginatedResponse(
        items=[
            service.to_response(course, params.academic_year_id)
            for course in courses
        ],
        pagination=PagePaginationMeta(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=(total + params.page_size - 1) // params.page_size,
        ),
    )


@router.post(
    "/courses",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_course(
    payload: CreateCourseRequest,
    scope: OrganizationAdminScope,
    service: CourseServiceDep,
) -> CourseResponse:
    try:
        course = await service.create_course(
            organization_id=scope.organization.id,
            payload=payload,
        )
    except CourseAcademicYearNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Academic year not found",
        ) from None
    except CourseAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A course with this name already exists",
        ) from None
    return service.to_response(course, payload.academic_year_id)


@router.put(
    "/courses/{course_id}/options",
    response_model=CourseResponse,
)
async def update_course_options(
    course_id: uuid.UUID,
    payload: UpdateCourseOptionsRequest,
    scope: OrganizationAdminScope,
    service: CourseServiceDep,
) -> CourseResponse:
    try:
        course = await service.update_options(
            organization_id=scope.organization.id,
            course_id=course_id,
            payload=payload,
        )
    except (CourseNotFoundError, CourseAcademicYearNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course or academic year not found",
        ) from None
    except CourseOptionInUseError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A course hour choice used by a study option cannot be removed",
        ) from None
    return service.to_response(course, payload.academic_year_id)


@router.get(
    "/classes/member-options",
    response_model=PagePaginatedResponse[SchoolClassMemberOptionResponse],
)
async def get_school_class_member_options(
    params: Annotated[SchoolClassMemberOptionListParams, Query()],
    scope: OrganizationAdminScope,
    service: SchoolClassServiceDep,
) -> PagePaginatedResponse[SchoolClassMemberOptionResponse]:
    members, total = await service.list_member_options(
        organization_id=scope.organization.id,
        role=params.role,
        search=params.search,
        academic_year=params.academic_year,
        excluded_school_class_id=params.school_class_id,
        offset=params.offset,
        limit=params.page_size,
    )
    return PagePaginatedResponse(
        items=[
            SchoolClassMemberOptionResponse(id=member.id, email=member.email)
            for member in members
        ],
        pagination=PagePaginationMeta(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=(total + params.page_size - 1) // params.page_size,
        ),
    )


@router.get(
    "/classes",
    response_model=PagePaginatedResponse[SchoolClassResponse],
)
async def get_school_classes(
    params: Annotated[SchoolClassListParams, Query()],
    scope: OrganizationAdminScope,
    service: SchoolClassServiceDep,
) -> PagePaginatedResponse[SchoolClassResponse]:
    classes, total = await service.list_classes(
        organization_id=scope.organization.id,
        params=params,
    )
    return PagePaginatedResponse(
        items=[service.to_response(school_class) for school_class in classes],
        pagination=PagePaginationMeta(
            page=params.page,
            page_size=params.page_size,
            total=total,
            total_pages=(total + params.page_size - 1) // params.page_size,
        ),
    )


@router.post(
    "/classes",
    response_model=SchoolClassResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_school_class(
    payload: CreateSchoolClassRequest,
    scope: OrganizationAdminScope,
    service: SchoolClassServiceDep,
) -> SchoolClassResponse:
    try:
        school_class = await service.create_class(
            organization_id=scope.organization.id,
            payload=payload,
        )
    except SchoolClassAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A class with this name already exists for this academic year",
        ) from None
    except InvalidSchoolClassMembersError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "message": "Some selected users are not active members with the expected role",
                "teacher_ids": sorted(str(user_id) for user_id in exc.teacher_ids),
                "student_ids": sorted(str(user_id) for user_id in exc.student_ids),
            },
        ) from None
    except StudentsAlreadyAssignedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Some students already belong to a class for this academic year",
                "student_ids": sorted(str(user_id) for user_id in exc.student_ids),
            },
        ) from None
    return service.to_response(school_class)


@router.put(
    "/classes/{school_class_id}/members",
    response_model=SchoolClassResponse,
)
async def update_school_class_members(
    school_class_id: uuid.UUID,
    payload: UpdateSchoolClassMembersRequest,
    scope: OrganizationAdminScope,
    service: SchoolClassServiceDep,
) -> SchoolClassResponse:
    try:
        school_class = await service.update_members(
            organization_id=scope.organization.id,
            school_class_id=school_class_id,
            payload=payload,
        )
    except SchoolClassNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Class not found",
        ) from None
    except InvalidSchoolClassMembersError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "message": "Some selected users are not active members with the expected role",
                "teacher_ids": sorted(str(user_id) for user_id in exc.teacher_ids),
                "student_ids": sorted(str(user_id) for user_id in exc.student_ids),
            },
        ) from None
    except StudentsAlreadyAssignedError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Some students already belong to a class for this academic year",
                "student_ids": sorted(str(user_id) for user_id in exc.student_ids),
            },
        ) from None
    return service.to_response(school_class)


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
