from fastapi import FastAPI, Depends
from app.modules.auth.router import router as auth_router

app = FastAPI(
    title="Progressia API",
    version="0.1.0",
)

app.include_router(auth_router)




