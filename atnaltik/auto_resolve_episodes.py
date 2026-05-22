#!/usr/bin/env python3
"""
Auto-resolve episodes with missing chat_id/msg_id via Telethon
Forward them to admin chat to get proper message location
"""
import asyncio
import os
import sqlite3
from dotenv import load_dotenv
from telethon import TelegramClient
import requests

load_dotenv()

api_id = os.environ.get('TELEGRAM_API_ID')
api_hash = os.environ.get('TELEGRAM_API_HASH')
bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
admin_chat_id = os.environ.get('ADMIN_CHAT_ID')

DB_PATH = os.path.join(os.path.dirname(__file__), 'database/atnaltik.db')

async def auto_resolve_episodes():
    print("\n🔧 EPISODES AUTO-RESOLVE - Telethon orqali")
    print("=" * 60)
    
    # Get episodes without chat_id/msg_id
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, title, telegram_file_id
        FROM episodes
        WHERE telegram_file_id IS NOT NULL AND telegram_file_id != ''
        AND (telegram_chat_id IS NULL OR telegram_chat_id = '')
        LIMIT 10
    """)
    
    episodes = cursor.fetchall()
    print(f"\n📊 Aniqlanishi kerak bo'lgan episodes: {len(episodes)}\n")
    
    if not episodes:
        print("✅ Hechqanday episode topilmadi\n")
        conn.close()
        return
    
    # Initialize Telethon client
    client = TelegramClient('auto_resolve_session', int(api_id), api_hash)
    await client.start(bot_token=bot_token)
    
    print("🔄 Telethon client ulandiiii...")
    
    updated = 0
    
    for ep in episodes:
        ep_id = ep['id']
        title = ep['title']
        file_id = ep['telegram_file_id']
        
        print(f"\n📹 Episode: {title} (ID: {ep_id})")
        print(f"   FileID: {file_id[:40]}...")
        
        try:
            # Try Bot API method first
            bot_token_str = os.environ.get('TELEGRAM_BOT_TOKEN')
            
            print(f"   ⚙️  Bot API orqali admin chat'ga yuborilmoqda...")
            
            url = f"https://api.telegram.org/bot{bot_token_str}/sendDocument"
            payload = {
                'chat_id': str(admin_chat_id),
                'document': file_id,
                'caption': f'Auto-resolved: {title}',
                'disable_notification': True,
                'parse_mode': 'HTML'
            }
            
            response = requests.post(url, json=payload, timeout=15)
            result = response.json()
            
            if result.get('ok'):
                msg_data = result['result']
                new_msg_id = msg_data.get('message_id')
                
                # Update database
                cursor.execute("""
                    UPDATE episodes
                    SET telegram_chat_id = ?, telegram_msg_id = ?
                    WHERE id = ?
                """, (str(admin_chat_id), new_msg_id, ep_id))
                
                # Also update pending_videos
                cursor.execute("""
                    INSERT OR REPLACE INTO pending_videos (file_id, chat_id, message_id)
                    VALUES (?, ?, ?)
                """, (file_id, str(admin_chat_id), new_msg_id))
                
                conn.commit()
                print(f"   ✅ Yuborildi! Chat: {admin_chat_id}, Msg: {new_msg_id}")
                updated += 1
            else:
                error_msg = result.get('description', 'Noma\'lum xato')
                print(f"   ❌ Bot API xatosi: {error_msg}")
                
        except Exception as e:
            print(f"   ❌ Xato: {e}")
    
    await client.disconnect()
    
    print("\n" + "=" * 60)
    print(f"✅ {updated} ta episode muvaffaqiyatli auto-resolve qilindi!\n")
    
    conn.close()

# Run
asyncio.run(auto_resolve_episodes())
