"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Users, X, Circle, Search, Plus, PartyPopper, UserPlus, Check, MoreHorizontal, UserMinus, ShieldBan } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSocket } from "@/components/socket-provider";
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, blockFriend } from "@/lib/actions/friends";
import { useRouter, usePathname } from "next/navigation";

function formatTime(seconds: number) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function LiveProgressBar({ currentTime, duration, isPlaying }: { currentTime: number, duration: number, isPlaying: boolean }) {
  const [current, setCurrent] = useState(currentTime);
  const localUpdatedAt = useRef(Date.now());

  useEffect(() => {
    // Whenever the backend sends a new currentTime, update our local timestamp!
    localUpdatedAt.current = Date.now();
  }, [currentTime, isPlaying]);

  useEffect(() => {
    if (!isPlaying) {
      setCurrent(currentTime);
      return;
    }

    let animationFrameId: number;
    const update = () => {
      const now = Date.now();
      const elapsed = (now - localUpdatedAt.current) / 1000;
      setCurrent(Math.min(currentTime + elapsed, duration));
      animationFrameId = requestAnimationFrame(update);
    };
    update();

    return () => cancelAnimationFrame(animationFrameId);
  }, [currentTime, duration, isPlaying]);

  const safePercentage = isNaN(duration) || duration <= 0 ? 0 : Math.max(0, Math.min(100, (current / duration) * 100));

  return (
    <div className="flex flex-col gap-1 mt-1.5">
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-accent transition-none" style={{ width: `${safePercentage}%` }} />
      </div>
      <div className="flex justify-between text-[9px] font-medium text-white/40 tracking-wider">
        <span>{formatTime(current)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

interface PartyInvite {
  partyId: string;
  hostId: string;
  hostName: string;
  mediaTitle: string;
  mediaId: string;
  mediaType: string;
  timestamp: number;
}

export default function FriendsSidebar({ user, data }: { user: any, data?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { socket } = useSocket();
  const [presenceState, setPresenceState] = useState<Record<string, { watching: string | null, mediaInfo?: any }>>({});
  const [invites, setInvites] = useState<PartyInvite[]>([]);
  
  const router = useRouter();
  const pathname = usePathname();
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [optimisticRemoved, setOptimisticRemoved] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'remove' | 'block', friendId: string, name: string } | null>(null);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setLoading(true);
    setMessage(null);

    const res = await sendFriendRequest(searchUsername.trim());
    if (res.success) {
      setMessage({ type: "success", text: `Sent to ${searchUsername}!` });
      setSearchUsername("");
      if (socket && res.targetUserId) {
        socket.emit("refresh_friends_for_user", { targetUserId: res.targetUserId, type: 'friend_request' });
      }
      router.refresh();
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage({ type: "error", text: res.error || "Failed to send request" });
    }
    setLoading(false);
  };

  const handleActionConfirm = async () => {
    if (!confirmAction) return;
    
    const { type, friendId } = confirmAction;
    setOptimisticRemoved((prev) => [...prev, friendId]);
    setConfirmAction(null);
    setActiveMenuId(null);
    
    let res;
    if (type === 'remove') {
      res = await removeFriend(friendId);
    } else if (type === 'block') {
      res = await blockFriend(friendId);
    }
    
    if (res?.success) {
      if (socket && res.targetUserId) {
        socket.emit("refresh_friends_for_user", { targetUserId: res.targetUserId });
      }
      router.refresh();
    }
  };

  const handleAcceptRequest = async (id: string) => {
    setOptimisticRemoved((prev) => [...prev, id]);
    const res = await acceptFriendRequest(id);
    if (res.success) {
      if (socket && res.targetUserId) {
        socket.emit("refresh_friends_for_user", { targetUserId: res.targetUserId });
      }
      router.refresh();
    }
  };

  const handleDeclineRequest = async (id: string) => {
    setOptimisticRemoved((prev) => [...prev, id]);
    const res = await declineFriendRequest(id);
    if (res.success) {
      if (socket && res.targetUserId) {
        socket.emit("refresh_friends_for_user", { targetUserId: res.targetUserId });
      }
      router.refresh();
    }
  };

  useEffect(() => {
    if (!socket) return;

    // Fetch initial presence immediately
    socket.emit("get_presence", (state: any) => {
      if (state) setPresenceState(state);
    });

    const handlePresence = (state: Record<string, { watching: string | null, mediaInfo?: any }>) => {
      setPresenceState(state);
    };

    const handleInvite = (invite: PartyInvite) => {
      new Audio('/audio/notification.mp3').play().catch(() => {});
      const newInvite = { ...invite, timestamp: Date.now() };
      setInvites(prev => [...prev, newInvite]);

      // Auto-remove after 30 seconds
      setTimeout(() => {
        setInvites(prev => prev.filter(i => i.partyId !== invite.partyId));
      }, 30000);
    };

    socket.on("presence_sync", handlePresence);
    socket.on("party_invite_received", handleInvite);

    const handleRefreshFriends = (data?: { type?: string }) => {
      if (data?.type === 'friend_request') {
        new Audio('/audio/notification.mp3').play().catch(() => {});
      }
      router.refresh();
    };
    socket.on("refresh_friends", handleRefreshFriends);

    return () => {
      socket.off("presence_sync", handlePresence);
      socket.off("party_invite_received", handleInvite);
      socket.off("refresh_friends", handleRefreshFriends);
    };
  }, [socket, router]);

  const removeInvite = (partyId: string) => {
    setInvites(prev => prev.filter(i => i.partyId !== partyId));
  };

  // Use real data from the database, split by actual presence
  const allFriends = data?.accepted ? data.accepted.map((item: any) => ({
    id: item.user.id,
    name: item.user.username || item.user.name || "Unknown",
    watching: presenceState[item.user.id]?.watching || null,
    mediaInfo: presenceState[item.user.id]?.mediaInfo || null,
    image: item.user.image,
  })) : [];

  const invitedHostIds = new Set(invites.map(i => i.hostId));

  const onlineFriends = allFriends.filter((f: any) => presenceState[f.id] !== undefined && !invitedHostIds.has(f.id));
  const offlineFriends = allFriends.filter((f: any) => presenceState[f.id] === undefined && !invitedHostIds.has(f.id));

  const filteredOnline = useMemo(() => onlineFriends.filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery, onlineFriends]);
  const filteredOffline = useMemo(() => offlineFriends.filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery, offlineFriends]);

  const hasNotification = invites.length > 0 || (data?.pendingIncoming && data.pendingIncoming.filter((r: any) => !optimisticRemoved.includes(r.requestId)).length > 0);

  if (!user) return null;

  if (pathname === '/social') return null;

  return (
    <>
      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmAction(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#151515] border border-white/10 rounded-2xl p-6 w-[280px] shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                {confirmAction.type === 'block' ? <ShieldBan className="w-6 h-6 text-red-500" /> : <UserMinus className="w-6 h-6 text-red-400" />}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">
                  {confirmAction.type === 'block' ? 'Block User?' : 'Remove Friend?'}
                </h3>
                <p className="text-white/50 text-xs">
                  Are you sure you want to {confirmAction.type === 'block' ? 'block' : 'remove'} <span className="font-bold text-white/80">{confirmAction.name}</span>? 
                  {confirmAction.type === 'block' && " They won't be able to send you friend requests or invites."}
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionConfirm}
                  className={`flex-1 py-2.5 rounded-xl text-white transition-colors text-[10px] font-bold uppercase tracking-wider ${confirmAction.type === 'block' ? 'bg-red-500 hover:bg-red-600' : 'bg-red-500/80 hover:bg-red-500'}`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button (Hidden on Mobile) */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
        className={`hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 border-r-0 rounded-l-[20px] p-4 items-center justify-center transition-transform ${isOpen ? 'translate-x-full' : 'translate-x-0'} hover:bg-[rgba(255,255,255,0.08)] cursor-pointer`}
      >
        <div className="relative">
          <Users className="w-5 h-5 text-accent" />
          {hasNotification && (
            <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent shadow-[0_0_10px_rgba(255,68,68,1)]"></span>
            </span>
          )}
        </div>
      </button>

      {/* The Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 md:hidden"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              style={{
                background: 'rgba(20, 20, 20, 0.65)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)'
              }}
              className="fixed right-0 top-0 bottom-0 w-[320px] z-[60] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-white/70" />
                  <div>
                    <h2 className="text-white font-bold tracking-widest text-sm uppercase">Friends</h2>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider">{(filteredOnline?.length || 0) + (filteredOffline?.length || 0)} Total</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setShowAddFriend(!showAddFriend);
                      setMessage(null);
                    }}
                    className={`p-2 rounded-full transition-all hover:bg-white/10 ${showAddFriend ? 'text-accent' : 'text-white/70 hover:text-white'}`}
                    title="Add Friend"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Add Friend Inline Form */}
              <AnimatePresence>
                {showAddFriend && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 overflow-hidden"
                  >
                    <form onSubmit={handleSendRequest} className="flex flex-col gap-3 pb-4 border-b border-white/5">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                        <input
                          type="text"
                          value={searchUsername}
                          onChange={(e) => setSearchUsername(e.target.value)}
                          placeholder="Username..."
                          className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-[10px] pl-9 pr-4 py-2.5 text-ivory text-sm focus:outline-none focus:border-accent/50 focus:bg-[rgba(255,255,255,0.05)] transition-all"
                          required
                        />
                      </div>
                      {message && (
                        <div className={`p-2 rounded-[8px] text-[10px] font-medium text-center ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-accent/10 text-accent border border-accent/20"}`}>
                          {message.text}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={loading || !searchUsername.trim()}
                        className="w-full bg-accent text-white py-2.5 rounded-[10px] font-bold tracking-widest uppercase text-[10px] hover:brightness-110 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? "Sending..." : "Send Request"}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="px-6 pb-6 border-b border-white/5 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-xs text-ivory placeholder:text-[#888888] focus:outline-none focus:border-white/20 focus:bg-[rgba(255,255,255,0.05)] transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8">

                {filteredOnline.length === 0 && filteredOffline.length === 0 && invites.length === 0 && (!data?.pendingIncoming || data.pendingIncoming.filter((r: any) => !optimisticRemoved.includes(r.requestId)).length === 0) && (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50 mt-10">
                    <Users className="w-10 h-10 mb-3 text-[#888888]" />
                    <p className="text-[#888888] text-sm">No friends to display</p>
                  </div>
                )}

                {/* Invites Section */}
                {invites.length > 0 && (
                  <div>
                    <h3 className="text-[#888888] text-xs font-bold tracking-widest uppercase mb-4">
                      Invites — {invites.length}
                    </h3>
                    <div className="flex flex-col gap-4">
                      {invites.map((invite) => {
                        const friend = allFriends.find((f: any) => f.id === invite.hostId) || {
                          id: invite.hostId,
                          name: invite.hostName,
                          watching: null,
                          mediaInfo: null,
                          image: null
                        };

                        return (
                          <div key={invite.partyId} className="flex flex-col gap-3 group bg-[#1a1a1a] hover:bg-white/5 p-3 rounded-xl border border-accent/30 shadow-lg transition-all">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {friend.image ? (
                                  <img src={friend.image} alt={friend.name} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-background-elevated border border-white/10 flex items-center justify-center text-white font-bold">
                                    {friend.name[0]}
                                  </div>
                                )}
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background-base" />
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-white text-sm font-semibold truncate group-hover:text-accent transition-colors">
                                  {friend.name}
                                </span>
                                {friend.watching && !friend.mediaInfo ? (
                                  <span className="text-xs text-accent truncate">
                                    Watching {friend.watching}
                                  </span>
                                ) : !friend.mediaInfo ? (
                                  <span className="text-xs text-white/50 truncate">
                                    Online
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            
                            {friend.mediaInfo && (
                              <div className="mt-1 flex gap-3 pl-2">
                                {friend.mediaInfo.image && (
                                  <img src={friend.mediaInfo.image} alt={friend.mediaInfo.title} className="w-12 h-16 object-cover rounded-md shadow-lg" />
                                )}
                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                  <span className="text-xs font-bold text-white truncate">{friend.mediaInfo.title}</span>
                                  {friend.mediaInfo.description && (
                                    <span className="text-[10px] text-white/60 truncate">{friend.mediaInfo.description}</span>
                                  )}
                                  <LiveProgressBar 
                                    currentTime={friend.mediaInfo.currentTime}
                                    duration={friend.mediaInfo.duration}
                                    isPlaying={friend.mediaInfo.isPlaying}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() => {
                                  new Audio('/audio/click.mp3').play().catch(() => {});
                                  removeInvite(invite.partyId);
                                  window.location.href = `/watch/${invite.mediaType}/${invite.mediaId}?party=${invite.partyId}`;
                                }}
                                className="flex-1 bg-accent text-white text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  new Audio('/audio/click.mp3').play().catch(() => {});
                                  removeInvite(invite.partyId);
                                }}
                                className="flex-1 bg-white/5 text-white/70 text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg border border-white/10"
                              >
                                Decline
                              </button>
                            </div>
                            <motion.div
                              initial={{ width: "100%" }}
                              animate={{ width: "0%" }}
                              transition={{ duration: 30, ease: "linear" }}
                              className="h-0.5 bg-accent/50 mt-1 rounded-full"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pending Requests Section */}
                {data?.pendingIncoming && data.pendingIncoming.filter((r: any) => !optimisticRemoved.includes(r.requestId)).length > 0 && (
                  <div>
                    <h3 className="text-[#888888] text-xs font-bold tracking-widest uppercase mb-4">
                      Friend Requests — {data.pendingIncoming.filter((r: any) => !optimisticRemoved.includes(r.requestId)).length}
                    </h3>
                    <div className="flex flex-col gap-4">
                      {data.pendingIncoming.filter((r: any) => !optimisticRemoved.includes(r.requestId)).map((req: any) => (
                        <div key={req.requestId} className="flex flex-col gap-3 group bg-[#1a1a1a] p-3 rounded-xl border border-accent/30 shadow-lg">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {req.user.image ? (
                                <img src={req.user.image} alt={req.user.username} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-background-elevated border border-white/10 flex items-center justify-center text-white font-bold">
                                  {req.user.username[0].toUpperCase()}
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-background-base" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-white text-sm font-semibold truncate group-hover:text-accent transition-colors">
                                {req.user.username}
                              </span>
                              <span className="text-xs text-white/50 truncate">
                                Wants to be friends
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => {
                                new Audio('/audio/click.mp3').play().catch(() => {});
                                handleAcceptRequest(req.requestId);
                              }}
                              className="flex-1 bg-accent text-white text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg flex items-center justify-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button
                              onClick={() => {
                                new Audio('/audio/click.mp3').play().catch(() => {});
                                handleDeclineRequest(req.requestId);
                              }}
                              className="flex-1 bg-white/5 text-white/70 text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg border border-white/10 flex items-center justify-center gap-1"
                            >
                              <X className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Online Friends */}
                {filteredOnline.length > 0 && (
                  <div>
                    <h3 className="text-[#888888] text-xs font-bold tracking-widest uppercase mb-4">
                      Online — {filteredOnline.length}
                    </h3>
                    <div className="flex flex-col gap-4">
                      {filteredOnline.map((friend: any) => (
                        <div key={friend.id} className="flex flex-col gap-3 group cursor-pointer bg-black/20 hover:bg-white/5 p-3 rounded-xl border border-transparent hover:border-white/5 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {friend.image ? (
                                <img src={friend.image} alt={friend.name} className="w-10 h-10 rounded-full border border-white/10 object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-background-elevated border border-white/10 flex items-center justify-center text-white font-bold">
                                  {friend.name[0]}
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background-base" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-white text-sm font-semibold truncate group-hover:text-accent transition-colors">
                                {friend.name}
                              </span>
                              {friend.watching && !friend.mediaInfo ? (
                                <span className="text-xs text-accent truncate">
                                  Watching {friend.watching}
                                </span>
                              ) : !friend.mediaInfo ? (
                                <span className="text-xs text-white/50 truncate">
                                  Online
                                </span>
                              ) : null}
                            </div>
                            <div className="relative ml-auto">
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === friend.id ? null : friend.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-full transition-all text-[#888888] hover:text-white"
                                title="More options"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              
                              <AnimatePresence>
                                {activeMenuId === friend.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                      className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                    >
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); /* handle invite */ }}
                                        className="w-full text-left px-4 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                      >
                                        <Plus className="w-4 h-4" /> Invite to Party
                                      </button>
                                      <div className="h-[1px] bg-white/10 w-full" />
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'remove', friendId: friend.id, name: friend.name }); setActiveMenuId(null); }}
                                        className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-400/10 flex items-center gap-2"
                                      >
                                        <UserMinus className="w-4 h-4" /> Remove Friend
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'block', friendId: friend.id, name: friend.name }); setActiveMenuId(null); }}
                                        className="w-full text-left px-4 py-2.5 text-xs text-red-500 font-bold hover:bg-red-500/10 flex items-center gap-2"
                                      >
                                        <ShieldBan className="w-4 h-4" /> Block User
                                      </button>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>

                          {friend.mediaInfo && (
                            <div className="mt-1 flex gap-3 pl-2">
                              {friend.mediaInfo.image && (
                                <img src={friend.mediaInfo.image} alt={friend.mediaInfo.title} className="w-12 h-16 object-cover rounded-md shadow-lg" />
                              )}
                              <div className="flex flex-col justify-center flex-1 min-w-0">
                                <span className="text-xs font-bold text-white truncate">{friend.mediaInfo.title}</span>
                                {friend.mediaInfo.description && (
                                  <span className="text-[10px] text-white/60 truncate">{friend.mediaInfo.description}</span>
                                )}
                                <LiveProgressBar
                                  currentTime={friend.mediaInfo.currentTime}
                                  duration={friend.mediaInfo.duration}
                                  isPlaying={friend.mediaInfo.isPlaying}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Offline Friends */}
                {filteredOffline.length > 0 && (
                  <div>
                    <h3 className="text-[#888888] text-xs font-bold tracking-widest uppercase mb-4">
                      Offline — {filteredOffline.length}
                    </h3>
                    <div className="flex flex-col gap-4 opacity-50">
                      {filteredOffline.map((friend: any) => (
                        <div key={friend.id} className="flex items-center gap-3 group">
                          <div className="relative">
                            {friend.image ? (
                              <img src={friend.image} alt={friend.name} className="w-10 h-10 rounded-full border border-white/10 object-cover grayscale" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-background-elevated border border-white/10 flex items-center justify-center text-white font-bold">
                                {friend.name[0]}
                              </div>
                            )}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-500 rounded-full border-2 border-background-base" />
                          </div>
                          <span className="text-white text-sm font-semibold truncate group-hover:text-accent transition-colors">
                            {friend.name}
                          </span>
                          <div className="relative ml-auto">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === friend.id ? null : friend.id); }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-full transition-all text-[#888888] hover:text-white"
                              title="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            
                            <AnimatePresence>
                              {activeMenuId === friend.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                                  >
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'remove', friendId: friend.id, name: friend.name }); setActiveMenuId(null); }}
                                      className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-400/10 flex items-center gap-2"
                                    >
                                      <UserMinus className="w-4 h-4" /> Remove Friend
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'block', friendId: friend.id, name: friend.name }); setActiveMenuId(null); }}
                                      className="w-full text-left px-4 py-2.5 text-xs text-red-500 font-bold hover:bg-red-500/10 flex items-center gap-2"
                                    >
                                      <ShieldBan className="w-4 h-4" /> Block User
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
