"""
Persist frames and inspection metadata for the demo (folder + JSONL).

Routes and the analysis pipeline call these functions; replace internals with SQLite later if needed.
"""

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.config import Settings
from app.services import zone_captures

_FRAME_FILENAME_RE = re.compile(r"^[0-9a-fA-F-]{36}\.[A-Za-z0-9]{2,12}$")


def _safe_resolved_frame_path(settings: Settings, filename: str) -> Path | None:
    if not filename or not _FRAME_FILENAME_RE.match(filename):
        return None
    base = settings.frames_dir.resolve()
    path = (settings.frames_dir / filename).resolve()
    try:
        path.relative_to(base)
    except ValueError:
        return None
    return path


def resolve_frame_file(settings: Settings, filename: str) -> Path | None:
    """Return path to a frame file under frames_dir if name is safe and file exists."""
    path = _safe_resolved_frame_path(settings, filename)
    if path is None or not path.is_file():
        return None
    return path


def try_delete_orphan_frame_file(
    settings: Settings,
    frame_filename: str,
) -> bool:
    """
    Delete a file under frames_dir if it exists and the name is still safe to resolve.
    Call after zone capture removal; optional guard at call site (e.g. no remaining references).
    """
    path = _safe_resolved_frame_path(settings, frame_filename)
    if path is None or not path.is_file():
        return False
    path.unlink()
    return True


def save_frame(frame_bytes: bytes, ext: str, run_id: str | None, settings: Settings) -> str:
    settings.frames_dir.mkdir(parents=True, exist_ok=True)
    fid = str(uuid.uuid4())
    safe_ext = ext if ext.startswith(".") else (f".{ext}" if ext else ".bin")
    path = settings.frames_dir / f"{fid}{safe_ext}"
    path.write_bytes(frame_bytes)
    return str(path.resolve())


def save_result(record: dict[str, Any], settings: Settings) -> None:
    settings.results_db.parent.mkdir(parents=True, exist_ok=True)
    line = dict(record)
    ts = line.get("timestamp")
    if isinstance(ts, datetime):
        line["timestamp"] = ts.astimezone(timezone.utc).isoformat()
    with settings.results_db.open("a", encoding="utf-8") as f:
        f.write(json.dumps(line, default=str) + "\n")


def load_results(
    settings: Settings,
    *,
    limit: int = 50,
    offset: int = 0,
    run_id: str | None = None,
    since: datetime | None = None,
    issue_type: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    if not settings.results_db.is_file():
        return [], 0
    rows: list[dict[str, Any]] = []
    with settings.results_db.open(encoding="utf-8") as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            rows.append(json.loads(raw))

    filtered: list[dict[str, Any]] = []
    for r in rows:
        if run_id is not None and r.get("run_id") != run_id:
            continue
        if issue_type is not None and r.get("issue_type") != issue_type:
            continue
        if since is not None:
            ts_raw = r.get("timestamp")
            if not ts_raw:
                continue
            try:
                ts_s = str(ts_raw).replace("Z", "+00:00")
                parsed = datetime.fromisoformat(ts_s)
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                s = since if since.tzinfo else since.replace(tzinfo=timezone.utc)
                if parsed < s:
                    continue
            except ValueError:
                continue
        filtered.append(r)

    filtered.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)
    total = len(filtered)
    page = filtered[offset : offset + limit]
    return page, total


def _norm_frame_path(p: str) -> str:
    try:
        return str(Path(p).resolve())
    except (OSError, ValueError):
        return p


def load_all_result_rows(settings: Settings) -> list[dict[str, Any]]:
    if not settings.results_db.is_file():
        return []
    out: list[dict[str, Any]] = []
    with settings.results_db.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return out


def latest_inspection_summary_for_frame_filename(
    settings: Settings,
    filename: str,
) -> dict[str, Any] | None:
    """
    Newest results row (by timestamp) whose frame_path basename matches ``filename``.
    Returns a small dict for API JSON: issueType, confidence, flagged, notes.
    """
    want = str(filename).strip()
    if not want:
        return None
    best: dict[str, Any] | None = None
    best_ts = ""
    for r in load_all_result_rows(settings):
        fp = r.get("frame_path")
        if not fp or not isinstance(fp, str):
            continue
        try:
            base = Path(fp).name
        except (TypeError, ValueError):
            continue
        if base != want:
            continue
        ts = str(r.get("timestamp") or "")
        if best is None or ts >= best_ts:
            best = r
            best_ts = ts
    if best is None:
        return None
    try:
        cf = float(best.get("confidence"))
    except (TypeError, ValueError):
        cf = 0.0
    cf = max(0.0, min(1.0, cf))
    notes = best.get("notes")
    return {
        "issueType": str(best.get("issue_type") or "no_issue"),
        "confidence": cf,
        "flagged": bool(best.get("flagged")),
        "notes": (str(notes) if notes is not None and str(notes).strip() else None),
    }


def analyzed_frame_path_strings(settings: Settings) -> set[str]:
    s: set[str] = set()
    for r in load_all_result_rows(settings):
        fp = r.get("frame_path")
        if not fp or not isinstance(fp, str):
            continue
        s.add(_norm_frame_path(fp))
    return s


def list_unanalyzed_exterior_frame_paths(
    settings: Settings,
    aircraft_tail: str,
) -> list[str]:
    """
    On-disk stills referenced by zone_captures for this tail for which we have
    no inspection row with the same frame_path (by resolved path string).
    """
    analyzed = analyzed_frame_path_strings(settings)
    fns = zone_captures.unique_zone_frame_filenames_for_tail(settings, aircraft_tail)
    out: list[str] = []
    for fn in sorted(fns):
        p = resolve_frame_file(settings, fn)
        if p is None:
            continue
        key = str(p.resolve())
        if key not in analyzed:
            out.append(key)
    return out
