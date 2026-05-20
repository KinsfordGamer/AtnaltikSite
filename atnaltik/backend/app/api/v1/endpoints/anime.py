from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.models.database import get_session
from app.models.models import Anime, Genre, Season, Episode

router = APIRouter()

@router.get("/", response_model=List[Anime])
def read_animes(
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = Query(default=20, lte=100),
    search: Optional[str] = None
):
    statement = select(Anime)
    if search:
        statement = statement.where(Anime.title.contains(search))
    
    statement = statement.offset(offset).limit(limit).order_by(Anime.created_at.desc())
    results = session.exec(statement).all()
    return results

@router.get("/{anime_id}")
def read_anime(anime_id: int, session: Session = Depends(get_session)):
    anime = session.get(Anime, anime_id)
    if not anime:
        raise HTTPException(status_code=404, detail="Anime topilmadi")
    
    # Season va episodlarni yuklash
    # SQLModel relationship orqali avtomatik ishlaydi
    return {
        **anime.dict(),
        "genres": anime.genres,
        "seasons": [
            {
                **season.dict(),
                "episodes": season.episodes
            } for season in anime.seasons
        ]
    }

@router.get("/genres/", response_model=List[Genre])
def read_genres(session: Session = Depends(get_session)):
    return session.exec(select(Genre)).all()

@router.post("/", response_model=Anime)
def create_anime(anime: Anime, session: Session = Depends(get_session)):
    session.add(anime)
    session.commit()
    session.refresh(anime)
    return anime

@router.post("/episodes/", response_model=Episode)
def create_episode(episode: Episode, session: Session = Depends(get_session)):
    session.add(episode)
    session.commit()
    session.refresh(episode)
    return episode
