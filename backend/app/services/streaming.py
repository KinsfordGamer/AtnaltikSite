from typing import AsyncGenerator
from fastapi import Request, HTTPException
from fastapi.responses import StreamingResponse
from app.services.telegram import telegram_service
from app.core.config import settings
import re

class StreamingService:
    @staticmethod
    async def get_video_stream(media, range_header: str = None) -> StreamingResponse:
        """
        Telegramdan videoni bo'laklab (chunked) o'qish va foydalanuvchiga uzatish.
        Bu usul 20MB limitini chetlab o'tadi va istalgan hajmdagi fayllarni (2GB gacha) o'ynatadi.
        """
        if not media:
            raise HTTPException(status_code=404, detail="Media topilmadi")

        # Media ma'lumotlarini olish
        if hasattr(media, 'document'):
            file_size = media.document.size
            mime_type = media.document.mime_type
        elif hasattr(media, 'size'):
            file_size = media.size
            mime_type = getattr(media, 'mime_type', 'video/mp4')
        else:
            file_size = 0
            mime_type = 'video/mp4'

        start_byte = 0
        end_byte = file_size - 1
        status_code = 200

        # HTTP Range headerini qayta ishlash (pleer uchun muhim)
        if range_header:
            match = re.search(r'bytes=(\d+)-(\d*)', range_header)
            if match:
                start_byte = int(match.group(1))
                if match.group(2):
                    end_byte = int(match.group(2))
                end_byte = min(end_byte, file_size - 1)
                status_code = 206

        content_length = end_byte - start_byte + 1

        async def chunk_generator() -> AsyncGenerator[bytes, None]:
            try:
                # MTProto orqali faylni bo'laklab yuklash
                async for chunk in telegram_service.client.iter_download(
                    media,
                    offset=start_byte,
                    request_size=settings.CHUNK_SIZE,
                    limit=content_length
                ):
                    yield bytes(chunk)
            except Exception as e:
                print(f"🔥 Stream Error: {e}")

        headers = {
            'Content-Type': mime_type,
            'Content-Length': str(content_length),
            'Accept-Ranges': 'bytes',
            'Content-Disposition': 'inline',
            'Access-Control-Allow-Origin': '*',
        }

        if range_header:
            headers['Content-Range'] = f'bytes {start_byte}-{end_byte}/{file_size}'

        return StreamingResponse(
            chunk_generator(),
            status_code=status_code,
            headers=headers
        )

streaming_service = StreamingService()
