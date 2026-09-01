"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdArrowBack, MdGridView, MdClose, MdPlaylistPlay, MdChatBubbleOutline, MdPlayArrow } from 'react-icons/md';
import { fetchTVSeason } from '@/lib/actions/tmdb';
import { fetchVideoSources } from '@/lib/actions/video';
import { getMediaProgress, updateWatchHistory } from '@/lib/actions/history';
import { getTMDBImageUrl } from '@/lib/tmdb';
import { useSocket } from '@/components/socket-provider';
import CustomVideoPlayer from './custom-video-player';
import CommentsSection from './comments-section';
import { authClient } from '@/lib/auth-client';
import PartyChat from './party-chat';
import { ArrowLeft, Users } from 'lucide-react';
import Image from 'next/image';

const MemoizedCustomVideoPlayer = React.memo(CustomVideoPlayer);
const MemoizedCommentsSection = React.memo(CommentsSection);

interface WatchPlayerProps {
  item: any;
  type: 'movie' | 'tv' | 'anime';
  defaultSeason?: number;
  defaultEpisode?: number;
}

export default function WatchPlayer({ item, type, defaultSeason, defaultEpisode }: WatchPlayerProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'comments' | 'party'>(type === 'movie' ? 'comments' : 'episodes');

  const initialSeason = defaultSeason || item?.seasons?.find((s: any) => s.season_number > 0)?.season_number || 1;
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(defaultEpisode || 1);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);

  const [videoSources, setVideoSources] = useState<any[]>([]);
  const [isSourcesLoading, setIsSourcesLoading] = useState(true);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [initialTime, setInitialTime] = useState(0);

  const { socket, isConnected } = useSocket();
  const searchParams = useSearchParams();
  const partyId = searchParams.get("party");
  
  const [isInParty, setIsInParty] = useState(false);
  const [partyError, setPartyError] = useState<string | null>(null);
  const [partyPassword, setPartyPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [partyHostId, setPartyHostId] = useState<string | null>(null);
  const [partyMembers, setPartyMembers] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (isConnected && socket && partyId && session?.user && !isInParty) {
      socket.emit("join_party", {
        partyId,
        userId: session.user.id,
        userName: session.user.name || session.user.username || "Guest",
        password: partyPassword || undefined
      }, (res: any) => {
        if (res.success) {
          setIsInParty(true);
          setNeedsPassword(false);
          setPartyError(null);
          setPartyHostId(res.hostId);
          setPartyMembers(res.members || []);
        } else {
          if (res.error === "Invalid password") {
            setNeedsPassword(true);
          } else {
            setPartyError(res.error);
          }
        }
      });
    }
  }, [isConnected, socket, partyId, session?.user, partyPassword, isInParty]);

  // Listen for party events (kick, end, member updates)
  useEffect(() => {
    if (!socket || !partyId) return;

    const handleKicked = (data: any) => {
      setIsInParty(false);
      setPartyError(data.reason || "You were removed from the party.");
    };
    const handleEnded = (data: any) => {
      setIsInParty(false);
      setPartyError(data.reason || "The party has ended.");
    };
    const handleMembersUpdate = (data: any) => {
      setPartyMembers(data.members || []);
    };

    socket.on("party_kicked", handleKicked);
    socket.on("party_ended", handleEnded);
    socket.on("party_members_update", handleMembersUpdate);

    return () => {
      socket.off("party_kicked", handleKicked);
      socket.off("party_ended", handleEnded);
      socket.off("party_members_update", handleMembersUpdate);
    };
  }, [socket, partyId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket && isInParty) {
        socket.emit("leave_party");
      }
    };
  }, [socket, isInParty]);

  useEffect(() => {
    if (isConnected && socket) {
      const watchingText = item?.title || item?.name || "Video";
      console.log("Emitting presence:", watchingText);
      socket.emit("update_presence", { watching: watchingText });
      
      const interval = setInterval(() => {
        socket.emit("update_presence", { watching: watchingText });
      }, 10000); // Re-sync every 10 seconds just in case
      
      return () => {
        console.log("Clearing presence");
        clearInterval(interval);
        if (isConnected && socket) {
          socket.emit("update_presence", { watching: null });
        }
      };
    }
  }, [isConnected, socket, item]);

  useEffect(() => {
    if (type === 'movie') return;

    async function loadSeason() {
      setIsLoadingEpisodes(true);
      const data = await fetchTVSeason(item.id, selectedSeason);
      setSeasonData(data);
      setIsLoadingEpisodes(false);
    }
    loadSeason();
  }, [selectedSeason, item.id, type]);

  useEffect(() => {
    async function loadSources() {
      setIsSourcesLoading(true);
      setVideoSources([]);
      
      const [res, progress] = await Promise.all([
        fetchVideoSources(type, item.id, selectedSeason, selectedEpisode),
        getMediaProgress(item.id, type, type === 'movie' ? undefined : selectedSeason, type === 'movie' ? undefined : selectedEpisode)
      ]);

      if (res.success && res.sources) {
        setVideoSources(res.sources);
      }
      setInitialTime(partyId ? 0 : (progress || 0));
      setIsSourcesLoading(false);
    }
    loadSources();
  }, [selectedSeason, selectedEpisode, item.id, type]);

  if (!item) return null;

  const validSeasons = item.seasons?.filter((s: any) => s.season_number > 0) || [];

  return (
    <div className="fixed inset-0 w-screen h-screen bg-background z-50 p-0 md:p-6 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full bg-black rounded-none md:rounded-[24px] border-0 md:border md:border-white/5 overflow-hidden shadow-2xl flex flex-col md:flex-row">

        {/* LEFT COLUMN: VIDEO PLAYER */}
        <div className="relative flex-1 h-full">
          {/* BACK BUTTON */}
          <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 z-[60] w-12 h-12 flex items-center justify-center text-white/50 hover:text-white bg-black/20 hover:bg-white/5 rounded-full backdrop-blur-md transition-all"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Watch Party Setup Overlays */}
          {partyId && !isInParty && !partyError && needsPassword && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-6">
              <div className="bg-background-elevated border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center">
                <h3 className="text-white font-bold tracking-widest uppercase">Private Party</h3>
                <p className="text-muted text-xs">Enter the password to join this watch party.</p>
                <input
                  type="text"
                  value={partyPassword}
                  onChange={(e) => setPartyPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors text-center mt-2"
                />
              </div>
            </div>
          )}

          {partyError && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-6">
              <div className="bg-background-elevated border border-red-500/20 rounded-2xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center">
                <h3 className="text-red-500 font-bold tracking-widest uppercase">Connection Failed</h3>
                <p className="text-muted text-sm">{partyError}</p>
                <button
                  onClick={() => router.push(`/watch/${type}/${item.id}`)}
                  className="mt-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  Watch Solo
                </button>
              </div>
            </div>
          )}

          {/* Party Chat - Now integrated in sidebar */}

          {!isSidebarOpen && (
            <div className="absolute top-6 right-6 z-[60] flex gap-3">
              {type !== 'movie' && (
                <button
                  onClick={() => { setIsSidebarOpen(true); setActiveTab('episodes'); }}
                  className="px-5 py-3 flex items-center gap-3 text-white/70 hover:text-white bg-black/60 hover:bg-black/80 rounded-xl backdrop-blur-xl border border-white/10 transition-all font-bold tracking-widest text-xs uppercase shadow-2xl"
                >
                  <MdPlaylistPlay className="w-5 h-5" />
                  Episodes
                </button>
              )}
              <button
                onClick={() => { setIsSidebarOpen(true); setActiveTab('comments'); }}
                className="px-5 py-3 flex items-center gap-3 text-white/70 hover:text-white bg-black/60 hover:bg-black/80 rounded-xl backdrop-blur-xl border border-white/10 transition-all font-bold tracking-widest text-xs uppercase shadow-2xl"
              >
                <MdChatBubbleOutline className="w-5 h-5" />
                Discuss
              </button>
              {isInParty && partyId && (
                <button
                  onClick={() => { setIsSidebarOpen(true); setActiveTab('party'); }}
                  className="px-5 py-3 flex items-center gap-3 text-white/70 hover:text-white bg-black/60 hover:bg-black/80 rounded-xl backdrop-blur-xl border border-white/10 transition-all font-bold tracking-widest text-xs uppercase shadow-2xl"
                >
                  <Users className="w-5 h-5 text-accent" />
                  Party
                </button>
              )}
            </div>
          )}

          {isSourcesLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-4 text-white/50">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-widest font-bold">Loading Streams...</span>
              </div>
            </div>
          ) : (
            <MemoizedCustomVideoPlayer
              sources={videoSources}
              poster={getTMDBImageUrl(item.backdrop_path || item.poster_path, 'original')}
              initialTime={initialTime}
              socket={socket}
              partyId={partyId}
              isInParty={isInParty}
              itemTitle={item.name || item.title}
              itemDescription={type === 'movie' ? item.overview : (seasonData?.episodes?.find((e: any) => e.episode_number === selectedEpisode)?.overview || item.overview)}
              itemMetadata={[
                item.vote_average ? `⭐ ${Math.round(item.vote_average * 10) / 10}` : '',
                type === 'movie' ? 'Movie' : 'TV',
                type === 'movie' ? '' : `S${selectedSeason} E${selectedEpisode}`,
                (item.release_date || item.first_air_date || '').split('-')[0]
              ].filter(Boolean).join(' • ')}
              itemLogo={item.images?.logos?.[0]?.file_path ? `https://image.tmdb.org/t/p/w500${item.images.logos[0].file_path}` : undefined}
              onProgress={(currentTime, duration) => {
                updateWatchHistory({
                  mediaId: item.id,
                  mediaType: type,
                  season: type === 'movie' ? undefined : selectedSeason,
                  episode: type === 'movie' ? undefined : selectedEpisode,
                  progress: currentTime,
                  duration: duration,
                  title: item.name || item.title,
                  posterPath: item.poster_path,
                  backdropPath: item.backdrop_path,
                });
              }}
            />
          )}
        </div>

        <div
          className={`absolute top-0 right-0 h-full w-full sm:w-[450px] bg-[rgba(10,10,10,0.95)] backdrop-blur-3xl border-l border-white/5 z-[70] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0 md:w-[400px] ${!isSidebarOpen ? 'md:hidden' : 'md:flex'}`}
        >
          <div className="flex items-center justify-between p-2 border-b border-white/5 shrink-0 bg-black/20">
            <div className="flex">
              {type !== 'movie' && (
                <button
                  onClick={() => setActiveTab('episodes')}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'episodes' ? 'text-accent border-b-2 border-accent' : 'text-[#888888] hover:text-white'}`}
                >
                  Episodes
                </button>
              )}
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'comments' ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-white'}`}
              >
                Discuss
              </button>
              {isInParty && partyId && (
                <button
                  onClick={() => setActiveTab('party')}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'party' ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-white'}`}
                >
                  Party
                </button>
              )}
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="mr-4 w-8 h-8 flex items-center justify-center text-[#888888] hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden relative">

            {activeTab === 'episodes' && type !== 'movie' && (
              <div className="absolute inset-0 flex flex-col bg-black/90">
                <div className="relative px-6 py-4 border-b border-white/10 shrink-0 z-20 bg-black/40">
                  <button
                    onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                    className="flex items-center gap-3 text-xl md:text-2xl font-bold text-white transition-opacity hover:opacity-80"
                  >
                    Season {selectedSeason}
                    <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-300 ${isSeasonDropdownOpen ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isSeasonDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSeasonDropdownOpen(false)} />
                      <div className="absolute top-full left-6 mt-2 w-56 bg-[#181818] border border-white/10 rounded-lg shadow-2xl z-20 py-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                        {validSeasons.map((season: any) => (
                          <button
                            key={season.id}
                            onClick={() => {
                              setSelectedSeason(season.season_number);
                              setIsSeasonDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3.5 text-sm transition-colors hover:bg-white/10 ${selectedSeason === season.season_number ? 'text-accent bg-white/10 font-bold' : 'text-white/80 font-medium'
                              }`}
                          >
                            Season {season.season_number}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
                  {isLoadingEpisodes ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin drop-shadow-md" />
                    </div>
                  ) : seasonData?.episodes?.length > 0 ? (
                    seasonData.episodes.map((ep: any, index: number) => {
                      const isPlaying = selectedEpisode === ep.episode_number;
                      return (
                        <button
                          key={ep.id}
                          onClick={() => {
                            setSelectedEpisode(ep.episode_number);
                            
                            if (window.innerWidth < 768) setIsSidebarOpen(false);
                          }}
                          className={`relative flex items-center gap-4 px-4 py-4 text-left transition-colors border-b border-white/5 group ${isPlaying ? 'bg-white/5' : 'hover:bg-white/5'
                            }`}
                        >
                          <div className={`w-32 aspect-video shrink-0 bg-black/80 rounded overflow-hidden relative`}>
                            {ep.still_path ? (
                              <Image
                                src={getTMDBImageUrl(ep.still_path, 'w500')}
                                alt={ep.name}
                                fill
                                sizes="(max-width: 768px) 128px, 128px"
                                className={`object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20">
                                <MdGridView className="w-6 h-6" />
                              </div>
                            )}

                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              {isPlaying ? (
                                <span className="text-[10px] font-bold tracking-widest text-white uppercase drop-shadow-md bg-black/60 px-2 py-1 rounded">Playing</span>
                              ) : (
                                <MdPlayArrow className="w-10 h-10 text-white drop-shadow-md" />
                              )}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex flex-col gap-1 mb-1">
                              <h4 className={`text-sm font-medium truncate ${isPlaying ? 'text-accent font-bold drop-shadow-md' : 'text-white/90 group-hover:text-white'}`}>
                                {ep.episode_number}. {ep.name}
                              </h4>
                            </div>
                            <p className="text-xs text-white/50 line-clamp-2 leading-relaxed group-hover:text-white/70 transition-colors">
                              {ep.overview || 'No overview available.'}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-white/30 gap-3">
                      <MdGridView className="w-8 h-8 opacity-50" />
                      <p className="text-xs uppercase tracking-widest font-bold">No Episodes Found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {}
            {activeTab === 'comments' && (
              <div className="absolute inset-0 h-full">
                <MemoizedCommentsSection
                  mediaId={item.id}
                  mediaType={type}
                  season={type === 'movie' ? undefined : selectedSeason}
                  episode={type === 'movie' ? undefined : selectedEpisode}
                  currentUser={session?.user}
                />
              </div>
            )}

            {/* Party Chat Tab */}
            {activeTab === 'party' && isInParty && session?.user && partyId && (
              <div className="absolute inset-0 h-full bg-background-elevated/90 backdrop-blur-md">
                <PartyChat
                  partyId={partyId}
                  userId={session.user.id}
                  userName={session.user.name || "Unknown"}
                  hostId={partyHostId}
                  members={partyMembers}
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
