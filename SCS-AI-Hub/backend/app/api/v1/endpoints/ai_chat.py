
import os
import time

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from google import genai
from pydantic import BaseModel

load_dotenv()

router = APIRouter()

api_key = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    if client is None:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_API_KEY is missing from the backend .env file.",
        )

    try:
        start_time = time.time()

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=(
                "You are the helpful AI assistant for SCS AI Hub, "
                "a business services company. Answer clearly and "
                "professionally. Do not invent company-specific facts. "
                "Reply in the same language as the user.\n\n"
                f"User: {request.message}"
            ),
        )

        elapsed_time = time.time() - start_time
        print(f"Gemini response time: {elapsed_time:.2f} seconds")

        if not response.text:
            raise ValueError("Gemini returned an empty response.")

        return ChatResponse(reply=response.text)

    except Exception as error:
        print(f"Gemini API error: {type(error).__name__}: {error}")
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error: {type(error).__name__}: {error}",
        ) from error
