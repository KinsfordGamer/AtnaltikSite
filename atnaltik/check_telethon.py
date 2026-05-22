#!/usr/bin/env python3
"""
Telethon Client Status Check
"""
import os
import sys
import asyncio
from dotenv import load_dotenv
from telethon import TelegramClient

load_dotenv()

api_id = os.environ.get('TELEGRAM_API_ID')
api_hash = os.environ.get('TELEGRAM_API_HASH')
bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')

print("\n=== TELETHON CLIENT STATUS ===\n")

print(f"✓ API_ID: {api_id if api_id else '❌ TOPILMADI'}")
print(f"✓ API_HASH: {api_hash[:10]}*** " if api_hash else "❌ TOPILMADI")
print(f"✓ BOT_TOKEN: {bot_token[-20:]}" if bot_token else "❌ TOPILMADI")

if not all([api_id, api_hash, bot_token]):
    print("\n❌ Telethon uchun kerakli ma'lumotlar to'liq emas!")
    sys.exit(1)

print("\n🔄 Telethon client-ni tekshirilmoqda...")

async def check_client():
    try:
        client = TelegramClient('check_session', int(api_id), api_hash)
        await client.start(bot_token=bot_token)
        
        if client.is_connected():
            print("✅ Telethon client ulandiiii!")
            me = await client.get_me()
            print(f"   Bot nomi: @{me.username}")
            print(f"   Bot ID: {me.id}")
            
            # Check if we can get messages from a chat
            try:
                # Try to get dialogs
                dialogs = await client.get_dialogs(limit=1)
                print(f"✅ Client ma'lumotlarni o'qiy oladi (dialogs: {len(dialogs)})")
            except Exception as e:
                print(f"⚠️  Dialogs xatosi: {e}")
            
            await client.disconnect()
            print("\n✅ Telethon to'g'ri ishlayapdi!")
        else:
            print("❌ Telethon client ulanmadi!")
            
    except Exception as e:
        print(f"❌ Telethon xatosi: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(check_client())
