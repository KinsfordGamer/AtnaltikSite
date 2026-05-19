import React from 'react';
import { Github, Send, Instagram, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-background-dark/80 backdrop-blur-md border-t border-white/5 py-12 mt-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent italic tracking-tighter">
              ATNALTIK
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              O'zbekistondagi eng zamonaviy anime platformasi. Biz bilan eng so'nggi animelarni yuqori sifatda tomosha qiling.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-bold mb-6">Bo'limlar</h3>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a href="/" className="hover:text-primary transition-colors">Bosh sahifa</a></li>
              <li><a href="/animes" className="hover:text-primary transition-colors">Barcha animelar</a></li>
              <li><a href="/genres" className="hover:text-primary transition-colors">Janrlar</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Ma'lumot</h3>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a href="/about" className="hover:text-primary transition-colors">Biz haqimizda</a></li>
              <li><a href="/rules" className="hover:text-primary transition-colors">Qoidalar</a></li>
              <li><a href="/contact" className="hover:text-primary transition-colors">Aloqa</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-6">Bizga qo'shiling</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                <Send size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/5 mt-12 pt-8 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} ATNALTIK DUBBING. Barcha huquqlar himoyalangan.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
