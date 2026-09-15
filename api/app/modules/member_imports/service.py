import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import generate_secret
from app.models.background_job import BackgroundJob, BackgroundJobType
from app.models.organization_membership import OrganizationMembership
from app.models.user import User
from app.modules.auth.user_manager import UserManager
from app.modules.jobs.service import BackgroundJobService
from app.modules.member_imports.exceptions import BulkMemberEmailConflictError
from app.modules.member_imports.schemas import (
    BulkMemberPreviewResponse,
    BulkMemberPreviewRow,
    BulkMemberRole,
    EMAIL_PATTERN,
)


class BulkMemberImportService:
    def __init__(
        self,
        *,
        db: AsyncSession,
        user_manager: UserManager,
        job_service: BackgroundJobService,
    ):
        self.db = db
        self.user_manager = user_manager
        self.job_service = job_service

    async def preview(self, emails: list[str]) -> BulkMemberPreviewResponse:
        normalized = [email.strip().lower() for email in emails]
        candidates = {
            email for email in normalized if EMAIL_PATTERN.fullmatch(email)
        }
        existing = await self._existing_emails(candidates)
        seen: set[str] = set()
        rows: list[BulkMemberPreviewRow] = []

        for index, email in enumerate(normalized, start=1):
            error: str | None = None
            if not EMAIL_PATTERN.fullmatch(email):
                error = "Adresse e-mail invalide"
            elif email in seen:
                error = "Adresse présente plusieurs fois dans le lot"
            elif email in existing:
                error = "Un compte utilise déjà cette adresse"
            seen.add(email)
            rows.append(
                BulkMemberPreviewRow(
                    row=index,
                    email=email,
                    is_valid=error is None,
                    error=error,
                )
            )

        valid = sum(row.is_valid for row in rows)
        return BulkMemberPreviewResponse(
            rows=rows,
            total=len(rows),
            valid=valid,
            invalid=len(rows) - valid,
            can_confirm=bool(rows) and valid == len(rows),
        )

    async def create(
        self,
        *,
        organization_id: uuid.UUID,
        emails: list[str],
        role: BulkMemberRole,
        triggered_by_user_id: uuid.UUID,
    ) -> tuple[int, int]:
        existing = await self._existing_emails(set(emails))
        if existing:
            raise BulkMemberEmailConflictError(sorted(existing))

        jobs: list[BackgroundJob] = []
        batch_id = uuid.uuid4()
        try:
            for email in emails:
                user = User(
                    email=email,
                    hashed_password=self.user_manager.password_helper.hash(
                        generate_secret()
                    ),
                    is_active=True,
                    is_superuser=False,
                    is_verified=False,
                )
                self.db.add(user)
                await self.db.flush()
                self.db.add(
                    OrganizationMembership(
                        user_id=user.id,
                        organization_id=organization_id,
                        role=role.to_organization_role(),
                    )
                )
                jobs.append(
                    self.job_service.create_email_job(
                        job_type=BackgroundJobType.ACCOUNT_VERIFICATION_EMAIL,
                        recipient_email=email,
                        subject_user_id=user.id,
                        organization_id=organization_id,
                        triggered_by_user_id=triggered_by_user_id,
                        batch_id=batch_id,
                    )
                )
            await self.db.flush()
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise BulkMemberEmailConflictError(emails) from None

        queued = 0
        for job in jobs:
            queued += await self.job_service.dispatch(job)
        return len(emails), queued

    async def _existing_emails(self, emails: set[str]) -> set[str]:
        if not emails:
            return set()
        result = await self.db.scalars(
            select(func.lower(User.email)).where(
                func.lower(User.email).in_(emails)
            )
        )
        return set(result.all())
