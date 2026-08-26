"use client";

import { useState } from 'react';
import ContentSection from './content-section';
import { motion } from 'framer-motion';

type PlatformName = 'Netflix' | 'Prime Video' | 'Max' | 'Disney+' | 'Hulu' | 'Apple TV+';

interface PlatformSectionProps {
  platformData: Record<PlatformName, any[]>;
}

export default function PlatformSection({ platformData }: PlatformSectionProps) {
  const [activeTab, setActiveTab] = useState<PlatformName>('Netflix');

  const items = platformData[activeTab] || [];

  const rightElement = (
    <div className="flex items-center gap-4 flex-wrap justify-end">
      {(Object.keys(platformData) as PlatformName[]).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`relative text-[11px] font-bold tracking-[0.1em] md:tracking-[0.2em] uppercase transition-colors duration-200 py-1 ${
            activeTab === tab 
              ? 'text-[#EAE8E3]' 
              : 'text-[#888888] hover:text-[#EAE8E3]'
          }`}
        >
          {tab}
          {activeTab === tab && (
            <motion.span 
              layoutId="platform-underline"
              className="absolute left-0 -bottom-1 w-full h-[1.5px] bg-accent" 
            />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <ContentSection 
      title={`Only on ${activeTab}`} 
      items={items} 
      rightElement={rightElement}
    />
  );
}
