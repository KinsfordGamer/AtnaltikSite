import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Menu, X, PlaySquare } from 'lucide-react';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Bosh sahifa', path: '/' },
    { name: 'Animelar', path: '/animes' },
    { name: 'Janrlar', path: '/genres' },
    { name: 'Biz haqimizda', path: '/about' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 md:px-12 py-6 ${scrolled ? 'py-4' : 'py-8'}`}>
      <div className={`max-w-7xl mx-auto glass rounded-full px-8 py-4 flex items-center justify-between transition-all duration-500 ${scrolled ? 'shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black/60' : ''}`}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12 group-hover:scale-110 shadow-glow">
             <PlaySquare size={22} color="white" fill="white" />
          </div>
          <span className="text-2xl font-black italic tracking-tighter text-white">ATNALTIK</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Search size={22} />
          </button>
          
          {token ? (
            <Link to="/admin" className="w-10 h-10 glass rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors">
              <User size={20} className="text-primary" />
            </Link>
          ) : (
            <Link to="/login" className="px-6 py-2.5 bg-white text-black font-bold rounded-xl text-sm transition-all hover:scale-105 active:scale-95 shadow-xl">
              Kirish
            </Link>
          )}

          <button 
            className="md:hidden p-2 text-gray-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-28 left-6 right-6 glass p-8 rounded-[2rem] md:hidden shadow-2xl"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-xl font-bold ${location.pathname === link.path ? 'text-primary' : 'text-gray-400'}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
