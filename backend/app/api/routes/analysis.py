"""
Run the inspection pipeline on selected frames for a job or session.
"""

from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from app.api.schemas.inspection import (
    AnalysisRunRequest,
    AnalysisRunResponse,
    InspectionRecord,
)
from app.core.config import Settings, get_settings
from app.services import model_pipeline, storage

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/run", response_model=AnalysisRunResponse)
async def run_inspection(
    body: AnalysisRunRequest,
    settings: Annotated[Settings, Depends(get_settings)],
):
    run_id = body.run_id or str(uuid4())
    max_n = body.max_frames or 10

    if body.frame_paths:
        paths = list(body.frame_paths)[:max_n]
    elif body.video_path:
        paths = [body.video_path]
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide video_path or frame_paths",
        )

    raw_rows = model_pipeline.analyze_frames(paths, run_id=run_id, settings=settings)
    records: list[InspectionRecord] = []
    for row in raw_rows:
        storage.save_result(row, settings)
        records.append(InspectionRecord.model_validate(row))

    if not records:
        raise HTTPException(status_code=500, detail="analysis produced no records")

    best = max(records, key=lambda r: r.confidence)
    flagged_any = any(r.flagged for r in records)

    return AnalysisRunResponse(
        run_id=run_id,
        summary_issue_type=best.issue_type,
        summary_confidence=best.confidence,
        flagged=flagged_any,
        per_frame=records,
    )
