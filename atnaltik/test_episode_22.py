#!/usr/bin/env python3
"""
Test streaming an episode that has chat_id and msg_id
"""
import os
import asyncio
import sqlite3
from dotenv import load_dotenv
from telethon import TelegramClient

load_dotenv()

api_id = os.environ.get('TELEGRAM_API_ID')
api_hash = os.environ.get('TELEGRAM_API_HASH')
bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')

DB_PATH = os.path.join(os.path.dirname(__file__), 'database/atnaltik.db')

async def test_working_episode():
    print("\n✅ WORKING EPISODE TEST")
    print("=" * 60)
    
    # Get episode 22 (should have chat_id and msg_id)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, title, telegram_chat_id, telegram_msg_id
        FROM episodes
        WHERE id = 22
    """)
    
    ep = cursor.fetchone()
    if not ep:
        print("❌ Episode 22 topilmadi!")
        conn.close()
        return
    
    ep_id = ep['id']
    title = ep['title']
    chat_id = ep['telegram_chat_id']
    msg_id = ep['telegram_msg_id']
    
    print(f"\nEpisode: {title} (ID: {ep_id})")
    print(f"Chat ID: {chat_id}")
    print(f"Msg ID: {msg_id}")
    
    # Test with Telethon
    client = TelegramClient('test_episode_session', int(api_id), api_hash)
    await client.start(bot_token=bot_token)
    
    print("\n🔄 Telethon orqali xabar olish...")
    
    try:
        target_chat = int(chat_id)
        msg = await client.get_messages(target_chat, ids=int(msg_id))
        
        if msg and msg.media:
            print(f"✅ Xabar topildi!")
            print(f"   Media type: {type(msg.media).__name__}")
            
            if hasattr(msg.media, 'document'):
                doc = msg.media.document
                print(f"   Fayl nomi: {doc.file_name}")
                print(f"   Fayl hajmi: {doc.size} bytes ({doc.size / 1024 / 1024:.2f} MB)")
                print(f"   Mime type: {doc.mime_type}")
                
                # Try to download a small chunk
                print(f"\n   🔄 Stream test - 1MB chunk yuklash...")
                chunk_data = await client.download_file(msg.media, file_size=1024*1024)
                chunk_bytes = b''
                async for chunk in chunk_data:
                    chunk_bytes += chunk
                    if len(chunk_bytes) >= 100*1024:  # 100KB
                        break
                
                print(f"   ✅ {len(chunk_bytes)} bytes successfully streamed!")
                print(f"\n🎉 VIDEO STREAM WORKING!\n")
            else:
                print(f"   ⚠️ Document emas!")
        else:
            print(f"❌ Xabar topilmadi yoki media yo'q")
            
    except Exception as e:
        print(f"❌ Xato: {e}")
        import traceback
        traceback.print_exc()
    
    await client.disconnect()
    conn.close()

asyncio.run(test_working_episode())
