from fastapi import APIRouter, Depends

from app.modules.authorisation.dependencies import require_platform_admin


router = APIRouter(
    prefix="/platform",
    tags=["platform"],
    dependencies=[
        Depends(require_platform_admin),
    ],
)

@router.get("/test")
async def test():
    return {"test": "test"}
