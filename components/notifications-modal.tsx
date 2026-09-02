/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from "@/lib/actions/notifications";
import { X, Check, Trash2, Heart, MessageSquare, AtSign, Bell, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadNotifications();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    setIsLoading(true);
    const res = await getNotifications();
    if (res.success && res.notifications) {
      setNotifications(res.notifications);
    }
    setIsLoading(false);
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      await markNotificationAsRead(n.id);
      setNotifications(prev => prev.map(p => p.id === n.id ? { ...p, isRead: true } : p));
    }

    onClose();

    if (n.type.startsWith('system')) {
      onClose();
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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-background-elevated border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Notifications</h2>
              <p className="text-[#888888] text-xs font-medium">Activity from your network</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                await markAllNotificationsAsRead();
                await loadNotifications();
              }}
              className="text-xs font-bold text-[#888888] hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              title="Mark all as read"
            >
              <Check size={14} />
              <span className="hidden sm:inline">Mark Read</span>
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
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${isConfirmingClear ? 'text-accent' : 'text-[#888888] hover:text-accent'}`}
              title="Clear all"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">{isConfirmingClear ? "SURE?" : "Clear"}</span>
            </button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 flex flex-col gap-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#888888] gap-4">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium animate-pulse">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#888888] gap-4">
              <Bell size={48} className="opacity-20" />
              <p className="text-sm font-medium">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isSystem = n.type.startsWith('system');
              const Icon = n.type === 'like' ? Heart : (n.type === 'mention' ? AtSign : (isSystem ? ShieldAlert : MessageSquare));
              const colorClass = n.type === 'like' ? 'text-rose-500 bg-rose-500/10' : (n.type === 'mention' ? 'text-blue-500 bg-blue-500/10' : (isSystem ? 'text-amber-500 bg-amber-500/10' : 'text-green-500 bg-green-500/10'));
              const systemMessage = n.type === 'system_ban'
                ? 'Your account has been suspended. Check your email for details.'
                : 'One of your comments was removed by moderation.';
              const textAction = n.type === 'like' ? 'liked your comment' : (n.type === 'mention' ? 'mentioned you in a comment' : (isSystem ? '' : 'replied to your comment'));

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border ${n.isRead ? 'bg-transparent border-transparent hover:bg-white/5' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                    }`}
                >
                  {!n.isRead && (
                    <div className="absolute top-1/2 -translate-y-1/2 left-2 w-1.5 h-1.5 rounded-full bg-accent" />
                  )}

                  <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center mt-1 ${colorClass}`}>
                    <Icon size={18} strokeWidth={2.5} />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    {isSystem ? (
                      <p className="text-sm text-white/90 leading-snug">
                        <span className="font-bold text-amber-500">System</span>{' '}
                        {systemMessage}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-white/90 leading-snug">
                          <span className="font-bold">{n.sender?.username || n.sender?.name || 'Someone'}</span> {textAction}.
                        </p>
                        {n.comment && (
                          <p className="text-xs text-[#888888] mt-1.5 line-clamp-2 italic border-l-2 border-white/10 pl-2 group-hover:border-white/30 transition-colors">
                            "{n.comment.content}"
                          </p>
                        )}
                      </>
                    )}
                    <span className="text-[10px] font-bold text-[#555555] uppercase tracking-wider mt-2">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
