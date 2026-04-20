"""
Ingest endpoints: receive uploads or register frames extracted server-side.
"""

from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.schemas.inspection import FrameIngestRequest, FrameIngestResponse
from app.core.config import Settings, get_settings
from app.services import storage

router = APIRouter(prefix="/frames", tags=["frames"])


@router.post("", response_model=FrameIngestResponse, status_code=201)
async def ingest_frame(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)],
):
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        payload = FrameIngestRequest.model_validate(await request.json())
        if not payload.video_path:
            raise HTTPException(
                status_code=422,
                detail="video_path is required for application/json ingest",
            )
        return FrameIngestResponse(
            frame_id=str(uuid4()),
            frame_path=payload.video_path,
            run_id=payload.run_id,
            message="registered server-local path (no bytes stored)",
        )

    if "multipart/form-data" in content_type:
        form = await request.form()
        upload = form.get("file")
        if upload is None:
            raise HTTPException(status_code=422, detail="multipart field 'file' is required")
        data = await upload.read()
        filename = getattr(upload, "filename", None) or "upload.bin"
        ext = Path(filename).suffix or ".bin"
        run_id = form.get("run_id")
        run_id_str = str(run_id) if run_id is not None else None
        path_str = storage.save_frame(data, ext, run_id_str, settings)
        frame_id = Path(path_str).stem
        return FrameIngestResponse(
            frame_id=frame_id,
            frame_path=path_str,
            run_id=run_id_str,
            message="saved",
        )

    raise HTTPException(
        status_code=415,
        detail="Content-Type must be application/json or multipart/form-data",
    )
