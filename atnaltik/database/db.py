"""
ATNALTIK DUBBING — Database Layer (SQLite)
"""

import sqlite3
import hashlib
import os
from datetime import datetime
from contextlib import contextmanager


DB_PATH = os.path.join(os.path.dirname(__file__), 'atnaltik.db')


class Database:
    def __init__(self):
        self.db_path = DB_PATH
        self._init_db()
        self._seed_data()

    def get_setting(self, key, default=None):
        try:
            with self.get_conn() as conn:
                row = conn.execute("SELECT value FROM settings WHERE key=?", (key,)).fetchone()
                return row['value'] if row else default
        except Exception as e:
            print(f"Error getting setting {key}: {e}")
            return default

    def set_setting(self, key, value):
        try:
            with self.get_conn() as conn:
                conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)", (key, str(value)))
        except Exception as e:
            print(f"Error setting setting {key}: {e}")

    @contextmanager
    def get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self):
        with self.get_conn() as conn:
            conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password_hash TEXT,
                first_name TEXT NOT NULL DEFAULT '',
                last_name TEXT DEFAULT '',
                username TEXT DEFAULT '',
                photo_url TEXT DEFAULT '',
                telegram_id TEXT UNIQUE,
                is_admin INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS animes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                original_title TEXT DEFAULT '',
                icon TEXT DEFAULT '🎬',
                score REAL DEFAULT 0,
                status TEXT DEFAULT 'Davom etmoqda',
                year INTEGER DEFAULT 2024,
                description TEXT DEFAULT '',
                cover_image TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS anime_genres (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                anime_id INTEGER,
                genre_name TEXT,
                UNIQUE(anime_id, genre_name),
                FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS genres (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                icon TEXT DEFAULT '🎭',
                color TEXT DEFAULT 'rgba(100,100,100,0.15)'
            );

            CREATE TABLE IF NOT EXISTS seasons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                anime_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                year INTEGER DEFAULT 2024,
                order_num INTEGER DEFAULT 1,
                FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                season_id INTEGER NOT NULL,
                anime_id INTEGER NOT NULL,
                num INTEGER DEFAULT 1,
                title TEXT NOT NULL,
                duration TEXT DEFAULT '24 dq',
                telegram_url TEXT DEFAULT '',
                telegram_file_id TEXT DEFAULT '',
                telegram_file_path TEXT DEFAULT '',
                is_new INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
                FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS pending_videos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id TEXT NOT NULL,
                chat_id TEXT,
                message_id INTEGER,
                caption TEXT DEFAULT '',
                processed INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );

            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                episode_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                likes_count INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS comment_likes (
                user_id INTEGER NOT NULL,
                comment_id INTEGER NOT NULL,
                PRIMARY KEY (user_id, comment_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS ratings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                anime_id INTEGER NOT NULL,
                rating INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, anime_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (anime_id) REFERENCES animes(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                username TEXT,
                amount REAL,
                provider TEXT,
                status TEXT DEFAULT 'completed',
                transaction_id TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
            """)
            
            try:
                conn.execute("ALTER TABLE animes ADD COLUMN cover_image TEXT DEFAULT ''")
            except: pass

            try:
                conn.execute("ALTER TABLE animes ADD COLUMN voice_actors TEXT DEFAULT ''")
            except: pass

            try:
                conn.execute("ALTER TABLE animes ADD COLUMN translators TEXT DEFAULT ''")
            except: pass

            try:
                conn.execute("ALTER TABLE episodes ADD COLUMN telegram_chat_id TEXT")
                conn.execute("ALTER TABLE episodes ADD COLUMN telegram_msg_id INTEGER")
            except: pass

            try:
                conn.execute("ALTER TABLE pending_videos ADD COLUMN chat_id TEXT")
            except: pass

            try:
                conn.execute("ALTER TABLE users ADD COLUMN balance REAL DEFAULT 0.0")
            except: pass

            try:
                conn.execute("ALTER TABLE users ADD COLUMN premium_until TEXT DEFAULT NULL")
            except: pass

            try:
                conn.execute("ALTER TABLE users ADD COLUMN premium_type TEXT DEFAULT NULL")
            except: pass

            try:
                conn.execute("ALTER TABLE episodes ADD COLUMN release_delay_days INTEGER DEFAULT 0")
            except: pass

    # ─────────────────────────────────────────
    #  SEED DATA
    # ─────────────────────────────────────────

    def _seed_data(self):
        """Boshlang'ich ma'lumotlar — faqat bo'sh DB uchun"""
        with self.get_conn() as conn:
            # Admin mavjudmi?
            row = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE is_admin=1").fetchone()
            if row['cnt'] > 0:
                return  # Allaqachon seed qilingan

            # Admin yaratish
            pwd_hash = hashlib.sha256('admin123'.encode()).hexdigest()
            conn.execute("""
                INSERT OR IGNORE INTO users (email, password_hash, first_name, is_admin)
                VALUES (?, ?, ?, 1)
            """, ('admin@atnaltik.uz', pwd_hash, 'Admin'))

            # Janrlar
            genres = [
                ('Aksiya', '⚔️', 'rgba(230,57,70,0.15)'),
                ('Fantastika', '✨', 'rgba(156,39,176,0.15)'),
                ('Drama', '💔', 'rgba(244,67,54,0.12)'),
                ('Komediya', '😂', 'rgba(255,193,7,0.15)'),
                ('Sarguzasht', '🌍', 'rgba(76,175,80,0.15)'),
                ('Sport', '🎾', 'rgba(33,150,243,0.15)'),
                ('Romantika', '🌹', 'rgba(233,30,99,0.15)'),
                ('Dahshat', '💀', 'rgba(121,85,72,0.15)'),
                ('Psixologik', '🧠', 'rgba(103,58,183,0.15)'),
                ('Tarix', '👑', 'rgba(121,85,72,0.15)'),
            ]
            conn.executemany(
                "INSERT OR IGNORE INTO genres (name, icon, color) VALUES (?,?,?)", genres
            )

            # Demo animelar
            demo_animes = [
                {
                    'title': 'Demon Slayer: Kimetsu no Yaiba', 'original_title': '鬼滅の刃',
                    'icon': '🏮', 'score': 8.7, 'status': 'Tugallangan', 'year': 2019,
                    'description': "Tanjiro Kamado oilasi jin tomonidan o'ldirilgandan so'ng, tiriq qolgan singlisini insonga qaytarish uchun Jin qiruvchilar safiga qo'shiladi.",
                    'genres': ['Aksiya', 'Fantastika', 'Drama'],
                    'seasons': [
                        {'title': '1-fasl', 'year': 2019, 'order_num': 1, 'episodes': [
                            {'num': 1, 'title': 'Yovuzlik uyg\'ondi', 'duration': '24 dq', 'telegram_url': 'https://t.me/ATNALTIK', 'is_new': False},
                            {'num': 2, 'title': 'Qiyinchilik davri', 'duration': '24 dq', 'telegram_url': 'https://t.me/ATNALTIK', 'is_new': False},
                        ]},
                        {'title': '2-fasl: Yoshiwara Kvartali', 'year': 2021, 'order_num': 2, 'episodes': [
                            {'num': 1, 'title': 'Yoshiwara tunlari', 'duration': '44 dq', 'telegram_url': 'https://t.me/ATNALTIK', 'is_new': True},
                        ]},
                    ]
                },
                {
                    'title': 'Attack on Titan', 'original_title': '進撃の巨人',
                    'icon': '⚔️', 'score': 9.0, 'status': 'Tugallangan', 'year': 2013,
                    'description': "Gigant odamxo'rlar dunyosida, devol ichida yashayotgan odamlar qoldig'i. Eren Yaeger qasos yo'lida.",
                    'genres': ['Drama', 'Psixologik', 'Aksiya'],
                    'seasons': [
                        {'title': '1-fasl', 'year': 2013, 'order_num': 1, 'episodes': [
                            {'num': 1, 'title': "Devol ichidagi dunyo", 'duration': '24 dq', 'telegram_url': 'https://t.me/ATNALTIK', 'is_new': False},
                        ]},
                        {'title': 'Final Fasl', 'year': 2022, 'order_num': 4, 'episodes': [
                            {'num': 1, 'title': 'Oxirigacha', 'duration': '87 dq', 'telegram_url': 'https://t.me/ATNALTIK', 'is_new': True},
                        ]},
                    ]
                },
                {
                    'title': 'Jujutsu Kaisen', 'original_title': '呪術廻戦',
                    'icon': '🔥', 'score': 8.6, 'status': 'Davom etmoqda', 'year': 2020,
                    'description': "Yuji Itadori bir tasodifdan so'ng eng kuchli la'nat ruhining tashuvchisiga aylanadi.",
                    'genres': ['Aksiya', 'Fantastika', 'Dahshat'],
                    'seasons': [
                        {'title': '1-fasl', 'year': 2020, 'order_num': 1, 'episodes': [
                            {'num': 1, 'title': 'Ryomen Sukuna', 'duration': '24 dq', 'telegram_url': 'https://t.me/ATNALTIK', 'is_new': False},
                        ]},
                        {'title': '2-fasl', 'year': 2023, 'order_num': 2, 'episodes': [
                            {'num': 1, 'title': "Gojoniyng o'tmishi", 'duration': '47 dq', 'telegram_url': 'https://t.me/ATNALTIK', 'is_new': True},
                        ]},
                    ]
                },
                {
                    'title': 'One Piece', 'original_title': 'ワンピース',
                    'icon': '🐉', 'score': 8.9, 'status': 'Davom etmoqda', 'year': 1999,
                    'description': "Monkey D. Luffy va uning dengizchi do'stlari Grand Line bo'ylab Bir bo'lakni izlab sayohat qiladilar.",
                    'genres': ['Sarguzasht', 'Komediya', 'Aksiya'],
                    'seasons': [
                        {'title': 'East Blue Saga', 'year': 1999, 'order_num': 1, 'episodes': [
                            {'num': 1, 'title': "Men kaptanman!", 'duration': '22 dq', 'telegram_url': 'https://t.me/ATNALTIK', 'is_new': False},
                        ]},
                    ]
                },
                {
                    'title': 'Haikyuu!!', 'original_title': 'ハイキュー!!',
                    'icon': '🎾', 'score': 8.5, 'status': 'Tugallangan', 'year': 2014,
                    'description': "Hinata Shoyo qisqa bo'lishiga qaramay professional voleybol o'yinchisi bo'lishni orzu qiladi.",
                    'genres': ['Sport', 'Drama', 'Komediya'],
                    'seasons': [
                        {'title': '1-fasl', 'year': 2014, 'order_num': 1, 'episodes': [
                            {'num': 1, 'title': "Gigantlarning to'qnashuvi", 'duration': '25 dq', 'telegram_url': 'https://t.me/ATNALTIK', 'is_new': False},
                        ]},
                    ]
                },
            ]

            for anime_data in demo_animes:
                genres_list = anime_data.pop('genres')
                seasons_data = anime_data.pop('seasons')
                cur = conn.execute("""
                    INSERT INTO animes (title, original_title, icon, score, status, year, description)
                    VALUES (:title, :original_title, :icon, :score, :status, :year, :description)
                """, anime_data)
                anime_id = cur.lastrowid

                for g in genres_list:
                    conn.execute("INSERT OR IGNORE INTO anime_genres VALUES (?,?)", (anime_id, g))

                for s in seasons_data:
                    eps = s.pop('episodes')
                    cur2 = conn.execute("""
                        INSERT INTO seasons (anime_id, title, year, order_num)
                        VALUES (?,?,?,?)
                    """, (anime_id, s['title'], s['year'], s['order_num']))
                    season_id = cur2.lastrowid

                    for e in eps:
                        conn.execute("""
                            INSERT INTO episodes (season_id, anime_id, num, title, duration, telegram_url, is_new)
                            VALUES (?,?,?,?,?,?,?)
                        """, (season_id, anime_id, e['num'], e['title'], e['duration'],
                              e['telegram_url'], 1 if e['is_new'] else 0))

    # ─────────────────────────────────────────
    #  USERS
    # ─────────────────────────────────────────

    def _hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()

    def get_user(self, user_id):
        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
            return dict(row) if row else None

    def user_exists(self, email):
        with self.get_conn() as conn:
            row = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
            return row is not None

    def create_user(self, email, password, first_name):
        with self.get_conn() as conn:
            pwd_hash = self._hash_password(password)
            cur = conn.execute("""
                INSERT INTO users (email, password_hash, first_name) VALUES (?,?,?)
            """, (email, pwd_hash, first_name))
            return {'id': cur.lastrowid, 'first_name': first_name, 'is_admin': 0}

    def login_user(self, email, password):
        with self.get_conn() as conn:
            pwd_hash = self._hash_password(password)
            row = conn.execute(
                "SELECT * FROM users WHERE email=? AND password_hash=?", (email, pwd_hash)
            ).fetchone()
            return dict(row) if row else None

    def check_admin(self, username, password):
        with self.get_conn() as conn:
            pwd_hash = self._hash_password(password)
            row = conn.execute("""
                SELECT * FROM users WHERE (email=? OR username=?) AND password_hash=? AND is_admin=1
            """, (username, username, pwd_hash)).fetchone()
            return dict(row) if row else None

    def get_or_create_user_by_telegram(self, tg_id, first_name, last_name, username, photo_url):
        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM users WHERE telegram_id=?", (tg_id,)).fetchone()
            if row:
                conn.execute("""
                    UPDATE users SET first_name=?, last_name=?, username=?, photo_url=? WHERE telegram_id=?
                """, (first_name, last_name, username, photo_url, tg_id))
                return dict(row)
            cur = conn.execute("""
                INSERT INTO users (telegram_id, first_name, last_name, username, photo_url)
                VALUES (?,?,?,?,?)
            """, (tg_id, first_name, last_name, username, photo_url))
            return {'id': cur.lastrowid, 'first_name': first_name, 'is_admin': 0}

    def get_all_users(self):
        with self.get_conn() as conn:
            rows = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
            return [dict(r) for r in rows]

    def toggle_admin(self, user_id):
        with self.get_conn() as conn:
            conn.execute("UPDATE users SET is_admin = 1 - is_admin WHERE id=?", (user_id,))

    # ─────────────────────────────────────────
    #  ANIMES
    # ─────────────────────────────────────────

    def _row_to_anime(self, row, conn):
        a = dict(row)
        genres = conn.execute(
            "SELECT genre_name FROM anime_genres WHERE anime_id=?", (a['id'],)
        ).fetchall()
        a['genres'] = [g['genre_name'] for g in genres]
        return a

    def get_all_animes(self):
        with self.get_conn() as conn:
            rows = conn.execute("SELECT * FROM animes ORDER BY created_at DESC").fetchall()
            result = []
            for r in rows:
                a = self._row_to_anime(r, conn)
                # Season va episode count
                a['season_count'] = conn.execute(
                    "SELECT COUNT(*) as cnt FROM seasons WHERE anime_id=?", (a['id'],)
                ).fetchone()['cnt']
                result.append(a)
            return result

    def get_animes_filtered(self, genre='', search='', page=1, per_page=20):
        with self.get_conn() as conn:
            offset = (page - 1) * per_page
            if genre and search:
                rows = conn.execute("""
                    SELECT DISTINCT a.* FROM animes a
                    JOIN anime_genres ag ON a.id=ag.anime_id
                    WHERE ag.genre_name=? AND (a.title LIKE ? OR a.original_title LIKE ?)
                    ORDER BY a.created_at DESC LIMIT ? OFFSET ?
                """, (genre, f'%{search}%', f'%{search}%', per_page, offset)).fetchall()
            elif genre:
                rows = conn.execute("""
                    SELECT a.* FROM animes a
                    JOIN anime_genres ag ON a.id=ag.anime_id
                    WHERE ag.genre_name=? ORDER BY a.created_at DESC LIMIT ? OFFSET ?
                """, (genre, per_page, offset)).fetchall()
            elif search:
                rows = conn.execute("""
                    SELECT * FROM animes
                    WHERE title LIKE ? OR original_title LIKE ?
                    ORDER BY created_at DESC LIMIT ? OFFSET ?
                """, (f'%{search}%', f'%{search}%', per_page, offset)).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM animes ORDER BY created_at DESC LIMIT ? OFFSET ?",
                    (per_page, offset)
                ).fetchall()
            return [self._row_to_anime(r, conn) for r in rows]

    def get_anime_with_seasons(self, anime_id):
        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM animes WHERE id=?", (anime_id,)).fetchone()
            if not row:
                return None
            anime = self._row_to_anime(row, conn)
            seasons = conn.execute(
                "SELECT * FROM seasons WHERE anime_id=? ORDER BY order_num", (anime_id,)
            ).fetchall()
            anime['seasons'] = []
            for s in seasons:
                season = dict(s)
                eps = conn.execute(
                    "SELECT * FROM episodes WHERE season_id=? ORDER BY num", (s['id'],)
                ).fetchall()
                season['episodes'] = [dict(e) for e in eps]
                anime['seasons'].append(season)
            return anime

    def add_anime(self, data):
        data_copy = dict(data)
        if 'voice_actors' not in data_copy:
            data_copy['voice_actors'] = ''
        if 'translators' not in data_copy:
            data_copy['translators'] = ''
        with self.get_conn() as conn:
            cur = conn.execute("""
                INSERT INTO animes (title, original_title, icon, score, status, year, description, cover_image, voice_actors, translators)
                VALUES (:title, :original_title, :icon, :score, :status, :year, :description, :cover_image, :voice_actors, :translators)
            """, data_copy)
            anime_id = cur.lastrowid
            for g in data_copy.get('genres', []):
                conn.execute("INSERT OR IGNORE INTO anime_genres VALUES (?,?)", (anime_id, g))
            return anime_id

    def update_anime(self, data):
        data_copy = dict(data)
        if 'voice_actors' not in data_copy:
            data_copy['voice_actors'] = ''
        if 'translators' not in data_copy:
            data_copy['translators'] = ''
        with self.get_conn() as conn:
            conn.execute("""
                UPDATE animes SET title=:title, original_title=:original_title, icon=:icon,
                score=:score, status=:status, year=:year, description=:description, cover_image=:cover_image,
                voice_actors=:voice_actors, translators=:translators
                WHERE id=:id
            """, data_copy)
            conn.execute("DELETE FROM anime_genres WHERE anime_id=?", (data_copy['id'],))
            for g in data_copy.get('genres', []):
                conn.execute("INSERT OR IGNORE INTO anime_genres VALUES (?,?)", (data_copy['id'], g))

    def delete_anime(self, anime_id):
        with self.get_conn() as conn:
            conn.execute("DELETE FROM animes WHERE id=?", (anime_id,))

    # ─────────────────────────────────────────
    #  SEASONS
    # ─────────────────────────────────────────

    def get_season(self, season_id):
        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM seasons WHERE id=?", (season_id,)).fetchone()
            return dict(row) if row else None

    def add_season(self, data):
        with self.get_conn() as conn:
            cur = conn.execute("""
                INSERT INTO seasons (anime_id, title, year, order_num)
                VALUES (:anime_id, :title, :year, :order_num)
            """, data)
            return cur.lastrowid

    def delete_season(self, season_id):
        with self.get_conn() as conn:
            conn.execute("DELETE FROM seasons WHERE id=?", (season_id,))

    # ─────────────────────────────────────────
    #  EPISODES
    # ─────────────────────────────────────────

    def get_episode(self, ep_id):
        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM episodes WHERE id=?", (ep_id,)).fetchone()
            return dict(row) if row else None

    def add_episode(self, data):
        data_copy = dict(data)
        if 'release_delay_days' not in data_copy:
            data_copy['release_delay_days'] = 0
        with self.get_conn() as conn:
            cur = conn.execute("""
                INSERT INTO episodes (season_id, anime_id, num, title, duration, telegram_url, telegram_file_id, telegram_chat_id, telegram_msg_id, telegram_file_path, is_new, release_delay_days)
                VALUES (:season_id, :anime_id, :num, :title, :duration, :telegram_url, :telegram_file_id, :telegram_chat_id, :telegram_msg_id, :telegram_file_path, :is_new, :release_delay_days)
            """, data_copy)
            return cur.lastrowid

    def update_episode(self, ep_id, data):
        data_copy = dict(data)
        if 'release_delay_days' not in data_copy:
            data_copy['release_delay_days'] = 0
        with self.get_conn() as conn:
            conn.execute("""
                UPDATE episodes SET
                num = :num,
                title = :title,
                duration = :duration,
                telegram_url = :telegram_url,
                telegram_file_id = :telegram_file_id,
                telegram_chat_id = :telegram_chat_id,
                telegram_msg_id = :telegram_msg_id,
                telegram_file_path = :telegram_file_path,
                is_new = :is_new,
                release_delay_days = :release_delay_days
                WHERE id = :id
            """, data_copy)

    def delete_episode(self, ep_id):
        with self.get_conn() as conn:
            conn.execute("DELETE FROM episodes WHERE id=?", (ep_id,))

    def toggle_episode_new(self, ep_id):
        with self.get_conn() as conn:
            conn.execute("UPDATE episodes SET is_new = 1 - is_new WHERE id=?", (ep_id,))

    def get_latest_episodes(self, limit=12):
        with self.get_conn() as conn:
            rows = conn.execute("""
                SELECT e.*, a.title as anime_title, a.icon as anime_icon, s.title as season_title
                FROM episodes e
                JOIN animes a ON e.anime_id = a.id
                JOIN seasons s ON e.season_id = s.id
                ORDER BY e.is_new DESC, e.created_at DESC
                LIMIT ?
            """, (limit,)).fetchall()
            return [dict(r) for r in rows]

    # ─────────────────────────────────────────
    #  GENRES
    # ─────────────────────────────────────────

    def get_all_genres(self):
        with self.get_conn() as conn:
            rows = conn.execute("""
                SELECT g.*, COUNT(ag.anime_id) as count
                FROM genres g
                LEFT JOIN anime_genres ag ON g.name = ag.genre_name
                GROUP BY g.id ORDER BY g.name
            """).fetchall()
            return [dict(r) for r in rows]

    def add_genre(self, data):
        with self.get_conn() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO genres (name, icon, color) VALUES (:name, :icon, :color)", data
            )

    def delete_genre(self, genre_id):
        with self.get_conn() as conn:
            conn.execute("DELETE FROM genres WHERE id=?", (genre_id,))

    # ─────────────────────────────────────────
    #  STATS
    # ─────────────────────────────────────────

    def get_stats(self):
        with self.get_conn() as conn:
            anime_count = conn.execute("SELECT COUNT(*) as cnt FROM animes").fetchone()['cnt']
            ep_count = conn.execute("SELECT COUNT(*) as cnt FROM episodes").fetchone()['cnt']
            user_count = conn.execute("SELECT COUNT(*) as cnt FROM users").fetchone()['cnt']
            season_count = conn.execute("SELECT COUNT(*) as cnt FROM seasons").fetchone()['cnt']
            return {
                'animes': anime_count,
                'episodes': ep_count,
                'users': user_count,
                'seasons': season_count,
            }

    def save_pending_video(self, file_id, caption, chat_id, message_id):
        with self.get_conn() as conn:
            # Ensure chat_id is properly stored (should not be None)
            chat_id_str = str(chat_id) if chat_id else None
            if not chat_id_str:
                # Fallback to VIDEO_STORAGE_GROUP if available
                import os
                from dotenv import load_dotenv
                load_dotenv()
                chat_id_str = os.environ.get('VIDEO_STORAGE_GROUP') or os.environ.get('ADMIN_CHAT_ID')
            
            conn.execute("""
                INSERT INTO pending_videos (file_id, caption, chat_id, message_id)
                VALUES (?,?,?,?)
            """, (file_id, caption, chat_id_str, message_id))

    def get_user_by_username(self, username):
        with self.get_conn() as conn:
            row = conn.execute("SELECT * FROM users WHERE username=?", (username,)).fetchone()
            if not row:
                row = conn.execute("SELECT * FROM users WHERE email=?", (username,)).fetchone()
            return dict(row) if row else None

    def add_payment_and_update_balance(self, username, amount, provider, transaction_id=None):
        with self.get_conn() as conn:
            user_row = conn.execute("SELECT id FROM users WHERE username=?", (username,)).fetchone()
            if not user_row:
                user_row = conn.execute("SELECT id FROM users WHERE email=?", (username,)).fetchone()
            
            user_id = user_row['id'] if user_row else None
            
            conn.execute("""
                INSERT INTO payments (user_id, username, amount, provider, status, transaction_id)
                VALUES (?, ?, ?, ?, 'completed', ?)
            """, (user_id, username, amount, provider, transaction_id))
            
            if user_id:
                conn.execute("UPDATE users SET balance = balance + ? WHERE id = ?", (amount, user_id))
                return True
            return False

    def subscribe_user(self, user_id, plan_type):
        from datetime import timedelta
        cost = 15000 if plan_type == 'premium' else 35000
        days = 30 if plan_type == 'premium' else 90
        
        with self.get_conn() as conn:
            user = conn.execute("SELECT balance, premium_until FROM users WHERE id=?", (user_id,)).fetchone()
            if not user or user['balance'] < cost:
                return False, "Balans yetarli emas"
            
            now = datetime.now()
            if user['premium_until']:
                try:
                    current_until = datetime.strptime(user['premium_until'], '%Y-%m-%d %H:%M:%S')
                    if current_until > now:
                        start_date = current_until
                    else:
                        start_date = now
                except Exception:
                    start_date = now
            else:
                start_date = now
                
            new_until = start_date + timedelta(days=days)
            new_until_str = new_until.strftime('%Y-%m-%d %H:%M:%S')
            
            conn.execute("""
                UPDATE users 
                SET balance = balance - ?, premium_until = ?, premium_type = ?
                WHERE id = ?
            """, (cost, new_until_str, plan_type, user_id))
            
            return True, "Muvaffaqiyatli obuna bo'lindi"

    def get_episode_comments(self, episode_id, current_user_id=None):
        with self.get_conn() as conn:
            rows = conn.execute("""
                SELECT c.*, u.first_name, u.last_name, u.username, u.photo_url, u.is_admin
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.episode_id = ?
                ORDER BY c.created_at DESC
            """, (episode_id,)).fetchall()
            
            comments = []
            for r in rows:
                c = dict(r)
                liked = False
                if current_user_id:
                    like_row = conn.execute(
                        "SELECT 1 FROM comment_likes WHERE user_id=? AND comment_id=?", 
                        (current_user_id, c['id'])
                    ).fetchone()
                    liked = like_row is not None
                c['liked_by_me'] = liked
                comments.append(c)
            return comments

    def add_comment(self, episode_id, user_id, content):
        with self.get_conn() as conn:
            user = conn.execute("SELECT premium_until FROM users WHERE id=?", (user_id,)).fetchone()
            is_premium = False
            if user and user['premium_until']:
                try:
                    until = datetime.strptime(user['premium_until'], '%Y-%m-%d %H:%M:%S')
                    if until > datetime.now():
                        is_premium = True
                except Exception:
                    pass
            
            if not is_premium:
                count = conn.execute(
                    "SELECT COUNT(*) as cnt FROM comments WHERE user_id=?", 
                    (user_id,)
                ).fetchone()['cnt']
                if count >= 3:
                    return None, "Izoh yozish chegaralangan (maksimum 3 ta). Cheksiz izohlar yozish uchun Premium obunani faollashtiring!"
            
            cur = conn.execute("""
                INSERT INTO comments (user_id, episode_id, content)
                VALUES (?, ?, ?)
            """, (user_id, episode_id, content))
            
            comment_id = cur.lastrowid
            row = conn.execute("""
                SELECT c.*, u.first_name, u.last_name, u.username, u.photo_url, u.is_admin
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = ?
            """, (comment_id,)).fetchone()
            
            res = dict(row)
            res['liked_by_me'] = False
            return res, None

    def toggle_comment_like(self, comment_id, user_id):
        with self.get_conn() as conn:
            row = conn.execute(
                "SELECT 1 FROM comment_likes WHERE user_id=? AND comment_id=?", 
                (user_id, comment_id)
            ).fetchone()
            
            if row:
                conn.execute("DELETE FROM comment_likes WHERE user_id=? AND comment_id=?", (user_id, comment_id))
                conn.execute("UPDATE comments SET likes_count = MAX(0, likes_count - 1) WHERE id=?", (comment_id,))
                liked = False
            else:
                conn.execute("INSERT INTO comment_likes (user_id, comment_id) VALUES (?,?)", (user_id, comment_id))
                conn.execute("UPDATE comments SET likes_count = likes_count + 1 WHERE id=?", (comment_id,))
                liked = True
            
            new_count = conn.execute("SELECT likes_count FROM comments WHERE id=?", (comment_id,)).fetchone()['likes_count']
            return liked, new_count

    def get_user_comment_count(self, user_id):
        with self.get_conn() as conn:
            row = conn.execute("SELECT COUNT(*) as cnt FROM comments WHERE user_id=?", (user_id,)).fetchone()
            return row['cnt'] if row else 0

    def rate_anime(self, anime_id, user_id, score):
        if score < 1 or score > 10:
            return False, "Baholash 1 dan 10 gacha bo'lishi kerak"
            
        with self.get_conn() as conn:
            conn.execute("""
                INSERT INTO ratings (user_id, anime_id, rating)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id, anime_id) DO UPDATE SET rating=excluded.rating
            """, (user_id, anime_id, score))
            
            avg_row = conn.execute("SELECT AVG(rating) as avg_score FROM ratings WHERE anime_id=?", (anime_id,)).fetchone()
            avg_score = round(avg_row['avg_score'], 1) if avg_row['avg_score'] else score
            
            conn.execute("UPDATE animes SET score=? WHERE id=?", (avg_score, anime_id))
            return True, avg_score
