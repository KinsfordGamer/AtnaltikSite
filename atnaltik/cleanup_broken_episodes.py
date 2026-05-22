#!/usr/bin/env python3
"""
Remove broken episodes and clean up
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'database/atnaltik.db')

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("\n🗑️  BROKEN EPISODES CLEANUP")
print("=" * 50)

# Delete broken episodes
cursor.execute("DELETE FROM episodes WHERE id IN (11, 12, 13)")
conn.commit()

print(f"✅ Deleted {cursor.rowcount} broken episodes (ID: 11, 12, 13)")

# Verify remaining episodes
cursor.execute("SELECT COUNT(*) as cnt FROM episodes")
total = cursor.fetchone()[0]

print(f"✅ Remaining episodes: {total}")

print("\n" + "=" * 50)
print("✅ Cleanup tugallandi!\n")

conn.close()
