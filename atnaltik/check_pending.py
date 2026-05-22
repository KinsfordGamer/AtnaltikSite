#!/usr/bin/env python3
"""
Database diagnostic - check pending_videos and current episodes
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'database/atnaltik.db')

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("\n=== PENDING_VIDEOS JADVALINI TEKSHIRISH ===\n")

cursor.execute("SELECT COUNT(*) as cnt FROM pending_videos")
pending_count = cursor.fetchone()['cnt']
print(f"Jami pending videos: {pending_count}\n")

cursor.execute("""
    SELECT id, file_id, chat_id, message_id, created_at 
    FROM pending_videos 
    LIMIT 5
""")

rows = cursor.fetchall()
if rows:
    for r in rows:
        print(f"ID: {r['id']}")
        print(f"  File: {r['file_id'][:40]}...")
        print(f"  Chat: {r['chat_id']}, Msg: {r['message_id']}")
        print(f"  Created: {r['created_at']}\n")
else:
    print("⚠️  pending_videos jadvali bo'sh!\n")

print("\n=== EPISODES WITHOUT CHAT_ID/MSG_ID ===\n")

cursor.execute("""
    SELECT id, title, telegram_file_id, telegram_chat_id, telegram_msg_id
    FROM episodes
    WHERE telegram_file_id IS NOT NULL AND telegram_file_id != ''
    AND (telegram_chat_id IS NULL OR telegram_chat_id = '')
    LIMIT 10
""")

episodes_without_location = cursor.fetchall()
print(f"Jami episodes (chat_id/msg_id bo'lmay): {len(episodes_without_location)}\n")

for ep in episodes_without_location:
    file_id = ep['telegram_file_id']
    
    # Check if this file_id exists in pending_videos
    cursor.execute("""
        SELECT chat_id, message_id FROM pending_videos 
        WHERE file_id = ?
        LIMIT 1
    """, (file_id,))
    
    pending = cursor.fetchone()
    
    print(f"Episode: {ep['title']} (ID: {ep['id']})")
    print(f"  FileID: {file_id[:40]}...")
    
    if pending:
        print(f"  ✅ Pending-da topildi! Chat: {pending['chat_id']}, Msg: {pending['message_id']}")
    else:
        print(f"  ⚠️  Pending-da topilmadi")
    print()

conn.close()
