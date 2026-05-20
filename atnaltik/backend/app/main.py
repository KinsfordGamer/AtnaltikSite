from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.models.database import init_db
from app.services.telegram import telegram_service
import asyncio

# --- API Endpoints ---
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS sozlamalari (Frontend uchun)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.services.bot import start_bot_worker

@app.on_event("startup")
async def startup_event():
    # 1. Bazani initsializatsiya qilish
    init_db()
    
    # 2. Telegram Bot Workerni ishga tushirish (Backgroundda)
    asyncio.create_task(start_bot_worker())
    print("Backend and Bot Worker startup complete.")

@app.get("/")
async def root():
    return {"message": "ATNALTIK DUBBING API v2.0 is running", "status": "ok"}

# Routerlarni ulash
app.include_router(api_router, prefix=settings.API_V1_STR)
