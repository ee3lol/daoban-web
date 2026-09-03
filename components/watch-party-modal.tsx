/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Lock, Copy, Check, Send, Search } from "lucide-react";
import { useSocket } from "@/components/socket-provider";
import Image from "next/image";

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

            {/* Under Development Message */}
            <div className="flex flex-col items-center justify-center p-10 space-y-4">
              <Image 
                src="/stickers/ugh.png" 
                alt="Under Development"
                width={128}
                height={128}
                className="w-32 h-32 object-contain mb-2"
              />
              <h3 className="text-xl font-bold tracking-widest uppercase text-white">Under Development</h3>
              <p className="text-sm text-center text-white/50 leading-relaxed max-w-xs">
                Watch Parties are currently undergoing maintenance and improvements. Please check back later!
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-8 py-3.5 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white rounded-xl font-bold tracking-widest text-xs uppercase transition-colors w-full max-w-[200px]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

