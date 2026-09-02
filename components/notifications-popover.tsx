/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Heart, MessageSquare, AtSign, Check, Trash2, Maximize2, ShieldAlert } from "lucide-react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from "@/lib/actions/notifications";
import NotificationsModal from "./notifications-modal";
import { useRouter } from "next/navigation";
import { useSocket } from "./socket-provider";

export default function NotificationsPopover({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadNotifications = async () => {
    setIsLoading(true);
    const res = await getNotifications();
    if (res.success && res.notifications) {
      setNotifications(res.notifications);
    }
    setIsLoading(false);
  };

  const { socket } = useSocket();

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Polling as a fallback
      const interval = setInterval(loadNotifications, 60000); 
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = () => {
        loadNotifications();
      };
      socket.on("new_notification", handleNewNotification);
      return () => {
        socket.off("new_notification", handleNewNotification);
      };
    }
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      await markNotificationAsRead(n.id);
      setNotifications(prev => prev.map(p => p.id === n.id ? { ...p, isRead: true } : p));
    }
    
    setIsOpen(false);
    
    if (n.type.startsWith('system')) {
      // System notifications don't navigate anywhere, just mark as read
      setIsOpen(false);
      return;
    }
    
    // Deep linking route construction
    let route = "";
    if (n.mediaType === 'movie') {
      route = `/watch/movie/${n.mediaId}`;
    } else if (n.season && n.episode) {
      route = `/watch/tv/${n.mediaId}?season=${n.season}&episode=${n.episode}`;
    } else {
      route = `/tv/${n.mediaId}`;
    }
    router.push(`${route}${route.includes('?') ? '&' : '?'}commentId=${n.commentId}`);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative text-[#888888] hover:text-accent transition-colors"
      >
        <Bell className="w-5 h-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(252,83,90,0.8)]" />
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-[rgba(21,21,21,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_20px_40px_rgba(0,0,0,0.4)] rounded-[16px] overflow-hidden flex flex-col z-[150] animate-in fade-in zoom-in-95 duration-200">
          
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <span className="text-white font-bold text-sm tracking-wide">Notifications</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                  await markAllNotificationsAsRead();
                  await loadNotifications();
                }}
                className="text-white/40 hover:text-white transition-colors"
                title="Mark all as read"
              >
                <Check size={14} />
              </button>
              <button 
                onClick={async () => {
                  if (isConfirmingClear) {
                    await clearAllNotifications();
                    setNotifications([]);
                    setIsConfirmingClear(false);
                  } else {
                    setIsConfirmingClear(true);
                    setTimeout(() => setIsConfirmingClear(false), 3000);
                  }
                }}
                className={`transition-colors ${isConfirmingClear ? 'text-accent' : 'text-white/40 hover:text-accent'}`}
                title="Clear all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[320px] custom-scrollbar flex flex-col">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/40 gap-2">
                <Bell size={32} className="opacity-20" />
                <span className="text-xs font-medium">No new notifications</span>
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const isSystem = n.type.startsWith('system');
                const Icon = n.type === 'like' ? Heart : (n.type === 'mention' ? AtSign : (isSystem ? ShieldAlert : MessageSquare));
                const colorClass = n.type === 'like' ? 'text-rose-500' : (n.type === 'mention' ? 'text-blue-500' : (isSystem ? 'text-amber-500' : 'text-green-500'));
                const textAction = n.type === 'like' ? 'liked your comment' : (n.type === 'mention' ? 'mentioned you' : (isSystem ? '' : 'replied to you'));
                const systemMessage = n.type === 'system_ban' 
                  ? 'Your account has been suspended. Check your email for details.'
                  : 'One of your comments was removed by moderation.';
                
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-3 p-3 text-left transition-all border-b border-white/5 last:border-0 ${
                      n.isRead ? 'hover:bg-white/5' : 'bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                      <Icon size={14} strokeWidth={3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {isSystem ? (
                        <p className="text-[12px] text-white/90 leading-tight">
                          <span className="font-bold text-amber-500">System</span>{' '}
                          {systemMessage}
                        </p>
                      ) : (
                        <>
                          <p className="text-[12px] text-white/90 leading-tight">
                            <span className="font-bold">{n.sender?.username || n.sender?.name || 'Someone'}</span> {textAction}
                          </p>
                          {n.comment && (
                            <p className="text-[10px] text-[#888888] mt-1 line-clamp-1 italic">
                              "{n.comment.content}"
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    {!n.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="p-2 border-t border-white/5 bg-white/[0.01]">
            <button 
              onClick={() => {
                setIsOpen(false);
                setIsModalOpen(true);
              }}
              className="w-full py-1.5 flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest uppercase text-[#888888] hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <Maximize2 size={12} />
              View All Activity
            </button>
          </div>

        </div>
      )}

      {/* Expanded Modal */}
      <NotificationsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
