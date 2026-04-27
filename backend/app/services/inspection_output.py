"""
Normalize model JSON (Gemini, etc.) into rows compatible with :class:`InspectionRecord`.
"""

from __future__ import annotations

import json
import math
import re
import uuid
from datetime import datetime, timezone
from typing import Any

_ISSUE_TYPES = frozenset({"dent", "crack", "corrosion", "paint_damage", "no_issue"})


def _strip_code_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\s*```\s*$", "", t)
    return t.strip()


def parse_model_json_text(text: str) -> dict[str, Any]:
    raw = _strip_code_fence(text)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}")
        if start >= 0 and end > start:
            return json.loads(raw[start : end + 1])
        raise


def _normalize_issue_type(value: object) -> str:
    if value is None:
        return "no_issue"
    s = str(value).strip().lower().replace(" ", "_").replace("-", "_")
    if s in _ISSUE_TYPES:
        return s
    if "corrosion" in s:
        return "corrosion"
    if "crack" in s:
        return "crack"
    if "dent" in s:
        return "dent"
    if "paint" in s:
        return "paint_damage"
    return "no_issue"


def _clamp_confidence(value: object) -> float:
    try:
        x = float(value)
    except (TypeError, ValueError):
        return 0.0
    if math.isnan(x) or math.isinf(x):
        return 0.0
    return max(0.0, min(1.0, x))


def coerce_inspection_dict(row: dict) -> dict:
    """Ensure Pydantic ``InspectionRecord`` can validate model output."""
    d = {**row}
    d["issue_type"] = _normalize_issue_type(d.get("issue_type"))
    d["confidence"] = _clamp_confidence(d.get("confidence"))
    return d


def stub_inspection_row(
    frame_path: str,
    *,
    run_id: str,
    notes: str,
    aircraft_tail: str | None = None,
) -> dict:
    now = datetime.now(timezone.utc)
    row = {
        "id": str(uuid.uuid4()),
        "frame_path": frame_path,
        "timestamp": now,
        "issue_type": "no_issue",
        "confidence": 0.0,
        "flagged": False,
        "run_id": run_id,
        "notes": notes,
    }
    if aircraft_tail and str(aircraft_tail).strip():
        row["aircraft_tail"] = str(aircraft_tail).strip().upper()
    return row
