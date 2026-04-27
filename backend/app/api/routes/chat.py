"""
POST /api/chat — Google Gemini (AeroMind AI assistant).
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import Settings, get_settings

router = APIRouter()

SYSTEM_INSTRUCTION = (
    "You are AeroMind AI, an expert aircraft maintenance assistant embedded in the "
    "AeroMind Ground Ops platform. You help aviation maintenance technicians and engineers "
    "interpret inspection results, understand defect types (dents, cracks, corrosion, "
    "paint damage), review work orders, assess risk factors, and advise on maintenance "
    "procedures. Always be concise, precise, and safety-focused. When referencing "
    "specific aircraft data provided in the conversation, use it to give tailored advice. "
    "Use aviation terminology appropriately."
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    aircraft_context: str | None = None


class ChatResponse(BaseModel):
    reply: str


def _demo_reply() -> ChatResponse:
    return ChatResponse(
        reply=(
            "[Demo mode — set GEMINI_API_KEY in backend/.env and install google-genai for live AeroMind AI.] "
            "I would normally analyze your question using the selected aircraft context. "
            "Until then, use the dashboard panels for health, alerts, and manuals."
        )
    )


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, settings: Annotated[Settings, Depends(get_settings)]):
    api_key = (settings.gemini_api_key or "").strip()
    if not api_key:
        return _demo_reply()

    try:
        from google import genai
        from google.genai import types
    except ImportError:
        return _demo_reply()

    client = genai.Client(api_key=api_key)

    history: list[Any] = []

    if req.aircraft_context:
        history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=f"[AIRCRAFT CONTEXT]\n{req.aircraft_context}")],
            )
        )
        history.append(
            types.Content(
                role="model",
                parts=[types.Part(text="Understood. I have the aircraft data loaded and ready to assist.")],
            )
        )

    for msg in req.messages:
        role = "user" if msg.role == "user" else "model"
        history.append(
            types.Content(
                role=role,
                parts=[types.Part(text=msg.content)],
            )
        )

    try:
        response = client.models.generate_content(
            model=settings.gemini_vision_model,
            contents=history,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION),
        )
        return ChatResponse(reply=(response.text or "") if response.text is not None else "")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}") from e
