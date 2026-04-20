"""
Application settings: paths, intervals, model endpoints.

Loads from environment variables and optional `.env`. Use `get_settings()` for dependency injection.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    frames_dir: Path = Field(default=Path("data/frames"))
    results_db: Path = Field(default=Path("data/results.jsonl"))
    model_url: str = Field(default="http://localhost:9999/vlm")

    frame_sample_interval_sec: float = Field(default=2.0, ge=0.1)
    blur_threshold: float = Field(default=100.0)

    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
    )

    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
