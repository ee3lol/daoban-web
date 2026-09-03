/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Users, PartyPopper, MessageSquare, Crown, UserX, XCircle } from "lucide-react";
import { useSocket } from "@/components/socket-provider";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userImage?: string | null;
  text: string;
  timestamp: number;
}

interface PartyChatProps {
  partyId: string;
  userId: string;
  userName: string;
  userImage?: string | null;
  hostId?: string | null;
  members?: { id: string; name: string, image?: string, role?: string }[];
  partySettings?: { anyoneCanControl: boolean };
  initialMessages?: ChatMessage[];
}

export default function PartyChat({ partyId, userId, userName, userImage, hostId, members = [], partySettings, initialMessages = [] }: PartyChatProps) {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Add local join message on initialization only
    return [...initialMessages, {
      id: "local_join_" + Date.now(),
      userId: "system",
      userName: "System",
      text: "You joined the party.",
      timestamp: Date.now()
    }];
  });
  const [inputText, setInputText] = useState("");
  const [activeView, setActiveView] = useState<"chat" | "members">("chat");
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isHost = userId === hostId;

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (data: any) => {
      setMessages((prev) => [...prev, data]);
      if (activeView !== "chat") {
        setUnreadCount((prev) => prev + 1);
      }
    };
    
    const handleUserJoined = (data: any) => {
      if (data.userId === userId) return; // Ignore our own events
      setMessages((prev) => [...prev, {
        id: Math.random().toString(36),
        userId: "system",
        userName: "System",
        text: `${data.userName || "Someone"} joined the party.`,
        timestamp: Date.now()
      }]);
    };
    
    const handleUserLeft = (data: any) => {
      if (data.userId === userId) return; // Ignore our own events
      setMessages((prev) => [...prev, {
        id: Math.random().toString(36),
        userId: "system",
        userName: "System",
        text: `${data.userName || "Someone"} left the party.`,
        timestamp: Date.now()
      }]);
    };

    const handleTyping = (data: any) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (data.isTyping) next.add(data.userName);
        else next.delete(data.userName);
        return next;
      });
    };

    socket.on("party_chat_message", handleMessage);
    socket.on("party_user_joined", handleUserJoined);
    socket.on("party_user_left", handleUserLeft);
    socket.on("party_typing", handleTyping);

    return () => {
      socket.off("party_chat_message", handleMessage);
      socket.off("party_user_joined", handleUserJoined);
      socket.off("party_user_left", handleUserLeft);
      socket.off("party_typing", handleTyping);
    };
  }, [socket, isConnected, activeView]);

  useEffect(() => {
    if (activeView === "chat") {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeView, typingUsers]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket || !isConnected) return;
    
    socket.emit("party_typing", { partyId, userName, isTyping: e.target.value.length > 0 });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("party_typing", { partyId, userName, isTyping: false });
    }, 2000);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !isConnected) return;

    const msgData: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      userId,
      userName,
      userImage,
      text: inputText.trim(),
      timestamp: Date.now()
    };

    socket.emit("party_chat_message", { partyId, ...msgData });
    socket.emit("party_typing", { partyId, userName, isTyping: false });
    setInputText("");
  };

  const handleKick = (kickUserId: string) => {
    if (!socket || !isHost) return;
    socket.emit("kick_from_party", { partyId, hostId: userId, kickUserId });
  };

  const handleEndParty = () => {
    if (!socket || !isHost) return;
    socket.emit("end_party", { partyId, hostId: userId });
  };

  const handleToggleDJ = (targetId: string, currentRole?: string) => {
    if (!socket || !isHost) return;
    if (currentRole === "dj") {
      socket.emit("revoke_dj", { partyId, targetId });
    } else {
      socket.emit("grant_dj", { partyId, targetId });
    }
  };

  const handleLeaveParty = () => {
    if (!socket) return;
    socket.emit("leave_party");
    // Redirect to the current URL without the party parameter
    const url = new URL(window.location.href);
    url.searchParams.delete("party");
    window.location.href = url.toString();
  };

  return (
    <div className="flex flex-col w-full h-full bg-background-elevated/90 overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center border-b border-white/10 bg-white/[0.03] shrink-0">
        <button
          onClick={() => { setActiveView("chat"); setUnreadCount(0); }}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-bold tracking-widest uppercase transition-colors relative ${activeView === "chat" ? "text-accent" : "text-white/40 hover:text-white/70"}`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
          {unreadCount > 0 && activeView !== "chat" && (
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          )}
          {activeView === "chat" && <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] bg-accent rounded-full" />}
        </button>
        <button
          onClick={() => setActiveView("members")}
          className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-bold tracking-widest uppercase transition-colors relative ${activeView === "members" ? "text-accent" : "text-white/40 hover:text-white/70"}`}
        >
          <Users className="w-3.5 h-3.5" />
          Members ({members.length})
          {activeView === "members" && <div className="absolute bottom-0 left-[15%] right-[15%] h-[2px] bg-accent rounded-full" />}
        </button>
      </div>

      {/* Chat View */}
      {activeView === "chat" && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-2">
                <PartyPopper className="w-8 h-8 opacity-50" />
                <p className="text-[10px] tracking-widest uppercase font-bold text-center">No messages yet<br/>Say hi!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.userId === "system" ? "items-center" : msg.userId === userId ? "items-end" : "items-start"}`}>
                  {msg.userId === "system" ? (
                    <span className="text-[9px] font-bold tracking-widest uppercase text-accent/60 bg-accent/5 px-3 py-1 rounded-full border border-accent/10">
                      {msg.text}
                    </span>
                  ) : (
                    <>
                      {msg.userId !== userId && (
                        <span className="text-[10px] text-white/40 font-bold mb-1 ml-1 flex items-center gap-1.5">
                          {msg.userImage ? (
                             <img src={msg.userImage} alt="" className="w-4 h-4 rounded-full object-cover border border-white/10" />
                          ) : (
                             <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[8px]">
                               {msg.userName[0]?.toUpperCase()}
                             </div>
                          )}
                          {msg.userId === hostId && <Crown className="w-3 h-3 text-yellow-400" />}
                          {msg.userName}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2 rounded-xl text-sm max-w-[85%] ${
                          msg.userId === userId
                            ? "bg-accent text-white rounded-br-sm"
                            : "bg-white/[0.06] text-white/90 rounded-bl-sm border border-white/5"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {typingUsers.size > 0 && (
            <div className="px-4 py-2 text-[10px] font-medium tracking-widest text-accent/60 bg-black/10 shrink-0 italic animate-pulse">
              {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing...
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-black/30 border-t border-white/5 shrink-0">
            <form onSubmit={sendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={handleInput}
                placeholder="Type a message..."
                className="flex-1 bg-[rgba(255,255,255,0.025)] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/40 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 bg-accent hover:bg-accent/80 text-white rounded-xl transition-colors disabled:opacity-30 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Members View */}
      {activeView === "members" && (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
          <div className="p-4 flex flex-col gap-2 flex-1">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[rgba(255,255,255,0.02)] border border-transparent hover:border-white/5 transition-colors group"
              >
                {member.image ? (
                   <img src={member.image} alt={member.name} className="w-10 h-10 rounded-full border border-white/10 object-cover shrink-0" />
                ) : (
                   <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 text-sm font-bold shrink-0">
                     {member.name[0]?.toUpperCase()}
                   </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-white text-sm font-medium truncate flex items-center gap-2">
                    {member.name}
                    {member.id === hostId && (
                      <span title="Host">
                        <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
                      </span>
                    )}
                    {member.role === "dj" && member.id !== hostId && (
                      <span className="text-[9px] font-bold tracking-widest uppercase bg-accent/20 text-accent px-2 py-0.5 rounded-full border border-accent/30">DJ</span>
                    )}
                    {member.id === userId && (
                      <span className="text-[9px] text-white/30 tracking-wider uppercase">(you)</span>
                    )}
                  </span>
                </div>
                
                {isHost && member.id !== userId && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleToggleDJ(member.id, member.role)}
                      className={`p-2 rounded-lg transition-all text-xs font-bold ${member.role === 'dj' ? 'text-accent hover:bg-accent/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                      title={member.role === 'dj' ? "Revoke DJ" : "Make DJ"}
                    >
                      DJ
                    </button>
                    <button
                      onClick={() => handleKick(member.id)}
                      className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Kick from party"
                    >
                      <UserX className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="p-4 border-t border-white/5 shrink-0 space-y-4">
              <div className="flex items-center justify-between p-4 bg-[rgba(255,255,255,0.02)] rounded-xl border border-white/5">
                <div className="flex flex-col">
                   <span className="text-[10px] text-white font-bold uppercase tracking-widest">Anyone can control</span>
                   <span className="text-[10px] text-white/40 italic">Like a Spotify Jam</span>
                </div>
                <button 
                  onClick={() => {
                    socket?.emit("update_party_settings", { 
                      partyId, 
                      hostId: userId, 
                      settings: { ...partySettings, anyoneCanControl: !partySettings?.anyoneCanControl }
                    });
                  }}
                  className={`w-11 h-6 rounded-full relative transition-colors ${partySettings?.anyoneCanControl ? 'bg-accent' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-[2px] bottom-[2px] w-5 rounded-full bg-white transition-all shadow-md ${partySettings?.anyoneCanControl ? 'left-[22px]' : 'left-[2px]'}`} />
                </button>
              </div>
              
              <button
                onClick={handleEndParty}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-colors border border-red-500/10 hover:border-red-500/20"
              >
                <XCircle className="w-4 h-4" />
                End Party
              </button>
            </div>
          )}
          
          {!isHost && (
            <div className="p-4 border-t border-white/5 shrink-0">
              <button
                onClick={handleLeaveParty}
                className="group relative w-full flex items-center justify-center gap-2 py-4 bg-red-500 text-white rounded-xl text-xs font-black tracking-widest uppercase overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-300 animate-pulse hover:animate-none transform hover:scale-[1.02]"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <UserX className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Leave Party</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
