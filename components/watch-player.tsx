"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LayoutGrid, X, ListVideo } from 'lucide-react';
import { fetchTVSeason } from '@/lib/actions/tmdb';
import { getTMDBImageUrl } from '@/lib/tmdb';

interface WatchPlayerProps {
  item: any;
  type: 'movie' | 'tv' | 'anime';
}

export default function WatchPlayer({ item, type }: WatchPlayerProps) {
  const router = useRouter();
  const [isEpisodesOpen, setIsEpisodesOpen] = useState(false);
  const initialSeason = item?.seasons?.find((s: any) => s.season_number > 0)?.season_number || 1;
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (type === 'movie') return;
    
    async function loadSeason() {
      setIsLoading(true);
      const data = await fetchTVSeason(item.id, selectedSeason);
      setSeasonData(data);
      setIsLoading(false);
    }
    loadSeason();
  }, [selectedSeason, item.id, type]);

  if (!item) return null;

  const validSeasons = item.seasons?.filter((s: any) => s.season_number > 0) || [];

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#050505] z-50 p-2 md:p-6 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full bg-black rounded-xl md:rounded-[24px] border border-white/5 overflow-hidden shadow-2xl flex flex-col">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="absolute top-6 left-6 z-10 w-12 h-12 flex items-center justify-center text-white/50 hover:text-white bg-black/20 hover:bg-white/5 rounded-full backdrop-blur-md transition-all"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Episodes Toggle Button (TV/Anime Only) */}
        {type !== 'movie' && (
          <button 
            onClick={() => setIsEpisodesOpen(true)}
            className="absolute bottom-6 right-6 z-10 px-5 py-3 flex items-center gap-3 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-xl backdrop-blur-xl border border-white/10 transition-all font-bold tracking-widest text-xs uppercase shadow-2xl"
          >
            <ListVideo className="w-5 h-5" />
            Episodes
          </button>
        )}

        {/* Full Screen Video Player */}
        <iframe
          src={type === 'movie' 
            ? `https://www.vidking.net/embed/movie/${item.id}?color=D47A73&autoPlay=true` 
            : `https://www.vidking.net/embed/tv/${item.id}/${selectedSeason}/${selectedEpisode}?color=D47A73&autoPlay=true&nextEpisode=true&episodeSelector=false`}
          title="Watch Player"
          className="w-full h-full border-none outline-none"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />

        {/* Custom Slide-out Episodes Sidebar */}
        {type !== 'movie' && (
          <div 
            className={`absolute top-0 right-0 h-full w-full sm:w-[400px] bg-[rgba(10,10,10,0.85)] backdrop-blur-3xl border-l border-white/5 z-20 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isEpisodesOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-[#EAE8E3] font-bold tracking-widest text-sm uppercase">Episodes</h2>
              <button 
                onClick={() => setIsEpisodesOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[#888888] hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Seasons Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar p-4 gap-2 border-b border-white/5 shrink-0">
              {validSeasons.map((season: any) => (
                <button
                  key={season.id}
                  onClick={() => setSelectedSeason(season.season_number)}
                  className={`shrink-0 px-4 py-2 rounded-lg font-bold tracking-widest text-[10px] uppercase transition-all ${
                    selectedSeason === season.season_number
                      ? 'bg-[#D47A73] text-[#151515] shadow-[0_0_15px_rgba(212,122,115,0.2)]'
                      : 'bg-white/5 text-[#888888] hover:bg-white/10 hover:text-[#EAE8E3]'
                  }`}
                >
                  Season {season.season_number}
                </button>
              ))}
            </div>

            {/* Episodes List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#D47A73] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : seasonData?.episodes?.length > 0 ? (
                seasonData.episodes.map((ep: any) => {
                  const isPlaying = selectedEpisode === ep.episode_number;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => {
                        setSelectedEpisode(ep.episode_number);
                        setIsEpisodesOpen(false);
                      }}
                      className={`relative flex gap-4 p-3 rounded-xl text-left transition-all group overflow-hidden ${
                        isPlaying 
                          ? 'bg-white/10 border border-white/10' 
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-[120px] h-[68px] shrink-0 bg-black/50 rounded-lg overflow-hidden relative">
                        {ep.still_path ? (
                          <img 
                            src={getTMDBImageUrl(ep.still_path, 'w500')} 
                            alt={ep.name}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            <LayoutGrid className="w-6 h-6" />
                          </div>
                        )}
                        {/* Play Overlay */}
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          {isPlaying ? (
                            <div className="text-[10px] font-bold tracking-widest text-[#D47A73] uppercase bg-black/60 px-2 py-1 rounded">Playing</div>
                          ) : (
                            <ListVideo className="w-6 h-6 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 py-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-black ${isPlaying ? 'text-[#D47A73]' : 'text-white/40'}`}>
                            {ep.episode_number}.
                          </span>
                          <span className={`text-sm font-bold truncate ${isPlaying ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
                            {ep.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed">
                          {ep.overview || 'No overview available.'}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white/30 gap-2">
                  <LayoutGrid className="w-8 h-8 opacity-50" />
                  <p className="text-xs uppercase tracking-widest font-bold">No Episodes Found</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
