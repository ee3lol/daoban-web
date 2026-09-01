"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Lock, Link, Copy, Check, Send } from "lucide-react";
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
  const { socket, isConnected } = useSocket();
  const [step, setStep] = useState<"setup" | "invite">("setup");
  const [userLimit, setUserLimit] = useState(5);
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());

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
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
            className="relative w-full max-w-md bg-background-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold tracking-widest uppercase text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Watch Party
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {step === "setup" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-muted uppercase">
                      User Limit ({userLimit})
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      value={userLimit}
                      onChange={(e) => setUserLimit(parseInt(e.target.value))}
                      style={{
                        background: `linear-gradient(to right, var(--color-accent) ${((userLimit - 2) / 18) * 100}%, white ${((userLimit - 2) / 18) * 100}%)`
                      }}
                      className="w-full h-2 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-white/30">
                      <span>2</span>
                      <span>20</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest text-muted uppercase">
                      Password (Optional)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave empty for public"
                        className="w-full bg-background-light border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
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
                  <div className="p-4 bg-background-light border border-white/5 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-widest text-accent uppercase">Share Link</span>
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg"
                      >
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="text-sm text-white/70 truncate bg-background p-3 rounded-lg border border-white/5 font-mono">
                      {window.location.origin}/watch/{mediaType}/{mediaId}?party={partyId}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold tracking-widest text-muted uppercase">
                      Invite Online Friends
                    </label>
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                      {onlineFriends.length === 0 ? (
                        <div className="py-4 text-center text-muted text-xs">
                          No friends online right now.
                        </div>
                      ) : (
                        onlineFriends.map((friend) => (
                          <div key={friend.id} className="flex items-center justify-between p-3 bg-background-light rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              {friend.image ? (
                                <img src={friend.image} alt={friend.name} className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-background border border-white/10 flex items-center justify-center text-xs font-bold">
                                  {friend.name[0]}
                                </div>
                              )}
                              <span className="text-sm font-semibold text-white">{friend.name}</span>
                            </div>
                            <button
                              onClick={() => handleInvite(friend.id)}
                              disabled={invitedFriends.has(friend.id)}
                              className="px-4 py-2 bg-accent/20 hover:bg-accent/40 text-accent rounded-lg text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                      window.location.href = `/watch/${mediaType}/${mediaId}?party=${partyId}`;
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
