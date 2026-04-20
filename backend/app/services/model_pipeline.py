"""
Call the vision model / VLM and normalize output to the demo category set.

Stub implementation returns structured rows without calling MODEL_URL until wired.
"""

import uuid
from datetime import datetime, timezone

from app.core.config import Settings


def analyze_frames(
    frame_paths: list[str],
    *,
    run_id: str,
    settings: Settings,
) -> list[dict]:
    """
    Produce one inspection row per input path. Replace with real VLM calls later.
    """
    now = datetime.now(timezone.utc)
    out: list[dict] = []
    for path in frame_paths:
        out.append(
            {
                "id": str(uuid.uuid4()),
                "frame_path": path,
                "timestamp": now,
                "issue_type": "no_issue",
                "confidence": 0.0,
                "flagged": False,
                "run_id": run_id,
                "notes": f"stub inference (model_url={settings.model_url})",
            }
        )
    return out
