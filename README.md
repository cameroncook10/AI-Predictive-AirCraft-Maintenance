
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
uvicorn app.main:app --reload --host 127.0.0.1 --port 8765
```

On Windows, if you see `WinError 10013` on port 8000, Hyper-V or excluded port ranges often block it; **8765** avoids that. Use any free port and point the Vite proxy in `client/vite.config.js` at the same port.

## Backend Architecture

The backend is a **FastAPI** application that powers an AI-driven aircraft exterior inspection demo. It ingests still images from uploads, sends them to **Google Gemini** (vision) for defect-style assessment, and stores the results for the frontend to display.

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

Creates the FastAPI `app` instance used by `uvicorn app.main:app`. Mounts all route modules under the `/api` prefix and exposes a lightweight `/health` endpoint for manual or scripted smoke checks.

### API Layer — `app/api/`

All HTTP-facing code lives here. Routes handle request/response only and delegate heavy work to the service layer.

#### Routes

| File | Endpoint | Method | Purpose |
|------|----------|--------|---------|
| `routes/frames.py` | `/api/frames` | POST | Accepts a still-image upload or a `video_path` reference for server-local media. Validates input and calls `storage.save_frame`. |
| `routes/analysis.py` | `/api/analysis/run` | POST | Triggers inspection on saved image paths: **Gemini** multimodal analysis → save results. |
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

#### `model_pipeline.py` — Gemini (exterior stills)

`analyze_frames` is the module that calls **Google Gemini** for one or more saved stills, maps the model JSON to the fixed label set (`dent`, `crack`, `corrosion`, `paint_damage`, `no_issue`) plus confidence, and returns rows the API persists.

#### `storage.py` — Persistence

Handles all I/O for the demo (folder-based + JSON or SQLite):

- `save_frame(frame_bytes, ext, run_id)` — writes image bytes to `data/frames/` with stable filenames; returns the path.
- `save_result(result_dict)` — appends one JSON-line row with filename, timestamp, issue type, and confidence.
- `load_results(run_id?, since?)` — reads back stored records for `GET /api/results`, sorted by time with optional filters.

### Configuration — `app/core/config.py`

`Settings` class (to be implemented with `pydantic-settings BaseSettings`) that loads from environment variables or a `.env` file. Single source of truth for:

- `FRAMES_DIR` — where extracted frames are saved (default `data/frames`).
- `RESULTS_DB` — path to the results store (JSON file or SQLite DB).
- `GEMINI_API_KEY` / `GEMINI_VISION_MODEL` — Google Generative AI for chat and exterior image analysis.
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
  model_pipeline.analyze_frames(kept_frames)   ← Gemini returns labels + confidence
       │
       ▼
  storage.save_result(result)                  ← persist to disk
       │
       ▼
  Response → { summary, per-frame outcomes }
```

## Production (Docker)

From the repo root (`AI-Predictive-AirCraft-Maintenance/`), build and run a single container that serves the Vite-built UI and `/api` on one port (default **8765**; platforms like Railway set **`PORT`** automatically).

```bash
docker build -t aeromind .
docker run --rm -p 8765:8765 -e GEMINI_API_KEY=your_key_here aeromind
```

Open `http://localhost:8765`. Persisted uploads and JSONL stores live under `backend/data` inside the container unless you mount a volume there. Set **`CORS_ORIGINS`** if you later split the frontend to another host.

