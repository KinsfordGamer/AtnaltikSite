from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from app.models.database import get_session
from app.models.models import User
from app.core.config import settings
from app.core import security

router = APIRouter()

@router.post("/login/access-token")
def login_access_token(
    session: Session = Depends(get_session),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """OAuth2 mos keluvchi token login, JWT token qaytaradi"""
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Email yoki parol xato")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, 
            expires_delta=access_token_expires,
            extra_claims={"is_admin": user.is_admin}
        ),
        "token_type": "bearer",
    }

@router.post("/register")
def register_user(
    *,
    session: Session = Depends(get_session),
    email: str,
    password: str,
    full_name: str = None
) -> Any:
    """Yangi foydalanuvchini ro'yxatdan o'tkazish"""
    user = session.exec(select(User).where(User.email == email)).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="Ushbu email bilan foydalanuvchi allaqachon mavjud",
        )
    
    # Birinchi foydalanuvchini admin qilish
    is_first_user = session.exec(select(User)).first() is None
    
    new_user = User(
        email=email,
        password_hash=security.get_password_hash(password),
        full_name=full_name,
        is_admin=is_first_user
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.get("/me")
def get_me(
    session: Session = Depends(get_session),
    request: Any = Depends(lambda r: r)
):
    from jose import jwt
    from fastapi import Request
    
    auth_header = None
    if isinstance(request, Request):
        auth_header = request.headers.get("Authorization")
        
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Avtorizatsiya tokeni topilmadi")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=401, detail="Yaroqsiz token")
    
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
        
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "username": user.username,
        "is_admin": user.is_admin,
        "telegram_id": user.telegram_id
    }
