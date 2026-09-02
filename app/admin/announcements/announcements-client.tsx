/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Plus, Megaphone, Loader2, Trash2, Edit2, AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { createAnnouncement, toggleAnnouncement, deleteAnnouncement } from "@/lib/actions/admin";
import Image from "next/image";

export default function AnnouncementsClient({ initialAnnouncements }: { initialAnnouncements: any[] }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title || !message) return;
    setIsSubmitting(true);
    const res = await createAnnouncement(title, message, type);
    if (res.success) {
      window.location.reload();
    }
    setIsSubmitting(false);
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    setUpdatingId(id);
    const res = await toggleAnnouncement(id, !currentState);
    if (res.success) {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isActive: !currentState } : a));
    }
    setUpdatingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    setUpdatingId(id);
    const res = await deleteAnnouncement(id);
    if (res.success) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
    setUpdatingId(null);
  };

  const typeStyles: Record<string, { bg: string, text: string, icon: React.ReactNode }> = {
    info: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: <Info className="w-5 h-5 text-blue-500" /> },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-500', icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
    error: { bg: 'bg-red-500/10', text: 'text-red-500', icon: <AlertCircle className="w-5 h-5 text-red-500" /> },
    success: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
  };

  return (
    <div className="flex flex-col gap-8">
      {isCreating ? (
        <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-wide">New Announcement</h3>
            <button onClick={() => setIsCreating(false)} className="text-[#888888] hover:text-white transition-colors text-sm">Cancel</button>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g., Server Maintenance"
              className="bg-background-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Message</label>
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              placeholder="Detailed message..."
              className="bg-background-light border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-accent outline-none min-h-[100px] resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase">Type</label>
            <div className="flex gap-4">
              {['info', 'warning', 'error', 'success'].map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-lg text-[13px] font-bold capitalize transition-all border ${
                    type === t ? 'border-accent text-accent bg-accent/10' : 'border-white/10 text-[#888888] hover:border-white/30'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end mt-4 border-t border-white/5 pt-4">
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !title || !message}
              className="px-6 py-3 bg-accent hover:bg-accent/80 text-white rounded-xl font-bold tracking-wide transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Announcement
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsCreating(true)}
          className="w-full py-6 border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[#888888] font-medium tracking-wide">Create new announcement</span>
        </button>
      )}

      <div className="flex flex-col gap-4">
        {announcements.length === 0 ? (
          <div className="text-center py-10 text-[#888888] flex flex-col items-center gap-3">
            <Megaphone className="w-8 h-8 opacity-20" />
            <p>No announcements found.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border ${announcement.isActive ? 'bg-white/[0.02] border-white/10' : 'bg-background border-white/5 opacity-70'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeStyles[announcement.type]?.bg}`}>
                  {typeStyles[announcement.type]?.icon}
                </div>
                <div className="flex flex-col">
                  <h3 className={`font-bold tracking-wide ${announcement.isActive ? 'text-white' : 'text-[#888888]'}`}>{announcement.title}</h3>
                  <p className="text-[#888888] text-[13px] mt-1">{announcement.message}</p>
                  <div className="flex items-center gap-2 mt-3 text-[11px] text-[#888888] font-medium">
                    <img src={announcement.creator?.image || "/avatar/default1.png"} className="w-4 h-4 rounded-full" />
                    <span>Created by {announcement.creator?.username || announcement.creator?.name}</span>
                    <span>•</span>
                    <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 md:ml-auto">
                <button
                  onClick={() => handleToggle(announcement.id, announcement.isActive)}
                  disabled={updatingId === announcement.id}
                  className={`px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${
                    announcement.isActive 
                      ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                      : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                >
                  {updatingId === announcement.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {announcement.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  disabled={updatingId === announcement.id}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
