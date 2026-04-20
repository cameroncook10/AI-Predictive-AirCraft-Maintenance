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


class FrameIngestRequest(BaseModel):
    """Register server-local media; no file bytes in JSON."""

    video_path: str | None = None
    run_id: str | None = None


class FrameIngestResponse(BaseModel):
    frame_id: str
    frame_path: str
    run_id: str | None = None
    message: str | None = None


class AnalysisRunRequest(BaseModel):
    video_path: str | None = None
    run_id: str | None = None
    max_frames: int | None = Field(default=10, ge=1, le=100)
    frame_paths: list[str] | None = None


class AnalysisRunResponse(BaseModel):
    run_id: str
    summary_issue_type: IssueType
    summary_confidence: float
    flagged: bool
    per_frame: list[InspectionRecord]


class ResultsListResponse(BaseModel):
    items: list[InspectionRecord]
    total: int
