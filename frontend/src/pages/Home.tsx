import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Info, TrendingUp, Clock, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimeAPI } from '../api';

const Home: React.FC = () => {
  const [animes, setAnimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const response = await AnimeAPI.getAnimes();
        setAnimes(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080A]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-glow"></div>
      </div>
    );
  }

  const featured = animes[0] || {
    title: 'Demon Slayer: Kimetsu no Yaiba',
    description: 'Tanjiro Kamado, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon.',
    cover_image: 'https://images.alphacoders.com/102/1026600.jpg',
    year: 2019,
    score: 8.7,
    status: 'Tugallangan'
  };

  return (
    <div className="pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[90vh] w-full flex items-center px-6 md:px-20">
        <div className="absolute inset-0 z-0">
          <img 
            src={featured.cover_image} 
            className="w-full h-full object-cover opacity-40" 
            alt={featured.title} 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08080A] via-[#08080A]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold tracking-widest uppercase">
                #1 Trendda
              </span>
              <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                <Star size={16} fill="currentColor" />
                {featured.score}
              </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black italic mb-6 leading-[0.9] tracking-tighter text-gradient">
              {featured.title.toUpperCase()}
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl mb-10 line-clamp-3 font-medium max-w-xl">
              {featured.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to={`/anime/${featured.id}`} className="btn-primary flex items-center gap-3">
                <Play fill="white" />
                HOZIR KO'RISH
              </Link>
              <button className="px-8 py-4 glass hover:bg-white/10 rounded-2xl font-bold flex items-center gap-3 transition-all">
                <Info size={20} />
                BATAFSIL
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Anime Grid Section */}
      <section className="px-6 md:px-20 -mt-20 relative z-20">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-1 h-10 bg-primary rounded-full" />
            <h2 className="text-4xl font-black italic tracking-tight uppercase">Yangi animelar</h2>
          </div>
          <Link to="/animes" className="text-gray-400 hover:text-primary flex items-center gap-2 font-bold transition-colors group">
            Hammasini ko'rish
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {animes.map((anime, idx) => (
            <motion.div
              key={anime.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link to={`/anime/${anime.id}`} className="group block">
                <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden mb-4 shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                  <img 
                    src={anime.cover_image} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    alt={anime.title} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 glass rounded-full text-[10px] font-black uppercase tracking-widest">
                    {anime.year}
                  </div>
                  
                  {/* Hover Info */}
                  <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                        <Star size={12} fill="currentColor" />
                        {anime.score}
                      </div>
                      <span className="text-white/40 text-xs">|</span>
                      <div className="text-white/60 text-[10px] font-bold uppercase">{anime.status}</div>
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
                <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">{anime.original_title}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="mt-40 px-6 md:px-20">
        <div className="glass-card p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center gap-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="flex-grow">
            <h2 className="text-5xl font-black italic mb-6 leading-tight">
              O'ZBEK TILIDAGI <br /> <span className="text-primary">ENG SIFATLI</span> DUBLYAJ
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl">
              Atnaltik Dubbing jamoasi siz uchun eng so'nggi va eng sara animelarni o'zbek tiliga yuqori sifatda o'girib boradi. Biz bilan anime dunyosi yanada yorqinroq!
            </p>
            <div className="flex gap-10">
              <div>
                <div className="text-4xl font-black text-white mb-1">500+</div>
                <div className="text-gray-500 text-sm font-bold uppercase tracking-widest">Animelar</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white mb-1">10k+</div>
                <div className="text-gray-500 text-sm font-bold uppercase tracking-widest">Foydalanuvchilar</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white mb-1">HD</div>
                <div className="text-gray-500 text-sm font-bold uppercase tracking-widest">Sifat</div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3 aspect-square glass rounded-[3rem] p-4 relative">
             <div className="w-full h-full bg-primary/20 rounded-[2.5rem] flex items-center justify-center overflow-hidden">
                <Play size={80} className="text-primary shadow-glow animate-pulse" fill="currentColor" />
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
