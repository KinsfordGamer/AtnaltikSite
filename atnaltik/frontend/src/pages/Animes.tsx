import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Filter, RotateCcw, Star, Play } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimeAPI } from '../api';

const Animes: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre') || '';

  const [animes, setAnimes] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [loading, setLoading] = useState(true);

  // Sync state if URL param changes
  useEffect(() => {
    setSelectedGenre(searchParams.get('genre') || '');
  }, [searchParams]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await AnimeAPI.getGenres();
        setGenres(response.data);
      } catch (err) {
        console.error('Janrlarni olishda xatolik:', err);
      }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
    const fetchFilteredAnimes = async () => {
      setLoading(true);
      try {
        const response = await AnimeAPI.getAnimes(searchQuery, selectedGenre);
        setAnimes(response.data);
      } catch (err) {
        console.error('Animelarni olishda xatolik:', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchFilteredAnimes();
    }, 300); // Debounce search to reduce backend queries

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedGenre]);

  const handleGenreSelect = (genreName: string) => {
    if (selectedGenre === genreName) {
      setSelectedGenre('');
      setSearchParams({});
    } else {
      setSelectedGenre(genreName);
      setSearchParams({ genre: genreName });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSearchParams({});
  };

  return (
    <div className="pt-32 pb-24 px-6 md:px-20 min-h-screen bg-mesh">
      {/* Page Header Banner */}
      <div className="relative mb-16 rounded-[2.5rem] overflow-hidden glass p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -ml-20 -mt-20" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -mr-20 -mb-20" />
        
        <div className="relative z-10 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles size={12} className="animate-pulse" />
            Barcha to'plamlar
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tight uppercase leading-[0.95] mb-4">
            ANIMELAR <span className="text-gradient">DUNYOSI</span>
          </h1>
          <p className="text-gray-400 font-medium text-base md:text-lg">
            Saytimizdagi barcha animelar ro'yxati. Yuqori sifatli va professional o'zbekcha dublyajdagi asarlarni oson qidiring va tomosha qiling.
          </p>
        </div>

        {/* Dynamic Search & Stats */}
        <div className="relative z-10 w-full md:w-auto flex flex-col items-center md:items-end gap-3 min-w-[250px]">
          <div className="text-gray-500 font-black text-right hidden md:block">
            <span className="text-5xl text-white block mb-1 font-heading">{animes.length}</span>
            TA ANIME TOPILDI
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-8 mb-12 relative z-20">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Elegant Search Input */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Animelar ichidan qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-primary/50 focus:bg-white/10 outline-none transition-all duration-300 placeholder:text-gray-600 font-medium text-white shadow-xl"
            />
          </div>

          {/* Reset Filters Trigger */}
          {(searchQuery || selectedGenre) && (
            <button 
              onClick={handleResetFilters}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-white transition-colors glass px-5 py-3.5 rounded-xl border border-primary/20"
            >
              <RotateCcw size={14} />
              Filtrlarni tozalash
            </button>
          )}
        </div>

        {/* Dynamic Genre Pills */}
        <div className="flex flex-wrap gap-2.5 pb-2">
          {genres.map((g) => {
            const isActive = selectedGenre === g.name;
            return (
              <button
                key={g.id}
                onClick={() => handleGenreSelect(g.name)}
                style={{ backgroundColor: isActive ? 'var(--primary)' : g.color || 'rgba(255,255,255,0.05)' }}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-bold transition-all duration-300 hover:scale-105 ${
                  isActive 
                    ? 'border-primary text-white shadow-[0_0_15px_var(--primary-glow)]' 
                    : 'border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                }`}
              >
                <span>{g.icon || '🎭'}</span>
                <span>{g.name}</span>
                <span className="text-[10px] opacity-50 bg-black/20 px-2 py-0.5 rounded-md">{g.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Anime Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-glow mb-4"></div>
          <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Ma'lumotlar yuklanmoqda...</span>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {animes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass p-16 rounded-[2.5rem] text-center max-w-xl mx-auto border border-white/5"
            >
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500">
                <Filter size={36} />
              </div>
              <h3 className="text-2xl font-black italic uppercase mb-2">Anime topilmadi</h3>
              <p className="text-gray-500 font-medium mb-8">
                Qidiruv so'rovi yoki tanlangan janr bo'yicha hech qanday natija topilmadi. Boshqa kalit so'zlardan foydalanib ko'ring.
              </p>
              <button 
                onClick={handleResetFilters}
                className="btn-primary"
              >
                HAMMA ANIMELARNI KO'RISH
              </button>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8"
            >
              {animes.map((anime, idx) => (
                <motion.div
                  key={anime.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                >
                  <Link to={`/anime/${anime.id}`} className="group block">
                    <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden mb-4 shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2 border border-white/5">
                      <img 
                        src={anime.cover_image || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600'} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={anime.title} 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Badge Year */}
                      <div className="absolute top-4 right-4 px-3 py-1 glass rounded-full text-[10px] font-black uppercase tracking-widest">
                        {anime.year}
                      </div>

                      {/* Badge Score */}
                      <div className="absolute top-4 left-4 px-2.5 py-1 glass rounded-full text-[10px] font-black text-yellow-500 flex items-center gap-1">
                        <Star size={10} fill="currentColor" />
                        {anime.score}
                      </div>
                      
                      {/* Hover Info */}
                      <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-white/80 text-[10px] font-black uppercase bg-primary/20 px-2 py-0.5 rounded border border-primary/20">{anime.status}</div>
                        </div>
                        <button className="w-full py-3 bg-white text-black rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                          <Play size={14} fill="black" />
                          KO'RISH
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold truncate transition-colors group-hover:text-primary">
                      {anime.title}
                    </h3>
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">{anime.original_title || 'ATNALTIK DUBBING'}</p>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Animes;
