/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const TRIBUTE_SITES = [
  "123Movies", "FMovies", "Soap2Day", "Cineby", "Putlocker", "SolarMovie", 
  "PrimeWire", "GoStream", "Movie2k", "Movie4k", "Vumoo", "MyFlixer", 
  "Bflix", "Bflixz", "Fboxz", "Flixtorz", "Movies7", "SFlix", "Cinezone", "2Flix", 
  "SFlixtv", "Filmoflix", "TheFlixer", "Movies123", "YesMovies", "LookMovie", 
  "FlixHQ", "MoviesJoy", "StreamM4u", "WatchSeries", "WatchFree", "Watch32", 
  "WatchOnline", "LosMovies", "LimeTorrents", "P-Stream", "Movie-Web", 
  "Flixtor", "Popcorn Time", "Openload", "Streamango", "RapidVideo", "Vshare", 
  "Vidto", "Vidzi", "Vidup", "NowVideo", "Alluc", "Afdah", "Rainierland", 
  "KissAnime", "KissCartoon", "AniWave", "9anime", "Zoro.to", "Zoroxtv", 
  "AnimeSuge", "Anix", "Animeflix", "AnimeHeaven", "AnimeHub", "AnimeUltima", 
  "AnimeKisa", "AnimeDao", "AnimeFrenzy", "Masterani", "AnimeRhino", 
  "GoGoAnime", "AnimeShow", "Anime8", "AnimeNova", "Chia-Anime", "Anime44", 
  "AnimeToon", "AnimeHaven", "AnimeTake", "AniLinkz", "AniWatch", "KissAsian", 
  "Megavideo", "Stage6", "Megaupload", "What.CD", "Waffles.fm", "Oink's Pink Palace", 
  "Grooveshark", "KickassTorrents", "ExtraTorrent", "Torrentz", "TorrentHound", "IsoHunt"
];

export default function SocialHubClient({ initialFriendData, activeTab, currentUser }: { initialFriendData: any, activeTab: string, currentUser: any }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().catch((err) => {
        console.log("Autoplay prevented by browser:", err);
      });
    }
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (!hasInteracted) {
        setHasInteracted(true);
        audioRef.current.muted = false;
        setIsMuted(false);
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-[100] bg-[#020202] selection:bg-white/10 overflow-hidden font-sans block min-h-screen w-full">
      
      <audio ref={audioRef} src="/audio/bgm.mp3" loop />
      
      {/* Background Video with Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[0]">
        <video 
          src="/videos/background.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-25 grayscale-[0.3] contrast-125"
        />
        {/* Cinematic gradient and vignette */}
        <div className="absolute inset-0 bg-gradient-to-b md:bg-none md:bg-gradient-to-r from-[#020202] via-[#020202]/80 to-transparent" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] pointer-events-none" />
      </div>

      <style>{`
        @keyframes scroll-y {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-memorial-scroll {
          animation: scroll-y 120s linear infinite;
        }
        .mask-y-fade {
          mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
        }
      `}</style>

      {/* Audio Toggle (Top Left) */}
      <button 
        onClick={toggleAudio}
        className="absolute top-8 left-8 md:top-12 md:left-12 z-50 text-white/40 hover:text-white transition-all p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-md"
        aria-label="Toggle Audio"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Return Button (Bottom Left) */}
      <Link 
        href="/"
        className="absolute bottom-8 left-8 md:bottom-12 md:left-12 z-50 text-white/30 hover:text-white text-[11px] font-bold tracking-[0.5em] uppercase transition-all duration-300 flex items-center gap-2"
      >
        <span className="w-8 h-[1px] bg-white/30 transition-all group-hover:w-12 group-hover:bg-white" />
        Return
      </Link>

      {/* LEFT HALF: The Quote (Top Half on Mobile) */}
      <div className="absolute left-0 top-0 z-[10] w-full h-[40%] md:h-full md:bottom-0 md:w-[55%] flex flex-col justify-center items-center md:items-start px-8 md:px-24 lg:px-32 pointer-events-none text-center md:text-left pt-16 md:pt-0">
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-[0.02em] leading-[1.3] md:leading-[1.2] drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]">
          If buying isn't owning,
          <br />
          <span className="text-white/40 italic font-light tracking-normal mt-3 md:mt-5 block text-3xl md:text-5xl lg:text-6xl">
            piracy isn't stealing.
          </span>
        </h1>

      </div>

      {/* RIGHT HALF: The Memorial Scroll (Bottom Half on Mobile) */}
      <div className="absolute right-0 bottom-0 z-[10] w-full h-[60%] md:h-full md:top-0 md:w-[45%] overflow-hidden flex flex-col">
        
        {/* Memorial Header */}
        <div className="absolute top-0 inset-x-0 pt-8 md:pt-16 z-[20] flex flex-col items-center justify-center pointer-events-none">
          <p className="text-white/70 text-[10px] md:text-xs font-bold tracking-[1em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            [ In Memoriam ]
          </p>
          <div className="flex items-center gap-4 mt-6 opacity-60">
            <div className="w-16 md:w-24 h-[1px] bg-gradient-to-r from-transparent to-white/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)]" />
            <div className="w-16 md:w-24 h-[1px] bg-gradient-to-l from-transparent to-white/40" />
          </div>
        </div>

        {/* The Scrolling List */}
        <div className="flex-1 w-full relative flex justify-center z-[10] mask-y-fade mt-32 md:mt-40 overflow-hidden">
          <div className="flex flex-col items-center gap-12 md:gap-16 animate-memorial-scroll absolute top-0 pt-[50vh]">
            {[...TRIBUTE_SITES, ...TRIBUTE_SITES].map((site, idx) => (
              <div key={idx} className="flex flex-col items-center group">
                <span className="text-white/30 text-sm md:text-base lg:text-lg tracking-[0.5em] uppercase font-mono group-hover:text-white group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] group-hover:scale-110 transition-all duration-700 cursor-default text-center">
                  {site}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
