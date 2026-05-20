"""
ATNALTIK DUBBING — Backend Server
Flask + SQLite + Telegram Bot Integration
"""

import os
import sys
import json
import hashlib
import hmac
import threading
import time
from datetime import datetime, timedelta
from functools import wraps

import requests
from dotenv import load_dotenv
from flask import (
    Flask, render_template, request, jsonify,
    redirect, url_for, session, send_from_directory,
    abort, Response, stream_with_context
)
from werkzeug.local import LocalProxy
from cachetools import TTLCache

# .env faylini yuklash
load_dotenv()

from telethon import TelegramClient, events
from telethon.tl.types import InputDocumentFileLocation
import asyncio

from database.db import Database

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'atnaltik-secret-key-change-in-production')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

db = Database()

# ─────────────────────────────────────────
#  TELETHON CLIENT INITIALIZATION
# ─────────────────────────────────────────
api_id = os.environ.get('TELEGRAM_API_ID')
api_hash = os.environ.get('TELEGRAM_API_HASH')
bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')

# Media cache (10 daqiqa davomida saqlaydi)
media_cache = TTLCache(maxsize=100, ttl=600)
loop = asyncio.new_event_loop()
client = None

def start_telethon():
    global client
    if not api_id or not api_hash or not bot_token or 'SIZNING' in api_id:
        print("⚠️ Telethon uchun API_ID yoki API_HASH sozlanmagan. Katta fayllar ishlamasligi mumkin.")
        return

    asyncio.set_event_loop(loop)
    client = TelegramClient('atnaltik_session', int(api_id), api_hash)
    # Tezlikni oshirish uchun parallel ulanishlar (MTProto)
    client.flood_sleep_threshold = 60
    client.start(bot_token=bot_token)
    print("🚀 Telethon Client (MTProto) ishga tushdi.")
    # Client global o'zgaruvchi sifatida initsializatsiya bo'lganini belgilaymiz
    app.config['TELETHON_READY'] = True
    loop.run_forever()

# Telethonni alohida threadda ishga tushiramiz
threading.Thread(target=start_telethon, daemon=True).start()

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Tizimga kiring'}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('admin_login'))
        user = db.get_user(session['user_id'])
        if not user or not user['is_admin']:
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated

def verify_telegram_auth(data: dict) -> bool:
    """Telegram Login Widget ma'lumotlarini tekshirish"""
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not bot_token:
        return True  # dev rejimida o'tkazib yuborish

    check_hash = data.pop('hash', '')
    data_check_arr = sorted([f"{k}={v}" for k, v in data.items()])
    data_check_string = '\n'.join(data_check_arr)

    secret_key = hashlib.sha256(bot_token.encode()).digest()
    hmac_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(hmac_hash, check_hash)

def send_telegram_message(chat_id, text, reply_to=None):
    """Telegramga xabar yuborish"""
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not token: return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'}
    if reply_to:
        payload['reply_to_message_id'] = reply_to
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"Telegram error: {e}")


# ─────────────────────────────────────────
#  FRONTEND ROUTES
# ─────────────────────────────────────────

@app.route('/')
def index():
    animes = db.get_all_animes()
    genres = db.get_all_genres()
    stats = db.get_stats()
    return render_template('index.html',
        animes=animes, genres=genres, stats=stats,
        tg_bot_username=os.environ.get('TELEGRAM_BOT_USERNAME', 'ATNALTIK')
    )

@app.route('/anime/<int:anime_id>')
def anime_detail(anime_id):
    anime = db.get_anime_with_seasons(anime_id)
    if not anime:
        abort(404)
    return render_template('anime_detail.html', 
        anime=anime,
        tg_bot_username=os.environ.get('TELEGRAM_BOT_USERNAME', 'ATNALTIK')
    )


# ── SEO ──
@app.route('/robots.txt')
def static_from_root():
    return send_from_directory(app.static_folder, 'robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    animes = db.get_all_animes()
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    # Bosh sahifa
    xml += '  <url><loc>https://atnaltik.one/</loc><priority>1.0</priority></url>\n'
    # Anime sahifalari
    for anime in animes:
        xml += f'  <url><loc>https://atnaltik.one/anime/{anime["id"]}</loc><priority>0.8</priority></url>\n'
    xml += '</urlset>'
    return Response(xml, mimetype='application/xml')

# ─────────────────────────────────────────
#  API — ANIMES
# ─────────────────────────────────────────

@app.route('/api/animes')
def api_animes():
    genre = request.args.get('genre', '')
    search = request.args.get('search', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    animes = db.get_animes_filtered(genre=genre, search=search, page=page, per_page=per_page)
    return jsonify(animes)

@app.route('/api/animes/<int:anime_id>')
def api_anime(anime_id):
    anime = db.get_anime_with_seasons(anime_id)
    if not anime:
        return jsonify({'error': 'Topilmadi'}), 404
    return jsonify(anime)

@app.route('/api/latest-episodes')
def api_latest_episodes():
    eps = db.get_latest_episodes(limit=12)
    return jsonify(eps)

@app.route('/api/stats')
def api_stats():
    return jsonify(db.get_stats())

@app.route('/api/genres')
def api_genres():
    return jsonify(db.get_all_genres())


# ─────────────────────────────────────────
#  API — VIDEO STREAM (Telegram proxy)
# ─────────────────────────────────────────

@app.route('/api/stream/<int:episode_id>')
def stream_episode(episode_id):
    """
    Katta fayllarni Telethon orqali, kichiklarini Bot API orqali stream qilish.
    """
    global client
    episode = db.get_episode(episode_id)
    if not episode:
        return jsonify({'error': 'Qism topilmadi'}), 404

    file_id = episode.get('telegram_file_id')
    chat_id = episode.get('telegram_chat_id')
    msg_id = episode.get('telegram_msg_id')
    
    if not file_id and not (chat_id and msg_id):
        if episode.get('telegram_url'):
            return jsonify({'type': 'link', 'url': episode['telegram_url']})
        return jsonify({'error': "Video mavjud emas"}), 404

    # --- AUTO-RESOLVE FILE_ID TO CHAT_ID/MSG_ID ---
    if file_id and not (chat_id and msg_id):
        print(f"DEBUG: [{episode_id}] Auto-resolving file_id...")
        # 1. Check pending_videos
        with db.get_conn() as conn:
            row = conn.execute("SELECT chat_id, message_id FROM pending_videos WHERE file_id=?", (file_id,)).fetchone()
            if row and row['chat_id'] and row['message_id']:
                chat_id = row['chat_id']
                msg_id = row['message_id']
                conn.execute("UPDATE episodes SET telegram_chat_id=?, telegram_msg_id=? WHERE id=?", (chat_id, msg_id, episode_id))
                print(f"DEBUG: [{episode_id}] Found in pending_videos!")
        
        # 2. If not found, force resolve by sending to ADMIN_CHAT_ID
        if not (chat_id and msg_id):
            admin_id = os.environ.get('ADMIN_CHAT_ID')
            bot_token_api = os.environ.get('TELEGRAM_BOT_TOKEN')
            if admin_id and bot_token_api:
                print(f"DEBUG: [{episode_id}] Sending to ADMIN_CHAT_ID to get msg_id...")
                try:
                    url = f"https://api.telegram.org/bot{bot_token_api}/sendDocument"
                    payload = {'chat_id': admin_id, 'document': file_id, 'disable_notification': True}
                    resp = requests.post(url, json=payload, timeout=10).json()
                    if resp.get('ok'):
                        chat_id = str(admin_id)
                        msg_id = resp['result']['message_id']
                        with db.get_conn() as conn:
                            conn.execute("UPDATE episodes SET telegram_chat_id=?, telegram_msg_id=? WHERE id=?", (chat_id, msg_id, episode_id))
                            conn.execute("INSERT INTO pending_videos (file_id, chat_id, message_id) VALUES (?,?,?)", (file_id, chat_id, msg_id))
                        print(f"DEBUG: [{episode_id}] Resolved via sendDocument! MsgID: {msg_id}")
                except Exception as e:
                    print(f"Auto-resolve error: {e}")

    # 1. TELETHON ORQALI STREAM
    print(f"DEBUG: [{episode_id}] Telethon stream urinish... (Chat: {chat_id}, Msg: {msg_id})")
    try:
        range_header = request.headers.get('Range', None)
        
        if client is None or not client.is_connected():
            print("⚠️ Telethon client ulanmagan.")
            raise Exception("Client not connected")

        # Media ob'ektini olish
        media = media_cache.get(f"ep_{episode_id}")
        
        if not media:
            if chat_id and msg_id:
                try:
                    # Chat ID raqam yoki username bo'lishi mumkin
                    target_chat = chat_id
                    if str(chat_id).replace('-','').isdigit():
                        target_chat = int(chat_id)
                    
                    print(f"DEBUG: [{episode_id}] Xabarni Telegramdan qidirish...")
                    fut_msg = asyncio.run_coroutine_threadsafe(client.get_messages(target_chat, ids=int(msg_id)), loop)
                    msg = fut_msg.result(timeout=15)
                    if msg and msg.media:
                        media = msg.media
                        media_cache[f"ep_{episode_id}"] = media
                        print(f"DEBUG: [{episode_id}] Media topildi.")
                except Exception as me:
                    print(f"DEBUG: Xabarni olishda xato: {me}")

            # Self-healing Fallback 1: Check pending_videos
            if not media and file_id:
                print(f"DEBUG: [{episode_id}] Media topilmadi. pending_videos orqali self-healing urinish...")
                with db.get_conn() as conn:
                    row = conn.execute("SELECT chat_id, message_id FROM pending_videos WHERE file_id=?", (file_id,)).fetchone()
                    if row and row['chat_id'] and row['message_id'] and (int(row['message_id']) != int(msg_id or 0) or str(row['chat_id']) != str(chat_id or '')):
                        chat_id = row['chat_id']
                        msg_id = row['message_id']
                        conn.execute("UPDATE episodes SET telegram_chat_id=?, telegram_msg_id=? WHERE id=?", (chat_id, msg_id, episode_id))
                        print(f"DEBUG: [{episode_id}] pending_videos dan yangi ma'lumotlar topildi! Chat: {chat_id}, Msg: {msg_id}")
                        
                        try:
                            target_chat = chat_id
                            if str(chat_id).replace('-','').isdigit():
                                target_chat = int(chat_id)
                            fut_msg = asyncio.run_coroutine_threadsafe(client.get_messages(target_chat, ids=int(msg_id)), loop)
                            msg = fut_msg.result(timeout=15)
                            if msg and msg.media:
                                media = msg.media
                                media_cache[f"ep_{episode_id}"] = media
                                print(f"DEBUG: [{episode_id}] Media pending_videos orqali muvaffaqiyatli tiklandi!")
                        except Exception as me:
                            print(f"DEBUG: pending_videos orqali olishda xato: {me}")

            # Self-healing Fallback 2: Force re-resolve by sending to ADMIN_CHAT_ID
            if not media and file_id:
                admin_id = os.environ.get('ADMIN_CHAT_ID')
                bot_token_api = os.environ.get('TELEGRAM_BOT_TOKEN')
                if admin_id and bot_token_api:
                    print(f"DEBUG: [{episode_id}] Hali ham topilmadi. ADMIN_CHAT_ID ga yuborib qayta resolve qilish...")
                    try:
                        url = f"https://api.telegram.org/bot{bot_token_api}/sendDocument"
                        payload = {'chat_id': admin_id, 'document': file_id, 'disable_notification': True}
                        resp = requests.post(url, json=payload, timeout=10).json()
                        if resp.get('ok'):
                            chat_id = str(admin_id)
                            msg_id = resp['result']['message_id']
                            with db.get_conn() as conn:
                                conn.execute("UPDATE episodes SET telegram_chat_id=?, telegram_msg_id=? WHERE id=?", (chat_id, msg_id, episode_id))
                                conn.execute("INSERT OR REPLACE INTO pending_videos (file_id, chat_id, message_id) VALUES (?,?,?)", (file_id, chat_id, msg_id))
                            print(f"DEBUG: [{episode_id}] Qayta yuborish orqali hal qilindi! Yangi MsgID: {msg_id}")
                            
                            try:
                                target_chat = chat_id
                                if str(chat_id).replace('-','').isdigit():
                                    target_chat = int(chat_id)
                                fut_msg = asyncio.run_coroutine_threadsafe(client.get_messages(target_chat, ids=int(msg_id)), loop)
                                msg = fut_msg.result(timeout=15)
                                if msg and msg.media:
                                    media = msg.media
                                    media_cache[f"ep_{episode_id}"] = media
                                    print(f"DEBUG: [{episode_id}] Media qayta yuborish orqali muvaffaqiyatli topildi!")
                            except Exception as me:
                                print(f"DEBUG: Qayta yuborilgandan keyin olishda xato: {me}")
                    except Exception as e:
                        print(f"DEBUG: Qayta resolve qilishda xato: {e}")

        
        if media:
            # Fayl hajmini aniqlash
            if hasattr(media, 'document'):
                file_size = media.document.size
                mime_type = media.document.mime_type
            elif hasattr(media, 'size'):
                file_size = media.size
                mime_type = getattr(media, 'mime_type', 'video/mp4')
            else:
                file_size = 0
                mime_type = 'video/mp4'

            print(f"DEBUG: [{episode_id}] Hajm: {file_size} bytes, Mime: {mime_type}")

            start_byte = 0
            end_byte = file_size - 1
            status_code = 200
            
            if range_header:
                import re
                match = re.search(r'bytes=(\d+)-(\d*)', range_header)
                if match:
                    start_byte = int(match.group(1))
                    if match.group(2):
                        end_byte = int(match.group(2))
                    # Xavfsizlik: end_byte fayl hajmidan oshib ketmasligi kerak
                    end_byte = min(end_byte, file_size - 1)
                    status_code = 206

            content_length = end_byte - start_byte + 1
            
            def generate_telethon():
                async def get_chunk(gen_obj):
                    try:
                        return await gen_obj.__anext__()
                    except StopAsyncIteration:
                        return None
                    except Exception as e:
                        print(f"ASYNC CHUNK ERROR: {e}")
                        return None

                try:
                    # 512KB - ko'pgina DC lar uchun barqaror hajm
                    gen = client.iter_download(
                        media, 
                        offset=start_byte, 
                        request_size=512*1024, 
                        limit=content_length
                    )
                    while True:
                        fut_chunk = asyncio.run_coroutine_threadsafe(get_chunk(gen), loop)
                        chunk = fut_chunk.result(timeout=60) # Timeoutni oshirdik
                        if chunk is None:
                            break
                        yield bytes(chunk)
                except Exception as e:
                    print(f"STREAM GENERATOR ERROR: {e}")

            headers = {
                'Content-Type': mime_type or 'video/mp4',
                'Content-Length': str(content_length),
                'Accept-Ranges': 'bytes',
                'Access-Control-Allow-Origin': '*',
                'Content-Disposition': 'inline',
            }
            if range_header:
                headers['Content-Range'] = f'bytes {start_byte}-{end_byte}/{file_size}'

            return Response(
                stream_with_context(generate_telethon()), 
                status=status_code, 
                headers=headers
            )
        else:
            print(f"⚠️ [{episode_id}] Telethon media topa olmadi.")

    except Exception as e:
        print(f"⚠️ Telethon Error: {e}")

    # 2. BOT API FALLBACK (Faqat kichik fayllar uchun)
    if file_id:
        print(f"DEBUG: [{episode_id}] Bot APIFallback ishlatilmoqda...")
        bot_token_api = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        try:
            get_file_url = f"https://api.telegram.org/bot{bot_token_api}/getFile?file_id={file_id}"
            file_info = requests.get(get_file_url, timeout=10).json()
            
            if file_info.get('ok'):
                file_path = file_info['result']['file_path']
                f_size = file_info['result'].get('file_size', 0)
                
                if f_size > 20*1024*1024:
                    print(f"❌ XATO: Fayl hajmi {f_size} bytes. Bot API 20MB dan kattasini bera olmaydi!")
                    return jsonify({
                        'error': 'Fayl juda katta (20MB+). Admin paneldan Chat ID va Message ID ni kiriting.',
                        'size': f_size
                    }), 400

                download_url = f"https://api.telegram.org/file/bot{bot_token_api}/{file_path}"
                resp = requests.get(download_url, stream=True, timeout=20)
                
                def generate_bot():
                    for chunk in resp.iter_content(chunk_size=32768):
                        yield chunk
                
                return Response(
                    stream_with_context(generate_bot()),
                    status=resp.status_code,
                    headers={k: v for k, v in resp.headers.items() if k in ['Content-Type', 'Content-Length', 'Accept-Ranges', 'Content-Range']}
                )
        except Exception as be:
            print(f"Bot API Error: {be}")

    return jsonify({
        'error': 'Video stream qilib bo\'lmadi. Admin paneldan ma\'lumotlar (Chat ID, Msg ID) to\'g\'riligini tekshiring.',
        'episode_id': episode_id
    }), 404



# ─────────────────────────────────────────
#  AUTH — Telegram Login Widget
# ─────────────────────────────────────────

@app.route('/auth/telegram', methods=['POST'])
def auth_telegram():
    data = request.json or {}
    if not verify_telegram_auth(dict(data)):
        return jsonify({'error': 'Autentifikatsiya xatosi'}), 403

    tg_id = str(data.get('id', ''))
    user = db.get_or_create_user_by_telegram(
        tg_id=tg_id,
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        username=data.get('username', ''),
        photo_url=data.get('photo_url', ''),
    )
    session['user_id'] = user['id']
    session.permanent = True
    return jsonify({'success': True, 'user': {'name': user['first_name'], 'id': user['id']}})

@app.route('/auth/login', methods=['POST'])
def auth_login():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    user = db.login_user(email, password)
    if not user:
        return jsonify({'error': 'Email yoki parol xato'}), 401
    session['user_id'] = user['id']
    session.permanent = True
    return jsonify({'success': True, 'user': {'name': user['first_name'], 'id': user['id']}})

@app.route('/auth/register', methods=['POST'])
def auth_register():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    if not email or not password or not name:
        return jsonify({'error': "Barcha maydonlarni to'ldiring"}), 400
    if db.user_exists(email):
        return jsonify({'error': 'Bu email allaqachon ro\'yxatdan o\'tgan'}), 409
    user = db.create_user(email=email, password=password, first_name=name)
    session['user_id'] = user['id']
    session.permanent = True
    return jsonify({'success': True, 'user': {'name': user['first_name'], 'id': user['id']}})

@app.route('/auth/logout')
def auth_logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/auth/me')
def auth_me():
    if 'user_id' not in session:
        return jsonify({'logged_in': False})
    user = db.get_user(session['user_id'])
    if not user:
        session.clear()
        return jsonify({'logged_in': False})
    return jsonify({
        'logged_in': True,
        'user': {'name': user['first_name'], 'id': user['id'], 'is_admin': user['is_admin']}
    })

@app.route('/profile')
def profile_page():
    if 'user_id' not in session:
        return redirect('/')
    user = db.get_user(session['user_id'])
    if not user:
        session.clear()
        return redirect('/')
    return render_template(
        'profile.html', 
        user=user,
        tg_bot_username=os.environ.get('TELEGRAM_BOT_USERNAME', 'ATNALTIK')
    )



# ─────────────────────────────────────────
#  ADMIN PANEL
# ─────────────────────────────────────────

@app.route('/admin')
@admin_required
def admin_dashboard():
    stats = db.get_stats()
    recent_animes = db.get_all_animes()[:5]
    return render_template('admin/dashboard.html', stats=stats, recent_animes=recent_animes)

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        admin_user = db.check_admin(username, password)
        if admin_user:
            session['user_id'] = admin_user['id']
            session.permanent = True
            return redirect(url_for('admin_dashboard'))
        return render_template('admin/login.html', error="Noto'g'ri ma'lumotlar")
    return render_template('admin/login.html')

@app.route('/admin/logout')
def admin_logout():
    session.clear()
    return redirect(url_for('admin_login'))

# ── ADMIN: ANIMES ──

@app.route('/admin/animes')
@admin_required
def admin_animes():
    animes = db.get_all_animes()
    return render_template('admin/animes.html', animes=animes)

@app.route('/admin/animes/add', methods=['GET', 'POST'])
@admin_required
def admin_add_anime():
    genres = db.get_all_genres()
    if request.method == 'POST':
        data = {
            'title': request.form.get('title', ''),
            'original_title': request.form.get('original_title', ''),
            'icon': request.form.get('icon', '🎬'),
            'score': float(request.form.get('score') or 0),
            'status': request.form.get('status', 'Davom etmoqda'),
            'year': int(request.form.get('year') or datetime.now().year),
            'description': request.form.get('description', ''),
            'genres': request.form.getlist('genres'),
            'cover_image': request.form.get('cover_image', ''),
        }
        anime_id = db.add_anime(data)
        return redirect(url_for('admin_anime_edit', anime_id=anime_id))
    return render_template('admin/anime_form.html', anime=None, genres=genres, action='add')

@app.route('/admin/animes/<int:anime_id>/edit', methods=['GET', 'POST'])
@admin_required
def admin_anime_edit(anime_id):
    anime = db.get_anime_with_seasons(anime_id)
    if not anime:
        abort(404)
    all_genres = db.get_all_genres()
    if request.method == 'POST':
        data = {
            'id': anime_id,
            'title': request.form.get('title', ''),
            'original_title': request.form.get('original_title', ''),
            'icon': request.form.get('icon', '🎬'),
            'score': float(request.form.get('score') or 0),
            'status': request.form.get('status', 'Davom etmoqda'),
            'year': int(request.form.get('year') or 2024),
            'description': request.form.get('description', ''),
            'genres': request.form.getlist('genres'),
            'cover_image': request.form.get('cover_image', ''),
        }
        db.update_anime(data)
        return redirect(url_for('admin_anime_edit', anime_id=anime_id))
    return render_template('admin/anime_form.html', anime=anime, genres=all_genres, action='edit')

@app.route('/admin/animes/<int:anime_id>/delete', methods=['POST'])
@admin_required
def admin_delete_anime(anime_id):
    db.delete_anime(anime_id)
    return redirect(url_for('admin_animes'))

# ── ADMIN: SEASONS ──

@app.route('/admin/animes/<int:anime_id>/seasons/add', methods=['POST'])
@admin_required
def admin_add_season(anime_id):
    data = {
        'anime_id': anime_id,
        'title': request.form.get('title', ''),
        'year': int(request.form.get('year') or datetime.now().year),
        'order_num': int(request.form.get('order_num') or 1),
    }
    db.add_season(data)
    return redirect(url_for('admin_anime_edit', anime_id=anime_id))

@app.route('/admin/seasons/<int:season_id>/delete', methods=['POST'])
@admin_required
def admin_delete_season(season_id):
    season = db.get_season(season_id)
    db.delete_season(season_id)
    return redirect(url_for('admin_anime_edit', anime_id=season['anime_id']))

# ── ADMIN: EPISODES ──

@app.route('/admin/seasons/<int:season_id>/episodes/add', methods=['POST'])
@admin_required
def admin_add_episode(season_id):
    season = db.get_season(season_id)
    data = {
        'season_id': season_id,
        'anime_id': season['anime_id'],
        'num': int(request.form.get('num') or 1),
        'title': request.form.get('title', ''),
        'duration': request.form.get('duration', '24 dq'),
        'telegram_url': request.form.get('telegram_url', ''),
        'telegram_file_id': request.form.get('telegram_file_id', ''),
        'telegram_chat_id': request.form.get('telegram_chat_id', ''),
        'telegram_msg_id': request.form.get('telegram_msg_id') or None,
        'telegram_file_path': request.form.get('telegram_file_path', ''),
        'is_new': request.form.get('is_new') == 'on',
    }
    db.add_episode(data)
    return redirect(url_for('admin_anime_edit', anime_id=season['anime_id']))

@app.route('/admin/episodes/<int:ep_id>/delete', methods=['POST'])
@admin_required
def admin_delete_episode(ep_id):
    ep = db.get_episode(ep_id)
    season = db.get_season(ep['season_id'])
    db.delete_episode(ep_id)
    return redirect(url_for('admin_anime_edit', anime_id=season['anime_id']))

@app.route('/admin/episodes/<int:ep_id>/toggle-new', methods=['POST'])
@admin_required
def admin_toggle_new(ep_id):
    db.toggle_episode_new(ep_id)
    ep = db.get_episode(ep_id)
    season = db.get_season(ep['season_id'])
    return redirect(url_for('admin_anime_edit', anime_id=season['anime_id']))

# ── ADMIN: GENRES ──

@app.route('/admin/genres')
@admin_required
def admin_genres():
    genres = db.get_all_genres()
    return render_template('admin/genres.html', genres=genres)

@app.route('/admin/genres/add', methods=['POST'])
@admin_required
def admin_add_genre():
    data = {
        'name': request.form.get('name', ''),
        'icon': request.form.get('icon', '🎭'),
        'color': request.form.get('color', 'rgba(100,100,100,0.15)'),
    }
    db.add_genre(data)
    return redirect(url_for('admin_genres'))

@app.route('/admin/genres/<int:genre_id>/delete', methods=['POST'])
@admin_required
def admin_delete_genre(genre_id):
    db.delete_genre(genre_id)
    return redirect(url_for('admin_genres'))

# ── ADMIN: USERS ──

@app.route('/admin/users')
@admin_required
def admin_users():
    users = db.get_all_users()
    return render_template('admin/users.html', users=users)

@app.route('/admin/users/<int:user_id>/toggle-admin', methods=['POST'])
@admin_required
def admin_toggle_user_admin(user_id):
    db.toggle_admin(user_id)
    return redirect(url_for('admin_users'))


# ─────────────────────────────────────────
#  TELEGRAM BOT (inline mode)
# ─────────────────────────────────────────

# Global state tracking for Bot
BOT_SESSIONS = {}

def is_bot_admin(chat_id):
    # 1. Environment variable check
    admin_chat_id = os.environ.get('ADMIN_CHAT_ID')
    if admin_chat_id and str(chat_id) == str(admin_chat_id):
        return True
    
    # 2. Database check
    try:
        with db.get_conn() as conn:
            row = conn.execute("SELECT id FROM users WHERE telegram_id=? AND is_admin=1", (str(chat_id),)).fetchone()
            if row:
                return True
    except Exception as e:
        print(f"Error checking admin status: {e}")
        
    return False

def handle_bot_update(update):
    """Telegram bot xabarlarini qayta ishlash logikasi"""
    global BOT_SESSIONS
    if 'message' not in update:
        return
        
    msg = update['message']
    chat_id = msg['chat']['id']
    text = msg.get('text', '').strip()
    
    if chat_id not in BOT_SESSIONS:
        BOT_SESSIONS[chat_id] = {"state": None, "data": {}}
        
    session = BOT_SESSIONS[chat_id]
    
    # /cancel command
    if text == '/cancel':
        BOT_SESSIONS[chat_id] = {"state": None, "data": {}}
        send_telegram_message(chat_id, "❌ Joriy operatsiya bekor qilindi.")
        return
        
    # /start command
    if text.startswith('/start'):
        welcome_text = (
            "<b>Salom! ATNALTIK DUBBING botiga xush kelibsiz!</b>\n\n"
            "Ushbu bot orqali saytga yangi animelar va qismlarni avtomatik qo'shishingiz mumkin.\n"
            "Boshlash uchun admin paneldagi parolingiz bilan kiring:\n"
            "👉 /admin buyrug'ini bosing."
        )
        send_telegram_message(chat_id, welcome_text)
        return

    # /admin command
    if text == '/admin':
        if is_bot_admin(chat_id):
            send_telegram_message(
                chat_id, 
                "👋 <b>Siz allaqachon admin sifatida kirgansiz!</b>\n\n"
                "Buyruqlar:\n"
                "🔹 /add_anime - Yangi anime qo'shish\n"
                "🔹 Video yuborish - Epizod ro'yxatga olish\n"
                "🔹 /cancel - Bekor qilish"
            )
        else:
            BOT_SESSIONS[chat_id] = {"state": "ADMIN_LOGIN", "data": {}}
            send_telegram_message(chat_id, "🔐 <b>Admin panelga kirish</b>\n\nLoginingizni kiriting:")
        return

    # /add_admin command
    if text.startswith('/add_admin'):
        if not is_bot_admin(chat_id):
            send_telegram_message(chat_id, "❌ Siz admin emassiz.")
            return
        parts = text.split()
        if len(parts) < 3:
            send_telegram_message(chat_id, "Format xato. Ishlatish: <code>/add_admin login parol</code>")
            return
        new_login = parts[1]
        new_pass = parts[2]
        try:
            # Hash password
            pwd_hash = db._hash_password(new_pass)
            email = f"{new_login}@atnaltik.uz" if "@" not in new_login else new_login
            with db.get_conn() as conn:
                conn.execute("""
                    INSERT INTO users (email, password_hash, first_name, username, is_admin)
                    VALUES (?, ?, ?, ?, 1)
                """, (email, pwd_hash, new_login, new_login))
            send_telegram_message(
                chat_id, 
                f"✅ <b>Yangi admin muvaffaqiyatli qo'shildi!</b>\n\n"
                f"👤 Login: <code>{new_login}</code>\n"
                f"🔑 Parol: <code>{new_pass}</code>"
            )
        except Exception as e:
            send_telegram_message(chat_id, f"❌ Xatolik yuz berdi (balki login banddir): {e}")
        return

    # /add_anime command
    if text == '/add_anime':
        if not is_bot_admin(chat_id):
            send_telegram_message(chat_id, "❌ Ushbu buyruq faqat adminlar uchun!")
            return
        BOT_SESSIONS[chat_id] = {"state": "ADD_ANIME_TITLE", "data": {}}
        send_telegram_message(chat_id, "📝 <b>Yangi Anime qo'shish</b>\n\nAnime nomini kiriting:")
        return

    # STATE MACHINE HANDLING
    state = session.get("state")
    
    if state == "ADMIN_LOGIN":
        session["data"]["username"] = text
        session["state"] = "ADMIN_PASS"
        send_telegram_message(chat_id, "🔑 Parolni kiriting:")
        return

    elif state == "ADMIN_PASS":
        username = session["data"]["username"]
        password = text
        
        # Check standard admin
        is_valid = False
        if username == "asilbek123" and password == "asilbekatt1":
            is_valid = True
            
        # Check database admin
        if not is_valid:
            admin_user = db.check_admin(username, password)
            if admin_user:
                is_valid = True
                
        if is_valid:
            # Set this chat_id as admin in users table
            try:
                email = f"{username}@atnaltik.uz" if "@" not in username else username
                with db.get_conn() as conn:
                    # Update if exists or insert
                    row = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
                    if row:
                        conn.execute("UPDATE users SET telegram_id=?, is_admin=1 WHERE id=?", (str(chat_id), row['id']))
                    else:
                        pwd_hash = db._hash_password(password)
                        conn.execute("""
                            INSERT INTO users (email, password_hash, first_name, telegram_id, is_admin)
                            VALUES (?, ?, ?, ?, 1)
                        """, (email, pwd_hash, username, str(chat_id)))
            except Exception as e:
                print(f"Error associating telegram_id: {e}")
                
            BOT_SESSIONS[chat_id] = {"state": None, "data": {}}
            send_telegram_message(
                chat_id, 
                "✅ <b>Muvaffaqiyatli kirdingiz!</b>\n\n"
                "Sizning Telegram hisobingiz admin sifatidagi profilga ulandi.\n\n"
                "Buyruqlar:\n"
                "🔹 /add_anime - Yangi anime qo'shish\n"
                "🔹 Video yuborish - Epizod qo'shish\n"
                "🔹 /add_admin &lt;login&gt; &lt;parol&gt; - Yangi admin qo'shish\n"
                "🔹 /cancel - Bekor qilish"
            )
        else:
            BOT_SESSIONS[chat_id] = {"state": None, "data": {}}
            send_telegram_message(chat_id, "❌ Noto'g'ri login yoki parol. Kirish bekor qilindi. Qayta urinish uchun /admin deb yozing.")
        return

    # ANIME CREATION STATES
    elif state == "ADD_ANIME_TITLE":
        session["data"]["title"] = text
        session["state"] = "ADD_ANIME_ORIGINAL"
        send_telegram_message(chat_id, "Anime asl nomini kiriting (masalan: 鬼滅の刃, bo'sh qoldirish uchun /skip bosing):")
        return

    elif state == "ADD_ANIME_ORIGINAL":
        session["data"]["original_title"] = "" if text == "/skip" else text
        session["state"] = "ADD_ANIME_YEAR"
        send_telegram_message(chat_id, "Anime chiqarilgan yilini kiriting (masalan: 2024):")
        return

    elif state == "ADD_ANIME_YEAR":
        if not text.isdigit():
            send_telegram_message(chat_id, "❌ Yil faqat raqam bo'lishi kerak. Qayta kiriting:")
            return
        session["data"]["year"] = int(text)
        session["state"] = "ADD_ANIME_DESC"
        send_telegram_message(chat_id, "Anime tavsifini (description) kiriting:")
        return

    elif state == "ADD_ANIME_DESC":
        session["data"]["description"] = text
        session["state"] = "ADD_ANIME_COVER"
        send_telegram_message(chat_id, "Anime poster/cover rasm havolasini yuboring (bo'sh qoldirish uchun /skip bosing):")
        return

    elif state == "ADD_ANIME_COVER":
        session["data"]["cover_image"] = "" if text == "/skip" else text
        
        # Save anime to database
        anime_data = {
            "title": session["data"]["title"],
            "original_title": session["data"]["original_title"],
            "icon": "🎬",
            "score": 8.0,
            "status": "Davom etmoqda",
            "year": session["data"]["year"],
            "description": session["data"]["description"],
            "cover_image": session["data"]["cover_image"],
            "genres": ["Aksiya"] # Default genre
        }
        try:
            anime_id = db.add_anime(anime_data)
            send_telegram_message(
                chat_id, 
                f"✅ <b>Anime muvaffaqiyatli qo'shildi!</b>\n\n"
                f"🆔 Anime ID: <code>{anime_id}</code>\n"
                f"🎬 Nomi: <b>{anime_data['title']}</b>"
            )
        except Exception as e:
            send_telegram_message(chat_id, f"❌ Xatolik yuz berdi: {e}")
        BOT_SESSIONS[chat_id] = {"state": None, "data": {}}
        return

    # EPISODE CREATION STATES
    elif state == "ADD_EPISODE_ANIME":
        if not text.isdigit():
            send_telegram_message(chat_id, "❌ Anime ID faqat raqam bo'lishi kerak. Qayta kiriting:")
            return
        anime_id = int(text)
        anime = db.get_anime_with_seasons(anime_id)
        if not anime:
            send_telegram_message(chat_id, "❌ Bunday ID dagi anime topilmadi. Qayta kiriting:")
            return
            
        session["data"]["anime_id"] = anime_id
        session["state"] = "ADD_EPISODE_SEASON"
        
        # Show seasons
        seasons = anime.get("seasons", [])
        seasons_text = "\n".join([f"🔹 <b>ID: {s['id']}</b> - {s['title']}" for s in seasons])
        
        send_telegram_message(
            chat_id, 
            f"🎬 Anime: <b>{anime['title']}</b> tanlandi.\n\n"
            f"Faslni tanlang. Mavjud fasl ID raqamini kiriting yoki yangi fasl yaratish uchun <code>yangi:Fasl Nomi</code> yozing:\n\n"
            f"{seasons_text}"
        )
        return

    elif state == "ADD_EPISODE_SEASON":
        anime_id = session["data"]["anime_id"]
        if text.startswith("yangi:"):
            season_title = text.split("yangi:", 1)[1].strip()
            try:
                season_id = db.add_season({
                    "anime_id": anime_id,
                    "title": season_title,
                    "year": datetime.now().year,
                    "order_num": 1
                })
                send_telegram_message(chat_id, f"✅ Yangi fasl yaratildi! ID: <code>{season_id}</code>")
            except Exception as e:
                send_telegram_message(chat_id, f"❌ Yangi fasl yaratishda xato: {e}")
                return
        else:
            if not text.isdigit():
                send_telegram_message(chat_id, "❌ Fasl ID faqat raqam bo'lishi kerak. Qayta kiriting:")
                return
            season_id = int(text)
            season = db.get_season(season_id)
            if not season or season["anime_id"] != anime_id:
                send_telegram_message(chat_id, "❌ Noto'g'ri fasl ID. Qayta kiriting:")
                return
                
        session["data"]["season_id"] = season_id
        session["state"] = "ADD_EPISODE_NUM"
        send_telegram_message(chat_id, "🔢 Qism (epizod) raqamini kiriting:")
        return

    elif state == "ADD_EPISODE_NUM":
        if not text.isdigit():
            send_telegram_message(chat_id, "❌ Qism raqami faqat raqam bo'lishi kerak. Qayta kiriting:")
            return
        session["data"]["num"] = int(text)
        session["state"] = "ADD_EPISODE_TITLE"
        send_telegram_message(chat_id, "📝 Epizod nomini kiriting (bo'sh qoldirish uchun /skip bosing):")
        return

    elif state == "ADD_EPISODE_TITLE":
        num = session["data"]["num"]
        ep_title = f"{num}-qism" if text == "/skip" else text
        
        # Save episode to database
        episode_data = {
            "season_id": session["data"]["season_id"],
            "anime_id": session["data"]["anime_id"],
            "num": num,
            "title": ep_title,
            "duration": "24 dq",
            "telegram_url": "",
            "telegram_file_id": session["data"]["telegram_file_id"],
            "telegram_chat_id": session["data"]["telegram_chat_id"],
            "telegram_msg_id": session["data"]["telegram_msg_id"],
            "telegram_file_path": "",
            "is_new": True
        }
        try:
            ep_id = db.add_episode(episode_data)
            send_telegram_message(
                chat_id, 
                f"✅ <b>Epizod muvaffaqiyatli saqlandi va saytda faollashtirildi!</b>\n\n"
                f"🆔 Epizod ID: <code>{ep_id}</code>\n"
                f"🎬 Nomi: <b>{ep_title}</b>"
            )
        except Exception as e:
            send_telegram_message(chat_id, f"❌ Epizodni saqlashda xatolik: {e}")
            
        BOT_SESSIONS[chat_id] = {"state": None, "data": {}}
        return

    # Check for document/video
    video_obj = msg.get('video') or msg.get('document')
    if msg.get('document') and not msg['document'].get('mime_type', '').startswith('video/'):
        if not msg.get('video'):
            return

    if video_obj:
        if not is_bot_admin(chat_id):
            send_telegram_message(chat_id, "❌ Siz admin emassiz. Videoni qabul qila olmayman.")
            return
            
        file_id = video_obj['file_id']
        caption = msg.get('caption', '')
        
        # Save to pending
        db.save_pending_video(file_id=file_id, caption=caption, chat_id=chat_id, message_id=msg['message_id'])
        
        # Start state machine for adding episode
        BOT_SESSIONS[chat_id] = {
            "state": "ADD_EPISODE_ANIME",
            "data": {
                "telegram_file_id": file_id,
                "telegram_chat_id": str(chat_id),
                "telegram_msg_id": msg['message_id']
            }
        }
        
        # Show anime list
        animes = db.get_all_animes()
        list_text = "\n".join([f"🔹 <b>ID: {a['id']}</b> - {a['title']}" for a in animes[:15]])
        
        send_telegram_message(
            chat_id,
            f"📂 <b>Video qabul qilindi!</b>\n\n"
            f"Ushbu video qaysi animega tegishli? Anime ID raqamini kiriting:\n\n"
            f"{list_text}"
        )


@app.route('/bot/webhook', methods=['POST'])
def bot_webhook():
    """Telegram bot webhook — yangi videolar qo'shilganda"""
    # Xavfsizlik tekshiruvi (agar WEBHOOK_SECRET sozlangan bo'lsa)
    secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token', '')
    webhook_secret = os.environ.get('WEBHOOK_SECRET', 'atnaltik-webhook')
    if secret and secret != webhook_secret:
        return 'Forbidden', 403

    update = request.json
    if update:
        handle_bot_update(update)

    return 'OK'

def run_bot_polling():
    """Webhooksiz ishlash uchun background polling"""
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not token:
        print("⚠️ BOT_TOKEN topilmadi, polling ishga tushmadi.")
        return

    # Webhookni o'chirish (getUpdates ishlashi uchun shart)
    try:
        requests.get(f"https://api.telegram.org/bot{token}/deleteWebhook")
        print("🗑️ Telegram Webhook o'chirildi (Polling rejimida ishlash uchun)")
    except: pass

    print("🚀 Telegram Bot polling rejimida ishga tushdi...")
    offset = 0
    while True:
        try:
            url = f"https://api.telegram.org/bot{token}/getUpdates?offset={offset}&timeout=30"
            resp = requests.get(url, timeout=35).json()
            if resp.get('ok'):
                for update in resp.get('result', []):
                    handle_bot_update(update)
                    offset = update['update_id'] + 1
        except Exception as e:
            print(f"⚠️ Polling error: {e}")
            time.sleep(5)
        time.sleep(0.5)


# ─────────────────────────────────────────
#  ERROR HANDLERS
# ─────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500


# ─────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'true').lower() == 'true'
    
    # Bot pollingni alohida threadda ishga tushirish
    bot_thread = threading.Thread(target=run_bot_polling, daemon=True)
    bot_thread.start()
    
    print(f"\n{'='*50}")
    print(f"  ATNALTIK DUBBING — Server ishga tushdi")
    print(f"  URL: http://localhost:{port}")
    print(f"  Admin: http://localhost:{port}/admin")
    print(f"  Bot rejim: Polling (Background)")
    print(f"{'='*50}\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=False)
