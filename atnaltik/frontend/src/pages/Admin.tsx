import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, PlusCircle, Film, Users, LogOut, 
  Trash2, Edit, X, Save, FilmIcon, Plus, Eye, ListOrdered 
} from 'lucide-react';
import { AnimeAPI } from '../api';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('animes');
  const [animes, setAnimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Anime Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAnime, setNewAnime] = useState({
    title: '',
    original_title: '',
    description: '',
    cover_image: '',
    year: new Date().getFullYear(),
    status: 'Davom etmoqda',
    score: 8.5,
    voice_actors: '',
    translators: '',
    genres_str: 'Aksiya'
  });

  // Edit Anime Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnime, setEditingAnime] = useState<any>(null);

  // Add Episode Modal State
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [selectedAnimeId, setSelectedAnimeId] = useState<number | null>(null);
  const [newEpisode, setNewEpisode] = useState({
    title: '',
    num: 1,
    duration: '24 dq',
    telegram_chat_id: '',
    telegram_msg_id: 0,
    telegram_file_id: '',
    telegram_url: '',
    release_delay_days: 0
  });

  // Manage Episodes Modal State
  const [showManageEpisodesModal, setShowManageEpisodesModal] = useState(false);
  const [animeWithEpisodes, setAnimeWithEpisodes] = useState<any>(null);

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
      const genres = newAnime.genres_str
        .split(',')
        .map(g => g.trim())
        .filter(Boolean);

      await AnimeAPI.createAnime({
        ...newAnime,
        genres
      });
      
      setShowAddModal(false);
      setNewAnime({
        title: '',
        original_title: '',
        description: '',
        cover_image: '',
        year: new Date().getFullYear(),
        status: 'Davom etmoqda',
        score: 8.5,
        voice_actors: '',
        translators: '',
        genres_str: 'Aksiya'
      });
      fetchData();
      alert("Anime muvaffaqiyatli qo'shildi!");
    } catch (err) {
      alert("Xatolik yuz berdi!");
    }
  };

  const handleUpdateAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnime) return;
    try {
      const genres = editingAnime.genres_str
        .split(',')
        .map((g: string) => g.trim())
        .filter(Boolean);

      await AnimeAPI.updateAnime(editingAnime.id, {
        ...editingAnime,
        genres
      });
      
      setShowEditModal(false);
      setEditingAnime(null);
      fetchData();
      alert("Anime ma'lumotlari yangilandi!");
    } catch (err) {
      alert("Xatolik yuz berdi!");
    }
  };

  const handleDeleteAnime = async (animeId: number, title: string) => {
    if (!window.confirm(`Haqiqatan ham "${title}" animesini butunlay o'chirmoqchisiz?\nBarcha fasl va epizodlar ham o'chib ketadi!`)) {
      return;
    }
    try {
      await AnimeAPI.deleteAnime(animeId);
      fetchData();
      alert("Anime o'chirildi!");
    } catch (err) {
      alert("O'chirishda xatolik yuz berdi!");
    }
  };

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimeId) return;
    try {
      await AnimeAPI.addEpisode({
        ...newEpisode,
        anime_id: selectedAnimeId,
        season_id: 1 // Default birinchi fasl
      });
      setShowEpisodeModal(false);
      setNewEpisode({
        title: '',
        num: 1,
        duration: '24 dq',
        telegram_chat_id: '',
        telegram_msg_id: 0,
        telegram_file_id: '',
        telegram_url: '',
        release_delay_days: 0
      });
      alert("Epizod muvaffaqiyatli qo'shildi!");
      fetchData();
    } catch (err) {
      alert("Epizod qo'shishda xatolik yuz berdi!");
    }
  };

  const handleOpenManageEpisodes = async (animeId: number) => {
    try {
      const res = await AnimeAPI.getAnime(animeId);
      setAnimeWithEpisodes(res.data);
      setShowManageEpisodesModal(true);
    } catch (err) {
      alert("Epizodlarni yuklashda xatolik yuz berdi.");
    }
  };

  const handleDeleteEpisode = async (episodeId: number, num: number) => {
    if (!window.confirm(`Haqiqatan ham ${num}-qismni o'chirib tashlamoqchisiz?`)) {
      return;
    }
    try {
      await AnimeAPI.deleteEpisode(episodeId);
      alert("Qism muvaffaqiyatli o'chirildi!");
      
      // Refresh managed anime episodes list
      if (animeWithEpisodes) {
        const res = await AnimeAPI.getAnime(animeWithEpisodes.id);
        setAnimeWithEpisodes(res.data);
      }
      fetchData();
    } catch (err) {
      alert("Qismni o'chirishda xatolik yuz berdi.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen pt-24 bg-background flex flex-col md:flex-row">
      {/* Mobile Tab Navigation */}
      <div className="flex md:hidden bg-[#0d0d11]/90 backdrop-blur-md border-b border-white/5 p-4 justify-around sticky top-[64px] z-30">
        <button 
          onClick={() => setActiveTab('animes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'animes' ? 'bg-primary text-white shadow-glow' : 'text-gray-400'}`}
        >
          <Film size={14} />
          Animelar
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-glow' : 'text-gray-400'}`}
        >
          <Users size={14} />
          Foydalanuvchilar
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-primary/80"
        >
          <LogOut size={14} />
          Chiqish
        </button>
      </div>

      {/* Sidebar (Desktop) */}
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
      <main className="flex-grow p-4 md:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {activeTab === 'animes' ? 'Animelar boshqaruvi' : 'Foydalanuvchilar boshqaruvi'}
            </h1>
            <p className="text-gray-400 text-sm">Tizimdagi barcha {activeTab === 'animes' ? 'animelarni' : 'foydalanuvchilarni'} boshqarish.</p>
          </div>
          {activeTab === 'animes' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center justify-center gap-2 self-start sm:self-auto w-full sm:w-auto"
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
          <div className="glass-card overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
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
                        <img src={anime.cover_image} className="w-10 h-10 rounded-lg object-cover bg-white/5 flex-shrink-0" alt="" />
                        <div className="max-w-[200px] sm:max-w-xs truncate">
                          <p className="font-bold text-sm truncate">{anime.title}</p>
                          <p className="text-xs text-gray-500 truncate">{anime.original_title}</p>
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
                          <Plus size={12} />
                          Qism
                        </button>
                        <button 
                          onClick={() => handleOpenManageEpisodes(anime.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 hover:bg-accent/25 rounded-lg text-xs text-accent transition-all font-semibold"
                        >
                          <ListOrdered size={12} />
                          Ro'yxat
                        </button>
                        <button 
                          onClick={() => {
                            setEditingAnime({
                              ...anime,
                              genres_str: anime.genres ? anime.genres.join(', ') : ''
                            });
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAnime(anime.id, anime.title)}
                          className="p-2 hover:bg-primary/20 rounded-lg text-gray-400 hover:text-primary transition-all"
                        >
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
          <div className="text-center py-20 glass rounded-2xl border border-white/5 px-6">
            <Users size={48} className="mx-auto mb-4 text-gray-600 animate-pulse" />
            <h3 className="text-xl font-bold mb-2">Foydalanuvchilar ro'yxati</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Tez kunda bu yerda barcha ro'yxatdan o'tgan foydalanuvchilar va adminlarni boshqarish imkoniyati qo'shiladi.</p>
          </div>
        )}
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-2xl glass-card p-6 md:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/5 pt-1 pb-4 border-b border-white/5 z-20">
                <h2 className="text-xl md:text-2xl font-bold italic tracking-tight">YANGI ANIME QO'SHISH</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddAnime} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Anime nomi</label>
                  <input 
                    type="text" required
                    value={newAnime.title}
                    onChange={e => setNewAnime({...newAnime, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="Naruto"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Original nomi (JP)</label>
                  <input 
                    type="text"
                    value={newAnime.original_title}
                    onChange={e => setNewAnime({...newAnime, original_title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="NARUTO"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Rasm havolasi (Cover URL)</label>
                  <input 
                    type="text" required
                    value={newAnime.cover_image}
                    onChange={e => setNewAnime({...newAnime, cover_image: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Janrlar (Vergul bilan ajrating)</label>
                  <input 
                    type="text" required
                    value={newAnime.genres_str}
                    onChange={e => setNewAnime({...newAnime, genres_str: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="Aksiya, Sarguzasht, Fantastika"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tavsif (Description)</label>
                  <textarea 
                    rows={3}
                    value={newAnime.description}
                    onChange={e => setNewAnime({...newAnime, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="Anime haqida qisqacha..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ovoz berdi (Voice Actors)</label>
                  <input 
                    type="text"
                    value={newAnime.voice_actors}
                    onChange={e => setNewAnime({...newAnime, voice_actors: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="Ism1, Ism2, ..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tarjimon (Translators)</label>
                  <input 
                    type="text"
                    value={newAnime.translators}
                    onChange={e => setNewAnime({...newAnime, translators: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="Ism1, Ism2, ..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Yili</label>
                  <input 
                    type="number"
                    value={newAnime.year}
                    onChange={e => setNewAnime({...newAnime, year: parseInt(e.target.value) || new Date().getFullYear()})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Holati</label>
                  <select 
                    value={newAnime.status}
                    onChange={e => setNewAnime({...newAnime, status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
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

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingAnime && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditModal(false);
                setEditingAnime(null);
              }}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-2xl glass-card p-6 md:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-background/5 pt-1 pb-4 border-b border-white/5 z-20">
                <h2 className="text-xl md:text-2xl font-bold italic tracking-tight">ANIMENI TAHRIRLASH</h2>
                <button onClick={() => {
                  setShowEditModal(false);
                  setEditingAnime(null);
                }} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateAnime} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Anime nomi</label>
                  <input 
                    type="text" required
                    value={editingAnime.title}
                    onChange={e => setEditingAnime({...editingAnime, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Original nomi (JP)</label>
                  <input 
                    type="text"
                    value={editingAnime.original_title || ''}
                    onChange={e => setEditingAnime({...editingAnime, original_title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Rasm havolasi (Cover URL)</label>
                  <input 
                    type="text" required
                    value={editingAnime.cover_image || ''}
                    onChange={e => setEditingAnime({...editingAnime, cover_image: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Janrlar (Vergul bilan ajrating)</label>
                  <input 
                    type="text" required
                    value={editingAnime.genres_str || ''}
                    onChange={e => setEditingAnime({...editingAnime, genres_str: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tavsif (Description)</label>
                  <textarea 
                    rows={3}
                    value={editingAnime.description || ''}
                    onChange={e => setEditingAnime({...editingAnime, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ovoz berdi (Voice Actors)</label>
                  <input 
                    type="text"
                    value={editingAnime.voice_actors || ''}
                    onChange={e => setEditingAnime({...editingAnime, voice_actors: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="Ism1, Ism2, ..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tarjimon (Translators)</label>
                  <input 
                    type="text"
                    value={editingAnime.translators || ''}
                    onChange={e => setEditingAnime({...editingAnime, translators: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="Ism1, Ism2, ..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Yili</label>
                  <input 
                    type="number"
                    value={editingAnime.year || 2024}
                    onChange={e => setEditingAnime({...editingAnime, year: parseInt(e.target.value) || 2024})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Holati</label>
                  <select 
                    value={editingAnime.status || 'Davom etmoqda'}
                    onChange={e => setEditingAnime({...editingAnime, status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                  >
                    <option value="Davom etmoqda">Davom etmoqda</option>
                    <option value="Tugallangan">Tugallangan</option>
                    <option value="Tez kunda">Tez kunda</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 pt-4">
                  <button type="submit" className="w-full btn-primary py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-rose-600">
                    <Save size={20} />
                    O'zgarishlarni saqlash
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Episode Modal */}
      <AnimatePresence>
        {showEpisodeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEpisodeModal(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-lg glass-card p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/5">
                <h2 className="text-xl font-bold italic uppercase">Epizod qo'shish</h2>
                <button onClick={() => setShowEpisodeModal(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddEpisode} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Epizod nomi</label>
                  <input 
                    type="text" required
                    value={newEpisode.title}
                    onChange={e => setNewEpisode({...newEpisode, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="1-qism: Boshlanish"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Qism raqami</label>
                    <input 
                      type="number" required
                      value={newEpisode.num}
                      onChange={e => setNewEpisode({...newEpisode, num: parseInt(e.target.value) || 1})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Davomiyligi</label>
                    <input 
                      type="text"
                      value={newEpisode.duration}
                      onChange={e => setNewEpisode({...newEpisode, duration: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kechikish muddati (kunlarda, bepul foydalanuvchilar uchun)</label>
                  <input 
                    type="number" min="0" required
                    value={newEpisode.release_delay_days}
                    onChange={e => setNewEpisode({...newEpisode, release_delay_days: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                    placeholder="0"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Epizod qo'shilgandan so'ng bepul foydalanuvchilar uchun necha kundan keyin ochilishini belgilaydi. 0 = darhol barchaga ochiladi. Premium foydalanuvchilar uchun kechikish ta'sir qilmaydi.
                  </p>
                </div>
                
                {/* Optional Telethon File ID, Chat ID and Message ID */}
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <span className="text-[10px] uppercase font-black tracking-widest text-primary block">Integratsiya (Telegram bot / MTProto proxy)</span>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Telegram Chat ID (Video yuborilgan chat)</label>
                    <input 
                      type="text"
                      value={newEpisode.telegram_chat_id}
                      onChange={e => setNewEpisode({...newEpisode, telegram_chat_id: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                      placeholder="7618637796 yoki -100..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Telegram Message ID</label>
                    <input 
                      type="number"
                      value={newEpisode.telegram_msg_id}
                      onChange={e => setNewEpisode({...newEpisode, telegram_msg_id: parseInt(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                      placeholder="110"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Telegram File ID (Bot API stream uchun)</label>
                    <input 
                      type="text"
                      value={newEpisode.telegram_file_id}
                      onChange={e => setNewEpisode({...newEpisode, telegram_file_id: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                      placeholder="BQACAgIAAx..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Telegram URL (Tashqi havola, ixtiyoriy)</label>
                    <input 
                      type="text"
                      value={newEpisode.telegram_url}
                      onChange={e => setNewEpisode({...newEpisode, telegram_url: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:border-primary/50 outline-none text-sm"
                      placeholder="https://t.me/..."
                    />
                  </div>
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

      {/* Manage Episodes Modal */}
      <AnimatePresence>
        {showManageEpisodesModal && animeWithEpisodes && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowManageEpisodesModal(false);
                setAnimeWithEpisodes(null);
              }}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-xl glass-card p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/5 sticky top-0 bg-background/5 z-20">
                <div>
                  <h2 className="text-xl font-bold italic uppercase text-accent">QISMLAR BOSHQARUVI</h2>
                  <p className="text-xs text-gray-400 mt-1">{animeWithEpisodes.title}</p>
                </div>
                <button onClick={() => {
                  setShowManageEpisodesModal(false);
                  setAnimeWithEpisodes(null);
                }} className="p-2 hover:bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {animeWithEpisodes.seasons?.length === 0 || 
                 animeWithEpisodes.seasons?.every((s: any) => s.episodes?.length === 0) ? (
                  <div className="text-center py-10 text-gray-500 italic">
                    Hali bu anime uchun epizodlar kiritilmagan.
                  </div>
                ) : (
                  animeWithEpisodes.seasons.map((season: any) => (
                    <div key={season.id} className="space-y-3">
                      <div className="text-xs font-black tracking-widest text-primary uppercase bg-white/5 px-3 py-1.5 rounded-lg">
                        {season.title} ({season.episodes?.length || 0} ta qism)
                      </div>
                      
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {season.episodes?.map((ep: any) => (
                          <div 
                            key={ep.id}
                            className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
                                {ep.num}
                              </div>
                              <div>
                                <span className="font-bold text-sm block">{ep.title}</span>
                                <span className="text-[10px] text-gray-500">{ep.duration}</span>
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => handleDeleteEpisode(ep.id, ep.num)}
                              className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary transition-colors"
                              title="O'chirish"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Admin;
