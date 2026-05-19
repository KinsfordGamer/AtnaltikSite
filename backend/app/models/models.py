from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

# --- USERS ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    full_name: str
    username: Optional[str] = None
    telegram_id: Optional[str] = Field(default=None, unique=True)
    is_admin: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- GENRES ---
class AnimeGenreLink(SQLModel, table=True):
    anime_id: Optional[int] = Field(default=None, foreign_key="anime.id", primary_key=True)
    genre_id: Optional[int] = Field(default=None, foreign_key="genre.id", primary_key=True)

class Genre(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    icon: str = "🎭"
    color: str = "rgba(100,100,100,0.15)"
    
    animes: List["Anime"] = Relationship(back_populates="genres", link_model=AnimeGenreLink)

# --- ANIMES ---
class Anime(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    original_title: Optional[str] = None
    icon: str = "🎬"
    score: float = 0.0
    status: str = "Davom etmoqda"
    year: int = 2024
    description: str = ""
    cover_image: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    genres: List[Genre] = Relationship(back_populates="animes", link_model=AnimeGenreLink)
    seasons: List["Season"] = Relationship(back_populates="anime", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

# --- SEASONS ---
class Season(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    anime_id: int = Field(foreign_key="anime.id")
    title: str
    year: int = 2024
    order_num: int = 1
    
    anime: Anime = Relationship(back_populates="seasons")
    episodes: List["Episode"] = Relationship(back_populates="season", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

# --- EPISODES ---
class Episode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    season_id: int = Field(foreign_key="season.id")
    anime_id: int = Field(foreign_key="anime.id")
    num: int = 1
    title: str
    duration: str = "24 dq"
    
    # Telegram Data
    telegram_file_id: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    telegram_msg_id: Optional[int] = None
    
    is_new: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    season: Season = Relationship(back_populates="episodes")

# --- PENDING VIDEOS ---
class PendingVideo(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    file_id: str
    chat_id: Optional[str] = None
    message_id: Optional[int] = None
    caption: Optional[str] = None
    processed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
