import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen relative bg-[var(--bg-base)] px-6 md:px-12 w-full text-center">
      <div className="max-w-2xl flex flex-col items-center gap-8 z-10 pt-20 pb-12">
        
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[#EAE8E3] text-2xl md:text-3xl font-black tracking-[0.2em] uppercase">DAOBAN</span>
            <span className="text-[#888888]/30 text-2xl">|</span>
            <span className="text-accent text-2xl md:text-3xl font-medium">盗版</span>
          </div>
          <p className="text-[#888888]/60 text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold mt-2">
            Means &quot;Pirated&quot; / &quot;Bootleg&quot;
          </p>
        </div>

        <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

        <div className="flex flex-col gap-6 text-[#888888] text-sm md:text-[15px] leading-[1.8] font-medium text-balance max-w-xl">
          <p>
            Honestly, we just built this so our friend group had a chill place to watch movies and anime together without dealing with popups, trackers, or those annoying 30-second unskippable ads. 
          </p>
          <p>
            But hey, the door is open. Feel free to hang out, stream some good stuff, and make yourself at home.
          </p>
          
          <div className="p-6 md:p-8 bg-white/[0.02] border border-white/5 hover:border-accent/30 rounded-3xl mt-6 flex flex-col items-center gap-4 relative overflow-hidden group transition-all duration-500 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <h3 className="text-[#EAE8E3] font-bold tracking-widest uppercase text-xs flex items-center gap-2 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Keep it Ad-Free
            </h3>
            
            <p className="text-[13px] text-white/50 leading-relaxed z-10">
              We pay out of pocket to keep servers running fast and 100% ad-free. If you vibe with what we're doing and want to buy us a coffee (or just help cover server costs), we'd super appreciate it.
            </p>
            
            <Link 
              href="#"
              className="mt-4 flex items-center gap-3 px-6 py-3.5 bg-[#5865F2]/10 hover:bg-[#5865F2] text-[#5865F2] hover:text-white border border-[#5865F2]/20 hover:border-[#5865F2] rounded-xl font-bold text-[11px] uppercase tracking-[0.15em] transition-all duration-300 z-10 shadow-lg"
            >
              <MessageSquare className="w-4 h-4" />
              Join Discord to Donate
            </Link>
          </div>
        </div>

      </div>
      
      {}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
    </main>
  );
}
