"""
Run the inspection pipeline on selected frames for a job or session.

TODO:
- Orchestrate: `input_source` → `select_frames` → `filter_frame` → `analyze_frames` → `save_result`.
- Accept run parameters (source path, max frames, thresholds) via body or query.
- Return summary for UI: latest frame thumbnail path, label, confidence, flagged.

Expected role:
- Single "go" endpoint for the demo E2E button; no long blocking without streaming if video is large (optional: background task).

TODO (ops): Consider returning 202 + job id if you move work to a background queue later.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/run")
async def run_inspection():
    # TODO: Request model for options; invoke service pipeline; return structured response (not 501).
    """
    Expected:
    - Trigger one inspection pass over configured or uploaded media.
    - Response body matches what the minimal UI needs (result + optional list of per-frame outcomes).
    """
    raise HTTPException(status_code=501, detail="Not implemented")
