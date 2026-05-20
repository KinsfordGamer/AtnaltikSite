import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, PlusCircle, Film, Users, Settings, LogOut, Trash2, Edit, X, Save } from 'lucide-react';
import { AnimeAPI } from '../api';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('animes');
  const [animes, setAnimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newAnime, setNewAnime] = useState({
    title: '',
    original_title: '',
    description: '',
    cover_image: '',
    year: new Date().getFullYear(),
    status: 'Davom etmoqda',
    score: 8.5
  });

  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [newEpisode, setNewEpisode] = useState({
    title: '',
    num: 1,
    duration: '24 dq',
    telegram_chat_id: '',
    telegram_msg_id: 0
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'animes') {
        const res = await AnimeAPI.getAnimes();
        setAnimes(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AnimeAPI.createAnime(newAnime);
      setShowAddModal(false);
      setNewAnime({
        title: '',
        original_title: '',
        description: '',
        cover_image: '',
        year: new Date().getFullYear(),
        status: 'Davom etmoqda',
        score: 8.5
      });
      fetchData();
    } catch (err) {
      alert("Xatolik yuz berdi!");
    }
  };

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimeId) return;
    try {
      // Epizod qo'shishda anime_id va season_id (hozircha 1) kerak
      await AnimeAPI.addEpisode({
        ...newEpisode,
        anime_id: selectedAnimeId,
        season_id: 1 // Default birinchi fasl
      });
      setShowEpisodeModal(false);
      alert("Epizod qo'shildi!");
    } catch (err) {
      alert("Xatolik yuz berdi!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen pt-24 bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 p-6 space-y-8 hidden md:block">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard size={18} color="white" />
          </div>
          <span className="font-black tracking-tight italic">ADMIN PANEL</span>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('animes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'animes' ? 'bg-primary text-white shadow-glow' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Film size={18} />
            <span className="text-sm font-semibold">Animelar</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-glow' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Users size={18} />
            <span className="text-sm font-semibold">Foydalanuvchilar</span>
          </button>
        </nav>

        <div className="pt-20">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-primary hover:bg-primary/10 transition-all"
          >
            <LogOut size={18} />
            <span className="text-sm font-semibold">Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {activeTab === 'animes' ? 'Animelar boshqaruvi' : 'Foydalanuvchilar boshqaruvi'}
            </h1>
            <p className="text-gray-400 text-sm">Tizimdagi barcha {activeTab === 'animes' ? 'animelarni' : 'foydalanuvchilarni'} boshqarish.</p>
          </div>
          {activeTab === 'animes' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusCircle size={20} />
              Yangi anime
            </button>
          )}
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 glass rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'animes' ? (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-4 text-center w-16">ID</th>
                  <th className="px-6 py-4">Anime nomi</th>
                  <th className="px-6 py-4">Reyting</th>
                  <th className="px-6 py-4">Holat</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {animes.map(anime => (
                  <tr key={anime.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-center text-gray-500 font-mono text-xs">{anime.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={anime.cover_image} className="w-10 h-10 rounded-lg object-cover bg-white/5" alt="" />
                        <div>
                          <p className="font-bold text-sm">{anime.title}</p>
                          <p className="text-xs text-gray-500">{anime.original_title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-xs font-bold">
                        ★ {anime.score}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-xs px-2 py-1 rounded-full ${anime.status === 'Tugallangan' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {anime.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedAnimeId(anime.id);
                            setShowEpisodeModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-all"
                        >
                          <PlusCircle size={14} />
                          Epizod
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 hover:bg-primary/20 rounded-lg text-gray-400 hover:text-primary transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 glass rounded-2xl border border-white/5">
            <Users size={48} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-bold mb-2">Foydalanuvchilar ro'yxati</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Tez kunda bu yerda barcha foydalanuvchilarni ko'rish va ularni admin qilish imkoniyati paydo bo'ladi.</p>
          </div>
        )}
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-2xl glass-card p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold italic">YANGI ANIME QO'SHISH</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddAnime} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Anime nomi</label>
                  <input 
                    type="text" required
                    value={newAnime.title}
                    onChange={e => setNewAnime({...newAnime, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                    placeholder="Naruto"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Original nomi (JP)</label>
                  <input 
                    type="text"
                    value={newAnime.original_title}
                    onChange={e => setNewAnime({...newAnime, original_title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                    placeholder="NARUTO"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Rasm havolasi (Cover URL)</label>
                  <input 
                    type="text" required
                    value={newAnime.cover_image}
                    onChange={e => setNewAnime({...newAnime, cover_image: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tavsif (Description)</label>
                  <textarea 
                    rows={3}
                    value={newAnime.description}
                    onChange={e => setNewAnime({...newAnime, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                    placeholder="Anime haqida qisqacha..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Yili</label>
                  <input 
                    type="number"
                    value={newAnime.year}
                    onChange={e => setNewAnime({...newAnime, year: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Holati</label>
                  <select 
                    value={newAnime.status}
                    onChange={e => setNewAnime({...newAnime, status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                  >
                    <option value="Davom etmoqda">Davom etmoqda</option>
                    <option value="Tugallangan">Tugallangan</option>
                    <option value="Tez kunda">Tez kunda</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 pt-4">
                  <button type="submit" className="w-full btn-primary py-4 flex items-center justify-center gap-2">
                    <Save size={20} />
                    Saqlash
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Episode Modal */}
      <AnimatePresence>
        {showEpisodeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEpisodeModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-lg glass-card p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold italic uppercase">Epizod qo'shish</h2>
                <button onClick={() => setShowEpisodeModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddEpisode} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Epizod nomi</label>
                  <input 
                    type="text" required
                    value={newEpisode.title}
                    onChange={e => setNewEpisode({...newEpisode, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                    placeholder="1-qism: Boshlanish"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Qism raqami</label>
                    <input 
                      type="number" required
                      value={newEpisode.num}
                      onChange={e => setNewEpisode({...newEpisode, num: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Davomiyligi</label>
                    <input 
                      type="text"
                      value={newEpisode.duration}
                      onChange={e => setNewEpisode({...newEpisode, duration: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 text-primary">Telegram Chat ID</label>
                  <input 
                    type="text" required
                    value={newEpisode.telegram_chat_id}
                    onChange={e => setNewEpisode({...newEpisode, telegram_chat_id: e.target.value})}
                    className="w-full bg-white/5 border border-primary/20 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                    placeholder="7618637796 yoki -100..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1 text-primary">Telegram Message ID</label>
                  <input 
                    type="number" required
                    value={newEpisode.telegram_msg_id}
                    onChange={e => setNewEpisode({...newEpisode, telegram_msg_id: parseInt(e.target.value)})}
                    className="w-full bg-white/5 border border-primary/20 rounded-xl py-3 px-4 focus:border-primary/50 outline-none"
                    placeholder="110"
                  />
                </div>
                
                <button type="submit" className="w-full btn-primary py-4 flex items-center justify-center gap-2">
                  <Save size={20} />
                  Epizodni saqlash
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
