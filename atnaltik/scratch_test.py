import os
import asyncio
from dotenv import load_dotenv
from telethon import TelegramClient

load_dotenv()

async def main():
    api_id = os.environ.get('TELEGRAM_API_ID')
    api_hash = os.environ.get('TELEGRAM_API_HASH')
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    
    if not api_id or not api_hash or not bot_token:
        print("Missing credentials")
        return

    client = TelegramClient('scratch_session', int(api_id), api_hash)
    await client.start(bot_token=bot_token)
    
    chat_id = 7618637796
    msg_id = 112
    print(f"\n--- Checking chunk data type for Msg {msg_id} ---")
    try:
        msg = await client.get_messages(chat_id, ids=msg_id)
        if msg and msg.media:
            gen = client.iter_download(msg.media, offset=0, request_size=1024, limit=1024)
            chunk = await gen.__anext__()
            print(f"Chunk type: {type(chunk)}")
            print(f"Is bytes: {isinstance(chunk, bytes)}")
            print(f"Is bytearray: {isinstance(chunk, bytearray)}")
        else:
            print("Message or media not found")
    except Exception as e:
        print(f"Error: {e}")
        
    await client.disconnect()

asyncio.run(main())
