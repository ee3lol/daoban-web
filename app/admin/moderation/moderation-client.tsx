/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { MessageSquare, ShieldBan, Trash2, Loader2, Link as LinkIcon, Plus, ChevronDown, Check } from "lucide-react";
import { adminDeleteComment, blacklistMedia, unblacklistMedia } from "@/lib/actions/admin";
import Link from "next/link";

export default function ModerationClient({ initialComments, initialBlacklist }: { initialComments: any[], initialBlacklist: any[] }) {
  const [activeTab, setActiveTab] = useState<'comments' | 'blacklist'>('comments');
  const [comments, setComments] = useState(initialComments);
  const [blacklist, setBlacklist] = useState(initialBlacklist);
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  
  // Blacklist form state
  const [mediaId, setMediaId] = useState("");
  const [mediaType, setMediaType] = useState("movie");
  const [reason, setReason] = useState("");
  const [blockSeason, setBlockSeason] = useState("");
  const [blockEpisode, setBlockEpisode] = useState("");
  const [isBlacklisting, setIsBlacklisting] = useState(false);
  const [isMediaTypeOpen, setIsMediaTypeOpen] = useState(false);

  const handleDeleteComment = async (id: string) => {
    if (deletingCommentId !== id) {
      setDeletingCommentId(id);
      setDeleteReason("");
      return;
    }
    setUpdatingId(id);
    const res = await adminDeleteComment(id, deleteReason || undefined);
    if (res.success) {
      setComments(prev => prev.filter(c => c.id !== id));
    }
    setUpdatingId(null);
    setDeletingCommentId(null);
    setDeleteReason("");
  };

  const handleBlacklist = async () => {
    if (!mediaId || isNaN(Number(mediaId))) return alert("Invalid Media ID");
    setIsBlacklisting(true);
    const seasonNum = blockSeason ? Number(blockSeason) : null;
    const episodeNum = blockEpisode ? Number(blockEpisode) : null;
    const res = await blacklistMedia(Number(mediaId), mediaType, reason, seasonNum, episodeNum);
    if (res.success) {
      window.location.reload(); // Quick refresh to grab new data with admin joins
    } else {
      alert(res.error || "Failed to blacklist");
      setIsBlacklisting(false);
    }
  };

  const handleUnblacklist = async (id: string) => {
    setUpdatingId(id);
    const res = await unblacklistMedia(id);
    if (res.success) {
      setBlacklist(prev => prev.filter(b => b.id !== id));
    }
    setUpdatingId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px">
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'comments' ? 'text-accent border-accent' : 'text-[#888888] border-transparent hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Comments
        </button>
        <button
          onClick={() => setActiveTab('blacklist')}
          className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'blacklist' ? 'text-accent border-accent' : 'text-[#888888] border-transparent hover:text-white'
          }`}
        >
          <ShieldBan className="w-4 h-4" />
          Media Blacklist
        </button>
      </div>

      {activeTab === 'comments' && (
        <div className="flex flex-col gap-4">
          {comments.length === 0 ? (
            <div className="text-center py-10 text-[#888888]">No recent comments found.</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={comment.user?.image || "/avatar/default1.png"} className="w-8 h-8 rounded-full" />
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-semibold">{comment.user?.username || comment.user?.name}</span>
                      <span className="text-[#888888] text-[11px]">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link 
                      href={`/watch/${comment.mediaType}/${comment.mediaId}${comment.season ? `?season=${comment.season}&episode=${comment.episode}` : ''}`}
                      target="_blank"
                      className="text-[#888888] hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors bg-white/5 px-3 py-1.5 rounded-lg"
                    >
                      <LinkIcon className="w-3 h-3" />
                      View Context
                    </Link>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={updatingId === comment.id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                    >
                      {updatingId === comment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-[#EAE8E3] text-sm mt-1">{comment.content}</p>
                
                {/* Delete Confirmation with Reason */}
                {deletingCommentId === comment.id && (
                  <div className="flex flex-col gap-3 pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col gap-1">
                      <label className="text-[#888888] text-[11px] uppercase tracking-wider font-bold">
                        Reason <span className="normal-case tracking-normal font-normal">(the user will be notified)</span>
                      </label>
                      <input
                        type="text"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="e.g. Spam, inappropriate content, etc."
                        className="w-full bg-background-light border border-white/10 focus:border-red-500/50 rounded-lg px-3 py-2 text-[13px] text-white outline-none transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => { setDeletingCommentId(null); setDeleteReason(""); }}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#888888] hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={updatingId === comment.id}
                        className="px-4 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/20 transition-all flex items-center gap-1.5"
                      >
                        {updatingId === comment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded">
                    {comment.mediaType} ID: {comment.mediaId}
                  </span>
                  {comment.season && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#888888] bg-white/5 px-2 py-0.5 rounded">
                      S{comment.season} E{comment.episode}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'blacklist' && (
        <div className="flex flex-col gap-8">
          {/* Add Blacklist Form */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white tracking-wide">Block Content</h3>
            <p className="text-[#888888] text-sm -mt-2">Prevent a TMDB movie or TV show from being accessed.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">TMDB ID</label>
                <input 
                  type="text" 
                  value={mediaId} 
                  onChange={e => setMediaId(e.target.value)} 
                  placeholder="e.g., 550"
                  className="bg-background-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none"
                />
              </div>
              <div className="flex flex-col gap-2 relative">
                <label className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Media Type</label>
                <button
                  type="button"
                  onClick={() => setIsMediaTypeOpen(!isMediaTypeOpen)}
                  className="bg-background-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none flex items-center justify-between w-full text-left"
                >
                  {mediaType === 'movie' ? 'Movie' : mediaType === 'tv' ? 'TV Show' : 'Anime (TV)'}
                  <ChevronDown className={`w-4 h-4 text-[#888888] transition-transform ${isMediaTypeOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMediaTypeOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-background-light border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {[
                      { value: 'movie', label: 'Movie' },
                      { value: 'tv', label: 'TV Show' },
                      { value: 'anime', label: 'Anime (TV)' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setMediaType(opt.value); setIsMediaTypeOpen(false); }}
                        className="w-full flex items-center justify-between px-4 py-3 text-[13px] text-left hover:bg-white/5 transition-colors"
                      >
                        <span className={`font-medium ${mediaType === opt.value ? 'text-accent' : 'text-white'}`}>
                          {opt.label}
                        </span>
                        {mediaType === opt.value && <Check className="w-4 h-4 text-accent" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Season / Episode (only for TV types) */}
            {(mediaType === 'tv' || mediaType === 'anime') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-2">
                  <label className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Season <span className="normal-case tracking-normal font-normal">(leave empty to block entire show)</span></label>
                  <input 
                    type="text" 
                    value={blockSeason} 
                    onChange={e => setBlockSeason(e.target.value)} 
                    placeholder="e.g., 1"
                    className="bg-background-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Episode <span className="normal-case tracking-normal font-normal">(optional, requires season)</span></label>
                  <input 
                    type="text" 
                    value={blockEpisode} 
                    onChange={e => setBlockEpisode(e.target.value)} 
                    placeholder="e.g., 5"
                    disabled={!blockSeason}
                    className="bg-background-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Reason (Optional)</label>
              <input 
                type="text" 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="DMCA Takedown, Inappropriate, etc."
                className="bg-background-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none"
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={handleBlacklist}
                disabled={isBlacklisting || !mediaId}
                className="px-6 py-3 bg-accent/15 hover:bg-accent/25 text-accent border border-accent/20 rounded-xl font-bold tracking-wide transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isBlacklisting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldBan className="w-4 h-4" />}
                Blacklist Media
              </button>
            </div>
          </div>

          {/* Active Blacklist */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold text-lg mb-2">Currently Blocked</h3>
            {blacklist.length === 0 ? (
              <div className="text-center py-10 text-[#888888]">No media is currently blocked.</div>
            ) : (
              blacklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold tracking-wide uppercase">{item.mediaType}</span>
                      <span className="text-[#888888] text-sm font-medium">#{item.mediaId}</span>
                      {item.season && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded">
                          S{item.season}{item.episode ? `E${item.episode}` : ' (Full Season)'}
                        </span>
                      )}
                    </div>
                    {item.reason && <p className="text-[#888888] text-[13px] mt-1">Reason: {item.reason}</p>}
                    <p className="text-[#888888] text-[11px] mt-2">Blocked by {item.admin?.name || 'Admin'} on {new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleUnblacklist(item.id)}
                    disabled={updatingId === item.id}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2"
                  >
                    {updatingId === item.id && <Loader2 className="w-3 h-3 animate-spin" />}
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
