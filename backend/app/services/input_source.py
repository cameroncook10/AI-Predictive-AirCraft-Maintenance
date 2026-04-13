"""
Abstract where frames come from: webcam, phone stream, or file on disk.

TODO:
- Implement `open_source` for at least one path: prerecorded video file (recommended for demos).
- Return a handle or generator the extractor can read (OpenCV `VideoCapture`, etc.).

Expected role:
- Hide device vs file differences so `frame_extraction` always sees a uniform reader interface.
"""


def open_source(*args, **kwargs):
    # TODO: Signature should be explicit, e.g. open_source(kind: str, path: str | None) -> VideoCaptureLike.
    """
    Expected:
    - Open webcam, URL/stream, or local video path.
    - Raise a clear error if the source is missing or unreadable.

    Returns:
    - An object the frame extractor can pull frames from (implementation-defined).
    """
    ...
