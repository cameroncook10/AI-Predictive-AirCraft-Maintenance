"""
Exterior inspection: Google Gemini (multimodal) on still images (paths on disk after client upload).
"""

from app.core.config import Settings
from app.services import gemini_exterior


def analyze_frames(
    frame_paths: list[str],
    *,
    run_id: str,
    settings: Settings,
    aircraft_context: str | None = None,
    aircraft_tail: str | None = None,
) -> list[dict]:
    """Produce one inspection row per image path using Gemini vision."""
    out: list[dict] = []
    for path in frame_paths:
        out.append(
            gemini_exterior.analyze_frame_path(
                path,
                run_id=run_id,
                settings=settings,
                aircraft_context=aircraft_context,
                aircraft_tail=aircraft_tail,
            )
        )
    return out
