"use client";

import { useState, useMemo, useEffect } from "react";
import { Users, X, Circle, Search, Plus, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSocket } from "@/components/socket-provider";

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

  // If not logged in, don't render the sidebar at all
  if (!user) return null;

  const { socket } = useSocket();
  const [presenceState, setPresenceState] = useState<Record<string, { watching: string | null }>>({});
  const [invites, setInvites] = useState<PartyInvite[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Fetch initial presence immediately
    socket.emit("get_presence", (state: any) => {
      if (state) setPresenceState(state);
    });

    const handlePresence = (state: Record<string, { watching: string | null }>) => {
      setPresenceState(state);
    };

    const handleInvite = (invite: PartyInvite) => {
      const newInvite = { ...invite, timestamp: Date.now() };
      setInvites(prev => [...prev, newInvite]);
      
      // Auto-remove after 30 seconds
      setTimeout(() => {
        setInvites(prev => prev.filter(i => i.partyId !== invite.partyId));
      }, 30000);
    };

    socket.on("presence_sync", handlePresence);
    socket.on("party_invite_received", handleInvite);
    return () => {
      socket.off("presence_sync", handlePresence);
      socket.off("party_invite_received", handleInvite);
    };
  }, [socket]);

  const removeInvite = (partyId: string) => {
    setInvites(prev => prev.filter(i => i.partyId !== partyId));
  };

  // Use real data from the database, split by actual presence
  const allFriends = data?.accepted ? data.accepted.map((item: any) => ({
    id: item.user.id,
    name: item.user.username || item.user.name || "Unknown",
    watching: presenceState[item.user.id]?.watching || null,
    image: item.user.image,
  })) : [];

  const onlineFriends = allFriends.filter((f: any) => presenceState[f.id] !== undefined);
  const offlineFriends = allFriends.filter((f: any) => presenceState[f.id] === undefined);

  const filteredOnline = useMemo(() => onlineFriends.filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery, onlineFriends]);
  const filteredOffline = useMemo(() => offlineFriends.filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery, offlineFriends]);

  return (
    <>
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
        <Users className="w-5 h-5 text-accent" />
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
              {/* Invites (Shows inside sidebar) */}
              <div className="flex flex-col gap-2 p-4 pb-0 mt-4">
                <AnimatePresence>
                  {invites.map((invite) => (
                    <motion.div
                      key={invite.partyId}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[#1a1a1a] border border-accent/30 rounded-xl p-4 shadow-lg mb-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 border border-accent/40">
                          <PartyPopper className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-bold truncate">{invite.hostName}</h4>
                          <p className="text-white/60 text-xs truncate">Invited you to watch {invite.mediaTitle}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            removeInvite(invite.partyId);
                            window.location.href = `/watch/${invite.mediaType}/${invite.mediaId}?party=${invite.partyId}`;
                          }}
                          className="flex-1 bg-accent text-white text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => removeInvite(invite.partyId)}
                          className="flex-1 bg-white/5 text-white/70 text-[10px] font-bold tracking-widest uppercase py-2 rounded-lg border border-white/10"
                        >
                          Decline
                        </button>
                      </div>
                      <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 30, ease: "linear" }}
                        className="h-0.5 bg-accent/50 mt-3 rounded-full"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-accent" />
                  <h2 className="text-ivory font-bold tracking-[0.2em] uppercase text-xs">Friends</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-[#888888] hover:text-accent transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

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

                {filteredOnline.length === 0 && filteredOffline.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50 mt-10">
                    <Users className="w-10 h-10 mb-3 text-[#888888]" />
                    <p className="text-[#888888] text-sm">No friends to display</p>
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
                        <div key={friend.id} className="flex items-center gap-3 group cursor-pointer">
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
                            {friend.watching ? (
                              <span className="text-xs text-accent truncate">
                                Watching {friend.watching}
                              </span>
                            ) : (
                              <span className="text-xs text-white/50 truncate">
                                Online
                              </span>
                            )}
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-full transition-all ml-auto text-[#888888] hover:text-white" title="Invite to Watch Party">
                            <Plus className="w-4 h-4" />
                          </button>
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
                          <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-full transition-all ml-auto text-[#888888] hover:text-white" title="Invite to Watch Party">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              <div className="p-6 pt-2 pb-8 flex-shrink-0">
                <Link
                  href="/friends"
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-accent hover:brightness-110 rounded-full py-4 flex items-center justify-center text-accent-foreground font-bold text-xs tracking-widest uppercase transition-all"
                >
                  Manage Friends
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
