"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function GenreTabs({ currentTab }: { currentTab: string }) {
  const tabs = [
    { label: 'MOVIES', value: 'movies' },
    { label: 'TV SHOWS', value: 'tv' },
    { label: 'ANIME', value: 'anime' }
  ];

  return (
    <div className="flex items-center gap-8 mb-8 border-b border-white/5 pb-0 w-full md:w-fit">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.value;
        return (
          <Link
            key={tab.value}
            href={`/genres?tab=${tab.value}`}
            className={`relative text-[12px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 py-3 ${
              isActive ? 'text-[#EAE8E3]' : 'text-[#888888] hover:text-[#EAE8E3]'
            }`}
          >
            {tab.label}
            {isActive && (
              <motion.span
                layoutId="genres-underline"
                className="absolute left-0 bottom-0 w-full h-[2px] bg-accent"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
