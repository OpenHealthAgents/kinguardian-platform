from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./kinguardian.db"
    iam_issuer: str = ""
    iam_audience: str = "kinguardian-api"
    iam_jwks_url: str = ""
    event_publisher_url: str = ""


settings = Settings()
