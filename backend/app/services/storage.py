"""
Persist frames and inspection metadata for the demo (folder + JSONL).

Routes and the analysis pipeline call these functions; replace internals with SQLite later if needed.
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.config import Settings


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
