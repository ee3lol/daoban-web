/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from "lucide-react";
import { useState } from "react";

export default function AnnouncementBanner({ announcements }: { announcements: any[] }) {
  const [closedIds, setClosedIds] = useState<string[]>([]);

  if (!announcements || announcements.length === 0) return null;

  const visibleAnnouncements = announcements.filter(a => !closedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="w-full flex flex-col z-[100] relative border-b border-white/5">
      {visibleAnnouncements.map(announcement => (
        <div 
          key={announcement.id} 
          className={`w-full p-2.5 px-4 flex items-center justify-between text-[13px] font-medium backdrop-blur-md ${
            announcement.type === 'error' ? 'bg-red-500/90 text-white' :
            announcement.type === 'warning' ? 'bg-amber-500/90 text-white' :
            announcement.type === 'success' ? 'bg-emerald-500/90 text-white' :
            'bg-blue-500/90 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {announcement.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {announcement.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
            {announcement.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {announcement.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
            <span>
              {announcement.title && <strong className="mr-2 opacity-90">{announcement.title}:</strong>}
              {announcement.message}
            </span>
          </div>
          <button 
            onClick={() => setClosedIds([...closedIds, announcement.id])}
            className="w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
