"""
FastAPI application entry: mounts routers and exposes process health.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analysis, frames, results, chat
from app.core.config import get_settings

_settings = get_settings()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(frames.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(results.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/health")
def health():
    """Return 200 with a small JSON body for smoke checks."""
    return {"status": "ok"}
