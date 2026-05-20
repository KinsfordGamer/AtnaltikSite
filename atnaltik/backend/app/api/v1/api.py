from fastapi import APIRouter
from app.api.v1.endpoints import anime, stream, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(anime.router, prefix="/animes", tags=["animes"])
api_router.include_router(stream.router, prefix="/stream", tags=["streaming"])
