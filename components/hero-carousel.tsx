/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTMDBImageUrl } from '@/lib/tmdb';
import { Play, Info, Star } from 'lucide-react';

interface Movie {
  id: number;
  title?: string;
  name?: string;
  backdrop_path: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

export default function HeroCarousel({ movies }: { movies: Movie[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!movies || movies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(movies.length, 5)); // Cycle through top 5
    }, 8000); // Slide every 8 seconds
    return () => clearInterval(interval);
  }, [movies]);

  if (!movies || movies.length === 0) return null;

  const currentMovie = movies[currentIndex];
  const title = currentMovie.title || currentMovie.name;
  const releaseYear = (currentMovie.release_date || currentMovie.first_air_date || '').split('-')[0];
  const genres = currentMovie.genre_ids 
    ? currentMovie.genre_ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 2).join(' • ')
    : null;

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] flex items-center overflow-hidden">
      {/* Background Images with Crossfade and Ken Burns Zoom */}
      {movies.slice(0, 5).map((movie, idx) => (
        <div 
          key={movie.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-0' : 'opacity-0 z-[-1]'}`}
        >
          <img 
            src={getTMDBImageUrl(movie.backdrop_path, 'original')} 
            alt={movie.title || movie.name}
            className={`w-full h-full object-cover opacity-60 transition-transform ease-out ${idx === currentIndex ? 'scale-105 duration-[10000ms]' : 'scale-100 duration-0'}`}
          />
        </div>
      ))}

      {/* Gradients to fade into #151515 background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/60 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#151515] via-[#151515]/80 to-transparent z-10" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 mt-20">
        <div className="max-w-2xl flex flex-col gap-5 transform transition-all duration-700 translate-y-0 opacity-100">
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#EAE8E3] tracking-tighter leading-[1.1] drop-shadow-2xl uppercase">
            {title}
          </h1>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-[12px] sm:text-[13px] font-medium text-[#888888] flex-wrap mt-1">
            {currentMovie.vote_average ? (
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-[#D47A73] text-[#D47A73]" />
                <span className="text-[#D47A73] font-bold">{currentMovie.vote_average.toFixed(1)}</span>
              </div>
            ) : null}
            
            {releaseYear && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#888888]/40" />
                <span className="tracking-widest">{releaseYear}</span>
              </>
            )}

            {genres && (
              <>
                <span className="w-1 h-1 rounded-full bg-[#888888]/40" />
                <span className="tracking-widest">{genres}</span>
              </>
            )}
          </div>
          
          <p className="text-[#888888] text-[13px] sm:text-sm md:text-base leading-[1.8] font-medium line-clamp-3 md:line-clamp-4 max-w-xl text-balance drop-shadow-md mt-2">
            {currentMovie.overview}
          </p>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto gap-3 sm:gap-4 mt-6">
            <Link 
              href={`/watch/${currentMovie.title ? 'movie' : 'tv'}/${currentMovie.id}`}
              className="group flex items-center justify-center gap-2 sm:gap-3 px-4 py-3.5 sm:px-8 sm:py-4 bg-[#D47A73] text-white hover:bg-[#DE867E] rounded-full font-bold text-[13px] tracking-widest transition-all duration-300 active:scale-95 whitespace-nowrap w-full sm:w-auto"
            >
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform duration-300" />
              WATCH NOW
            </Link>
            <Link 
              href={`/${currentMovie.title ? 'movie' : 'tv'}/${currentMovie.id}`}
              className="flex items-center justify-center gap-2 px-4 py-3.5 sm:px-8 sm:py-4 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] text-[#EAE8E3] hover:text-white rounded-full font-bold text-[13px] tracking-wider transition-colors duration-300 backdrop-blur-md whitespace-nowrap w-full sm:w-auto"
            >
              <Info className="w-4 h-4" />
              DETAILS
            </Link>
          </div>
        </div>
      </div>
      
      {/* Carousel Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {movies.slice(0, 5).map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ease-out ${idx === currentIndex ? 'w-10 bg-[#D47A73]' : 'w-2 bg-[#888888]/30 hover:bg-[#888888]/60 hover:w-4'}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
