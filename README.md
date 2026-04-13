
Backend

Make a python virtual env so you don't conflict with other installed packages 

```bash
python -m venv venv 
source venv/Scripts/activate 
```

Install all necessary packages through:

```bash
pip install -r requirements.txt
```

Run the server with:

```bash
cd backend
uvicorn app.main:app --reload
```

## Backend Architecture

The backend is a **FastAPI** application that powers an AI-driven aircraft exterior inspection demo. It ingests video or still frames, filters and samples them, sends them to a vision language model (VLM) for defect detection, and stores the results for the frontend to display.

### Directory Structure

```
backend/
├── requirements.txt
└── app/
    ├── __init__.py
    ├── main.py
    ├── api/
    │   ├── __init__.py
    │   ├── routes/
    │   │   ├── __init__.py
    │   │   ├── frames.py
    │   │   ├── analysis.py
    │   │   └── results.py
    │   └── schemas/
    │       ├── __init__.py
    │       └── inspection.py
    ├── services/
    │   ├── __init__.py
    │   ├── input_source.py
    │   ├── frame_extraction.py
    │   ├── frame_filtering.py
    │   ├── model_pipeline.py
    │   └── storage.py
    └── core/
        ├── __init__.py
        └── config.py
```

### Entry Point — `app/main.py`

Creates the FastAPI `app` instance used by `uvicorn app.main:app`. Mounts all route modules under the `/api` prefix and exposes a lightweight `/health` endpoint for smoke checks and load balancers.

### API Layer — `app/api/`

All HTTP-facing code lives here. Routes handle request/response only and delegate heavy work to the service layer.

#### Routes

| File | Endpoint | Method | Purpose |
|------|----------|--------|---------|
| `routes/frames.py` | `/api/frames` | POST | Accepts a still-image upload or a `video_path` reference for server-local media. Validates input and calls `storage.save_frame`. |
| `routes/analysis.py` | `/api/analysis/run` | POST | Single "go" endpoint that triggers the full inspection pipeline: input source → frame extraction → filtering → VLM analysis → save results. Returns a summary the UI can render. |
| `routes/results.py` | `/api/results` | GET | Returns stored inspection records (frame reference, timestamp, issue type, confidence, flagged status). Supports optional query params like `limit`, `since`, and `issue_type`. |

#### Schemas — `app/api/schemas/inspection.py`

Pydantic models that define the API contract. Planned types:

- **FrameIngestRequest / FrameIngestResponse** — multipart frame upload payloads.
- **AnalysisRunRequest / AnalysisRunResponse** — video path or session id in, summary out.
- **InspectionRecord** — frame filename, timestamp, `issue_type` (enum: `dent`, `crack`, `corrosion`, `paint_damage`, `no_issue`), `confidence` (float), `flagged` (bool).

### Service Layer — `app/services/`

Pure domain logic with no FastAPI imports. Each module handles one step of the inspection pipeline.

#### `input_source.py` — Media Abstraction

`open_source(kind, path)` opens a webcam, URL/stream, or local video file and returns a uniform reader object (e.g. OpenCV `VideoCapture`) so downstream code doesn't care about the source type.

#### `frame_extraction.py` — Frame Sampling

`select_frames(source, interval_seconds)` walks the opened source and yields frames at a configurable interval (e.g. 1 frame every 2 seconds). Reduces volume before filtering and model inference so the VLM isn't called on every frame.

#### `frame_filtering.py` — Quality Filtering

`filter_frame(frame, previous_frame)` applies cheap heuristics to drop bad or redundant frames before they reach the model:

- **Blur detection** — variance of Laplacian below threshold → skip.
- **Luminance check** — mean brightness too low → skip.
- **Duplicate rejection** — histogram or MSE comparison to previous kept frame → skip.

#### `model_pipeline.py` — VLM Inference

`analyze_frames(frames)` is the only module that talks to the ML stack. It sends one or more still images to the vision model, maps raw output to the fixed label set (`dent`, `crack`, `corrosion`, `paint_damage`, `no_issue` + confidence score), and handles timeouts and model errors with controlled fallback responses.

#### `storage.py` — Persistence

Handles all I/O for the demo (folder-based + JSON or SQLite):

- `save_frame(frame_bytes, ext, run_id)` — writes image bytes to `data/frames/` with stable filenames; returns the path.
- `save_result(result_dict)` — appends one JSON-line row with filename, timestamp, issue type, and confidence.
- `load_results(run_id?, since?)` — reads back stored records for `GET /api/results`, sorted by time with optional filters.

### Configuration — `app/core/config.py`

`Settings` class (to be implemented with `pydantic-settings BaseSettings`) that loads from environment variables or a `.env` file. Single source of truth for:

- `FRAMES_DIR` — where extracted frames are saved (default `data/frames`).
- `RESULTS_DB` — path to the results store (JSON file or SQLite DB).
- `MODEL_URL` — endpoint for the VLM.
- Frame sampling interval, blur thresholds, and other tuning knobs.

Exposed via a cached `get_settings()` singleton for dependency injection across routes and services.

### Full Inspection Pipeline Flow

```
Client POST /api/analysis/run
       │
       ▼
  input_source.open_source(kind, path)
       │
       ▼
  frame_extraction.select_frames(source, interval)
       │
       ▼
  frame_filtering.filter_frame(frame, prev)   ← drop blurry / dark / duplicate
       │
       ▼
  model_pipeline.analyze_frames(kept_frames)   ← VLM returns labels + confidence
       │
       ▼
  storage.save_result(result)                  ← persist to disk
       │
       ▼
  Response → { summary, per-frame outcomes }
```

