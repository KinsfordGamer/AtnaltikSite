import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimeAPI } from '../api';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';
import { Play, Star, Calendar, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<any>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      AnimeAPI.getAnime(parseInt(id))
        .then(res => {
          setAnime(res.data);
          // Avtomatik 1-qismni tanlash
          if (res.data.seasons?.[0]?.episodes?.[0]) {
            setSelectedEpisode(res.data.seasons[0].episodes[0]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading || !anime) return <div className="h-screen flex items-center justify-center">Yuklanmoqda...</div>;

  const videoSrc = selectedEpisode ? {
    type: 'video' as const,
    sources: [
      {
        src: AnimeAPI.getStreamUrl(selectedEpisode.id),
        type: 'video/mp4',
      },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-background">
      
      {/* Background Blur */}
      <div className="fixed inset-0 z-0">
        <img src={anime.cover_image} className="w-full h-full object-cover blur-[100px] opacity-20" alt="blur" />
      </div>

      <div className="relative z-10 pt-28 pb-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left: Player & Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Player Container */}
            <div className="glass rounded-3xl overflow-hidden shadow-2xl aspect-video bg-black">
              <AnimatePresence mode="wait">
                {selectedEpisode ? (
                  <motion.div 
                    key={selectedEpisode.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <Plyr 
                      source={videoSrc!} 
                      options={{ 
                        quality: { default: 720, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240] },
                        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen']
                      }} 
                    />
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 italic">
                    Qismni tanlang
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Anime Info */}
            <div className="glass p-8 rounded-3xl">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <h1 className="text-4xl font-black">{anime.title}</h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-400/10 text-yellow-400 rounded-full text-sm font-bold">
                  <Star size={16} fill="currentColor" />
                  {anime.score}
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400 mb-8">
                <span className="flex items-center gap-2"><Calendar size={18} /> {anime.year}</span>
                <span className="flex items-center gap-2"><Clock size={18} /> {anime.status}</span>
                <div className="flex gap-2">
                  {anime.genres?.map((g: any) => (
                    <span key={g.name} className="px-3 py-1 glass rounded-full text-xs text-primary">{g.name}</span>
                  ))}
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed text-lg">
                {anime.description}
              </p>
            </div>
          </div>

          {/* Right: Episodes List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Play size={24} className="text-primary" />
              Qismlar
            </h2>
            
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {anime.seasons?.map((season: any) => (
                <div key={season.id} className="space-y-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">
                    {season.title}
                  </div>
                  {season.episodes?.map((ep: any) => (
                    <button
                      key={ep.id}
                      onClick={() => setSelectedEpisode(ep)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                        selectedEpisode?.id === ep.id 
                          ? 'bg-primary/20 border-primary shadow-glow' 
                          : 'glass border-transparent hover:border-white/20'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        selectedEpisode?.id === ep.id ? 'bg-primary text-white' : 'bg-white/10 text-gray-400'
                      }`}>
                        {ep.num}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold line-clamp-1">{ep.title}</div>
                        <div className="text-xs text-gray-500">{ep.duration}</div>
                      </div>
                      <ChevronRight size={18} className={selectedEpisode?.id === ep.id ? 'text-primary' : 'text-gray-400'} />
                    </button>
                  ))}
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
