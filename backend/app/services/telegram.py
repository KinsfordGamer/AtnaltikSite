import asyncio
from telethon import TelegramClient
from app.core.config import settings

class TelegramService:
    _instance = None
    client: TelegramClient = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TelegramService, cls).__new__(cls)
            cls._instance.client = TelegramClient(
                'atnaltik_v2_session', 
                settings.TELEGRAM_API_ID, 
                settings.TELEGRAM_API_HASH
            )
        return cls._instance

    async def start(self):
        if not self.client.is_connected():
            await self.client.start(bot_token=settings.TELEGRAM_BOT_TOKEN)
            print("Telethon Client (MTProto) Connected!")

    async def get_media(self, chat_id: str, message_id: int):
        """Telegramdan xabarni va undagi mediani olish"""
        try:
            # Chat ID numeric bo'lishi mumkin yoki username
            target = chat_id
            if chat_id.replace('-', '').isdigit():
                target = int(chat_id)
            
            msg = await self.client.get_messages(target, ids=message_id)
            if msg and msg.media:
                return msg.media
            return None
        except Exception as e:
            print(f"❌ Telegram Media Error: {e}")
            return None

telegram_service = TelegramService()
