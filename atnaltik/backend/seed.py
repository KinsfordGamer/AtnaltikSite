from sqlmodel import Session, create_engine, select
from app.models.models import Anime, Genre, Season, Episode, AnimeGenreLink
from app.core.config import settings

from app.models.database import engine, init_db

def seed():
    # Jadvallarni yaratish
    init_db()
    
    with Session(engine) as session:
        # 1. Janrlar yaratish
        action = Genre(name="Aksiya", icon="⚔️", color="rgba(230,57,70,0.15)")
        fantasy = Genre(name="Fantastika", icon="✨", color="rgba(156,39,176,0.15)")
        drama = Genre(name="Drama", icon="💔", color="rgba(244,67,54,0.12)")
        
        session.add_all([action, fantasy, drama])
        session.commit()

        # 2. Anime yaratish
        demon_slayer = Anime(
            title="Demon Slayer: Kimetsu no Yaiba",
            original_title="鬼滅の刃",
            icon="🏮",
            score=8.7,
            status="Tugallangan",
            year=2019,
            description="Tanjiro Kamado oilasi jin tomonidan o'ldirilgandan so'ng, tiriq qolgan singlisini insonga qaytarish uchun Jin qiruvchilar safiga qo'shiladi.",
            cover_image="https://images.alphacoders.com/132/1328328.jpeg"
        )
        
        # Janrlarni bog'lash
        demon_slayer.genres = [action, fantasy, drama]
        session.add(demon_slayer)
        session.commit()

        # 3. Fasl yaratish
        season1 = Season(
            anime_id=demon_slayer.id,
            title="1-fasl",
            year=2019,
            order_num=1
        )
        session.add(season1)
        session.commit()

        # 4. Epizodlar yaratish (Sizning Telegram ma'lumotlaringiz asosida)
        # Eslatma: Bu yerda Chat ID va Msg ID sizning kanalingizdan bo'lishi kerak
        ep1 = Episode(
            season_id=season1.id,
            anime_id=demon_slayer.id,
            num=1,
            title="Yovuzlik uyg'ondi",
            duration="24 dq",
            telegram_chat_id="7618637796", # Test uchun sizning ID
            telegram_msg_id=110,           # Test uchun msg ID
            is_new=True
        )
        session.add(ep1)
        session.commit()

        print("✅ Ma'lumotlar muvaffaqiyatli qo'shildi!")

if __name__ == "__main__":
    seed()
