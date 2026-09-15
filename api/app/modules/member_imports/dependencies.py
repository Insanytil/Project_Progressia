from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.modules.auth.dependencies import get_user_manager
from app.modules.auth.user_manager import UserManager
from app.modules.jobs.repository import BackgroundJobRepository
from app.modules.jobs.service import BackgroundJobService
from app.modules.member_imports.service import BulkMemberImportService


async def get_bulk_member_import_service(
    session: AsyncSession = Depends(get_async_session),
    user_manager: UserManager = Depends(get_user_manager),
) -> BulkMemberImportService:
    return BulkMemberImportService(
        db=session,
        user_manager=user_manager,
        job_service=BackgroundJobService(
            session,
            BackgroundJobRepository(session),
        ),
    )


BulkMemberImportServiceDep = Annotated[
    BulkMemberImportService,
    Depends(get_bulk_member_import_service),
]
