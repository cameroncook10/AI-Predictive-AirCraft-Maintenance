"""
Exterior still-image inspection via Google Gemini (multimodal API).

Uses the same JSON contract as the former local path; set ``GEMINI_API_KEY`` in ``backend/.env``.
"""

from __future__ import annotations

import mimetypes
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from app.core.config import Settings
from app.services.inspection_output import (
    _clamp_confidence,
    _normalize_issue_type,
    parse_model_json_text,
    stub_inspection_row,
)


def _build_exterior_prompt(aircraft_context: str | None) -> str:
    ctx_block = ""
    if aircraft_context and str(aircraft_context).strip():
        ctx_block = f"\nKnown context for this capture (may be partial):\n{str(aircraft_context).strip()}\n"
    return (
        "You are a certified aviation maintenance visual inspector. "
        "This photo is meant to show all or part of an aircraft exterior (fuselage, wings, empennage, "
        "control surfaces, paint, fasteners, doors, or engines as visible).\n"
        f"{ctx_block}\n"
        "Assess visible exterior condition only. Do not invent damage not suggested by the image.\n"
        "Respond with ONLY a single JSON object (no markdown fences) using exactly these keys:\n"
        '- "issue_type": one of dent, crack, corrosion, paint_damage, no_issue (primary finding if any)\n'
        '- "confidence": number from 0 to 1 for your primary issue_type call\n'
        '- "flagged": boolean, true if any visible defect warrants a maintenance follow-up\n'
        '- "exterior_summary": one concise sentence on overall exterior status\n'
        '- "observed_details": 2–5 sentences on what is visible (surfaces, symmetry, paint, wear, '
        "and any plausible defects or clear no-defect assessment)\n"
    )


def analyze_frame_path(
    frame_path: str,
    *,
    run_id: str,
    settings: Settings,
    aircraft_context: str | None = None,
    aircraft_tail: str | None = None,
) -> dict:
    path = Path(frame_path)
    if not path.is_file():
        return stub_inspection_row(
            frame_path,
            run_id=run_id,
            notes=f"File not found: {frame_path}",
            aircraft_tail=aircraft_tail,
        )
    if not path.stat().st_size:
        return stub_inspection_row(
            frame_path,
            run_id=run_id,
            notes="Empty image file.",
            aircraft_tail=aircraft_tail,
        )

    api_key = (settings.gemini_api_key or "").strip()
    if not api_key:
        return stub_inspection_row(
            frame_path,
            run_id=run_id,
            notes="Gemini exterior analysis: set GEMINI_API_KEY in backend/.env and restart the API.",
            aircraft_tail=aircraft_tail,
        )

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return stub_inspection_row(
            frame_path,
            run_id=run_id,
            notes="google-genai is not installed. Run: pip install google-genai",
            aircraft_tail=aircraft_tail,
        )

    data = path.read_bytes()
    mime, _ = mimetypes.guess_type(str(path))
    if not mime or not mime.startswith("image/"):
        mime = "image/jpeg"
    prompt_text = _build_exterior_prompt(aircraft_context)

    client = genai.Client(api_key=api_key)
    try:
        response = client.models.generate_content(
            model=settings.gemini_vision_model,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_bytes(data=data, mime_type=mime),
                        types.Part.from_text(text=prompt_text),
                    ],
                )
            ],
        )
        text = (response.text or "").strip() if response.text is not None else ""
        if not text:
            raise ValueError("empty model response")
        parsed = parse_model_json_text(text)
    except Exception as e:
        row = {
            "id": str(uuid4()),
            "frame_path": frame_path,
            "timestamp": datetime.now(timezone.utc),
            "issue_type": "no_issue",
            "confidence": 0.0,
            "flagged": True,
            "run_id": run_id,
            "notes": f"Gemini exterior analysis failed: {e!s}",
        }
        if aircraft_tail and str(aircraft_tail).strip():
            row["aircraft_tail"] = str(aircraft_tail).strip().upper()
        return row

    issue_type = _normalize_issue_type(parsed.get("issue_type"))
    confidence = _clamp_confidence(parsed.get("confidence"))
    flagged = bool(parsed.get("flagged"))
    summary = str(parsed.get("exterior_summary") or "").strip()
    details = str(parsed.get("observed_details") or "").strip()
    notes_parts = [p for p in (summary, details) if p]
    notes = "\n\n".join(notes_parts) if notes_parts else "No textual summary returned."

    if issue_type != "no_issue" and confidence < 0.15:
        confidence = min(0.85, max(0.35, confidence + 0.25))

    return {
        "id": str(uuid4()),
        "frame_path": frame_path,
        "timestamp": datetime.now(timezone.utc),
        "issue_type": issue_type,
        "confidence": confidence,
        "flagged": flagged,
        "run_id": run_id,
        "notes": notes,
        **(
            {"aircraft_tail": str(aircraft_tail).strip().upper()}
            if aircraft_tail and str(aircraft_tail).strip()
            else {}
        ),
    }
