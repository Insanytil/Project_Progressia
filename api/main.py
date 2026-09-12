from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from api.app.db.session import get_async_session
app = FastAPI(
    title="Progressia API",
    version="0.1.0",
)


@app.get("/health_db")
async def database_health(
    db: AsyncSession = Depends(get_async_session),
) -> dict[str,str]:
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        raise

    return {
        "status": "ok",
        "database": "connected",
    }



