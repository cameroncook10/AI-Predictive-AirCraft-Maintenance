"""
Legacy placeholder for server-side video sources.

The product flow uses still images captured in the browser and uploaded to `/api/frames`
or `/api/analysis/exterior`; no server-side stream reader is required for that path.
"""


def open_source(*args, **kwargs):
    """Reserved for optional future server-side media ingestion."""
    ...
