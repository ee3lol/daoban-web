"use client";

import { useRef, useState, useEffect } from 'react';
import MediaCard from './media-card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

interface ContentSectionProps {
  title: string;
  items: Movie[];
  showRank?: boolean;
  rightElement?: React.ReactNode;
}

export default function ContentSection({ title, items, showRank, rightElement }: ContentSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    handleScroll(); // Initial check
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === 'left' ? -600 : 600;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-8 relative flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6 relative z-20">
        <div className="flex items-center w-full sm:w-auto">
          <h2 className="text-[#EAE8E3] text-[13px] sm:text-[15px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">
            {title}
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#888888]/20 to-transparent ml-4 sm:mx-6" />
        </div>
        
        {/* Actions & Scroll Navigation */}
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto">
          {rightElement}
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
      
      {/* Horizontal Scroll Snap Container */}
      <div className="w-full relative transition-all duration-300">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-5 md:gap-6 pb-8 pt-2 snap-x snap-mandatory hide-scrollbar relative z-20 scroll-smooth"
        >
          {items.filter(item => item.poster_path).map((item, index) => (
            <div key={item.id} className="w-[150px] md:w-[170px] lg:w-[190px] xl:w-[200px] shrink-0 snap-start">
              <MediaCard item={item} rank={showRank ? index + 1 : undefined} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
