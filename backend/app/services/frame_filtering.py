"""
Drop bad or redundant frames before calling the model (cheap heuristics).

TODO:
- Blur score (e.g. variance of Laplacian) below threshold → skip.
- Mean luminance too low → skip.
- Near-duplicate vs previous kept frame (e.g. histogram or MSE) → skip.

Expected role:
- Improve demo quality and keep model calls small; logic stays testable without HTTP.
"""


def filter_frame(*args, **kwargs):
    # TODO: Signature e.g. filter_frame(frame, previous_frame | None) -> bool (keep) or Optional[frame].
    """
    Expected:
    - Return whether this frame should be kept, or return None if rejected.

    Returns:
    - True/False or filtered frame; callers then pass only kept frames to `model_pipeline`.
    """
    ...
