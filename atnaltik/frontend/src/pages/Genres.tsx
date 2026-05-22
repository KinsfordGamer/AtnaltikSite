import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Grid, ArrowRight } from 'lucide-react';
import { AnimeAPI } from '../api';

interface Genre {
  id: number;
  name: string;
  icon: string;
  color: string;
  count: number;
}

const Genres: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await AnimeAPI.getGenres();
        setGenres(response.data);
      } catch (err) {
        console.error('Janrlarni yuklashda xatolik:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGenres();
  }, []);

  const handleGenreClick = (genreName: string) => {
    navigate(`/animes?genre=${encodeURIComponent(genreName)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#08080A]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-glow mb-4"></div>
        <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Janrlar yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 md:px-20 min-h-screen bg-mesh">
      {/* Banner */}
      <div className="relative mb-16 rounded-[2.5rem] overflow-hidden glass p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl -ml-20 -mb-20" />
        
        <div className="relative z-10 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 text-accent rounded-full text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles size={12} className="animate-pulse text-accent" />
            Janrlar & Kategoriyalar
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tight uppercase leading-[0.95] mb-4">
            ANIME <span className="text-gradient">JANRLARI</span>
          </h1>
          <p className="text-gray-400 font-medium text-base md:text-lg">
            Sevimli yo'nalishingizni tanlang. Keng ko'lamli janrlar to'plami orqali o'zingizga yoqadigan eng mukammal anime asarlarini toping.
          </p>
        </div>

        <div className="relative z-10 w-full md:w-auto flex flex-col items-center md:items-end gap-3 min-w-[250px]">
          <div className="text-gray-500 font-black text-right hidden md:block">
            <span className="text-5xl text-accent block mb-1 font-heading">{genres.length}</span>
            TA JANR MAVJUD
          </div>
        </div>
      </div>

      {/* Genres Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {genres.map((genre, idx) => {
          // Fallback colors if DB color is default/plain
          const safeColor = genre.color || 'rgba(255, 46, 99, 0.15)';
          
          return (
            <motion.div
              key={genre.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.03, y: -4 }}
              onClick={() => handleGenreClick(genre.name)}
              className="group cursor-pointer relative overflow-hidden glass-card p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col justify-between min-h-[220px]"
            >
              {/* Backlit Glow */}
              <div 
                style={{ backgroundColor: safeColor, opacity: 0.15 }}
                className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-25"
              />
              
              <div 
                style={{ backgroundColor: safeColor }}
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-40 transition-transform duration-500 group-hover:scale-125"
              />

              <div className="relative z-10">
                {/* Icon Circle */}
                <div 
                  style={{ backgroundColor: safeColor }}
                  className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-3xl mb-6 shadow-lg border border-white/10"
                >
                  {genre.icon || '🎭'}
                </div>

                {/* Info */}
                <h3 className="text-2xl font-black italic uppercase mb-2 tracking-tight group-hover:text-primary transition-colors">
                  {genre.name}
                </h3>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">
                  {genre.count} ta anime yuklangan
                </p>
              </div>

              {/* Action Button */}
              <div className="relative z-10 flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-white transition-colors">
                  Animelarni ko'rish
                </span>
                <div 
                  style={{ backgroundColor: safeColor }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform duration-300 group-hover:translate-x-1"
                >
                  <ArrowRight size={18} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Genres;
