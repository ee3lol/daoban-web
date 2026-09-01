"use client";

import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SocialHubClient({ initialFriendData, activeTab, currentUser }: { initialFriendData: any, activeTab: string, currentUser: any }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background-base relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-24 h-24 bg-background-elevated rounded-[24px] flex items-center justify-center mb-8 border border-white/5 shadow-2xl relative z-10">
        <Users className="w-12 h-12 text-accent" />
      </div>
      
      <h1 className="text-4xl font-black text-white tracking-widest uppercase mb-4 relative z-10">
        Social Coming Soon
      </h1>
      
      <p className="text-[#888888] max-w-md text-[15px] leading-relaxed mb-10 relative z-10">
        We are building a massive update to bring real-time Discord-style chat, group watch parties, and seamless messaging straight to DAOBAN.
      </p>
      
      <Link 
        href="/"
        className="px-8 py-4 bg-background-elevated hover:bg-white/5 border border-white/10 rounded-[16px] text-white font-bold tracking-[0.2em] uppercase text-[13px] transition-all flex items-center gap-3 relative z-10 hover:border-white/20 hover:-translate-y-1"
      >
        <ArrowLeft className="w-4 h-4 text-accent" />
        Return to Home
      </Link>
    </div>
  );
}
