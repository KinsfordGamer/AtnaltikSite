from telethon import events
from app.services.telegram import telegram_service
from app.models.database import engine
from app.models.models import PendingVideo
from sqlmodel import Session
import os

async def start_bot_worker():
    """
    Telegram kanalni kuzatuvchi bot.
    Admin videoni kanalga tashlasa, bot uni tutib oladi va bazaga saqlaydi.
    """
    await telegram_service.start()
    client = telegram_service.client

    @client.on(events.NewMessage(pattern='/start'))
    async def start_handler(event):
        await event.reply("Salom! Men Atnaltik Dubbing botiman. Menga video yuborsangiz, uni saytga qo'shish uchun bazaga saqlayman.")

    @client.on(events.NewMessage)
    async def handle_new_message(event):
        # Faqat video yoki hujjat (video) bo'lsa
        if event.message.video or (event.message.document and event.message.document.mime_type.startswith('video/')):
            
            # Ma'lumotlarni bazaga saqlash
            with Session(engine) as session:
                pending = PendingVideo(
                    file_id=str(event.message.id), # MTProto uchun msg_id muhim
                    chat_id=str(event.chat_id),
                    message_id=event.message.id,
                    caption=event.message.text or ""
                )
                session.add(pending)
                session.commit()
                
            print(f"📥 Yangi video tutildi: {event.message.id} (Chat: {event.chat_id})")
            
            # Admin xabar yuborish (ixtiyoriy)
            await event.reply(f"✅ Video bazaga qo'shildi!\nID: `{event.message.id}`\nChat: `{event.chat_id}`")

    print("Telegram Bot Worker started...")
    await client.run_until_disconnected()
