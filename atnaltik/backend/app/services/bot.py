from telethon import events
from app.services.telegram import telegram_service
from app.models.database import engine
from app.models.models import PendingVideo, User, Anime, Season, Episode
from app.core.security import get_password_hash, verify_password
from sqlmodel import Session, select
import os
import asyncio

# Admin session tracking for dialogs/state machine
ADMIN_SESSIONS = {}

def get_session_state(sender_id):
    if sender_id not in ADMIN_SESSIONS:
        ADMIN_SESSIONS[sender_id] = {
            "state": None,
            "login": None,
            "anime_title": None,
            "anime_desc": None,
            "anime_cover": None,
            "anime_year": None,
            "video_chat_id": None,
            "video_msg_id": None,
            "episode_anime_id": None,
            "episode_season_num": None,
            "episode_num": None
        }
    return ADMIN_SESSIONS[sender_id]

def clear_session_state(sender_id):
    if sender_id in ADMIN_SESSIONS:
        del ADMIN_SESSIONS[sender_id]

def is_sender_admin(sender_id):
    if not sender_id:
        return False
    with Session(engine) as session:
        user = session.exec(
            select(User).where(User.telegram_id == str(sender_id), User.is_admin == True)
        ).first()
        return user is not None

async def start_bot_worker():
    """
    Telegram admin panel bot.
    Allows admins to login, manage, and add anime/episodes directly via Telegram chat.
    """
    await telegram_service.start()
    client = telegram_service.client

    # 1. /start command
    @client.on(events.NewMessage(pattern='/start'))
    async def start_handler(event):
        sender_id = event.sender_id
        if is_sender_admin(sender_id):
            await event.reply(
                "👋 Salom, Admin! Tizimga kirgansiz.\n\n"
                "Quyidagi buyruqlarni ishlatishingiz mumkin:\n"
                "➕ /add_anime - Yangi anime yaratish\n"
                "➕ /add_admin <login> <parol> - Yangi admin qo'shish\n"
                "🎬 Shunchaki video fayl yuboring - epizod qo'shishni boshlash uchun."
            )
        else:
            await event.reply(
                "Salom! Men Atnaltik Dubbing botiman.\n"
                "Admin panelga kirish uchun `/admin` buyrug'ini yuboring."
            )

    # 2. /admin command
    @client.on(events.NewMessage(pattern='/admin'))
    async def admin_handler(event):
        sender_id = event.sender_id
        if is_sender_admin(sender_id):
            await event.reply(
                "👋 Siz allaqachon admin sifatida tizimdasiz!\n\n"
                "Buyruqlar:\n"
                "➕ /add_anime - Yangi anime qo'shish\n"
                "➕ /add_admin <login> <parol> - Yangi admin qo'shish\n"
                "🎬 Video fayl yuboring - epizod qo'shish uchun."
            )
            return

        session_state = get_session_state(sender_id)
        session_state["state"] = "AWAITING_LOGIN"
        await event.reply("🔐 *Admin Panelga kirish*\n\nLoginingizni kiriting:")

    # 3. /cancel command
    @client.on(events.NewMessage(pattern='/cancel'))
    async def cancel_handler(event):
        sender_id = event.sender_id
        clear_session_state(sender_id)
        await event.reply("❌ Amallar bekor qilindi.")

    # 4. /add_admin command
    @client.on(events.NewMessage(pattern=r'/add_admin\s+(\S+)\s+(\S+)'))
    async def add_admin_handler(event):
        sender_id = event.sender_id
        if not is_sender_admin(sender_id):
            await event.reply("❌ Bu buyruqdan foydalanish uchun bot admini bo'lishingiz kerak.")
            return

        login = event.pattern_match.group(1)
        password = event.pattern_match.group(2)

        with Session(engine) as session:
            exists = session.exec(
                select(User).where((User.username == login) | (User.email == login))
            ).first()
            if exists:
                await event.reply("❌ Bunday loginli foydalanuvchi allaqachon mavjud.")
                return

            new_user = User(
                email=f"{login}@atnaltik.com",
                username=login,
                full_name=f"Admin {login}",
                password_hash=get_password_hash(password),
                is_admin=True
            )
            session.add(new_user)
            session.commit()

        await event.reply(
            f"✅ Yangi admin muvaffaqiyatli qo'shildi!\n"
            f"👤 Login: `{login}`\n"
            f"🔑 Parol: `{password}`\n\n"
            f"Ushbu admin Telegram botda `/admin` buyrug'i orqali ro'yxatdan o'tishi mumkin."
        )

    # Helper command for help add_admin
    @client.on(events.NewMessage(pattern=r'/add_admin$'))
    async def add_admin_help_handler(event):
        if not is_sender_admin(event.sender_id):
            await event.reply("❌ Bu buyruqdan foydalanish uchun admin huquqi kerak.")
            return
        await event.reply("Format: `/add_admin <login> <parol>`")

    # 5. /add_anime command
    @client.on(events.NewMessage(pattern='/add_anime'))
    async def add_anime_command(event):
        sender_id = event.sender_id
        if not is_sender_admin(sender_id):
            await event.reply("❌ Bu buyruqdan foydalanish uchun avval tizimga kiring: `/admin`")
            return

        session_state = get_session_state(sender_id)
        session_state["state"] = "ADD_ANIME_TITLE"
        await event.reply("📝 *Yangi Anime Qo'shish*\n\nAnime nomini kiriting:")

    # 6. Video messages (Episode addition)
    @client.on(events.NewMessage)
    async def handle_new_message(event):
        sender_id = event.sender_id
        
        # O'zimizning / commands bypass qilamiz
        text = event.message.text or ""
        if text.startswith('/'):
            return

        session_state = get_session_state(sender_id)
        state = session_state["state"]

        # --- AWAITING AUTHENTICATION FLOW ---
        if state == "AWAITING_LOGIN":
            session_state["login"] = text.strip()
            session_state["state"] = "AWAITING_PASSWORD"
            await event.reply("🔑 Parolni kiriting:")
            return

        elif state == "AWAITING_PASSWORD":
            login = session_state["login"]
            password = text.strip()
            
            # Default asilbek123 credentials check, or DB match
            authenticated = False
            user_to_auth = None

            if login == "asilbek123" and password == "asilbekatt1":
                authenticated = True
            else:
                # DB check
                with Session(engine) as session:
                    db_user = session.exec(
                        select(User).where((User.username == login) | (User.email == login))
                    ).first()
                    if db_user and verify_password(password, db_user.password_hash):
                        authenticated = True
                        user_to_auth = db_user

            if authenticated:
                with Session(engine) as session:
                    if user_to_auth:
                        user_to_auth.telegram_id = str(sender_id)
                        user_to_auth.is_admin = True
                        session.add(user_to_auth)
                    else:
                        # Find or create asilbek123
                        existing_asilbek = session.exec(
                            select(User).where((User.username == "asilbek123") | (User.email == "asilbek123@atnaltik.com"))
                        ).first()
                        if existing_asilbek:
                            existing_asilbek.telegram_id = str(sender_id)
                            existing_asilbek.is_admin = True
                            session.add(existing_asilbek)
                        else:
                            new_admin = User(
                                email="asilbek123@atnaltik.com",
                                username="asilbek123",
                                full_name="Asilbek Admin",
                                password_hash=get_password_hash("asilbekatt1"),
                                telegram_id=str(sender_id),
                                is_admin=True
                            )
                            session.add(new_admin)
                    session.commit()
                
                clear_session_state(sender_id)
                await event.reply(
                    "✅ *Muvaffaqiyatli kirdingiz!*\n"
                    "Endi siz bot orqali saytni boshqara olasiz.\n\n"
                    "Buyruqlar:\n"
                    "➕ /add_anime - Yangi anime qo'shish\n"
                    "➕ /add_admin <login> <parol> - Yangi admin qo'shish\n"
                    "🎬 Video yuboring - epizod qo'shish uchun."
                )
            else:
                clear_session_state(sender_id)
                await event.reply("❌ Login yoki parol xato. Qayta urinish uchun `/admin` deb yozing.")
            return

        # --- ADD ANIME FLOW ---
        elif state == "ADD_ANIME_TITLE":
            session_state["anime_title"] = text.strip()
            session_state["state"] = "ADD_ANIME_DESC"
            await event.reply("📝 Anime haqida qisqacha tavsif (description) kiriting:")
            return

        elif state == "ADD_ANIME_DESC":
            session_state["anime_desc"] = text.strip()
            session_state["state"] = "ADD_ANIME_COVER"
            await event.reply("🖼 Cover rasm havolasini (URL) kiriting:")
            return

        elif state == "ADD_ANIME_COVER":
            session_state["anime_cover"] = text.strip()
            session_state["state"] = "ADD_ANIME_YEAR"
            await event.reply("📅 Anime yili kiriting (masalan, 2024):")
            return

        elif state == "ADD_ANIME_YEAR":
            try:
                year = int(text.strip())
            except ValueError:
                year = 2024
            
            title = session_state["anime_title"]
            desc = session_state["anime_desc"]
            cover = session_state["anime_cover"]

            with Session(engine) as session:
                new_anime = Anime(
                    title=title,
                    description=desc,
                    cover_image=cover,
                    year=year,
                    status="Davom etmoqda",
                    score=8.5,
                    icon="🎬"
                )
                session.add(new_anime)
                session.commit()
                session.refresh(new_anime)

                # Default Season 1 yaratamiz
                new_season = Season(
                    anime_id=new_anime.id,
                    title="1-fasl",
                    year=year,
                    order_num=1
                )
                session.add(new_season)
                session.commit()

            clear_session_state(sender_id)
            await event.reply(
                f"✅ *Anime yaratildi!*\n"
                f"🎬 ID: `{new_anime.id}`\n"
                f"📌 Nomi: {new_anime.title}\n"
                f"📅 Yili: {new_anime.year}\n"
                f"📂 Avtomatik tarzda `1-fasl` ham yaratildi."
            )
            return

        # --- ADD EPISODE FLOW (STATEFUL) ---
        elif state == "ADD_EPISODE_ANIME":
            try:
                anime_id = int(text.strip())
                with Session(engine) as session:
                    anime = session.get(Anime, anime_id)
                    if not anime:
                        await event.reply("❌ Bunday ID ga ega anime topilmadi. Qayta ID kiriting:")
                        return
                session_state["episode_anime_id"] = anime_id
                session_state["state"] = "ADD_EPISODE_SEASON"
                await event.reply("🔢 Fasl (Season) raqamini kiriting (masalan, 1):")
            except ValueError:
                await event.reply("❌ Iltimos, raqam kiriting (Anime ID):")
            return

        elif state == "ADD_EPISODE_SEASON":
            try:
                season_num = int(text.strip())
                session_state["episode_season_num"] = season_num
                session_state["state"] = "ADD_EPISODE_NUM"
                await event.reply("🔢 Epizod raqamini kiriting (masalan, 1):")
            except ValueError:
                await event.reply("❌ Iltimos, raqam kiriting (Fasl raqami):")
            return

        elif state == "ADD_EPISODE_NUM":
            try:
                ep_num = int(text.strip())
                session_state["episode_num"] = ep_num
                session_state["state"] = "ADD_EPISODE_TITLE"
                await event.reply("📝 Epizod nomini kiriting (masalan, '1-qism' yoki 'Boshlanish'):")
            except ValueError:
                await event.reply("❌ Iltimos, raqam kiriting (Epizod raqami):")
            return

        elif state == "ADD_EPISODE_TITLE":
            ep_title = text.strip()
            
            chat_id = session_state["video_chat_id"]
            msg_id = session_state["video_msg_id"]
            anime_id = session_state["episode_anime_id"]
            season_num = session_state["episode_season_num"]
            ep_num = session_state["episode_num"]

            with Session(engine) as db_session:
                # Faslni qidiramiz yoki yaratamiz
                season = db_session.exec(
                    select(Season).where(Season.anime_id == anime_id, Season.order_num == season_num)
                ).first()
                
                if not season:
                    season = Season(
                        anime_id=anime_id,
                        title=f"{season_num}-fasl",
                        order_num=season_num,
                        year=2024
                    )
                    db_session.add(season)
                    db_session.commit()
                    db_session.refresh(season)

                new_ep = Episode(
                    season_id=season.id,
                    anime_id=anime_id,
                    num=ep_num,
                    title=ep_title,
                    duration="24 dq",
                    telegram_chat_id=str(chat_id),
                    telegram_msg_id=msg_id,
                    telegram_file_id=str(msg_id),
                    is_new=True
                )
                db_session.add(new_ep)
                
                # Shuningdek PendingVideo ga ham yozib qo'yamiz
                pending = PendingVideo(
                    file_id=str(msg_id),
                    chat_id=str(chat_id),
                    message_id=msg_id,
                    caption=ep_title,
                    processed=True
                )
                db_session.add(pending)
                
                db_session.commit()

            clear_session_state(sender_id)
            await event.reply(
                f"✅ *Epizod saytga muvaffaqiyatli joylandi!*\n\n"
                f"🎬 Anime ID: `{anime_id}`\n"
                f"🔢 Fasl: `{season_num}`\n"
                f"🔢 Epizod №: `{ep_num}`\n"
                f"📝 Nomi: `{ep_title}`\n"
                f"📹 Message ID: `{msg_id}`"
            )
            return

        # --- DETECT VIDEO OR DOCUMENT (EPISODE ADDITION INITIATION) ---
        if event.message.video or (event.message.document and event.message.document.mime_type.startswith('video/')):
            if not is_sender_admin(sender_id):
                await event.reply("❌ Siz bot admini emassiz! Tizimga kirish uchun `/admin` buyrug'ini yuboring.")
                return

            # Yangi epizod yozishni boshlaymiz
            session_state = get_session_state(sender_id)
            session_state["state"] = "ADD_EPISODE_ANIME"
            session_state["video_chat_id"] = str(event.chat_id)
            session_state["video_msg_id"] = event.message.id

            # So'rov yuboramiz va mavjud animelar ro'yxatini chiqaramiz
            with Session(engine) as session:
                animes = session.exec(select(Anime).order_by(Anime.id.desc()).limit(10)).all()
            
            anime_list_text = ""
            if animes:
                anime_list_text = "\n\n*Oxirgi qo'shilgan animelar:*\n"
                for a in animes:
                    anime_list_text += f"ID: `{a.id}` - {a.title}\n"
            else:
                anime_list_text = "\n\n(Tizimda hali animelar mavjud emas. Avval `/add_anime` orqali anime qo'shing.)"

            await event.reply(
                f"🎬 *Yangi video qabul qilindi!*\n\n"
                f"Iltimos, ushbu video qaysi Anime ID ga tegishli ekanligini kiriting:{anime_list_text}\n\n"
                f"Yoki bekor qilish uchun `/cancel` deb yozing."
            )

    print("Telegram Bot Worker with Admin Panel fully started...")
    await client.run_until_disconnected()
