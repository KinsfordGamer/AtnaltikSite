#!/usr/bin/env python3
"""
Test Video Streaming - Simulate a stream request
"""
import os
import sys
import asyncio
from dotenv import load_dotenv
from telethon import TelegramClient
import sqlite3

load_dotenv()

api_id = os.environ.get('TELEGRAM_API_ID')
api_hash = os.environ.get('TELEGRAM_API_HASH')
bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
admin_chat_id = os.environ.get('ADMIN_CHAT_ID')

DB_PATH = os.path.join(os.path.dirname(__file__), 'database/atnaltik.db')

async def test_stream():
    print("\n=== VIDEO STREAM TEST ===\n")
    
    # Get first episode
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, title, telegram_file_id, telegram_chat_id, telegram_msg_id
        FROM episodes 
        WHERE telegram_file_id IS NOT NULL AND telegram_file_id != ''
        LIMIT 1
    """)
    
    episode = cursor.fetchone()
    if not episode:
        print("❌ Database-da episode yo'q!")
        conn.close()
        return
    
    ep_id = episode['id']
    file_id = episode['telegram_file_id']
    chat_id = episode['telegram_chat_id']
    msg_id = episode['telegram_msg_id']
    
    print(f"Episode: {episode['title']} (ID: {ep_id})")
    print(f"FileID: {file_id[:30]}...")
    print(f"ChatID: {chat_id}, MsgID: {msg_id}")
    
    conn.close()
    
    # Create Telethon client
    client = TelegramClient('stream_test_session', int(api_id), api_hash)
    await client.start(bot_token=bot_token)
    
    print("\n🔄 Test 1: Existing chat_id/msg_id bo'lsa...")
    if chat_id and msg_id:
        try:
            target_chat = int(chat_id)
            msg = await client.get_messages(target_chat, ids=int(msg_id))
            if msg and msg.media:
                print(f"✅ Xabar topildi! Media: {type(msg.media)}")
                
                # Try to get file size
                if hasattr(msg.media, 'document'):
                    size = msg.media.document.size
                    mime = msg.media.document.mime_type
                    print(f"   Fayl: {size} bytes, Mime: {mime}")
                elif hasattr(msg.media, 'size'):
                    size = msg.media.size
                    print(f"   Fayl: {size} bytes")
            else:
                print("❌ Media topilmadi yoki xabar o'chirilgan")
        except Exception as e:
            print(f"❌ Xabar olishda xato: {e}")
    else:
        print("⚠️  Chat_id va msg_id yo'q - auto-resolution kerak")
        
        print("\n🔄 Test 2: Admin chat-ga yuborish orqali auto-resolve...")
        try:
            # Send to admin chat to get new msg_id
            msg = await client.send_file(
                int(admin_chat_id),
                file_id,
                caption="Auto-resolve test",
                force_document=True
            )
            print(f"✅ Xabar yuborildi! Chat: {admin_chat_id}, MsgID: {msg.id}")
            
            # Try to retrieve it back
            retrieved_msg = await client.get_messages(int(admin_chat_id), ids=msg.id)
            if retrieved_msg and retrieved_msg.media:
                print(f"✅ Yuborilgan xabar qayta olingan! Media: {type(retrieved_msg.media)}")
                if hasattr(retrieved_msg.media, 'document'):
                    size = retrieved_msg.media.document.size
                    print(f"   Fayl: {size} bytes")
            else:
                print("❌ Yuborilgan xabar o'chirilgan yoki media topilmadi")
                
        except Exception as e:
            print(f"❌ Admin chat'ga yuborishda xato: {e}")
    
    await client.disconnect()
    print("\n✅ Test tugallandi")

asyncio.run(test_stream())
