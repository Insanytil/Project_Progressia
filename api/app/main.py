from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError

from app.core.exceptions import (
    request_validation_exception_handler,
)

from app.modules.auth.router import router as auth_router
from app.modules.academic_years.router import router as academic_years_router
from app.modules.jobs.router import router as job_events_router
from app.modules.organization_administration.router import router as organization_administration_router
from app.modules.platform_administration.router import router as platform_administration_router

app = FastAPI(
    title="Progressia API",
    version="0.1.0",
)

app.add_exception_handler(
    RequestValidationError,
    request_validation_exception_handler,
)

app.include_router(auth_router)
app.include_router(academic_years_router)
app.include_router(job_events_router)
app.include_router(organization_administration_router)
app.include_router(platform_administration_router)


