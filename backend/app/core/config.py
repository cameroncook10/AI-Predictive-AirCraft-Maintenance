"""
Application settings: paths, intervals, model endpoints.

TODO:
- Load from environment variables or a `.env` file (e.g. FRAMES_DIR, RESULTS_DB, MODEL_URL).
- Expose a cached `get_settings()` singleton for dependency injection in routes/services.

Expected role:
- Single source of truth for `data/frames`, `data/results`, frame sampling interval, blur thresholds, etc.
"""


class Settings:
    # TODO: Replace with real fields (e.g. pydantic-settings BaseSettings) when implementing.
    """Expected: Immutable-ish config object read once per request or cached app-wide."""
    pass
