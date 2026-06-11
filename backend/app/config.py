from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = Field(default="development", alias="APP_ENV")
    app_base_url: str = Field(default="http://localhost:5173", alias="APP_BASE_URL")
    cors_origins: str = Field(
        default="http://localhost:5173",
        alias="CORS_ORIGINS",
    )

    database_url: str = Field(
        default="sqlite:///./data/3r-assist.db",
        alias="DATABASE_URL",
    )

    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(
        default="claude-sonnet-4-20250514",
        alias="ANTHROPIC_MODEL",
    )

    embedding_model: str = Field(
        default="all-MiniLM-L6-v2",
        alias="EMBEDDING_MODEL",
    )

    auth_secret: str | None = Field(default=None, alias="AUTH_SECRET")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def use_stub_llm(self) -> bool:
        return not self.anthropic_api_key


@lru_cache
def get_settings() -> Settings:
    return Settings()
