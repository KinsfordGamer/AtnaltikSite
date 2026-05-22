import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AnimeAPI, CommentsAPI, AuthAPI } from '../api';
import Plyr from 'plyr-react';
import 'plyr/dist/plyr.css';
import { 
  Play, Star, Calendar, Clock, ChevronRight, ChevronLeft, 
  Lock, Crown, Heart, Send, Sparkles, MessageSquare, AlertCircle, ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EpisodeWatch: React.FC = () => {
  const { animeId, episodeId } = useParams<{ animeId: string; episodeId: string }>();
  const navigate = useNavigate();
  
  const [anime, setAnime] = useState<any>(null);
  const [episode, setEpisode] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [userCommentCount, setUserCommentCount] = useState(0);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentError, setCommentError] = useState('');
  
  // Rating states
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [ratingMessage, setRatingMessage] = useState('');

  // Ad states
  const [showAd, setShowAd] = useState(false);
  const [adSeconds, setAdSeconds] = useState(30);
  
  // Navigation lists
  const [allEpisodes, setAllEpisodes] = useState<any[]>([]);
  const [prevEpisode, setPrevEpisode] = useState<any>(null);
  const [nextEpisode, setNextEpisode] = useState<any>(null);

  const parseLocalDate = (dateString: string) => {
    if (!dateString) return new Date('');
    return new Date(dateString.replace(' ', 'T'));
  };

  useEffect(() => {
    if (animeId && episodeId) {
      loadPageData();
    }
  }, [animeId, episodeId]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setCommentError('');
      
      // 1. Get user profile
      let currentUser = null;
      try {
        const userRes = await AuthAPI.getMe();
        currentUser = userRes.data;
        setUser(currentUser);
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      // 2. Get anime and episodes
      const animeRes = await AnimeAPI.getAnime(parseInt(animeId!));
      const animeData = animeRes.data;
      setAnime(animeData);

      // Flatten episodes to find previous/next
      const epsList: any[] = [];
      animeData.seasons?.forEach((season: any) => {
        season.episodes?.forEach((ep: any) => {
          epsList.push({ ...ep, seasonTitle: season.title });
        });
      });
      setAllEpisodes(epsList);

      const epIdNum = parseInt(episodeId!);
      const currentEp = epsList.find(e => e.id === epIdNum);
      
      if (!currentEp) {
        navigate(`/anime/${animeId}`);
        return;
      }
      setEpisode(currentEp);

      // Find index for pagination
      const currentIndex = epsList.findIndex(e => e.id === epIdNum);
      setPrevEpisode(currentIndex > 0 ? epsList[currentIndex - 1] : null);
      setNextEpisode(currentIndex < epsList.length - 1 ? epsList[currentIndex + 1] : null);

      // 3. Load comments
      const commentsRes = await CommentsAPI.getComments(epIdNum);
      setComments(commentsRes.data);

      // 4. Check early access lock
      const delayDays = currentEp.release_delay_days || 0;
      const isPremium = currentUser?.is_premium;
      
      let isLocked = false;
      if (delayDays > 0 && !isPremium) {
        const createdAtTime = parseLocalDate(currentEp.created_at).getTime();
        const unlockTime = createdAtTime + delayDays * 24 * 60 * 60 * 1000;
        if (Date.now() < unlockTime) {
          isLocked = true;
        }
      }

      // 5. Trigger Ad if not premium and not locked
      if (!isLocked && !isPremium) {
        const watchCount = parseInt(localStorage.getItem('atnaltik_watch_count') || '0') + 1;
        localStorage.setItem('atnaltik_watch_count', watchCount.toString());
        
        if (watchCount % 3 === 0) {
          setShowAd(true);
          setAdSeconds(30);
        } else {
          setShowAd(false);
        }
      } else {
        setShowAd(false);
      }

    } catch (error) {
      console.error("Error loading page data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ad timer count down
  useEffect(() => {
    let interval: any = null;
    if (showAd && adSeconds > 0) {
      interval = setInterval(() => {
        setAdSeconds(prev => prev - 1);
      }, 1000);
    } else if (showAd && adSeconds === 0) {
      setShowAd(false);
    }
    return () => clearInterval(interval);
  }, [showAd, adSeconds]);

  useEffect(() => {
    if (showAd && typeof window !== 'undefined') {
      if (!document.querySelector('script[data-adsbygoogle]')) {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        script.setAttribute('data-adsbygoogle', 'true');
        document.body.appendChild(script);
      }
      // @ts-ignore
      window.adsbygoogle = window.adsbygoogle || [];
      // @ts-ignore
      window.adsbygoogle.push({});
    }
  }, [showAd]);

  // Rate anime
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

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    if (!user?.is_premium && userCommentCount >= 3) {
      setCommentError("Cheksiz izoh yozish uchun Premium obunaga o'ting.");
      return;
    }
    
    try {
      setSubmittingComment(true);
      setCommentError('');
      const res = await CommentsAPI.addComment(episode.id, commentContent.trim());
      setComments(prev => [res.data, ...prev]);
      setCommentContent('');
      setUserCommentCount((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      setCommentError(err.response?.data?.detail || "Izoh yozishda xatolik yuz berdi.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Toggle Comment Like
  const handleLikeComment = async (commentId: number) => {
    try {
      const res = await CommentsAPI.likeComment(commentId);
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            liked_by_me: res.data.liked,
            likes_count: res.data.likes_count
          };
        }
        return c;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!anime || !episode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-primary" />
        <p className="text-gray-400">Ma'lumot topilmadi.</p>
        <Link to="/" className="btn-primary py-2 px-6">Bosh sahifaga qaytish</Link>
      </div>
    );
  }

  // Calculate locked status again for visual rendering
  const delayDays = episode.release_delay_days || 0;
  const isPremium = user?.is_premium;
  const createdAtTime = parseLocalDate(episode.created_at).getTime();
  const unlockTime = createdAtTime + delayDays * 24 * 60 * 60 * 1000;
  const isLocked = delayDays > 0 && !isPremium && Date.now() < unlockTime;
  const unlockDateStr = new Date(unlockTime).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Calculate comments written by user in this episode
  const userCommentsCount = comments.filter(c => c.user_id === user?.id).length;

  const videoSrc = {
    type: 'video' as const,
    sources: [
      {
        src: AnimeAPI.getStreamUrl(episode.id),
        type: 'video/mp4',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background relative pb-20">
      
      {/* Background Cover Blur */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img 
          src={anime.cover_image} 
          className="w-full h-full object-cover blur-[120px] opacity-15 scale-110" 
          alt="blur background" 
        />
      </div>

      <div className="relative z-10 pt-24 max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Back Link */}
        <Link 
          to={`/anime/${anime.id}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm font-semibold"
        >
          <ArrowLeft size={16} />
          {anime.title} — Tafsilotlariga qaytish
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Player, Nav, Actions, Comments */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Player Container */}
            <div className="glass rounded-3xl overflow-hidden shadow-2xl aspect-video bg-black relative border border-white/5">
              <AnimatePresence mode="wait">
                {isLocked ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-mesh"
                  >
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 shadow-glow">
                      <Lock size={36} className="text-primary animate-pulse" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black italic mb-3 tracking-tight">USHBU EPISOD PREMYERA!</h3>
                    <p className="text-gray-300 max-w-md text-sm md:text-base mb-8 leading-relaxed">
                      Bu qism faqat Premium a'zolarimiz uchun ochiq. Bepul foydalanuvchilar uchun ochilish muddati:
                      <br />
                      <strong className="text-accent mt-2 block font-mono">{unlockDateStr}</strong>
                    </p>
                    <button 
                      onClick={() => navigate('/profile')}
                      className="btn-primary py-4 px-8 flex items-center gap-2 shadow-glow text-sm uppercase tracking-wider"
                    >
                      <Crown size={18} />
                      PREMIUM sotib olish
                    </button>
                  </motion.div>
                ) : showAd ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 text-center"
                  >
                    <div className="absolute top-4 right-4 bg-white/10 px-4 py-2 rounded-full text-xs font-bold tracking-widest text-primary border border-white/5">
                      REKLAMA TUGASHIGA: {adSeconds}s
                    </div>
                    
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                    
                    <div className="max-w-md space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider">
                        <Sparkles size={12} />
                        ATNALTIK Reklama
                      </div>
                      <div className="w-full rounded-3xl bg-white/5 border border-white/10 p-4 text-left text-gray-200 text-xs">
                        <p className="font-semibold text-sm mb-3">Google AdSense reklama bloki</p>
                        <ins className="adsbygoogle"
                          style={{ display: 'block', width: '100%', minHeight: '90px', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '20px', padding: '18px', lineHeight: '1.6' }}
                          data-ad-client="ca-pub-XXXXXXXXXXXX"
                          data-ad-slot="1234567890"
                          data-ad-format="auto"
                          data-full-width-responsive="true"
                        >
                          Google reklama bu yerda ko‘rinadi
                        </ins>
                      </div>
                      <h4 className="text-xl md:text-2xl font-black italic uppercase">Reklamalarsiz tomosha qiling!</h4>
                      <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                        Obuna atigi 15,000 UZS/oy. Vaqt cheklovlarisiz va barcha qismlarni birinchilardan bo'lib reklamalarsiz tomosha qiling.
                      </p>
                      <button 
                        onClick={() => navigate('/profile')}
                        className="bg-primary/20 border border-primary/40 hover:bg-primary text-white text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl transition-all shadow-glow active:scale-95"
                      >
                        Obuna bo'lish
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key={episode.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full"
                  >
                    <Plyr 
                      source={videoSrc} 
                      options={{ 
                        quality: { default: 720, options: [1080, 720, 480, 360] },
                        controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'pip', 'fullscreen']
                      }} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Video Controls & Navigation */}
            <div className="flex justify-between items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4">
              <button
                disabled={!prevEpisode}
                onClick={() => navigate(`/anime/${anime.id}/episode/${prevEpisode.id}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95"
              >
                <ChevronLeft size={16} />
                Oldingi qism
              </button>

              <div className="text-center shrink-0">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-bold block">Hozirgi qism</span>
                <span className="font-bold text-primary font-heading text-sm md:text-base">{episode.num}-qism. {episode.title}</span>
              </div>

              <button
                disabled={!nextEpisode}
                onClick={() => navigate(`/anime/${anime.id}/episode/${nextEpisode.id}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-95 text-primary border-primary/20"
              >
                Keyingi qism
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Rating Section */}
            <div className="glass-card p-6 border border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-black tracking-tight mb-1 uppercase">ANIMENI BAHOLANG</h3>
                  <p className="text-gray-400 text-xs">Ushbu anime sizga yoqdimi? 10 ballik tizimda baho bering!</p>
                </div>
                
                <div className="flex flex-col items-center md:items-end gap-2">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(null)}
                        onClick={() => handleRate(star)}
                        className="transition-transform active:scale-90"
                      >
                        <Star 
                          size={22} 
                          className={`transition-all duration-150 ${
                            (hoveredRating !== null ? star <= hoveredRating : star <= userRating)
                              ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                              : 'text-gray-600 hover:text-yellow-400/50'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {ratingMessage && (
                    <span className="text-xs text-accent font-bold animate-pulse">{ratingMessage}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="glass-card p-6 md:p-8 space-y-6 border border-white/5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <MessageSquare className="text-primary" />
                <h3 className="text-xl font-black uppercase tracking-tight">Izohlar ({comments.length})</h3>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Fikringizni yozib qoldiring..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 focus:border-primary/50 focus:bg-white/10 outline-none transition-all duration-300 placeholder:text-gray-600 text-sm resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentContent.trim() || (!user?.is_premium && userCommentCount >= 3)}
                    className="absolute bottom-4 right-4 bg-primary text-white p-2 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-glow"
                  >
                    <Send size={16} />
                  </button>
                </div>
                
                {commentError && (
                  <div className="flex items-center gap-2 text-xs text-primary font-semibold bg-primary/10 border border-primary/20 p-3 rounded-xl">
                    <AlertCircle size={14} />
                    {commentError}
                  </div>
                )}

                {!user?.is_premium && (
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium px-2">
                    <span>Izohlar cheklovi: {userCommentCount}/3 ta izoh yozilgan</span>
                    <Link to="/profile" className="text-primary hover:underline font-bold flex items-center gap-1">
                      <Crown size={10} /> Cheksiz yozish
                    </Link>
                  </div>
                )}
              </form>

              {/* Comments List */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <AnimatePresence>
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-6 italic">Hali hech kim izoh qoldirmagan. Birinchi bo'ling!</p>
                  ) : (
                    comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-4 hover:bg-white/[0.04] transition-all"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 font-bold border border-white/5 text-gray-300 uppercase">
                          {comment.photo_url ? (
                            <img src={comment.photo_url} alt="avatar" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            comment.first_name?.charAt(0) || 'U'
                          )}
                        </div>

                        {/* Comment Body */}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                                {comment.first_name} {comment.last_name}
                                {comment.is_admin ? (
                                  <span className="bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">ADMIN</span>
                                ) : null}
                              </span>
                              <span className="text-gray-400 text-xs font-mono">
                                {comment.username ? `@${comment.username}` : ''}
                              </span>
                            </div>
                            
                            <span className="text-[10px] text-gray-500">
                              {new Date(comment.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('uz-UZ', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>

                          <div className="pt-2 flex items-center gap-4">
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              className={`flex items-center gap-1 text-xs font-bold transition-all active:scale-90 ${
                                comment.liked_by_me ? 'text-primary' : 'text-gray-500 hover:text-primary'
                              }`}
                            >
                              <Heart size={14} className={comment.liked_by_me ? 'fill-primary text-primary' : ''} />
                              <span>{comment.likes_count || 0}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

          {/* Right Column: Playlist & Info */}
          <div className="space-y-6">
            
            {/* Anime Brief Card */}
            <div className="glass-card p-6 border border-white/5 flex gap-4">
              <img 
                src={anime.cover_image} 
                alt={anime.title} 
                className="w-20 h-28 object-cover rounded-xl shadow-lg border border-white/10 shrink-0" 
              />
              <div className="space-y-2">
                <h4 className="font-bold font-heading line-clamp-2">{anime.title}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-400/10 px-2 py-0.5 rounded-full">
                    <Star size={12} fill="currentColor" />
                    {anime.score}
                  </div>
                  <span className="text-xs text-gray-500">{anime.year}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {anime.genres?.slice(0, 2).map((g: string) => (
                    <span key={g} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-[10px] text-gray-400">{g}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Episodes playlist */}
            <div className="glass-card p-6 border border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                  <Play size={16} className="text-primary animate-pulse" />
                  Qismlar ro'yxati
                </h3>
                <span className="text-xs font-mono text-gray-500 font-bold bg-white/5 px-2.5 py-1 rounded-full">{allEpisodes.length} qism</span>
              </div>

              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {anime.seasons?.map((season: any) => (
                  <div key={season.id} className="space-y-1.5">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2 py-1">
                      {season.title}
                    </div>
                    {season.episodes?.map((ep: any) => {
                      const epDelayDays = ep.release_delay_days || 0;
                      const epCreatedAtTime = new Date(ep.created_at.replace(' ', 'T') + 'Z').getTime();
                      const epUnlockTime = epCreatedAtTime + epDelayDays * 24 * 60 * 60 * 1000;
                      const epIsLocked = epDelayDays > 0 && !user?.is_premium && new Date().getTime() < epUnlockTime;
                      
                      const isCurrent = ep.id === episode.id;

                      return (
                        <button
                          key={ep.id}
                          disabled={isCurrent}
                          onClick={() => navigate(`/anime/${anime.id}/episode/${ep.id}`)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${
                            isCurrent
                              ? 'bg-primary/10 border-primary/30 shadow-glow text-white pointer-events-none'
                              : 'bg-white/[0.01] border-transparent hover:border-white/10 text-gray-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCurrent ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'
                          }`}>
                            {ep.num}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate">{ep.title}</p>
                            <span className="text-[10px] text-gray-500 block">{ep.duration}</span>
                          </div>

                          {epIsLocked ? (
                            <Lock size={12} className="text-primary shrink-0" />
                          ) : (
                            <ChevronRight size={14} className={isCurrent ? 'text-primary' : 'text-gray-500'} />
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
    </div>
  );
};

export default EpisodeWatch;
