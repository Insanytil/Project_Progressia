from functools import lru_cache

from pydantic import SecretStr, PositiveInt
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL

class Settings(BaseSettings):
    app_name: str = "Progressia API"
    environment: str = "development"

    postgres_host: str
    postgres_port: int = 5432
    postgres_user: str
    postgres_password: SecretStr
    postgres_db: str

    auth_session_lifetime_hours: PositiveInt = 24
    auth_session_cookie_name: str = "progressia_session"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",

    )

    @property
    def database_url(self) -> URL:
        return URL.create(
            drivername="postgresql+asyncpg",
            username=self.postgres_user,
            password=self.postgres_password.get_secret_value(),
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        )

@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()