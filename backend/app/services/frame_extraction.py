"""
Sample frames from a video or stream at a fixed rate (time or frame index).

TODO:
- Implement interval logic: e.g. 1 frame every 2 seconds, or every N frames (from Settings).
- Yield or return raw frame buffers plus metadata (timestamp, frame index).

Expected role:
- Reduce volume before filtering and model: never send every frame to the VLM for the demo.
"""


def select_frames(*args, **kwargs):
    # TODO: Signature e.g. select_frames(source, interval_seconds: float) -> Iterable[FrameArray].
    """
    Expected:
    - Walk the opened source and emit a sparse sequence of frames only.

    Returns:
    - Iterable of frames (numpy arrays or bytes) with optional index/time for storage.
    """
    ...
