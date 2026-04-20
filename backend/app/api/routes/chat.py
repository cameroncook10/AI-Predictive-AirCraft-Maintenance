"""
POST /api/chat — Gemini AI assistant endpoint.

Accepts a list of messages (with role + content) and an optional aircraft
tail number for context injection. Returns the model's reply as plain text.
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

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
    role: str   # 'user' or 'model'
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    aircraft_context: str | None = None   # optional JSON string of aircraft data


class ChatResponse(BaseModel):
    reply: str


def _build_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    return genai.Client(api_key=api_key)


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    client = _build_client()

    # Build history for multi-turn conversation
    history: list[types.Content] = []

    # Inject aircraft context as first user/model exchange if provided
    if req.aircraft_context:
        history.append(types.Content(
            role="user",
            parts=[types.Part(text=f"[AIRCRAFT CONTEXT]\n{req.aircraft_context}")]
        ))
        history.append(types.Content(
            role="model",
            parts=[types.Part(text="Understood. I have the aircraft data loaded and ready to assist.")]
        ))

    # Append the conversation messages
    for msg in req.messages:
        role = "user" if msg.role == "user" else "model"
        history.append(types.Content(
            role=role,
            parts=[types.Part(text=msg.content)]
        ))

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=history,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION),
        )
        return ChatResponse(reply=response.text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)}")
