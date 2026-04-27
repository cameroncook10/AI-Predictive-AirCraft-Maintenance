"""
Exterior inspection: Google Gemini (multimodal) on still images (client-captured uploads).
"""

import asyncio
import logging
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import ValidationError

from app.api.schemas.inspection import (
    AnalysisRunRequest,
    AnalysisRunResponse,
    InspectionRecord,
    PendingExteriorRequest,
    ZoneCaptureBrief,
    IssueType,
)
from app.core.config import Settings, get_settings
from app.services import model_pipeline, storage, zone_captures
from app.services.inspection_output import coerce_inspection_dict

router = APIRouter(prefix="/analysis", tags=["analysis"])
logger = logging.getLogger(__name__)

_IMAGE_SUFFIX = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}


def _is_image_server_path(p: str) -> bool:
    return Path(p).suffix.lower() in _IMAGE_SUFFIX


def _is_winsock_exhaustion(exc: BaseException) -> bool:
    if isinstance(exc, OSError):
        if getattr(exc, "winerror", None) == 10055:
            return True
        if getattr(exc, "errno", None) == 10055:
            return True
    return "10055" in str(exc) and "buffer" in str(exc).lower()


def _records_from_raw_rows(raw_rows: list[dict], settings: Settings) -> list[InspectionRecord]:
    """Validate and persist; raise HTTPException on bad rows."""
    records: list[InspectionRecord] = []
    for row in raw_rows:
        coerced = coerce_inspection_dict(row)
        try:
            rec = InspectionRecord.model_validate(coerced)
        except ValidationError as e:
            logger.exception("InspectionRecord validation failed after coerce")
            raise HTTPException(
                status_code=500,
                detail=f"Analysis returned an invalid record: {e!s}",
            ) from e
        storage.save_result(coerced, settings)
        records.append(rec)
    return records


@router.post("/exterior/pending", response_model=AnalysisRunResponse)
async def analyze_exterior_pending(
    body: PendingExteriorRequest,
    settings: Annotated[Settings, Depends(get_settings)],
):
    """
    Run exterior analysis on every on-disk still that appears in zone_captures
    for the given tail but has no results row for that file yet.
    """
    tail = body.aircraft_tail.strip()
    if not tail:
        raise HTTPException(status_code=422, detail="aircraft_tail is required")

    max_n = min(body.max_frames or 50, 100)
    all_pending = storage.list_unanalyzed_exterior_frame_paths(settings, tail)
    extra_msg: str | None = None
    if len(all_pending) > max_n:
        extra_msg = f"Only the first {max_n} of {len(all_pending)} unanalyzed images are processed this run. Run Analyze again for the rest."
    paths = all_pending[:max_n]
    if not paths:
        return AnalysisRunResponse(
            run_id=str(uuid4()),
            summary_issue_type=IssueType.no_issue,
            summary_confidence=0.0,
            flagged=False,
            per_frame=[],
            zone_capture=None,
            message=(
                "No unanalyzed zone-saved images for this aircraft. Save photos to a zone first "
                "(Capture or Upload to zone), or every saved photo is already analyzed."
            ),
        )

    run = str(uuid4())
    try:
        raw_rows = await asyncio.to_thread(
            model_pipeline.analyze_frames,
            paths,
            run_id=run,
            settings=settings,
            aircraft_context=body.aircraft_context,
            aircraft_tail=tail,
        )
    except asyncio.CancelledError:
        raise
    except OSError as e:
        if _is_winsock_exhaustion(e):
            logger.exception("Windows socket buffer exhaustion during pending exterior analysis")
            raise HTTPException(
                status_code=503,
                detail=(
                    "The system ran out of network socket resources. Close other network-heavy "
                    "applications and retry, or restart the computer if this persists."
                ),
            ) from e
        logger.exception("OSError during pending exterior analysis")
        raise HTTPException(
            status_code=503,
            detail=f"Exterior analysis I/O error: {e!s}",
        ) from e
    except Exception as e:
        logger.exception("Pending exterior analysis failed")
        msg = str(e) or e.__class__.__name__
        raise HTTPException(
            status_code=503,
            detail=f"Exterior analysis failed: {msg}",
        ) from e

    records = _records_from_raw_rows(raw_rows, settings)

    if not records:
        raise HTTPException(status_code=500, detail="analysis produced no records")

    best = max(records, key=lambda r: r.confidence)
    flagged_any = any(r.flagged for r in records)
    return AnalysisRunResponse(
        run_id=run,
        summary_issue_type=best.issue_type,
        summary_confidence=best.confidence,
        flagged=flagged_any,
        per_frame=records,
        zone_capture=None,
        message=extra_msg,
    )


@router.post("/exterior", response_model=AnalysisRunResponse, status_code=201)
async def analyze_exterior_upload(
    settings: Annotated[Settings, Depends(get_settings)],
    file: UploadFile = File(..., description="Exterior photo from the browser or device"),
    run_id: str | None = Form(None),
    aircraft_context: str | None = Form(None),
    aircraft_tail: str | None = Form(None),
    zone_id: str | None = Form(None),
):
    """
    One-shot: save an uploaded image and run Gemini exterior analysis.
    Prefer this from the web client after getUserMedia / canvas capture.
    """
    data = await file.read()
    if not data:
        raise HTTPException(status_code=422, detail="empty upload")

    filename = file.filename or "capture.jpg"
    ext = Path(filename).suffix or ".jpg"
    run = run_id or str(uuid4())
    path_str = storage.save_frame(data, ext, run, settings)

    try:
        raw_rows = await asyncio.to_thread(
            model_pipeline.analyze_frames,
            [path_str],
            run_id=run,
            settings=settings,
            aircraft_context=aircraft_context,
            aircraft_tail=aircraft_tail,
        )
    except asyncio.CancelledError:
        raise
    except OSError as e:
        if _is_winsock_exhaustion(e):
            logger.exception("Windows socket buffer exhaustion during analysis")
            raise HTTPException(
                status_code=503,
                detail=(
                    "The system ran out of network socket resources. Close other network-heavy "
                    "applications and retry, or restart the computer if this persists."
                ),
            ) from e
        logger.exception("OSError during exterior analysis")
        raise HTTPException(
            status_code=503,
            detail=f"Exterior analysis I/O error: {e!s}",
        ) from e
    except Exception as e:
        logger.exception("Exterior analysis failed")
        msg = str(e) or e.__class__.__name__
        raise HTTPException(
            status_code=503,
            detail=f"Exterior analysis failed: {msg}",
        ) from e

    records = _records_from_raw_rows(raw_rows, settings)

    zone_capture: ZoneCaptureBrief | None = None
    if zone_id and zone_id.strip() and aircraft_tail and aircraft_tail.strip():
        try:
            fn = Path(path_str).name
            rec = zone_captures.append_zone_capture(
                settings,
                aircraft_tail=aircraft_tail.strip(),
                zone_id=zone_id.strip(),
                frame_filename=fn,
                run_id=run,
            )
            zone_capture = ZoneCaptureBrief(
                id=str(rec["id"]),
                zone_id=str(rec["zone_id"]),
                captured_at=str(rec["captured_at"]),
                image_url=f"/api/frames/file/{fn}",
            )
        except OSError as e:
            raise HTTPException(
                status_code=503,
                detail=f"Could not save zone capture: {e!s}",
            ) from e

    if not records:
        raise HTTPException(status_code=500, detail="analysis produced no records")

    best = max(records, key=lambda r: r.confidence)
    flagged_any = any(r.flagged for r in records)

    return AnalysisRunResponse(
        run_id=run,
        summary_issue_type=best.issue_type,
        summary_confidence=best.confidence,
        flagged=flagged_any,
        per_frame=records,
        zone_capture=zone_capture,
    )


@router.post("/run", response_model=AnalysisRunResponse)
async def run_inspection(
    body: AnalysisRunRequest,
    settings: Annotated[Settings, Depends(get_settings)],
):
    run_id = body.run_id or str(uuid4())
    max_n = body.max_frames or 10

    if body.frame_paths:
        paths = list(body.frame_paths)[:max_n]
    elif body.video_path and _is_image_server_path(body.video_path):
        paths = [body.video_path]
    elif body.video_path:
        raise HTTPException(
            status_code=422,
            detail=(
                "Only still image paths are supported. Upload photos with POST /api/frames "
                "(multipart) or POST /api/analysis/exterior, then pass the returned frame_path "
                "values in frame_paths."
            ),
        )
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide frame_paths (saved image paths) or POST /api/analysis/exterior with a file.",
        )

    try:
        raw_rows = model_pipeline.analyze_frames(
            paths,
            run_id=run_id,
            settings=settings,
            aircraft_context=body.aircraft_context,
            aircraft_tail=body.aircraft_tail,
        )
    except OSError as e:
        if _is_winsock_exhaustion(e):
            logger.exception("Windows socket buffer exhaustion during analysis")
            raise HTTPException(
                status_code=503,
                detail=(
                    "The system ran out of network socket resources. Close other network-heavy "
                    "applications and retry, or restart the computer if this persists."
                ),
            ) from e
        logger.exception("OSError during analysis run")
        raise HTTPException(
            status_code=503,
            detail=f"Exterior analysis I/O error: {e!s}",
        ) from e
    except Exception as e:
        logger.exception("Exterior analysis run failed")
        msg = str(e) or e.__class__.__name__
        raise HTTPException(
            status_code=503,
            detail=f"Exterior analysis failed: {msg}",
        ) from e

    records = _records_from_raw_rows(raw_rows, settings)

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
