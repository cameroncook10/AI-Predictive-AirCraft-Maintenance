"""
Pydantic (or similar) shapes for JSON bodies and inspection records.

TODO:
- Add models for: multipart frame upload, optional job/run id, list of stored results.
- Constrain `issue_type` to the demo enum (e.g. dent, crack, corrosion, paint_damage, no_issue).
- Add `confidence` float and timestamps for OpenAPI and validation.

Expected role:
- Used by route handlers as `response_model` / body types so the contract matches the UI.
"""

# TODO: Example types to implement:
# - FrameIngestRequest / FrameIngestResponse
# - AnalysisRunRequest (e.g. video path or session id) / AnalysisRunResponse
# - InspectionRecord (frame filename, timestamp, issue_type, confidence, flagged: bool)
