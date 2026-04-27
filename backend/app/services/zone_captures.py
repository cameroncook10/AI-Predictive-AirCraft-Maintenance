"""
Persist exterior photos tagged by camera inspection zone (tail + zone_id).

Appended JSON lines; used by Exterior capture and Ground Inspection views.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.config import Settings


def _tail_key(tail: str) -> str:
    return tail.strip().upper()


def append_zone_capture(
    settings: Settings,
    *,
    aircraft_tail: str,
    zone_id: str,
    frame_filename: str,
    run_id: str | None = None,
) -> dict[str, Any]:
    """Record one saved frame under a camera zone for an aircraft tail."""
    settings.zone_captures_db.parent.mkdir(parents=True, exist_ok=True)
    rec = {
        "id": str(uuid.uuid4()),
        "aircraft_tail": _tail_key(aircraft_tail),
        "zone_id": zone_id.strip(),
        "frame_filename": frame_filename,
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "run_id": run_id,
    }
    with settings.zone_captures_db.open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec, default=str) + "\n")
    return rec


def _load_all_rows(settings: Settings) -> list[dict[str, Any]]:
    if not settings.zone_captures_db.is_file():
        return []
    rows: list[dict[str, Any]] = []
    with settings.zone_captures_db.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def exterior_zone_photos_payload(
    tail: str,
    camera_zones: list[dict[str, Any]],
    settings: Settings,
    *,
    per_zone_limit: int = 24,
) -> list[dict[str, Any]]:
    """
    Build [{ zoneId, zoneName, photos: [{ id, capturedAt, imageUrl, runId, inspection? }] }, ...]
    in the same order as camera_zones. imageUrl is relative to the API host.
    When a saved frame has exterior analysis in results, ``inspection`` is the latest match.
    """
    from app.services import storage

    want = _tail_key(tail)
    rows = [r for r in _load_all_rows(settings) if str(r.get("aircraft_tail") or "").upper() == want]

    def sort_key(r: dict[str, Any]) -> str:
        return str(r.get("captured_at") or "")

    rows.sort(key=sort_key, reverse=True)

    by_zone: dict[str, list[dict[str, Any]]] = {}
    for r in rows:
        zid = str(r.get("zone_id") or "").strip()
        if not zid:
            continue
        fn = str(r.get("frame_filename") or "").strip()
        if not fn:
            continue
        photo: dict[str, Any] = {
            "id": r.get("id"),
            "capturedAt": r.get("captured_at"),
            "imageUrl": f"/api/frames/file/{fn}",
            "runId": r.get("run_id"),
        }
        ins = storage.latest_inspection_summary_for_frame_filename(settings, fn)
        if ins:
            photo["inspection"] = ins
        by_zone.setdefault(zid, []).append(photo)

    for zid in by_zone:
        by_zone[zid] = by_zone[zid][:per_zone_limit]

    out: list[dict[str, Any]] = []
    for z in camera_zones:
        zid = str(z.get("id") or "")
        if not zid:
            continue
        out.append(
            {
                "zoneId": zid,
                "zoneName": z.get("name") or zid,
                "photos": by_zone.get(zid, []),
            }
        )
    return out


def _write_all_rows(settings: Settings, rows: list[dict[str, Any]]) -> None:
    """Replace JSONL (used for deletes). Preserves a single trailing newline as append did."""
    settings.zone_captures_db.parent.mkdir(parents=True, exist_ok=True)
    with settings.zone_captures_db.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, default=str) + "\n")


def count_references_to_frame_filename(settings: Settings, frame_filename: str) -> int:
    if not frame_filename or not str(frame_filename).strip():
        return 0
    want = str(frame_filename).strip()
    n = 0
    for r in _load_all_rows(settings):
        if str(r.get("frame_filename") or "").strip() == want:
            n += 1
    return n


def remove_zone_capture_by_id(
    settings: Settings,
    *,
    aircraft_tail: str,
    capture_id: str,
) -> dict[str, Any] | None:
    """Remove one zone capture line by id, scoped to tail. Returns the removed record or None."""
    want = _tail_key(aircraft_tail)
    want_id = str(capture_id).strip()
    rows = _load_all_rows(settings)
    removed: dict[str, Any] | None = None
    kept: list[dict[str, Any]] = []
    for r in rows:
        if str(r.get("id") or "") == want_id and str(r.get("aircraft_tail") or "").upper() == want:
            removed = r
            continue
        kept.append(r)
    if removed is None:
        return None
    _write_all_rows(settings, kept)
    return removed


def unique_zone_frame_filenames_for_tail(settings: Settings, tail: str) -> set[str]:
    """Distinct frame filenames (UUID.ext) that appear in zone_captures for this tail."""
    want = _tail_key(tail)
    out: set[str] = set()
    for r in _load_all_rows(settings):
        if str(r.get("aircraft_tail") or "").upper() != want:
            continue
        fn = str(r.get("frame_filename") or "").strip()
        if fn:
            out.add(fn)
    return out
