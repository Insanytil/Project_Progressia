from fastapi import FastAPI
from app.modules.auth.router import router as auth_router
from app.modules.platform_administration.router import router as platform_administration_router

app = FastAPI(
    title="Progressia API",
    version="0.1.0",
)

app.include_router(auth_router)
app.include_router(platform_administration_router)




