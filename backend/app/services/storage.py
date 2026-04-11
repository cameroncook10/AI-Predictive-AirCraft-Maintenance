"""
Persist frames and inspection metadata for the demo (folder + JSON or SQLite).

TODO:
- `save_frame`: write image bytes to `data/frames` with stable filenames; return path or id.
- `save_result`: append one JSON line / row with filename, timestamp, issue_type, confidence.
- `load_results`: read back for `GET /api/results` (sort by time, optional limit).

Expected role:
- Replace a full DB for the demo; keep I/O out of route handlers.
"""


def save_frame(*args, **kwargs):
    # TODO: Explicit args (frame_bytes, ext, run_id) -> str path.
    """Expected: Persist a single frame file; return its relative or absolute path for metadata."""
    ...


def save_result(*args, **kwargs):
    # TODO: Accept a dict or schema instance matching inspection output.
    """Expected: Append or upsert inspection metadata linked to a frame path and run."""
    ...


def load_results(*args, **kwargs):
    # TODO: Optional filters (run_id, since timestamp); return list[dict].
    """Expected: Return stored rows for the results API and optional export."""
    ...
