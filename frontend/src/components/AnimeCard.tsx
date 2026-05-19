import React from 'react';
import { Play, Star, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface AnimeCardProps {
  id: number;
  title: string;
  image: string;
  score: number;
  year: number;
  status: string;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ id, title, image, score, year, status }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="glass-card group relative"
    >
      <Link to={`/anime/${id}`}>
        {/* Cover Image */}
        <div className="aspect-[2/3] overflow-hidden relative">
          <img 
            src={image || 'https://via.placeholder.com/400x600'} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
          
          {/* Badge: Score */}
          <div className="absolute top-3 left-3 glass px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold text-yellow-400">
            <Star size={12} fill="currentColor" />
            {score}
          </div>
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-glow">
              <Play size={32} fill="white" className="ml-1" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {year}
            </span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] uppercase font-bold tracking-wider">
              {status}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default AnimeCard;
