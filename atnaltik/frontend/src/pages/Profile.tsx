import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, ShieldCheck, LogOut, LayoutDashboard, 
  Crown, Sparkles, X, Wallet, CheckCircle, CreditCard, ArrowRight, Shield 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthAPI, PaymentsAPI } from '../api';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Modal & Deposit State
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('15000');
  const [depositProvider, setDepositProvider] = useState('click');
  const [cardNumber, setCardNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Subscribe state
  const [submittingSubscription, setSubmittingSubscription] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [subscriptionError, setSubscriptionError] = useState('');

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

  // Deposit Submit handler
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError("Noto'g'ri to'lov miqdori.");
      return;
    }
    
    try {
      setIsPaying(true);
      setPaymentError('');
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const username = user?.username || user?.email;
      const res = await PaymentsAPI.deposit(username, amountNum, depositProvider);
      
      if (res.data.success) {
        setPaymentSuccess(true);
        setTimeout(async () => {
          setIsDepositOpen(false);
          setPaymentSuccess(false);
          setCardNumber('');
          setPhoneNumber('');
          // Refresh Profile
          const profileRes = await AuthAPI.getMe();
          setUser(profileRes.data);
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      setPaymentError(err.response?.data?.detail || "To'lovni amalga oshirishda xatolik.");
    } finally {
      setIsPaying(false);
    }
  };

  // Subscribe Plan handler
  const handleSubscribe = async (planType: string) => {
    const cost = planType === 'premium' ? 15000 : 35000;
    if ((user?.balance || 0) < cost) {
      setSubscriptionError(`Balans yetarli emas. Iltimos, hisobingizni to'ldiring.`);
      setTimeout(() => setSubscriptionError(''), 5000);
      return;
    }

    try {
      setSubmittingSubscription(true);
      setSubscriptionError('');
      setSubscriptionMessage('');
      
      const res = await PaymentsAPI.subscribe(planType);
      if (res.data.success) {
        setSubscriptionMessage(res.data.detail || "Muvaffaqiyatli obuna bo'lindi!");
        
        // Refresh profile
        const profileRes = await AuthAPI.getMe();
        setUser(profileRes.data);
        
        setTimeout(() => setSubscriptionMessage(''), 5000);
      }
    } catch (err: any) {
      console.error(err);
      setSubscriptionError(err.response?.data?.detail || "Obunani sotib olishda xatolik.");
      setTimeout(() => setSubscriptionError(''), 5000);
    } finally {
      setSubmittingSubscription(false);
    }
  };

  const parseLocalDate = (dateString: string) => {
    if (!dateString) return new Date('');
    return new Date(dateString.replace(' ', 'T'));
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate days remaining of premium subscription
  let daysLeft = 0;
  if (user?.is_premium && user?.premium_until) {
    const expires = parseLocalDate(user.premium_until).getTime();
    const now = Date.now();
    daysLeft = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto relative">
      
      {/* Background decoration */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Profile Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden h-fit"
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

          <h2 className="text-2xl font-black italic tracking-tighter mb-1 uppercase font-heading">
            {user?.full_name || 'Foydalanuvchi'}
          </h2>
          
          <p className="text-gray-400 text-sm mb-4 font-mono">
            {user?.username ? `@${user.username}` : 'Mijoz'}
          </p>

          {/* Premium Status Badge */}
          <div className="mb-6">
            {user?.is_premium ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full text-xs font-black uppercase tracking-wider shadow-glow">
                <Crown size={14} />
                {user.premium_type === 'premium_max' ? 'Premium Max' : 'Premium'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white/5 text-gray-400 border border-white/5 rounded-full text-xs font-bold uppercase tracking-wider">
                Bepul tarif
              </span>
            )}
          </div>

          {/* Wallet Section */}
          <div className="w-full bg-white/5 border border-white/5 p-5 rounded-2xl mb-6 text-left space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Wallet size={14} className="text-primary" /> Balans
              </span>
              <span className="font-mono font-bold text-white text-lg">
                {(user?.balance || 0).toLocaleString('uz-UZ')} UZS
              </span>
            </div>
            
            <button
              onClick={() => setIsDepositOpen(true)}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-1.5"
            >
              Hisobni to'ldirish
            </button>
          </div>

          <div className="w-full space-y-4 mb-8 text-left border-t border-white/5 pt-6 font-semibold">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-500 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</p>
                <p className="text-sm truncate text-white">{user?.email}</p>
              </div>
            </div>
            
            {user?.premium_until && user.is_premium && (
              <div className="flex items-center gap-3">
                <Crown size={18} className="text-yellow-400 shrink-0 animate-bounce" />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tugash muddati</p>
                  <p className="text-sm text-yellow-400 font-bold font-mono">
                    {new Date(user.premium_until.replace(' ', 'T') + 'Z').toLocaleDateString('uz-UZ')} ({daysLeft} kun qoldi)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="w-full space-y-3">
            {user?.is_admin && (
              <button 
                onClick={() => navigate('/admin')}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm uppercase tracking-wider font-heading"
              >
                <LayoutDashboard size={18} />
                Admin Panel
              </button>
            )}
            
            <button 
              onClick={handleLogout}
              className="w-full bg-primary/20 border border-primary/30 hover:bg-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-glow text-sm uppercase tracking-wider font-heading"
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
            <h1 className="text-3xl font-black italic tracking-tighter mb-2 font-heading uppercase">OBUNALAR BO'LIMI</h1>
            <p className="text-gray-400 text-sm">Atnaltik platformasida eksklyuziv dublyajlarni birinchilardan bo'lib va reklamalarsiz tomosha qiling.</p>
          </div>

          {/* Messages */}
          {subscriptionMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-pulse">
              <CheckCircle size={20} />
              {subscriptionMessage}
            </div>
          )}
          
          {subscriptionError && (
            <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <X size={20} />
              {subscriptionError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Subscription Card 1: Premium */}
            <div className="glass-card p-8 border border-white/5 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 transition-all">
              <div>
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/10 group-hover:scale-110 transition-transform">
                  <Crown size={24} className="text-primary" />
                </div>
                
                <h3 className="text-2xl font-black italic mb-2 tracking-tight uppercase font-heading">Premium Obuna</h3>
                <p className="text-gray-400 text-xs mb-6 leading-relaxed">Reklamalarsiz tomosha qilish, bepul a'zolarga yopiq vaqt cheklovli qismlarga bir zumda kirish.</p>
                
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-extrabold text-white font-mono">15 000</span>
                  <span className="text-gray-400 text-xs uppercase font-bold tracking-widest">UZS / 30 kun</span>
                </div>

                <ul className="space-y-3 text-sm text-gray-300 border-t border-white/5 pt-6 font-semibold">
                  <li className="flex items-center gap-2 text-xs">
                    <span className="text-primary font-bold">✓</span> Reklamalarsiz tomosha
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="text-primary font-bold">✓</span> Yangi premyeralarga to'liq kirish
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="text-primary font-bold">✓</span> Cheksiz izohlar yozish imkoniyati
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="text-primary font-bold">✓</span> 1080p Full HD sifat
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => handleSubscribe('premium')}
                disabled={submittingSubscription}
                className="w-full mt-8 btn-primary py-3.5 text-xs uppercase tracking-wider"
              >
                {submittingSubscription ? 'Yuklanmoqda...' : 'Faollashtirish'}
              </button>
            </div>

            {/* Subscription Card 2: PremiumMax */}
            <div className="glass-card p-8 border border-white/5 flex flex-col justify-between relative overflow-hidden group hover:border-accent/30 transition-all">
              <div className="absolute top-4 right-4 bg-accent/20 border border-accent/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-accent">
                Super taklif
              </div>
              
              <div>
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 border border-accent/10 group-hover:scale-110 transition-transform">
                  <Sparkles size={24} className="text-accent" />
                </div>
                
                <h3 className="text-2xl font-black italic mb-2 tracking-tight uppercase font-heading">Premium Max</h3>
                <p className="text-gray-400 text-xs mb-6 leading-relaxed">Eng tejamkor va maksimal imkoniyatlar: 90 kunga to'liq kirish, doimiy qulayliklar.</p>
                
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-extrabold text-white font-mono">35 000</span>
                  <span className="text-accent text-xs uppercase font-bold tracking-widest">UZS / 90 kun</span>
                </div>

                <ul className="space-y-3 text-sm text-gray-300 border-t border-white/5 pt-6 font-semibold">
                  <li className="flex items-center gap-2 text-xs">
                    <span className="text-accent font-bold">✓</span> 3 oylik (90 kun) to'liq a'zolik
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="text-accent font-bold">✓</span> 10 000 UZS iqtisod qilasiz
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="text-accent font-bold">✓</span> Reklamalarsiz va cheklovlarsiz
                  </li>
                  <li className="flex items-center gap-2 text-xs">
                    <span className="text-accent font-bold">✓</span> Premium status belgisi
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => handleSubscribe('premium_max')}
                disabled={submittingSubscription}
                className="w-full mt-8 relative px-8 py-3.5 bg-gradient-to-r from-accent/80 to-accent text-black font-extrabold rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(8,217,214,0.3)] text-xs uppercase tracking-wider"
              >
                {submittingSubscription ? 'Yuklanmoqda...' : 'Faollashtirish'}
              </button>
            </div>

          </div>
        </motion.div>
      </div>

      {/* --- DEPOSIT (TOP UP) BALANCE MODAL --- */}
      <AnimatePresence>
        {isDepositOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPaying && setIsDepositOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0D0D11] border border-white/10 rounded-[2rem] overflow-hidden p-6 md:p-8 z-10 shadow-2xl"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-2 font-heading">
                  <Wallet size={20} className="text-primary" /> Hisobni to'ldirish
                </h3>
                <button
                  disabled={isPaying}
                  onClick={() => setIsDepositOpen(false)}
                  className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white disabled:opacity-30"
                >
                  <X size={18} />
                </button>
              </div>

              {paymentSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <CheckCircle size={36} className="animate-bounce" />
                  </div>
                  <h4 className="text-lg font-bold text-white">To'lov Muvaffaqiyatli!</h4>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                    Sizning to'lovingiz Click/Payme orqali qabul qilindi. Balans yangilandi.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  
                  {/* Select Payment Provider */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setDepositProvider('click')}
                      className={`py-3 px-4 rounded-xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2 border ${
                        depositProvider === 'click'
                          ? 'bg-[#00A3FF]/10 text-[#00A3FF] border-[#00A3FF]/30'
                          : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <CreditCard size={14} />
                      Click
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositProvider('payme')}
                      className={`py-3 px-4 rounded-xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2 border ${
                        depositProvider === 'payme'
                          ? 'bg-[#1FD2C4]/10 text-[#1FD2C4] border-[#1FD2C4]/30'
                          : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <CreditCard size={14} />
                      Payme
                    </button>
                  </div>

                  {/* Username (Info Only) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Username / Email</label>
                    <input
                      type="text"
                      disabled
                      value={user?.username || user?.email || ''}
                      className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-gray-500 font-mono"
                    />
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Miqdor (UZS)</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      placeholder="Masalan: 15000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-sm font-bold focus:border-primary/50 outline-none transition-all placeholder:text-gray-600 font-mono text-white"
                    />
                    <div className="flex gap-2 pt-1">
                      {['15000', '35000', '50000'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDepositAmount(val)}
                          className="bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-bold py-1 px-3 rounded-lg text-gray-400 transition-colors"
                        >
                          {parseInt(val).toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mock Billing Fields */}
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    
                    {/* Card Number */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Karta raqami (16 xona)</label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="8600 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => {
                          // Format with spaces
                          const val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                          const matches = val.match(/\d{4,16}/g);
                          const match = (matches && matches[0]) || '';
                          const parts = [];

                          for (let i = 0, len = match.length; i < len; i += 4) {
                            parts.push(match.substring(i, i + 4));
                          }

                          if (parts.length > 0) {
                            setCardNumber(parts.join(' '));
                          } else {
                            setCardNumber(val);
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono tracking-widest focus:border-primary/50 outline-none transition-all placeholder:text-gray-600 text-white"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Telefon raqam</label>
                      <input
                        type="tel"
                        required
                        placeholder="+998 (90) 123-4567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-primary/50 outline-none transition-all placeholder:text-gray-600 text-white"
                      />
                    </div>

                  </div>

                  {/* Payment Error */}
                  {paymentError && (
                    <div className="text-xs text-primary font-semibold bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center gap-2">
                      <AlertCircle size={14} />
                      {paymentError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPaying}
                    className="w-full btn-primary py-3.5 mt-4 text-xs uppercase tracking-wider font-heading flex items-center justify-center gap-2 shadow-glow text-white"
                  >
                    {isPaying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Tranzaksiya bajarilmoqda...
                      </>
                    ) : (
                      <>
                        {parseFloat(depositAmount || '0').toLocaleString('uz-UZ')} UZS To'lash
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>

                  <div className="text-[9px] text-gray-500 font-semibold text-center flex items-center justify-center gap-1.5 mt-2">
                    <Shield size={10} /> Xavfsiz to'lov shlyuzi. ATNALTIK click/payme integratsiyasi.
                  </div>

                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Simple Icon for errors inside the modal
const AlertCircle = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

export default Profile;
