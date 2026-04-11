"""
FastAPI application entry: mounts routers and exposes process health.

TODO:
- Optionally add CORS middleware if a separate-origin frontend calls this API.
- Optionally add lifespan hooks to warm the model or validate paths on startup.

Expected role:
- Create the `app` instance used by `uvicorn app.main:app`.
- Register all HTTP routers under a consistent prefix (e.g. `/api`).
- Keep `/health` lightweight for load balancers and quick smoke checks.
"""

from fastapi import FastAPI

from app.api.routes import analysis, frames, results

app = FastAPI()
app.include_router(frames.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(results.router, prefix="/api")


@app.get("/health")
def health():
    # TODO: Optionally include build id or dependency checks; keep response small.
    """Expected: Return 200 with a JSON body proving the process is up (no video/model required)."""
    return {}
