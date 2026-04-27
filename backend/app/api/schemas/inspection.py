"""
Pydantic shapes for JSON bodies and inspection records.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class IssueType(str, Enum):
    dent = "dent"
    crack = "crack"
    corrosion = "corrosion"
    paint_damage = "paint_damage"
    no_issue = "no_issue"


class InspectionRecord(BaseModel):
    id: str
    frame_path: str
    timestamp: datetime
    issue_type: IssueType
    confidence: float = Field(ge=0.0, le=1.0)
    flagged: bool
    run_id: str | None = None
    notes: str | None = None
    aircraft_tail: str | None = Field(
        default=None,
        description="When set, this exterior run is linked to inspections for that tail.",
    )


class FrameIngestRequest(BaseModel):
    """Register a server-local image path (bytes should be uploaded via multipart instead)."""

    video_path: str | None = None  # legacy field name: any local image path on the API host
    run_id: str | None = None


class FrameIngestResponse(BaseModel):
    frame_id: str
    frame_path: str
    run_id: str | None = None
    message: str | None = None


class AnalysisRunRequest(BaseModel):
    """Analyze still images already saved on the server (e.g. after POST /api/frames)."""

    video_path: str | None = None  # only if it points to an image file on disk (legacy name)
    run_id: str | None = None
    max_frames: int | None = Field(default=10, ge=1, le=100)
    frame_paths: list[str] | None = None
    aircraft_context: str | None = Field(
        default=None,
        description="Optional free text (tail, type, bay) passed to Gemini for the exterior assessment.",
    )
    aircraft_tail: str | None = Field(
        default=None,
        description="Tail number (e.g. N787CC) to associate results with inspections / results filter.",
    )


class ZoneCaptureBrief(BaseModel):
    """When exterior analysis is tagged with zone_id, the saved zone photo is returned here."""

    id: str
    zone_id: str
    captured_at: str
    image_url: str


class AnalysisRunResponse(BaseModel):
    run_id: str
    summary_issue_type: IssueType
    summary_confidence: float
    flagged: bool
    per_frame: list[InspectionRecord]
    zone_capture: ZoneCaptureBrief | None = None
    message: str | None = Field(
        default=None,
        description="Set when there was no batch work to run (e.g. all zone images already analyzed).",
    )


class PendingExteriorRequest(BaseModel):
    """Analyze all unanalyzed zone-captured stills for a tail (server local paths from zone_captures)."""

    aircraft_tail: str = Field(min_length=1, description="Tail to scope zone captures (e.g. N787CC).")
    aircraft_context: str | None = Field(
        default=None,
        description="Optional free text passed to Gemini (tail, type, bay).",
    )
    max_frames: int | None = Field(
        default=50,
        ge=1,
        le=100,
        description="Upper bound on how many unanalyzed images to process in one run.",
    )


class ResultsListResponse(BaseModel):
    items: list[InspectionRecord]
    total: int
