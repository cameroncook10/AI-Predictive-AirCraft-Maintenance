"""
Read-only access to stored inspection metadata for the UI or export.

TODO:
- Call `storage.load_results`; support query params (limit, offset, run_id).
- Return JSON list compatible with the demo table or timeline view.

Expected role:
- Decouple "what we stored" from "how we ran the model"; safe to cache read-only for demos.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/results", tags=["results"])


@router.get("")
async def list_results():
    # TODO: Return real list from storage; add response_model when schemas exist.
    """
    Expected:
    - Return recent inspection rows: frame reference, timestamp, issue_type, confidence, flagged.

    Query params (optional later):
    - `limit`, `since`, `issue_type` filter for demos with many runs.
    """
    raise HTTPException(status_code=501, detail="Not implemented")
