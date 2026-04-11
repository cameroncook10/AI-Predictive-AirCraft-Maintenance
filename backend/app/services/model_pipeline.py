"""
Call the vision model / VLM and normalize output to the demo category set.

TODO:
- Batch or single-frame API to your model; build prompt for exterior defect check.
- Map raw model output to fixed labels: dent, crack, corrosion, paint_damage, no_issue (+ confidence).
- Handle timeouts and model errors with a controlled fallback response.

Expected role:
- Only place that talks to the ML stack; routes call this after frames are chosen.
"""


def analyze_frames(*args, **kwargs):
    # TODO: Signature e.g. analyze_frames(frames: list[bytes]) -> list[InspectionResultDict].
    """
    Expected:
    - Accept one or more still images aligned with the demo flow.
    - Return structured dicts (or Pydantic models) suitable for `storage.save_result` and the UI.

    Returns:
    - Per-frame or per-run results: issue_type, confidence, optional free text, flagged boolean.
    """
    ...
