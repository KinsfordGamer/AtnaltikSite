import sqlite3

db_path = '/home/ubuntu/Bot/database/atnaltik.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Update Episode 21 to have correct message ID 112
cursor.execute("UPDATE episodes SET telegram_msg_id = 112 WHERE id = 21")
conn.commit()
print("Remote DB updated: Episode 21 set to msg_id 112.")

# 2. Let's see what is currently in episodes for ID 21
cursor.execute("SELECT id, telegram_chat_id, telegram_msg_id FROM episodes WHERE id = 21")
row = cursor.fetchone()
print("Remote Episode 21 status after update:", row)

conn.close()
