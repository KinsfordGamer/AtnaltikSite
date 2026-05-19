from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlmodel import Session, select
from app.models.database import get_session
from app.models.models import Episode, PendingVideo
from app.services.telegram import telegram_service
from app.services.streaming import streaming_service
from app.core.config import settings
import requests

router = APIRouter()

@router.get("/{episode_id}")
async def stream_episode(
    episode_id: int,
    request: Request,
    range: str = Header(None),
    session: Session = Depends(get_session)
):
    """
    Episode ID orqali videoni Telegramdan stream qilish.
    """
    # 1. Bazadan epizod ma'lumotlarini olish
    episode = session.get(Episode, episode_id)
    print(f"DEBUG: [FastAPI] Striming so'rovi keldi. Epizod ID: {episode_id}")
    
    if not episode:
        print(f"DEBUG: [FastAPI] Epizod topilmadi: {episode_id}")
        raise HTTPException(status_code=404, detail="Epizod topilmadi")

    file_id = episode.telegram_file_id
    chat_id = episode.telegram_chat_id
    msg_id = episode.telegram_msg_id

    # --- AUTO-RESOLVE FILE_ID TO CHAT_ID/MSG_ID ---
    if file_id and not (chat_id and msg_id):
        print(f"DEBUG: [FastAPI] [{episode_id}] Auto-resolving file_id...")
        # 1. Check PendingVideo
        stmt = select(PendingVideo).where(PendingVideo.file_id == file_id)
        row = session.exec(stmt).first()
        if row and row.chat_id and row.message_id:
            chat_id = row.chat_id
            msg_id = row.message_id
            episode.telegram_chat_id = chat_id
            episode.telegram_msg_id = msg_id
            session.add(episode)
            session.commit()
            session.refresh(episode)
            print(f"DEBUG: [FastAPI] [{episode_id}] Found in pending_videos!")
        
        # 2. Force resolve by sending to ADMIN_CHAT_ID
        if not (chat_id and msg_id):
            admin_id = settings.ADMIN_CHAT_ID
            bot_token_api = settings.TELEGRAM_BOT_TOKEN
            if admin_id and bot_token_api:
                print(f"DEBUG: [FastAPI] [{episode_id}] Sending to ADMIN_CHAT_ID to get msg_id...")
                try:
                    url = f"https://api.telegram.org/bot{bot_token_api}/sendDocument"
                    payload = {'chat_id': admin_id, 'document': file_id, 'disable_notification': True}
                    resp = requests.post(url, json=payload, timeout=10).json()
                    if resp.get('ok'):
                        chat_id = str(admin_id)
                        msg_id = resp['result']['message_id']
                        episode.telegram_chat_id = chat_id
                        episode.telegram_msg_id = msg_id
                        session.add(episode)
                        
                        # Save to PendingVideo
                        pending = PendingVideo(file_id=file_id, chat_id=chat_id, message_id=msg_id)
                        session.add(pending)
                        
                        session.commit()
                        session.refresh(episode)
                        print(f"DEBUG: [FastAPI] [{episode_id}] Resolved via sendDocument! MsgID: {msg_id}")
                except Exception as e:
                    print(f"Auto-resolve error: {e}")

    if not chat_id or not msg_id:
        print(f"DEBUG: [FastAPI] Telegram ma'lumotlari yetishmayapti: {episode_id}")
        raise HTTPException(status_code=400, detail="Ushbu epizod uchun video bog'lanmagan")

    # 2. Telegramdan mediani olish
    print(f"DEBUG: [FastAPI] Telegramdan media olinmoqda... Chat: {chat_id}, Msg: {msg_id}")
    media = await telegram_service.get_media(chat_id, msg_id)
    
    # Self-healing Fallback 1: Check pending_videos
    if not media and file_id:
        print(f"DEBUG: [FastAPI] [{episode_id}] Media topilmadi. pending_videos orqali self-healing urinish...")
        stmt = select(PendingVideo).where(PendingVideo.file_id == file_id)
        row = session.exec(stmt).first()
        if row and row.chat_id and row.message_id and (int(row.message_id) != int(msg_id or 0) or str(row.chat_id) != str(chat_id or '')):
            chat_id = row.chat_id
            msg_id = row.message_id
            episode.telegram_chat_id = chat_id
            episode.telegram_msg_id = msg_id
            session.add(episode)
            session.commit()
            session.refresh(episode)
            print(f"DEBUG: [FastAPI] [{episode_id}] pending_videos dan yangi ma'lumotlar topildi! Chat: {chat_id}, Msg: {msg_id}")
            media = await telegram_service.get_media(chat_id, msg_id)

    # Self-healing Fallback 2: Force re-resolve by sending to ADMIN_CHAT_ID
    if not media and file_id:
        admin_id = settings.ADMIN_CHAT_ID
        bot_token_api = settings.TELEGRAM_BOT_TOKEN
        if admin_id and bot_token_api:
            print(f"DEBUG: [FastAPI] [{episode_id}] Hali ham topilmadi. ADMIN_CHAT_ID ga yuborib qayta resolve qilish...")
            try:
                url = f"https://api.telegram.org/bot{bot_token_api}/sendDocument"
                payload = {'chat_id': admin_id, 'document': file_id, 'disable_notification': True}
                resp = requests.post(url, json=payload, timeout=10).json()
                if resp.get('ok'):
                    chat_id = str(admin_id)
                    msg_id = resp['result']['message_id']
                    
                    episode.telegram_chat_id = chat_id
                    episode.telegram_msg_id = msg_id
                    session.add(episode)
                    
                    # Update/Insert PendingVideo
                    pending = session.exec(select(PendingVideo).where(PendingVideo.file_id == file_id)).first()
                    if pending:
                        pending.chat_id = chat_id
                        pending.message_id = msg_id
                        session.add(pending)
                    else:
                        pending = PendingVideo(file_id=file_id, chat_id=chat_id, message_id=msg_id)
                        session.add(pending)
                        
                    session.commit()
                    session.refresh(episode)
                    print(f"DEBUG: [FastAPI] [{episode_id}] Qayta yuborish orqali hal qilindi! Yangi MsgID: {msg_id}")
                    media = await telegram_service.get_media(chat_id, msg_id)
            except Exception as e:
                print(f"DEBUG: Qayta resolve qilishda xato: {e}")

    if not media:
        print(f"DEBUG: [FastAPI] Telegramda media topilmadi!")
        raise HTTPException(status_code=404, detail="Telegramda video topilmadi")

    print(f"DEBUG: [FastAPI] Media topildi! Striming boshlanmoqda...")

    # 3. Streaming Response qaytarish
    return await streaming_service.get_video_stream(media, range)
