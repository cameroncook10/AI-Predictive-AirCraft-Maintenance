"""
Ingest endpoints: receive uploads or register frames extracted server-side.

TODO:
- Accept multipart file upload and/or JSON body `{ "video_path": "..." }` for server-local demo video.
- Validate MIME/size; call `storage.save_frame` (and optionally trigger extraction if sending video).
- Return 201 with frame id/path; replace 501 when wired.

Expected role:
- HTTP boundary for "input enters the system"; keep heavy work in services.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/frames", tags=["frames"])


@router.post("")
async def ingest_frame():
    # TODO: Define request body / UploadFile parameters; call services; return schemas from `inspection`.
    """
    Expected:
    - Client sends a still image or a reference to content the backend will read from disk.
    - Response includes identifiers the UI can show and that `analysis` / `results` can reference.
    """
    raise HTTPException(status_code=501, detail="Not implemented")
