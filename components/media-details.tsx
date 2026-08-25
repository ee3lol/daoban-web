"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getTMDBImageUrl } from '@/lib/tmdb';
import { Play, Star, Clock, Calendar, Info, ChevronLeft, Plus, ListVideo, Volume2, VolumeX, LayoutGrid, ChevronDown, Bookmark, Heart } from 'lucide-react';
import ContentSection from './content-section';
import { fetchTVSeason } from '@/lib/actions/tmdb';
import { toggleWatchLater, toggleFavorite, checkMediaSaved } from '@/lib/actions/user';

interface MediaDetailsProps {
  item: any;
  type: 'movie' | 'tv' | 'anime';
}

export default function MediaDetails({ item, type }: MediaDetailsProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const validSeasons = item?.seasons?.filter((s: any) => s.season_number > 0) || [];
  const initialSeason = validSeasons.length > 0 ? validSeasons[0].season_number : 1;
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [isEpisodesVisible, setIsEpisodesVisible] = useState(true);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (item?.id) {
      checkMediaSaved(item.id).then(res => {
        setIsWatchLater(res.isWatchLater);
        setIsFavorite(res.isFavorite);
      });
    }
  }, [item?.id]);

  useEffect(() => {
    if (type === 'movie' || !item) return;
    
    async function loadSeason() {
      setIsEpisodesLoading(true);
      const data = await fetchTVSeason(item.id, selectedSeason);
      setSeasonData(data);
      setIsEpisodesLoading(false);
    }
    loadSeason();
  }, [selectedSeason, item?.id, type]);

  const toggleMute = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: isMuted ? 'unMute' : 'mute', args: [] }),
        '*'
      );
      setIsMuted(!isMuted);
    }
  };

  const handleToggleWatchLater = async () => {
    const previousState = isWatchLater;
    setIsWatchLater(!previousState); // Optimistic update

    const res = await toggleWatchLater(item.id, type, title, item.poster_path);
    if (res.success) {
      setIsWatchLater(res.added ?? false);
    } else {
      setIsWatchLater(previousState); // Revert on failure
      if (res.error === 'Not authenticated') alert('Please login to save to Watch Later.');
    }
  };

  const handleToggleFavorite = async () => {
    const previousState = isFavorite;
    setIsFavorite(!previousState); // Optimistic update

    const res = await toggleFavorite(item.id, type, title, item.poster_path);
    if (res.success) {
      setIsFavorite(res.added ?? false);
    } else {
      setIsFavorite(previousState); // Revert on failure
      if (res.error === 'Not authenticated') alert('Please login to save to Favorites.');
    }
  };

  if (!item) return null;

  const title = item.title || item.name;
  const releaseYear = (item.release_date || item.first_air_date || '').split('-')[0];
  const runtime = item.runtime || (item.episode_run_time && item.episode_run_time[0]);
  
  // Format runtime
  const formattedRuntime = runtime 
    ? `${Math.floor(runtime / 60)}h ${runtime % 60}m` 
    : '';

  const cast = item.credits?.cast?.slice(0, 8) || [];
  const similar = item.similar?.results?.slice(0, 10) || [];
  
  // Find a trailer
  const trailer = item.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');

  return (
    <main className="min-h-screen bg-[#050505] pb-20">
      {/* Advanced Cinematic Hero Section */}
      <div className="relative w-full h-[85vh] min-h-[600px] max-h-[900px] flex items-end overflow-hidden">
        
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none">
          {trailer ? (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vh] opacity-70">
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailer.key}&enablejsapi=1`}
                className="w-full h-full pointer-events-none"
                allow="autoplay; encrypted-media"
                frameBorder="0"
              />
            </div>
          ) : (
            <img 
              src={getTMDBImageUrl(item.backdrop_path, 'original')} 
              alt={title}
              className="w-full h-full object-cover opacity-60 scale-105"
            />
          )}

          {/* Cinematic Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#050505]/20 to-transparent" />
        </div>

        {/* Floating Mute Button */}
        {trailer && mounted && (
          <button 
            onClick={toggleMute}
            className="absolute top-24 right-8 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all pointer-events-auto shadow-2xl"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pb-16 flex flex-col gap-6">
          
          {/* Title Area */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors w-fit text-[10px] font-bold tracking-[0.3em] uppercase mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Go Back
            </button>
            <h1 className="text-5xl md:text-7xl lg:text-[100px] font-black text-white tracking-[0.25em] leading-[0.9] uppercase drop-shadow-2xl">
              {title}
            </h1>
          </div>
          
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-6 text-[12px] font-bold tracking-[0.1em] text-white/60 uppercase mt-4">
            {item.vote_average ? (
              <div className="flex items-center gap-1.5 text-[#D47A73]">
                <Star className="w-4 h-4 fill-current" />
                <span>{item.vote_average.toFixed(1)}</span>
              </div>
            ) : null}
            
            {releaseYear && <span>{releaseYear}</span>}
            
            {item.genres?.map((g: any) => (
              <span key={g.id}>{g.name}</span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-white/70 text-sm md:text-base leading-[1.8] max-w-2xl text-balance drop-shadow-md font-medium mt-2 mb-4">
            {item.overview}
          </p>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-4 w-full mt-2">
            
            {/* Primary Action */}
            <Link 
              href={`/watch/${type}/${item.id}`}
              className="group flex items-center justify-center gap-3 px-10 py-4 bg-[#D47A73] text-white hover:bg-[#DE867E] rounded-full font-bold text-[14px] tracking-widest uppercase transition-all duration-300 active:scale-95 w-full sm:w-auto shadow-[0_0_20px_rgba(212,122,115,0.3)]"
            >
              <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform duration-300" />
              Play
            </Link>

            {/* Secondary Actions (Vertical Icon + Text on Mobile, Horizontal on Desktop) */}
            <div className="flex items-center justify-around sm:justify-start w-full sm:w-auto gap-2 sm:gap-6">
              
              {/* Watch Later */}
              <button 
                onClick={handleToggleWatchLater}
                className="group flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className={`w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] flex items-center justify-center rounded-full border backdrop-blur-md transition-all shadow-xl ${
                  isWatchLater 
                    ? 'bg-[#D47A73] text-white border-[#D47A73]' 
                    : 'bg-black/40 group-hover:bg-white/10 text-white border-white/20'
                }`}>
                  <motion.div initial={false} animate={{ scale: isWatchLater ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
                    <Bookmark className={`w-5 h-5 ${isWatchLater ? 'fill-current' : ''}`} />
                  </motion.div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-white/60 group-hover:text-white transition-colors">Later</span>
              </button>

              {/* Favorite */}
              <button 
                onClick={handleToggleFavorite}
                className="group flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className={`w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] flex items-center justify-center rounded-full border backdrop-blur-md transition-all shadow-xl ${
                  isFavorite 
                    ? 'bg-rose-500 text-white border-rose-500' 
                    : 'bg-black/40 group-hover:bg-white/10 text-white border-white/20'
                }`}>
                  <motion.div initial={false} animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </motion.div>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-white/60 group-hover:text-white transition-colors">Fav</span>
              </button>

              {/* Episodes (TV Only) */}
              {type !== 'movie' && (
                <button 
                  onClick={() => document.getElementById('episodes-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group flex flex-col items-center gap-2 active:scale-95 transition-transform"
                >
                  <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] flex items-center justify-center rounded-full border border-white/20 bg-black/40 group-hover:bg-white/10 backdrop-blur-md text-white transition-all shadow-xl">
                    <ListVideo className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-white/60 group-hover:text-white transition-colors">Episodes</span>
                </button>
              )}

              {/* Similars */}
              <button 
                onClick={() => document.getElementById('similar-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="group flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-[46px] h-[46px] sm:w-[50px] sm:h-[50px] flex items-center justify-center rounded-full border border-white/20 bg-black/40 group-hover:bg-white/10 backdrop-blur-md text-white transition-all shadow-xl">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-white/60 group-hover:text-white transition-colors">Similars</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Content Layout */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16 flex flex-col gap-24">
        
        {/* Episodes Section */}
        {type !== 'movie' && (
          <div id="episodes-section" className="scroll-mt-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/5 pb-4">
              <button 
                onClick={() => setIsEpisodesVisible(!isEpisodesVisible)}
                className="text-[#EAE8E3] text-[16px] font-bold tracking-[0.2em] uppercase flex items-center gap-3 hover:text-white transition-colors"
              >
                <ChevronDown className={`w-5 h-5 text-[#D47A73] transition-transform duration-300 ${isEpisodesVisible ? '' : '-rotate-90'}`} />
                Episodes
              </button>
              
              {/* Seasons Dropdown */}
              {isEpisodesVisible && (
                <div className="relative z-20">
                  <button
                    onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                    className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold tracking-widest text-[12px] uppercase transition-all shadow-xl"
                  >
                    Season {selectedSeason}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSeasonDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSeasonDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setIsSeasonDropdownOpen(false)}
                      />
                      <div className="absolute top-full right-0 md:left-0 mt-2 w-48 max-h-[300px] overflow-y-auto custom-scrollbar bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-20 py-2 flex flex-col hide-scrollbar">
                        {validSeasons.map((season: any) => (
                          <button
                            key={season.id}
                            onClick={() => {
                              setSelectedSeason(season.season_number);
                              setIsSeasonDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 font-bold tracking-widest text-[11px] uppercase transition-all ${
                              selectedSeason === season.season_number
                                ? 'text-[#D47A73] bg-white/5'
                                : 'text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5'
                            }`}
                          >
                            Season {season.season_number}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {isEpisodesVisible && (
              isEpisodesLoading ? (
                <div className="w-full flex items-center justify-center p-20">
                  <div className="w-8 h-8 border-2 border-[#D47A73] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : seasonData?.episodes?.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {seasonData.episodes.map((ep: any) => (
                    <Link
                      key={ep.id}
                      href={`/watch/${type}/${item.id}`}
                      className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/5 transition-all duration-300 group"
                    >
                      {/* Thumbnail */}
                      <div className="w-full sm:w-[240px] shrink-0 aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/5 relative">
                        {ep.still_path ? (
                          <img 
                            src={getTMDBImageUrl(ep.still_path, 'w500')} 
                            alt={ep.name}
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20 bg-black/50">
                            <LayoutGrid className="w-8 h-8" />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                          <div className="w-12 h-12 rounded-full bg-[#D47A73]/90 text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                            <Play className="w-5 h-5 ml-1 fill-current" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="flex flex-col justify-center flex-1 py-1">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-2xl font-black text-white/20 group-hover:text-[#D47A73] transition-colors">
                            {ep.episode_number.toString().padStart(2, '0')}
                          </span>
                          <h4 className="text-[#EAE8E3] text-sm md:text-base font-bold leading-tight group-hover:text-white transition-colors">{ep.name}</h4>
                        </div>
                        <p className="text-white/40 text-xs md:text-[13px] line-clamp-3 leading-relaxed">{ep.overview || 'No overview available.'}</p>
                        
                        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                          <span className="text-[10px] tracking-[0.2em] text-[#D47A73] uppercase font-bold flex items-center gap-1.5">
                            <Play className="w-3 h-3 fill-current" /> Play Episode
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-2xl gap-3 text-white/50">
                  <ListVideo className="w-8 h-8 opacity-50" />
                  <p className="text-xs tracking-widest font-bold uppercase">No episodes found</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Cast Section */}
        {cast.length > 0 && (
          <section>
            <h2 className="text-[#EAE8E3] text-[12px] font-bold tracking-[0.3em] uppercase mb-8 flex items-center gap-3">
              <span className="w-1 h-1 rounded-full bg-[#D47A73]"></span>
              Top Cast
            </h2>
            <div className="flex overflow-x-auto hide-scrollbar gap-4 md:grid md:grid-cols-6 lg:grid-cols-8 md:gap-4 pb-4">
              {cast.map((actor: any) => (
                <div key={actor.id} className="flex flex-col gap-2 md:gap-3 group cursor-pointer shrink-0 w-[80px] md:w-auto items-center md:items-start text-center md:text-left">
                  <div className="w-[70px] h-[70px] md:w-full md:aspect-[2/3] md:h-auto rounded-full md:rounded-xl overflow-hidden bg-black/50 border border-white/5 shrink-0">
                    {actor.profile_path ? (
                      <img 
                        src={getTMDBImageUrl(actor.profile_path, 'w500')} 
                        alt={actor.name}
                        className="w-full h-full object-cover opacity-70 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 bg-black/50 text-[10px]">
                        N/A
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[#EAE8E3] text-[11px] font-bold tracking-wider uppercase leading-tight group-hover:text-[#D47A73] transition-colors">{actor.name}</h4>
                    <p className="text-white/40 text-[10px] mt-1 line-clamp-1">{actor.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar Titles */}
        {similar.length > 0 && (
          <div id="similar-section" className="scroll-mt-32">
            <ContentSection title="Similar Titles" items={similar} />
          </div>
        )}

      </div>
    </main>
  );
}
