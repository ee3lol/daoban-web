"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Film, Search } from 'lucide-react';
import WideMediaCard from './wide-media-card';
import { fetchByGenreAction, fetchTrendingAction } from '@/lib/actions/tmdb';
import { 
  Flame, Compass, Palette, Smile, ShieldAlert,
  Video, Clapperboard, Users, Wand2, Landmark,
  Ghost, Music, Heart, Rocket, AlertTriangle, Crosshair, Map
} from 'lucide-react';

interface Genre {
  id: number;
  name: string;
}

const GENRE_ICONS: Record<number, React.ElementType> = {
  28: Flame, 12: Compass, 16: Palette, 35: Smile, 80: ShieldAlert,
  99: Video, 18: Clapperboard, 10751: Users, 14: Wand2, 36: Landmark,
  27: Ghost, 10402: Music, 9648: Search, 10749: Heart, 878: Rocket,
  53: AlertTriangle, 10752: Crosshair, 37: Map,
};

interface GenreContentSectionProps {
  genres: Genre[];
}

export default function GenreContentSection({ genres }: GenreContentSectionProps) {
  const [activeGenre, setActiveGenre] = useState<Genre | { id: 'all', name: 'All' }>({ id: 'all', name: 'All' });
  const [activeType, setActiveType] = useState<'movie' | 'tv' | 'anime'>('movie');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isDropdownOpen && !(e.target as Element).closest('.genre-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Fetch data when genre or type changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let data;
        if (activeGenre.id === 'all') {
          data = await fetchTrendingAction(activeType, 'day');
        } else {
          data = await fetchByGenreAction(activeGenre.id.toString(), activeType);
        }
        
        if (isMounted && data?.results) {
          setItems(data.results.slice(0, 15));
        }
      } catch (error) {
        console.error("Failed to fetch genre data:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [activeGenre.id, activeType]);

  // Scroll handling
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    handleScroll(); 
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -600 : 600;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleGenreSelect = (genre: Genre | { id: 'all', name: 'All' }) => {
    setActiveGenre(genre);
    setIsDropdownOpen(false);
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-8 relative flex flex-col z-30">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
        
        {/* Left side: Dropdown */}
        <div className="relative genre-dropdown-container z-40">
          <div className="flex items-center">
            {/* The vertical red line from the image */}
            <div className="w-[3px] h-[20px] bg-accent rounded-full mr-3" />
            
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 group"
            >
              <h2 className="text-[#EAE8E3] text-[20px] sm:text-[24px] font-bold tracking-tight capitalize group-hover:text-white transition-colors">
                {activeGenre.name}
              </h2>
              <ChevronDown className={`w-5 h-5 text-accent transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 w-64 bg-[#111111] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col py-2 max-h-[60vh] overflow-y-auto custom-scrollbar"
              >
                <button
                  onClick={() => handleGenreSelect({ id: 'all', name: 'All' })}
                  className={`flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors ${activeGenre.id === 'all' ? 'text-accent bg-white/5' : 'text-[#EAE8E3]'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-semibold tracking-wider">All</span>
                </button>
                
                {genres.map((genre) => {
                  const Icon = GENRE_ICONS[genre.id] || Film;
                  return (
                    <button
                      key={genre.id}
                      onClick={() => handleGenreSelect(genre)}
                      className={`flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors ${activeGenre.id === genre.id ? 'text-accent bg-white/5' : 'text-[#EAE8E3]'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[13px] font-semibold tracking-wider">{genre.name}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side: Tabs & Arrows */}
        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveType('movie')}
              className={`relative text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 py-1 ${
                activeType === 'movie' ? 'text-[#EAE8E3]' : 'text-[#888888] hover:text-[#EAE8E3]'
              }`}
            >
              MOVIES
              {activeType === 'movie' && (
                <motion.span layoutId="genre-type-underline" className="absolute left-0 -bottom-1 w-full h-[1.5px] bg-accent rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveType('tv')}
              className={`relative text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 py-1 ${
                activeType === 'tv' ? 'text-[#EAE8E3]' : 'text-[#888888] hover:text-[#EAE8E3]'
              }`}
            >
              SERIES
              {activeType === 'tv' && (
                <motion.span layoutId="genre-type-underline" className="absolute left-0 -bottom-1 w-full h-[1.5px] bg-accent rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveType('anime')}
              className={`relative text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 py-1 ${
                activeType === 'anime' ? 'text-[#EAE8E3]' : 'text-[#888888] hover:text-[#EAE8E3]'
              }`}
            >
              ANIME
              {activeType === 'anime' && (
                <motion.span layoutId="genre-type-underline" className="absolute left-0 -bottom-1 w-full h-[1.5px] bg-accent rounded-full" />
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={() => scroll('left')}
              disabled={!showLeft}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll('right')}
              disabled={!showRight}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="w-full relative min-h-[200px]">
        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-background-light/50 backdrop-blur-sm"
            >
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className={`flex overflow-x-auto gap-4 md:gap-5 pb-8 pt-2 snap-x snap-mandatory hide-scrollbar relative z-0 scroll-smooth transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        >
          {items.map((item) => (
            <div key={item.id} className="w-[280px] sm:w-[320px] md:w-[360px] lg:w-[400px] shrink-0 snap-start">
              <WideMediaCard item={item} />
            </div>
          ))}
          {items.length === 0 && !isLoading && (
            <div className="w-full py-12 flex flex-col items-center justify-center text-[#888888]">
              <Film className="w-8 h-8 mb-3 opacity-50" />
              <p className="text-sm font-medium tracking-wide">No titles found for this category</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
