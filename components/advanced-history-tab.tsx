/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { History, Search, Trash2, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ContinueWatchingCard from "@/components/continue-watching-card";
import { clearHistory, removeFromHistory } from "@/lib/actions/history";
import { useRouter } from "next/navigation";

interface AdvancedHistoryTabProps {
  initialHistory: any[];
}

type FilterType = "all" | "movie" | "tv";
type SortType = "recent" | "alpha" | "progress";

export default function AdvancedHistoryTab({ initialHistory }: AdvancedHistoryTabProps) {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState(initialHistory);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortType, setSortType] = useState<SortType>("recent");
  const [isClearing, setIsClearing] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your entire watch history?")) return;
    
    setIsClearing(true);
    const res = await clearHistory();
    if (res.success) {
      setHistoryItems([]);
      router.refresh();
    }
    setIsClearing(false);
  };

  const handleRemoveItem = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setRemovingIds(prev => new Set(prev).add(id));
    const res = await removeFromHistory(id);
    if (res.success) {
      setHistoryItems(prev => prev.filter(item => item.id !== id));
      router.refresh();
    } else {
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let result = [...historyItems];

    if (filterType !== "all") {
      result = result.filter(item => item.mediaType === filterType);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => item.title?.toLowerCase().includes(lowerQuery));
    }

    result.sort((a, b) => {
      if (sortType === "alpha") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortType === "progress") {
        const progA = a.duration ? a.progress / a.duration : 0;
        const progB = b.duration ? b.progress / b.duration : 0;
        return progB - progA;
      }
      return 0; 
    });

    return result;
  }, [historyItems, filterType, searchQuery, sortType]);

  return (
    <div className="animate-in fade-in duration-300 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-white text-2xl font-bold tracking-wide">
          Watch History
        </h2>
        
        {historyItems.length > 0 && (
          <button
            onClick={handleClearHistory}
            disabled={isClearing}
            className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-[#888888] hover:text-[#EAE8E3] rounded-full text-[11px] font-bold tracking-[0.2em] uppercase transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            {isClearing ? "Clearing..." : "Clear"}
          </button>
        )}
      </div>

      {historyItems.length > 0 ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
            
            <div className="flex items-center gap-6">
              {(["all", "movie", "tv"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`relative text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-200 py-1 ${
                    filterType === type ? 'text-[#EAE8E3]' : 'text-[#888888] hover:text-[#EAE8E3]'
                  }`}
                >
                  {type === "all" ? "ALL" : type === "movie" ? "MOVIES" : "SERIES"}
                  {filterType === type && (
                    <motion.span layoutId="history-filter-underline" className="absolute left-0 -bottom-1 w-full h-[1.5px] bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-6">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888] group-focus-within:text-accent transition-colors" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[220px] bg-white/5 hover:bg-white/10 rounded-full pl-10 pr-4 py-2 text-[13px] text-white placeholder:text-[#888888] focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-white/20 transition-all"
                />
              </div>

              <div className="relative group shrink-0">
                <button className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-[#888888] hover:text-[#EAE8E3] transition-colors py-1">
                  Sort: {sortType === "recent" ? "Recent" : sortType === "alpha" ? "A-Z" : "Progress"}
                  <ChevronDown className="w-3 h-3 text-[#888888] group-hover:text-white transition-colors" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-40 bg-[#111111] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                  {(["recent", "alpha", "progress"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortType(s)}
                      className={`w-full text-left px-4 py-3 text-[12px] font-semibold transition-colors hover:bg-white/5 ${
                        sortType === s ? "text-accent" : "text-[#EAE8E3]"
                      }`}
                    >
                      {s === "recent" ? "Recently Watched" : s === "alpha" ? "Alphabetical" : "Highest Progress"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>


          {filteredAndSortedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredAndSortedItems.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={item.id}
                    className="relative group/card"
                  >
                    <ContinueWatchingCard item={item} />
                    
                    <button
                      onClick={(e) => handleRemoveItem(e, item.id)}
                      disabled={removingIds.has(item.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-rose-500 hover:bg-black/80 opacity-0 group-hover/card:opacity-100 transition-all z-40"
                    >
                      {removingIds.has(item.id) ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-[#888888] w-full text-center bg-background-elevated rounded-2xl border border-white/5 shadow-lg">
              <Search className="w-10 h-10 mb-4 opacity-20" />
              <p className="text-[14px] font-bold tracking-widest uppercase text-white/70">
                No matches found
              </p>
              <p className="text-[13px] mt-2">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-[#888888] w-full text-center bg-background-elevated rounded-2xl border border-white/5 shadow-lg">
          <History className="w-12 h-12 mb-6 opacity-20" />
          <p className="text-[15px] font-bold tracking-widest uppercase text-white/70">
            No history yet
          </p>
          <p className="text-[14px] mt-2 max-w-[250px] mx-auto text-balance">
            Titles you watch will appear here so you can easily resume them.
          </p>
        </div>
      )}
    </div>
  );
}
