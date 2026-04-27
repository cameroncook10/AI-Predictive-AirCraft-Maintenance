"""
Application settings: paths, intervals, model endpoints.

Loads from environment variables and optional `backend/.env` (always resolved from this
package location, not the shell cwd — so `uvicorn` can be started from repo root or `backend/`).
Use `get_settings()` for dependency injection.
"""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> parents: core, app, backend
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    frames_dir: Path = Field(default=Path("data/frames"))
    results_db: Path = Field(default=Path("data/results.jsonl"))
    zone_captures_db: Path = Field(default=Path("data/zone_captures.jsonl"))
    model_url: str = Field(default="http://localhost:9999/vlm")

    gemini_api_key: str | None = Field(
        default=None,
        description="Google AI API key for /api/chat and /api/analysis/exterior (Gemini vision).",
    )
    gemini_vision_model: str = Field(
        default="gemini-2.5-flash",
        description="Gemini model id for text chat and multimodal exterior stills.",
    )

    frame_sample_interval_sec: float = Field(default=2.0, ge=0.1)
    blur_threshold: float = Field(default=100.0)

    cors_origins: str = Field(
        default=(
            "http://localhost:5173,http://127.0.0.1:5173,"
            "https://localhost:5173,https://127.0.0.1:5173"
        ),
        description="Comma-separated origins. For phone/LAN HTTPS dev, add e.g. https://192.168.1.5:5173",
    )

    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


def get_settings() -> Settings:
    """Fresh read each call so .env edits apply after reload (dev). Lightweight for this app."""
    return Settings()
