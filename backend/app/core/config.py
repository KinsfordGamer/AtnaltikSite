import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "ATNALTIK DUBBING"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    
    DATABASE_URL: str
    
    TELEGRAM_API_ID: int
    TELEGRAM_API_HASH: str
    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_BOT_USERNAME: str = "ATNALTIK"
    ADMIN_CHAT_ID: str = ""
    
    CHUNK_SIZE: int = 524288  # 512KB for streaming
    CACHE_TTL: int = 3600
    
    model_config = SettingsConfigDict(env_file=os.path.join(os.getcwd(), ".env"))

settings = Settings()
