#!/usr/bin/env python3
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'database/atnaltik.db')

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("\n=== EPISODES JADVALINI TEKSHIRISH ===\n")

# Get episodes with required fields
cursor.execute("""
    SELECT 
        id, 
        title, 
        telegram_file_id, 
        telegram_chat_id, 
        telegram_msg_id,
        telegram_url
    FROM episodes 
    LIMIT 10
""")

rows = cursor.fetchall()

if not rows:
    print("❌ Hechqanday episode topilmadi!")
else:
    print(f"✅ Jami {len(rows)} ta episode topildi:\n")
    for r in rows:
        ep_id = r['id']
        title = r['title']
        file_id = bool(r['telegram_file_id'])
        chat_id = bool(r['telegram_chat_id'])
        msg_id = bool(r['telegram_msg_id'])
        url = bool(r['telegram_url'])
        
        print(f"ID: {ep_id:2} | {title[:25]}")
        print(f"   📁 FileID: {file_id} | Chat: {chat_id} | MsgID: {msg_id} | URL: {url}")
        
        if not (file_id or url):
            print(f"   ⚠️  VIDEO MALUMOTI YO'Q!")
        print()

conn.close()
