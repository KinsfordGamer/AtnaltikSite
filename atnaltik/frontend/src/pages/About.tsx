import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, Film, Award, Sparkles, MessageCircle, Globe } from 'lucide-react';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'Asilbek',
      role: 'Asoschi & Bosh muharrir',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
      bio: 'Atnaltik Dubbing loyihasining asoschisi va bosh tashkilotchisi. O\'zbek dublyaj san\'atini yangi bosqichga olib chiqish niyatida.',
      color: 'rgba(255, 46, 99, 0.15)'
    },
    {
      name: 'Shohjahon',
      role: 'Senior Full Stack dasturchi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
      bio: 'Platformaning texnik ta\'minoti, video oqim tizimi (MTProto proxy) va admin panellarini yaratuvchisi.',
      color: 'rgba(8, 217, 214, 0.15)'
    },
    {
      name: 'Dublyaj Guruhi',
      role: 'Ovoz berish ustalari va Tarjimonlar',
      avatar: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=400',
      bio: 'Siz sevadigan anime qahramonlariga o\'zbek tilida jon bag\'ishlaydigan professional ovoz aktyorlari va tarjimonlar jamoasi.',
      color: 'rgba(156, 39, 176, 0.15)'
    }
  ];

  const values = [
    {
      icon: <Film className="text-primary" size={28} />,
      title: 'Yuqori Sifat (HD)',
      desc: 'Biz har bir epizodni eng yuqori sifatda (Full HD) taqdim etamiz va ovoz jo\'rligini originalga moslashtiramiz.'
    },
    {
      icon: <Shield className="text-accent" size={28} />,
      title: 'Xavfsiz Stream',
      desc: 'Telegram integratsiyasi orqali tezkor va hech qanday cheklovlarsiz to\'g\'ridan-to\'g\'ri video stream qilish tizimi.'
    },
    {
      icon: <Award className="text-purple-400" size={28} />,
      title: 'Professional Dublyaj',
      desc: 'Matnlar va iboralarni asliga sodiq qolgan holda, o\'zbek tiliga tushunarli va ravon tarzda o\'girib ovozlashtirish.'
    }
  ];

  return (
    <div className="pt-32 pb-24 px-6 md:px-20 min-h-screen bg-mesh">
      {/* Intro Hero Section */}
      <section className="text-center max-w-4xl mx-auto mb-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-semibold tracking-wider uppercase mb-6">
            <Sparkles size={12} className="animate-pulse" />
            Biz haqimizda
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tight uppercase leading-[0.9] mb-8">
            ATNALTIK <span className="text-gradient">DUBBING</span>
          </h1>
          
          <p className="text-gray-400 font-medium text-lg md:text-xl leading-relaxed">
            Biz shunchaki anime tarjima qilmaymiz, biz tomoshabinga professional ovozlashtirish va yuqori vizual sifat orqali anime olamining cheksiz his-tuyg'ularini to'liq yetkazib berishga intilamiz.
          </p>
        </motion.div>
      </section>

      {/* Core Values Section */}
      <section className="mb-32">
        <div className="flex items-center gap-4 mb-12 justify-center">
          <div className="w-8 h-1 bg-primary rounded-full" />
          <h2 className="text-3xl font-black italic tracking-tight uppercase text-center">BIZNING USTUVOR QADRIYATLARIMIZ</h2>
          <div className="w-8 h-1 bg-primary rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((v, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden"
            >
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                {v.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{v.title}</h3>
              <p className="text-gray-500 font-medium text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team Profiles Section */}
      <section className="mb-32">
        <div className="flex items-center gap-4 mb-16 justify-center">
          <div className="w-8 h-1 bg-accent rounded-full" />
          <h2 className="text-3xl font-black italic tracking-tight uppercase text-center">BIZNING SUPER JAMOAMIZ</h2>
          <div className="w-8 h-1 bg-accent rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative overflow-hidden glass-card p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col items-center text-center"
            >
              <div 
                style={{ backgroundColor: member.color, opacity: 0.1 }}
                className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-20"
              />
              
              <div className="relative w-32 h-32 rounded-full overflow-hidden mb-6 border-4 border-white/10 group-hover:border-primary/50 transition-colors duration-500 shadow-xl">
                <img src={member.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={member.name} />
              </div>

              <h3 className="text-2xl font-black italic uppercase mb-1 tracking-tight group-hover:text-primary transition-colors">
                {member.name}
              </h3>
              <p className="text-accent text-xs font-black uppercase tracking-wider mb-6">
                {member.role}
              </p>
              
              <p className="text-gray-500 font-medium text-sm leading-relaxed">
                {member.bio}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="relative">
        <div className="glass-card p-12 md:p-20 relative overflow-hidden text-center max-w-4xl mx-auto border border-white/5 shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl -mt-40" />
          <h2 className="text-4xl md:text-5xl font-black italic mb-6 uppercase">
            BIZ BILAN ALOQADA BO'LING
          </h2>
          <p className="text-gray-400 font-medium text-base md:text-lg mb-10 max-w-xl mx-auto">
            Takliflar, hamkorlik masalalari yoki dublyaj jamoamiz safiga ovoz aktyori sifatida qo'shilish istagingiz bo'lsa, quyidagi rasmiy kanallarimiz orqali murojaat qilishingiz mumkin.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="https://t.me/ATNALTIK" 
              target="_blank" 
              rel="noreferrer"
              className="btn-primary flex items-center gap-3 px-8 py-4 text-sm"
            >
              <MessageCircle size={18} fill="white" />
              TELEGRAM KANALIMIZ
            </a>
            <button className="px-8 py-4 glass hover:bg-white/10 rounded-2xl font-bold flex items-center gap-3 transition-all text-sm border border-white/10">
              <Globe size={18} />
              SAHIFA: ATNALTIK.ONE
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
