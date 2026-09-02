/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Lock, Copy, Check, Send, Search } from "lucide-react";
import { useSocket } from "@/components/socket-provider";

interface WatchPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string;
  mediaType: string;
  mediaTitle: string;
  hostId: string;
  hostName: string;
  onlineFriends: any[];
}

export default function WatchPartyModal({
  isOpen,
  onClose,
  mediaId,
  mediaType,
  mediaTitle,
  hostId,
  hostName,
  onlineFriends
}: WatchPartyModalProps) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [step, setStep] = useState<"setup" | "invite">("setup");
  const [userLimit, setUserLimit] = useState(5);
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreate = () => {
    if (!isConnected || !socket) return;
    
    setIsCreating(true);
    socket.emit("create_party", {
      hostId,
      hostName,
      mediaId,
      mediaType,
      mediaTitle,
      userLimit,
      password: password.trim() || undefined,
    }, (res: any) => {
      if (res.success) {
        setPartyId(res.partyId);
        setStep("invite");
      }
      setIsCreating(false);
    });
  };

  const handleCopyLink = () => {
    if (!partyId) return;
    const url = `${window.location.origin}/watch/${mediaType}/${mediaId}?party=${partyId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (friendId: string) => {
    if (!isConnected || !socket || !partyId) return;
    
    socket.emit("invite_to_party", {
      friendId,
      partyId,
      hostId,
      hostName,
      mediaId,
      mediaType,
      mediaTitle,
    });
    
    setInvitedFriends(new Set([...invitedFriends, friendId]));
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filteredFriends = onlineFriends.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] backdrop-blur-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.05)]">
              <h2 className="text-xl font-bold tracking-widest uppercase text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Watch Party
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white hover:bg-[rgba(255,255,255,0.1)] rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Beta Warning */}
            <div className="px-6 pt-6 pb-0">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3">
                <div className="text-yellow-500 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div className="text-xs text-yellow-500/80 leading-relaxed">
                  <strong className="text-yellow-500 font-bold tracking-wider uppercase block mb-1">Beta Feature</strong>
                  Watch Party is currently in beta. You may occasionally experience synchronization delays or bugs.
                </div>
              </div>
            </div>

            <div className="p-6">
              {step === "setup" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                      User Limit ({userLimit})
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      value={userLimit}
                      onChange={(e) => setUserLimit(parseInt(e.target.value))}
                      style={{
                        background: `linear-gradient(to right, var(--color-accent) ${((userLimit - 2) / 18) * 100}%, rgba(255,255,255,0.1) ${((userLimit - 2) / 18) * 100}%)`
                      }}
                      className="w-full h-2 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-white/30">
                      <span>2</span>
                      <span>20</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                      Password (Optional)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave empty for public"
                        className="w-full bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreate}
                    disabled={isCreating || !isConnected}
                    className="w-full py-4 bg-accent hover:bg-accent/80 text-white rounded-xl font-bold tracking-widest text-xs uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreating ? "Creating..." : "Host Party"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-widest text-accent uppercase">Share Link</span>
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] px-3 py-1.5 rounded-lg"
                      >
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="text-sm text-white/70 truncate bg-black/30 p-3 rounded-lg border border-[rgba(255,255,255,0.05)] font-mono selection:bg-accent/30">
                      {window.location.origin}/watch/{mediaType}/{mediaId}?party={partyId}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
                      Invite Online Friends
                    </label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search friends..."
                        className="w-full bg-[rgba(255,255,255,0.025)] border border-[rgba(255,255,255,0.06)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                      {filteredFriends.length === 0 ? (
                        <div className="py-8 text-center flex flex-col items-center gap-2">
                           <Search className="w-6 h-6 text-white/20" />
                           <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                             {searchQuery ? "No friends found" : "No friends online"}
                           </span>
                        </div>
                      ) : (
                        filteredFriends.map((friend) => (
                          <div key={friend.id} className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.05)] transition-colors">
                            <div className="flex items-center gap-3">
                              {friend.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={friend.image} alt={friend.name} className="w-8 h-8 rounded-full border border-white/10 object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/70">
                                  {friend.name[0]?.toUpperCase()}
                                </div>
                              )}
                              <span className="text-sm font-semibold text-white/90">{friend.name}</span>
                            </div>
                            <button
                              onClick={() => handleInvite(friend.id)}
                              disabled={invitedFriends.has(friend.id)}
                              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${
                                invitedFriends.has(friend.id) 
                                  ? 'bg-white/10 text-white/50 border border-white/5 cursor-not-allowed'
                                  : 'bg-accent/20 hover:bg-accent/40 text-accent border border-accent/20 hover:border-accent/40 shadow-[0_0_15px_rgba(212,122,115,0.1)] hover:shadow-[0_0_20px_rgba(212,122,115,0.2)]'
                              }`}
                            >
                              {invitedFriends.has(friend.id) ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Sent
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3" />
                                  Invite
                                </>
                              )}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/watch/${mediaType}/${mediaId}?party=${partyId}`);
                    }}
                    className="w-full py-4 bg-accent hover:bg-accent/80 text-white rounded-xl font-bold tracking-widest text-xs uppercase transition-colors"
                  >
                    Join Room
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

