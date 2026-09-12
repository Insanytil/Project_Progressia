# app/modules/auth/router.py

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)

from app.modules.auth.auth_service import AuthService
from app.modules.auth.cookies import (
    clear_auth_cookies,
    set_auth_cookies,
)
from app.modules.auth.dependencies import (
    CsrfProtectedSession,
    CurrentUser,
    get_auth_service,
)
from app.modules.auth.exceptions import InvalidCredentialsError
from app.modules.auth.schemas import (
    CurrentUserResponse,
    LoginRequest,
)


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post(
    "/login",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def login(
    payload: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> None:
    try:
        result = await auth_service.login(
            email=payload.email,
            password=payload.password,
        )
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        ) from None

    set_auth_cookies(
        response,
        result,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout(
    response: Response,
    auth: CsrfProtectedSession,
    auth_service: AuthService = Depends(get_auth_service),
) -> None:
    await auth_service.logout(auth)

    clear_auth_cookies(response)


@router.post(
    "/logout-all",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout_all(
    response: Response,
    auth: CsrfProtectedSession,
    auth_service: AuthService = Depends(get_auth_service),
) -> None:
    await auth_service.logout_all(
        auth.user,
    )

    clear_auth_cookies(response)


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
async def get_me(
    user: CurrentUser,
) -> CurrentUserResponse:
    return CurrentUserResponse.model_validate(user)