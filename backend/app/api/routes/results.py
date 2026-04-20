"""
Read-only access to stored inspection metadata for the UI or export.
"""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.schemas.inspection import InspectionRecord, IssueType, ResultsListResponse
from app.core.config import Settings, get_settings
from app.services import storage

router = APIRouter(prefix="/results", tags=["results"])


@router.get("", response_model=ResultsListResponse)
async def list_results(
    settings: Annotated[Settings, Depends(get_settings)],
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    run_id: str | None = Query(default=None),
    since: datetime | None = Query(default=None),
    issue_type: IssueType | None = Query(default=None),
):
    rows, total = storage.load_results(
        settings,
        limit=limit,
        offset=offset,
        run_id=run_id,
        since=since,
        issue_type=issue_type.value if issue_type is not None else None,
    )
    items = [InspectionRecord.model_validate(r) for r in rows]
    return ResultsListResponse(items=items, total=total)
