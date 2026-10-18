from fastapi import APIRouter

from app.api.v1.endpoints import health, leads, ai_chat

api_router = APIRouter()

api_router.include_router(
    health.router,
    prefix="/health",
    tags=["Health"]
)

api_router.include_router(
    leads.router,
    prefix="/leads",
    tags=["Leads"]
)

api_router.include_router(
    ai_chat.router,
    prefix="/ai",
    tags=["AI Chat"]
)