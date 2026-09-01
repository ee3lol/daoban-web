"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getTMDBImageUrl } from "@/lib/tmdb";
import {
  Play,
  Star,
  Clock,
  Calendar,
  Info,
  ChevronLeft,
  Plus,
  ArrowLeft,
  BookmarkPlus,
  Check,
  MonitorPlay,
  X,
  Volume2,
  VolumeX,
  LayoutGrid,
  ChevronDown,
  Bookmark,
  Heart,
  Share2,
  ListVideo,
  PartyPopper,
} from "lucide-react";
import WatchPartyModal from "./watch-party-modal";
import { authClient } from "@/lib/auth-client";
import { getFriendData } from "@/lib/actions/friends";
import { useSocket } from "./socket-provider";
import ContentSection from "./content-section";
import CommentsSection from "./comments-section";
import ShareModal from "./share-modal";
import { fetchTVSeason } from "@/lib/actions/tmdb";
import { getWatchHistoryByMedia } from "@/lib/actions/history";
import {
  toggleWatchLater,
  toggleFavorite,
  checkMediaSaved,
} from "@/lib/actions/user";

interface MediaDetailsProps {
  item: any;
  type: "movie" | "tv" | "anime";
}

export default function MediaDetails({ item, type }: MediaDetailsProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const overviewRef = useRef<HTMLParagraphElement>(null);
  const { data: session } = authClient.useSession();
  const { socket, isConnected } = useSocket();
  const [presenceState, setPresenceState] = useState<Record<string, { watching: string | null }>>({});

  useEffect(() => {
    
    setShareUrl(window.location.href);
  }, []);

  const validSeasons =
    item?.seasons?.filter((s: any) => s.season_number > 0) || [];
  const initialSeason =
    validSeasons.length > 0 ? validSeasons[0].season_number : 1;
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [isEpisodesLoading, setIsEpisodesLoading] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [isEpisodesVisible, setIsEpisodesVisible] = useState(true);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [episodeProgress, setEpisodeProgress] = useState<Record<number, any>>({});
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  
  const [showTitleToggle, setShowTitleToggle] = useState(false);
  const [showOverviewToggle, setShowOverviewToggle] = useState(false);
  
  const [showSimilars, setShowSimilars] = useState(false);
  
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState<any[]>([]);

  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    if (!socket) return;
    
    // Fetch initial state immediately
    socket.emit("get_presence", (state: any) => {
      setPresenceState(state);
    });

    const handlePresence = (state: Record<string, { watching: string | null }>) => {
      setPresenceState(state);
    };
    socket.on("presence_sync", handlePresence);
    return () => {
      socket.off("presence_sync", handlePresence);
    };
  }, [socket]);

  useEffect(() => {
    if (isPartyModalOpen && session?.user) {
      getFriendData().then(data => {
        if (data?.accepted) {
          const formatted = data.accepted.map((f: any) => ({
            id: f.user.id,
            name: f.user.username || f.user.name,
            image: f.user.image,
          })).filter((f: any) => presenceState[f.id]); // Only those online
          setOnlineFriends(formatted);
        }
      });
    }
  }, [isPartyModalOpen, session?.user, presenceState]);

  const title = item?.title || item?.name;

  useEffect(() => {
    const checkTruncation = () => {
      if (titleRef.current && !isTitleExpanded) {
        setShowTitleToggle(titleRef.current.scrollHeight > titleRef.current.clientHeight);
      }
      if (overviewRef.current && !isOverviewExpanded) {
        setShowOverviewToggle(overviewRef.current.scrollHeight > overviewRef.current.clientHeight);
      }
    };

    const timeoutId = setTimeout(checkTruncation, 100);
    window.addEventListener("resize", checkTruncation);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkTruncation);
    };
  }, [title, item?.overview, isTitleExpanded, isOverviewExpanded]);
  const trailer = item?.videos?.results?.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube",
  );

  useEffect(() => {
    setMounted(true);
    if (item?.id) {
      checkMediaSaved(item.id).then((res) => {
        setIsWatchLater(res.isWatchLater);
        setIsFavorite(res.isFavorite);
      });
    }
  }, [item?.id]);

  useEffect(() => {
    if (trailer) {
      const timer = setTimeout(() => {
        setIsVideoReady(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [trailer]);

  useEffect(() => {
    if (type === "movie" || !item) return;

    async function loadSeason() {
      setIsEpisodesLoading(true);
      const [data, historyRes] = await Promise.all([
        fetchTVSeason(item.id, selectedSeason),
        getWatchHistoryByMedia(item.id, type)
      ]);
      setSeasonData(data);
      
      const historyMap: Record<number, any> = {};
      if (historyRes && historyRes.length > 0) {
        historyRes.forEach((h: any) => {
          if (h.season === selectedSeason && h.episode) {
            historyMap[h.episode] = h;
          }
        });
      }
      setEpisodeProgress(historyMap);
      setIsEpisodesLoading(false);
    }
    loadSeason();
  }, [selectedSeason, item?.id, type]);

  const toggleMute = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: isMuted ? "unMute" : "mute",
          args: [],
        }),
        "*",
      );
      setIsMuted(!isMuted);
    }
  };

  const handleToggleWatchLater = async () => {
    if (!session?.user) return;
    const previousState = isWatchLater;
    setIsWatchLater(!previousState); 

    const res = await toggleWatchLater(item.id, type, title, item.poster_path);
    if (res.success) {
      setIsWatchLater(res.added ?? false);
    } else {
      setIsWatchLater(previousState); 
    }
  };

  const handleToggleFavorite = async () => {
    if (!session?.user) return;
    const previousState = isFavorite;
    setIsFavorite(!previousState); 

    const res = await toggleFavorite(item.id, type, title, item.poster_path);
    if (res.success) {
      setIsFavorite(res.added ?? false);
    } else {
      setIsFavorite(previousState); 
    }
  };

  if (!item) return null;

  const releaseYear = (item.release_date || item.first_air_date || "").split(
    "-",
  )[0];
  const runtime =
    item.runtime || (item.episode_run_time && item.episode_run_time[0]);

  const formattedRuntime = runtime
    ? `${Math.floor(runtime / 60)}h ${runtime % 60}m`
    : "";

  const cast = item.credits?.cast?.slice(0, 8) || [];
  const similar = item.similar?.results?.slice(0, 10) || [];

  return (
    <main className="min-h-screen bg-background-light pb-20">
      {}
      <div className="relative w-full h-[75vh] min-h-[400px] max-h-[800px] flex items-center overflow-hidden">
        {}
        <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none">
          {}
          <Image
            src={getTMDBImageUrl(item.backdrop_path, "original")}
            alt={title}
            fill
            priority
            className={`object-cover scale-105 transition-opacity duration-300 ease-in-out ${trailer && isVideoReady ? "opacity-0" : "opacity-60"}`}
          />

          {}
          {trailer && (
            <div
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[56.25vw] min-w-[177.77vh] min-h-[100vh] scale-[1.15] pointer-events-none transition-opacity duration-300 ease-in-out hidden md:block ${isVideoReady ? "opacity-70" : "opacity-0"}`}
            >
              <iframe
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&loop=1&playlist=${trailer.key}`}
                className="w-full h-full pointer-events-none"
                allow="autoplay; encrypted-media"
                frameBorder="0"
              />
            </div>
          )}

          {}
          <div className="absolute inset-[-2px]" style={{ backgroundImage: 'linear-gradient(to top, var(--bg-light) 0%, color-mix(in srgb, var(--bg-light) 80%, transparent) 50%, transparent 100%)' }} />
          <div className="absolute inset-[-2px]" style={{ backgroundImage: 'linear-gradient(to right, var(--bg-light) 0%, color-mix(in srgb, var(--bg-light) 80%, transparent) 40%, transparent 100%)' }} />
          <div className="absolute inset-[-2px]" style={{ backgroundImage: 'linear-gradient(to left, color-mix(in srgb, var(--bg-light) 40%, transparent) 0%, transparent 100%)' }} />
        </div>

        {}
        <button
          onClick={() => router.back()}
          className="absolute top-16 md:top-24 left-6 md:left-12 z-30 flex items-center gap-2 text-white/50 hover:text-white transition-colors w-fit text-[10px] font-bold tracking-[0.3em] uppercase drop-shadow-md"
        >
          <ChevronLeft className="w-4 h-4" />
          Go Back
        </button>

        {}
        {trailer && mounted && (
          <button
            onClick={toggleMute}
            className="absolute top-24 right-8 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all pointer-events-auto shadow-2xl"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        )}

        {}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 md:px-12 mt-10 md:mt-20">
          <div className="max-w-2xl flex flex-col gap-5 transform transition-all duration-700 translate-y-0 opacity-100">
            <h1 
              ref={titleRef}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#EAE8E3] tracking-tighter leading-[1.1] drop-shadow-2xl uppercase text-balance"
            >
              {title}
            </h1>

            {}
            <div className="flex items-center gap-3 text-[12px] sm:text-[13px] font-medium text-[#888888] flex-wrap mt-1">
              {item.vote_average ? (
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                  <span className="text-accent font-bold">
                    {item.vote_average.toFixed(1)}
                  </span>
                </div>
              ) : null}

              {releaseYear && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#888888]/40" />
                  <span className="tracking-widest">{releaseYear}</span>
                </>
              )}

              {formattedRuntime && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#888888]/40" />
                  <span className="tracking-widest">{formattedRuntime}</span>
                </>
              )}

              {item.genres?.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#888888]/40" />
                  <span className="tracking-widest uppercase">
                    {item.genres.map((g: any) => g.name).slice(0, 3).join(" • ")}
                  </span>
                </>
              )}
            </div>

            <p 
              ref={overviewRef}
              className={`text-[#888888] text-[12px] sm:text-sm md:text-base leading-[1.6] sm:leading-[1.8] font-medium max-w-xl text-balance drop-shadow-md mt-1 sm:mt-2 transition-all duration-300 ${isOverviewExpanded ? "" : "line-clamp-3 sm:line-clamp-4"}`}
            >
              {item.overview}
            </p>
            {showOverviewToggle && (
              <button 
                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                className="text-accent text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-colors w-fit"
              >
                {isOverviewExpanded ? "Show Less" : "Read More"}
              </button>
            )}

            {}
            <div className="flex flex-col sm:flex-row items-center sm:items-start w-full gap-4 mt-6">
              {}
              <Link
                href={`/watch/${type}/${item.id}`}
                className="w-full sm:w-auto shrink-0 group flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 bg-accent text-accent-foreground hover:brightness-110 rounded-full font-bold text-[13px] tracking-widest transition-all duration-300 active:scale-95 whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform duration-300" />
                PLAY
              </Link>

              {}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start overflow-x-auto hide-scrollbar">
                {}
                <button
                  title="Watch Later"
                  disabled={!session?.user}
                  onClick={handleToggleWatchLater}
                  className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-full transition-all duration-300 backdrop-blur-md border ${
                    !session?.user ? "opacity-40 pointer-events-none" : "active:scale-95 group"
                  } ${
                    isWatchLater
                      ? "bg-accent/20 text-white border-accent/30 shadow-[0_0_15px_rgba(var(--color-accent),0.15)]"
                      : "bg-white/5 hover:bg-accent/10 border-white/10 hover:border-accent/40 text-foreground hover:text-accent"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110 ${isWatchLater ? "fill-current text-white" : ""}`} />
                </button>

                {}
                <button
                  title="Favorite"
                  disabled={!session?.user}
                  onClick={handleToggleFavorite}
                  className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-full transition-all duration-300 backdrop-blur-md border ${
                    !session?.user ? "opacity-40 pointer-events-none" : "active:scale-95 group"
                  } ${
                    isFavorite
                      ? "bg-accent/20 text-accent border-accent/30 shadow-[0_0_15px_rgba(var(--color-accent),0.15)]"
                      : "bg-white/5 hover:bg-accent/10 border-white/10 hover:border-accent/40 text-foreground hover:text-accent"
                  }`}
                >
                  <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110 ${isFavorite ? "fill-current text-accent" : ""}`} />
                </button>

                {}
                <button
                  title="Share"
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-accent/10 border border-white/10 hover:border-accent/40 text-foreground hover:text-accent transition-all duration-300 backdrop-blur-md active:scale-95 group"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                </button>

                {}
                {type !== "movie" && (
                  <button
                    title="Episodes"
                    onClick={() => document.getElementById("episodes-section")?.scrollIntoView({ behavior: "smooth" })}
                    className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-accent/10 border border-white/10 hover:border-accent/40 text-foreground hover:text-accent transition-all duration-300 backdrop-blur-md active:scale-95 group"
                  >
                    <ListVideo className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                  </button>
                )}

                {}
                  <button
                    title="Similars"
                    onClick={() => document.getElementById("similars-section")?.scrollIntoView({ behavior: "smooth" })}
                    className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-accent/10 border border-white/10 hover:border-accent/40 text-foreground hover:text-accent transition-all duration-300 backdrop-blur-md active:scale-95 group"
                  >
                    <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                  </button>
                  
                  {session?.user && (
                    <button
                      title="Host Watch Party"
                      onClick={() => setIsPartyModalOpen(true)}
                      className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-full bg-white/5 hover:bg-accent/10 border border-white/10 hover:border-accent/40 text-foreground hover:text-accent transition-all duration-300 backdrop-blur-md active:scale-95 group"
                    >
                      <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {session?.user && (
        <WatchPartyModal
          isOpen={isPartyModalOpen}
          onClose={() => setIsPartyModalOpen(false)}
          mediaId={item.id.toString()}
          mediaType={type}
          mediaTitle={item.title || item.name}
          hostId={session.user.id}
          hostName={session.user.name}
          onlineFriends={onlineFriends}
        />
      )}

      {}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-8 md:mt-12 relative z-20 flex flex-col gap-0 md:gap-4">
        {}
        {type !== "movie" && (
          <div id="episodes-section" className="scroll-mt-32">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/5 pb-4">
              <button
                onClick={() => setIsEpisodesVisible(!isEpisodesVisible)}
                className="text-[#EAE8E3] text-[16px] font-bold tracking-[0.2em] uppercase flex items-center gap-3 hover:text-white transition-colors"
              >
                <ChevronDown
                  className={`w-5 h-5 text-accent transition-transform duration-300 ${isEpisodesVisible ? "" : "-rotate-90"}`}
                />
                Episodes
              </button>

              {}
              {isEpisodesVisible && (
                <div className="relative z-20">
                  <button
                    onClick={() =>
                      setIsSeasonDropdownOpen(!isSeasonDropdownOpen)
                    }
                    className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold tracking-widest text-[12px] uppercase transition-all shadow-xl"
                  >
                    Season {selectedSeason}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-300 ${isSeasonDropdownOpen ? "rotate-180" : ""}`}
                    />
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
                                ? "text-accent bg-white/5"
                                : "text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5"
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

            {isEpisodesVisible &&
              (isEpisodesLoading ? (
                <div className="w-full flex items-center justify-center p-20">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : seasonData?.episodes?.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {seasonData.episodes.map((ep: any) => {
                    const epHistory = episodeProgress[ep.episode_number];
                    const progressPercentage = epHistory && epHistory.duration > 0 
                      ? (epHistory.progress / epHistory.duration) * 100 
                      : 0;

                    const timeText = (progressPercentage > 0 && progressPercentage < 95 && epHistory?.duration > 0)
                      ? `${Math.floor(epHistory.progress / 60)}m / ${Math.floor(epHistory.duration / 60)}m`
                      : ep.runtime ? `${ep.runtime}m` : null;

                    return (
                      <Link
                        key={ep.id}
                        href={`/watch/${type}/${item.id}?season=${selectedSeason}&episode=${ep.episode_number}`}
                        className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/5 transition-all duration-300 group"
                      >
                        {}
                        <div className="w-full sm:w-[240px] shrink-0 aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/5 relative">
                          {ep.still_path ? (
                            <Image
                              src={getTMDBImageUrl(ep.still_path, "w500")}
                              alt={ep.name}
                              fill
                              sizes="(max-width: 640px) 100vw, 240px"
                              className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20 bg-black/50">
                              <LayoutGrid className="w-8 h-8" />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                            <div className="w-12 h-12 rounded-full bg-accent/90 text-accent-foreground flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                              <Play className="w-5 h-5 ml-1 fill-current" />
                            </div>
                          </div>
                          
                          {}
                          {timeText && (
                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] font-bold tracking-wider text-white uppercase z-10 shadow-lg">
                              {timeText}
                            </div>
                          )}

                          {}
                          {progressPercentage > 0 && progressPercentage < 95 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20 backdrop-blur-sm">
                              <div 
                                className="h-full bg-accent transition-all duration-500"
                                style={{ width: `${Math.min(100, progressPercentage)}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {}
                        <div className="flex flex-col justify-center flex-1 py-1">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-2xl font-black text-white/20 group-hover:text-accent transition-colors">
                              {ep.episode_number.toString().padStart(2, "0")}
                            </span>
                            <div className="flex flex-col">
                              <h4 className="text-[#EAE8E3] text-sm md:text-base font-bold leading-tight group-hover:text-white transition-colors">
                                {ep.name}
                              </h4>
                            </div>
                          </div>
                          <p className="text-white/40 text-xs md:text-[13px] line-clamp-3 leading-relaxed">
                            {ep.overview || "No overview available."}
                          </p>

                          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2">
                            <span className="text-[10px] tracking-[0.2em] text-accent uppercase font-bold flex items-center gap-1.5">
                              <Play className="w-3 h-3 fill-current" /> Play Episode
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-2xl gap-3 text-white/50">
                  <ListVideo className="w-8 h-8 opacity-50" />
                  <p className="text-xs tracking-widest font-bold uppercase">
                    No episodes found
                  </p>
                </div>
              ))}
          </div>
        )}

        {}
        {cast.length > 0 && (
          <section className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-8 relative z-20">
              <div className="flex items-center w-full sm:w-auto">
                <h2 className="text-[#EAE8E3] text-[13px] sm:text-[15px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">
                  Top Cast
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-[#888888]/20 to-transparent ml-4 sm:mx-6" />
              </div>
            </div>
            
            <div className="flex overflow-x-auto gap-4 md:gap-8 pb-8 pt-2 snap-x snap-mandatory hide-scrollbar relative z-20 scroll-smooth">
              {cast.map((actor: any) => (
                <div
                  key={actor.id}
                  className="flex flex-col gap-3 group cursor-pointer shrink-0 w-[80px] md:w-[120px] items-center text-center snap-start"
                >
                  <div className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] rounded-full overflow-hidden bg-black/50 border-2 border-transparent group-hover:border-accent transition-all duration-300 shrink-0 shadow-lg p-1">
                    <div className="w-full h-full rounded-full overflow-hidden relative">
                      {actor.profile_path ? (
                        <Image
                          src={getTMDBImageUrl(actor.profile_path, "w500")}
                          alt={actor.name}
                          fill
                          sizes="(max-width: 768px) 80px, 120px"
                          className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 bg-black/50 text-[10px] font-bold tracking-wider">
                          N/A
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[#EAE8E3] text-[10px] md:text-[12px] font-bold tracking-wider uppercase leading-snug group-hover:text-accent transition-colors">
                      {actor.name}
                    </h4>
                    <p className="text-[#888888] text-[10px] md:text-[11px] mt-1 line-clamp-2 md:line-clamp-1 leading-snug font-medium">
                      {actor.character}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {}
        {similar.length > 0 && (
          <div id="similar-section" className="scroll-mt-32 mb-16 -mx-6 md:-mx-12">
            <ContentSection title="Similar Titles" items={similar} />
          </div>
        )}

        {}
        <section className="relative mb-16">
          <div className="flex items-center w-full sm:w-auto mb-8 relative z-20">
            <h2 className="text-[#EAE8E3] text-[13px] sm:text-[15px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">
              Discussion
            </h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-[#888888]/20 to-transparent ml-4 sm:mx-6" />
          </div>
          <div className="w-full relative z-20">
            <CommentsSection mediaId={item.id} mediaType={type} currentUser={session?.user} variant="inline" />
          </div>
        </section>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        url={shareUrl} 
        title={title} 
      />
    </main>
  );
}
