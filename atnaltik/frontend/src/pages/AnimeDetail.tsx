import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AnimeAPI, AuthAPI } from '../api';
import { Play, Star, Calendar, Clock, ChevronRight, Lock, Crown, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const AnimeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [anime, setAnime] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [ratingMessage, setRatingMessage] = useState('');

  useEffect(() => {
    if (id) {
      Promise.all([
        AnimeAPI.getAnime(parseInt(id)),
        AuthAPI.getMe().catch(() => ({ data: null }))
      ])
      .then(([animeRes, userRes]) => {
        setAnime(animeRes.data);
        if (userRes && userRes.data) {
          setUser(userRes.data);
        }
      })
      .finally(() => setLoading(false));
    }
  }, [id]);

  const handleRate = async (score: number) => {
    try {
      setUserRating(score);
      const res = await AnimeAPI.rateAnime(anime.id, score);
      if (res.data.success) {
        setAnime((prev: any) => ({ ...prev, score: res.data.average_score }));
        setRatingMessage(`Rahmat! Siz ${score} ball berdingiz.`);
        setTimeout(() => setRatingMessage(''), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setRatingMessage(err.response?.data?.detail || "Baholashda xatolik.");
    }
  };

  if (loading || !anime) return <div className="h-screen flex items-center justify-center">Yuklanmoqda...</div>;

  // First episode to start watching
  const firstEpisode = anime.seasons?.[0]?.episodes?.[0];

  return (
    <div className="min-h-screen bg-background relative">
      
      {/* Background Blur */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img 
          src={anime.cover_image} 
          className="w-full h-full object-cover blur-[100px] opacity-20 scale-110" 
          alt="blur" 
        />
      </div>

      <div className="relative z-10 pt-28 pb-20 max-w-7xl mx-auto px-6">
        
        {/* Back Link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          Bosh sahifaga qaytish
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left: Banner & Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Banner Container */}
            <div className="glass rounded-3xl overflow-hidden shadow-2xl aspect-video bg-black relative group border border-white/5">
              <img 
                src={anime.cover_image} 
                className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" 
                alt={anime.title} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-transparent to-transparent" />
              
              {/* Play Button Overlay */}
              {firstEpisode ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <button 
                    onClick={() => navigate(`/anime/${anime.id}/episode/${firstEpisode.id}`)}
                    className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-glow transition-transform duration-300 hover:scale-110 active:scale-95 group/btn"
                  >
                    <Play size={32} className="text-white fill-white translate-x-0.5 transition-transform group-hover/btn:scale-110" />
                  </button>
                  <span className="mt-4 font-bold text-lg text-white uppercase tracking-wider font-heading drop-shadow-md">
                    Tomosha qilishni boshlash
                  </span>
                  <span className="text-xs text-gray-300 mt-1">1-qismdan boshlash</span>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic">
                  Hali qismlar yuklanmagan
                </div>
              )}
            </div>

            {/* Anime Info */}
            <div className="glass-card p-8 border border-white/5">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <h1 className="text-2xl sm:text-4xl font-black italic">{anime.title}</h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-400/10 text-yellow-400 rounded-full text-sm font-bold border border-yellow-400/10">
                  <Star size={16} fill="currentColor" />
                  {anime.score}
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400 mb-8 font-semibold">
                <span className="flex items-center gap-2"><Calendar size={18} /> {anime.year}</span>
                <span className="flex items-center gap-2"><Clock size={18} /> {anime.status}</span>
                <div className="flex flex-wrap gap-2">
                  {anime.genres?.map((g: string) => (
                    <span key={g} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs text-primary">{g}</span>
                  ))}
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                {anime.description}
              </p>

              <div className="mt-8 p-6 bg-white/5 border border-white/5 rounded-3xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-sm text-gray-400 uppercase tracking-[0.2em] font-semibold mb-2">10 ballik baholash</div>
                    <div className="flex flex-wrap gap-1">
                      {[1,2,3,4,5,6,7,8,9,10].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(null)}
                          onClick={() => handleRate(star)}
                          className="transition-transform active:scale-95"
                        >
                          <Star
                            size={20}
                            className={`transition-all ${
                              (hoveredRating !== null ? star <= hoveredRating : star <= userRating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-500 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-[0.24em] text-gray-500 mb-1">O'rtacha reyting</div>
                    <div className="font-black text-3xl text-yellow-300">{anime.score?.toFixed ? anime.score.toFixed(1) : anime.score}</div>
                  </div>
                </div>
                {ratingMessage && <div className="mt-4 text-sm text-primary">{ratingMessage}</div>}
              </div>

              {(anime.voice_actors || anime.translators) && (
                <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {anime.voice_actors && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Ovoz berdi</h4>
                      <blockquote className="bg-white/5 border-l-2 border-primary p-4 rounded-r-2xl text-gray-300 font-medium italic">
                        {anime.voice_actors}
                      </blockquote>
                    </div>
                  )}
                  {anime.translators && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Tarjimon</h4>
                      <blockquote className="bg-white/5 border-l-2 border-accent p-4 rounded-r-2xl text-gray-300 font-medium italic">
                        {anime.translators}
                      </blockquote>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Episodes List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 font-heading italic uppercase">
              <Play size={24} className="text-primary" />
              Qismlar
            </h2>
            
            <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {anime.seasons?.map((season: any) => (
                <div key={season.id} className="space-y-3">
                  <div className="text-xs font-black text-gray-500 uppercase tracking-widest px-2">
                    {season.title}
                  </div>
                  {season.episodes?.map((ep: any) => {
                    // Check if episode is premium locked for current user
                    const delayDays = ep.release_delay_days || 0;
                    const isPremium = user?.is_premium;
                    const createdAtTime = new Date(ep.created_at.replace(' ', 'T') + 'Z').getTime();
                    const unlockTime = createdAtTime + delayDays * 24 * 60 * 60 * 1000;
                    const isLocked = delayDays > 0 && !isPremium && new Date().getTime() < unlockTime;

                    return (
                      <button
                        key={ep.id}
                        onClick={() => navigate(`/anime/${anime.id}/episode/${ep.id}`)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all border glass border-transparent hover:border-white/10 hover:bg-white/[0.08]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-gray-400 shrink-0">
                          {ep.num}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-bold line-clamp-1 text-sm md:text-base text-white">{ep.title}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{ep.duration}</span>
                            {delayDays > 0 && (
                              <span className="flex items-center gap-1 text-[10px] bg-primary/20 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-bold">
                                <Crown size={10} /> Premium
                              </span>
                            )}
                          </div>
                        </div>
                        {isLocked ? (
                          <Lock size={18} className="text-primary shrink-0" />
                        ) : (
                          <ChevronRight size={18} className="text-gray-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnimeDetail;
