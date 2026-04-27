"""
Merge saved exterior (Gemini) analysis rows into the walk-around checklist response.
"""

from __future__ import annotations

from typing import Any

from app.core.config import Settings
from app.services import storage


def _issue_label(issue: str) -> str:
    return str(issue or "no_issue").replace("_", " ").title()


def _result_row_to_checklist_item(row: dict[str, Any]) -> dict[str, Any]:
    issue = str(row.get("issue_type") or "no_issue")
    flagged = bool(row.get("flagged"))
    is_fail = flagged or issue != "no_issue"
    status = "fail" if is_fail else "pass"
    try:
        conf = float(row.get("confidence") or 0.0)
    except (TypeError, ValueError):
        conf = 0.0
    notes = (row.get("notes") or "").strip()
    headline = notes.split("\n")[0][:160] if notes else _issue_label(issue)
    rid = str(row.get("id") or "").strip() or "unknown"
    task = f"{_issue_label(issue)} ({int(conf * 100)}% conf.) — {headline}"
    return {
        "id": f"ext-{rid}",
        "task": task,
        "status": status,
        "readOnly": True,
    }


def exterior_zone_for_tail(tail: str, settings: Settings, *, limit: int = 15) -> dict[str, Any] | None:
    """
    Build one checklist zone from results.jsonl rows tagged with aircraft_tail.
    Newest captures first.
    """
    want = tail.strip().upper()
    if not want:
        return None
    rows, _ = storage.load_results(settings, limit=800, offset=0)
    matching = [r for r in rows if str(r.get("aircraft_tail") or "").strip().upper() == want]
    if not matching:
        return None

    def sort_key(r: dict[str, Any]) -> str:
        return str(r.get("timestamp") or "")

    matching.sort(key=sort_key, reverse=True)
    matching = matching[:limit]
    items = [_result_row_to_checklist_item(r) for r in matching]
    return {"zone": "Exterior capture (Gemini)", "items": items}


def merge_checklist_with_exterior(
    tail: str,
    checklist: list[dict[str, Any]],
    settings: Settings,
    *,
    limit: int = 15,
) -> list[dict[str, Any]]:
    zone = exterior_zone_for_tail(tail, settings, limit=limit)
    if zone is None:
        return checklist
    return [zone, *checklist]
