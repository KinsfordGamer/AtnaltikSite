#!/usr/bin/env python3
"""
Pending Videos Database Fix
Eski videolarga chat_id-ni admin chat ID sifatida to'ldirish
"""
import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), 'database/atnaltik.db')
ADMIN_CHAT_ID = os.environ.get('ADMIN_CHAT_ID', '7618637796')

print("\n🔧 DATABASE FIX - Pending Videos")
print("=" * 50)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# 1. Check how many pending videos have NULL chat_id
cursor.execute("SELECT COUNT(*) as cnt FROM pending_videos WHERE chat_id IS NULL OR chat_id = ''")
null_count = cursor.fetchone()['cnt']

print(f"\n📊 Status:")
print(f"   Pending videos with NULL chat_id: {null_count}")

if null_count > 0:
    print(f"\n⚙️  Fixing {null_count} pending videos...")
    print(f"   Setting chat_id = {ADMIN_CHAT_ID}")
    
    # Update all NULL chat_id to admin chat id
    cursor.execute("""
        UPDATE pending_videos 
        SET chat_id = ? 
        WHERE chat_id IS NULL OR chat_id = ''
    """, (ADMIN_CHAT_ID,))
    
    conn.commit()
    print(f"✅ Updated: {cursor.rowcount} rows")

# 2. Check episodes without chat_id/msg_id
cursor.execute("""
    SELECT COUNT(*) as cnt FROM episodes 
    WHERE telegram_file_id IS NOT NULL AND telegram_file_id != ''
    AND (telegram_chat_id IS NULL OR telegram_chat_id = '')
""")
ep_count = cursor.fetchone()['cnt']

print(f"\n📊 Episodes without chat_id/msg_id: {ep_count}")

if ep_count > 0:
    print(f"\n⚙️  Attempting to auto-resolve episodes...")
    
    # Get all episodes that need resolution
    cursor.execute("""
        SELECT e.id, e.telegram_file_id, p.chat_id, p.message_id
        FROM episodes e
        LEFT JOIN pending_videos p ON e.telegram_file_id = p.file_id
        WHERE e.telegram_file_id IS NOT NULL AND e.telegram_file_id != ''
        AND (e.telegram_chat_id IS NULL OR e.telegram_chat_id = '')
        AND p.file_id IS NOT NULL
        LIMIT 20
    """)
    
    rows = cursor.fetchall()
    updated = 0
    
    for row in rows:
        ep_id = row['id']
        chat_id = row['chat_id']
        msg_id = row['message_id']
        
        if chat_id and msg_id:
            cursor.execute("""
                UPDATE episodes 
                SET telegram_chat_id = ?, telegram_msg_id = ?
                WHERE id = ?
            """, (str(chat_id), msg_id, ep_id))
            updated += 1
            print(f"   ✅ Episode {ep_id} updated")
    
    if updated > 0:
        conn.commit()
        print(f"\n✅ Updated {updated} episodes")
    else:
        print(f"\n⚠️  Hechqanday episode update qilinmadi")

print("\n" + "=" * 50)
print("✅ Database fix tugallandi!\n")

conn.close()
