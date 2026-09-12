from fastapi import APIRouter, Depends
from app.modules.authorisation.dependencies import PlatformAdmin

router = APIRouter(
    prefix="/platform",
    tags=["platform"],
    dependencies=[
        Depends(PlatformAdmin),
    ],
)

@router.get("/test")
async def test():
    return {"test": "test"}
