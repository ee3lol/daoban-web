/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRef, useState, useEffect } from 'react';
import ContinueWatchingCard from './continue-watching-card';
import WideMediaCard from './wide-media-card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ContinueWatchingSection({ items }: { items: any[] }) {
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
    handleScroll();
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
            Continue Watching
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#888888]/20 to-transparent ml-4 sm:mx-6" />
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto">
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

      <div className="w-full relative transition-all duration-300 group/section">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-center gap-5 md:gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8 pt-2 relative z-20 scroll-smooth"
        >
          {items.map((item) => (
            <div key={item.id} className="w-[280px] sm:w-[320px] md:w-[380px] shrink-0 snap-start">
              <ContinueWatchingCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
