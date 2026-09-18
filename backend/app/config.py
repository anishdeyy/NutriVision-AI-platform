from pathlib import Path
from typing import Optional

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

_ROOT_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILES = (
    str(_ROOT_DIR / ".env"),
    ".env",
    "../.env",
)


class Settings(BaseSettings):
    APP_NAME: str = "NutriVision AI"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "sqlite:///./nutrivision.db"

    # Security / Auth
    JWT_SECRET: SecretStr
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    # Gemini AI
    GEMINI_API_KEY: SecretStr
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"

    # Razorpay
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[SecretStr] = None
    RAZORPAY_WEBHOOK_SECRET: Optional[SecretStr] = None

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()