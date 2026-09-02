/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from 'react';
import ContentSection from './content-section';
import { motion } from 'framer-motion';

interface TopRatedSectionProps {
  movies: any[];
  tv: any[];
  anime: any[];
}

export default function TopRatedSection({ movies, tv, anime }: TopRatedSectionProps) {
  const [activeTab, setActiveTab] = useState<'MOVIES' | 'TV' | 'ANIME'>('MOVIES');

  const items = activeTab === 'MOVIES' ? movies : activeTab === 'TV' ? tv : anime;

  const rightElement = (
    <div className="flex items-center gap-6">
      {(['MOVIES', 'TV', 'ANIME'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`relative text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 py-1 ${
            activeTab === tab 
              ? 'text-[#EAE8E3]' 
              : 'text-[#888888] hover:text-[#EAE8E3]'
          }`}
        >
          {tab}
          {activeTab === tab && (
            <motion.span 
              layoutId="toprated-underline"
              className="absolute left-0 -bottom-1 w-full h-[1.5px] bg-accent" 
            />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <ContentSection 
      title="Critically Acclaimed" 
      items={items} 
      rightElement={rightElement}
    />
  );
}
