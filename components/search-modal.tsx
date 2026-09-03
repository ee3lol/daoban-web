/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, X, ChevronDown, Play, Info, Star } from "lucide-react";
import Link from "next/link";
import { searchTMDB } from "@/lib/actions/tmdb";
import { getTMDBImageUrl } from "@/lib/tmdb";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
      setExpandedId(null);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setExpandedId(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchTMDB(query);
        
        const filtered =
          data.results?.filter(
            (r: any) => r.media_type === "movie" || r.media_type === "tv",
          ) || [];
        setResults(filtered.slice(0, 10)); 
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4 backdrop-blur-[2px] bg-black/80">
      {}
      <div className="absolute inset-0 z-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] backdrop-blur-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.2)] rounded-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.05)]">
          <h2 className="text-xl font-bold text-[#EAE8E3] tracking-wide">
            Search
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[rgba(255,255,255,0.1)] text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)]">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, tv shows..."
              className="w-full bg-[rgba(255,255,255,0.025)] text-[#EAE8E3] border border-[rgba(255,255,255,0.06)] rounded-xl py-4 pl-12 pr-12 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all text-[15px]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 p-1.5 rounded-full hover:bg-[rgba(255,255,255,0.1)] text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {isLoading && !results.length && (
            <div className="flex flex-col items-center justify-center p-12 text-white/30 gap-4">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold tracking-widest uppercase">
                Searching...
              </p>
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-white/30 gap-3">
              <Search className="w-8 h-8 opacity-20" />
              <p className="text-sm font-medium">
                No results found for "{query}"
              </p>
            </div>
          )}

          {!query && (
            <div className="flex flex-col items-center justify-center p-16 text-white/20 gap-4">
              <Search className="w-10 h-10 opacity-20" />
              <p className="text-xs font-bold tracking-[0.2em] uppercase">
                Type to start searching
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="flex flex-col">
              {results.map((item) => {
                const title = item.title || item.name;
                const year = (
                  item.release_date ||
                  item.first_air_date ||
                  ""
                ).split("-")[0];
                const type = item.media_type === "movie" ? "Movie" : "TV Show";
                const isExpanded = expandedId === item.id;
                const isAnime = item.original_language === 'ja' && item.genre_ids?.includes(16);
                const linkType = isAnime ? 'anime' : item.media_type;

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3 sm:gap-4 border-b border-white/5 hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-300"
                  >
                    <div className="flex items-center justify-between w-full sm:w-auto flex-1">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-[45px] h-[64px] shrink-0 rounded overflow-hidden bg-black/50 border border-white/10 relative">
                          {item.poster_path ? (
                            <img
                              src={getTMDBImageUrl(item.poster_path, "w500")}
                              alt={title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-white/20" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-center min-w-0">
                          <h3 className="text-[#EAE8E3] font-bold text-[15px] truncate">
                            {title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-[11px] font-medium tracking-wider text-[#888888] uppercase">
                            <span>{type}</span>
                            {year && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span>{year}</span>
                              </>
                            )}
                            {item.vote_average ? (
                              <>
                                <span className="w-1 h-1 rounded-full bg-accent/50" />
                                <span className="flex items-center gap-1 text-accent">
                                  <Star className="w-3 h-3 fill-current" />
                                  {item.vote_average.toFixed(1)}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setExpandedId(isExpanded ? null : item.id);
                        }}
                        className="sm:hidden p-2 text-white/40 hover:text-accent transition-colors ml-2"
                      >
                        <ChevronDown
                          className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-180 text-accent" : ""}`}
                        />
                      </button>
                    </div>

                    {}
                    <div
                      className={`${isExpanded ? "flex pt-2 w-full" : "hidden"} sm:flex items-center gap-2 w-full sm:w-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    >
                      <Link
                        href={`/watch/${linkType}/${item.id}`}
                        onClick={onClose}
                        className="group/btn flex items-center justify-center gap-2 px-6 py-2.5 bg-accent text-accent-foreground hover:brightness-110 rounded-full font-bold text-[11px] tracking-widest uppercase transition-all duration-300 active:scale-95 flex-1 sm:flex-none"
                      >
                        <Play className="w-3.5 h-3.5 fill-current group-hover/btn:scale-110 transition-transform duration-300" />
                        Play
                      </Link>
                      <Link
                        href={`/${item.media_type}/${item.id}`}
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-[#EAE8E3] rounded-full font-bold text-[11px] tracking-widest uppercase transition-all duration-300 border border-white/5 flex-1 sm:flex-none"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
