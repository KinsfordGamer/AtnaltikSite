import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, ShieldCheck, LogOut, LayoutDashboard, Crown, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthAPI } from '../api';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await AuthAPI.getMe();
      setUser(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Profil ma'lumotlarini yuklashda xatolik.");
      // Agar token muddati o'tgan bo'lsa
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto">
      {/* Background decoration */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Profile Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent" />
          
          {/* Avatar Icon */}
          <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-xl relative group">
            <User size={48} className="text-primary transition-transform group-hover:scale-110" />
            {user?.is_admin && (
              <span className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-lg border border-background">
                <ShieldCheck size={16} />
              </span>
            )}
          </div>

          <h2 className="text-2xl font-black italic tracking-tighter mb-1 uppercase">
            {user?.full_name || 'Foydalanuvchi'}
          </h2>
          <p className="text-gray-400 text-sm mb-6 font-mono">
            {user?.username ? `@${user.username}` : 'Mijoz'}
          </p>

          <div className="w-full space-y-4 mb-8 text-left border-t border-white/5 pt-6">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-500 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</p>
                <p className="text-sm font-semibold truncate text-white">{user?.email}</p>
              </div>
            </div>
            {user?.telegram_id && (
              <div className="flex items-center gap-3">
                <Crown size={18} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Telegram ID</p>
                  <p className="text-sm font-semibold text-white font-mono">{user?.telegram_id}</p>
                </div>
              </div>
            )}
          </div>

          <div className="w-full space-y-3">
            {user?.is_admin && (
              <button 
                onClick={() => navigate('/admin')}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <LayoutDashboard size={18} />
                Admin Panel
              </button>
            )}
            
            <button 
              onClick={handleLogout}
              className="w-full bg-primary/20 border border-primary/30 hover:bg-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-glow"
            >
              <LogOut size={18} />
              Tizimdan chiqish
            </button>
          </div>
        </motion.div>

        {/* Right Side: Subscriptions Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-8"
        >
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter mb-2">OBUNALAR BO'LIMI</h1>
            <p className="text-gray-400">Atnaltik platformasida eksklyuziv imkoniyatlarga ega bo'lish uchun obunalar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscription Card 1: Premium */}
            <div className="glass-card p-8 border border-white/5 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 transition-all">
              {/* Not available red stamp */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] z-20 border-4 border-red-500/80 bg-background/90 text-red-500 text-lg md:text-xl font-black px-6 py-2 rounded-xl shadow-2xl tracking-widest pointer-events-none select-none animate-pulse border-dashed">
                MAVJUD EMAS
              </div>

              <div className="opacity-50">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                  <Crown size={24} className="text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Premium Obuna</h3>
                <p className="text-gray-400 text-sm mb-6">Reklamalarsiz tomosha qilish va barcha animelarga to'liq kirish huquqi.</p>
                
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-extrabold text-white">15 000</span>
                  <span className="text-gray-400 text-sm">UZS / oy</span>
                </div>

                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-primary font-bold">✓</span> Reklamalarsiz tomosha
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary font-bold">✓</span> 1080p Full HD sifat
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary font-bold">✓</span> Eksklyuziv dublyajlar
                  </li>
                </ul>
              </div>

              <button disabled className="w-full mt-8 bg-white/5 border border-white/10 text-gray-500 font-bold py-3.5 rounded-xl cursor-not-allowed">
                Faollashtirish
              </button>
            </div>

            {/* Subscription Card 2: PremiumMax */}
            <div className="glass-card p-8 border border-white/5 flex flex-col justify-between relative overflow-hidden group hover:border-accent/30 transition-all">
              {/* Not available red stamp */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] z-20 border-4 border-red-500/80 bg-background/90 text-red-500 text-lg md:text-xl font-black px-6 py-2 rounded-xl shadow-2xl tracking-widest pointer-events-none select-none animate-pulse border-dashed">
                MAVJUD EMAS
              </div>

              <div className="opacity-50">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles size={24} className="text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">PremiumMax Obuna</h3>
                <p className="text-gray-400 text-sm mb-6">Maksimal imkoniyatlar: 4K UHD sifat, oflayn yuklab olish va 4 ta qurilma.</p>
                
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-extrabold text-white">29 000</span>
                  <span className="text-gray-400 text-sm">UZS / oy</span>
                </div>

                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-accent font-bold">✓</span> 4K Ultra HD sifat
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent font-bold">✓</span> 4 ta qurilmada bir vaqtda tomosha
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent font-bold">✓</span> Oflayn rejimda yuklab olish
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent font-bold">✓</span> VIP telegram guruhga a'zolik
                  </li>
                </ul>
              </div>

              <button disabled className="w-full mt-8 bg-white/5 border border-white/10 text-gray-500 font-bold py-3.5 rounded-xl cursor-not-allowed">
                Faollashtirish
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
