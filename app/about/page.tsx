export default function AboutPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center min-h-screen relative bg-[#151515] px-6 md:px-12 w-full text-center">
      <div className="max-w-2xl flex flex-col items-center gap-8 z-10">
        
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[#EAE8E3] text-2xl font-bold tracking-[0.2em] uppercase">DAOBAN</span>
            <span className="text-[#888888]/40 text-xl">|</span>
            <span className="text-[#D47A73] text-2xl font-medium">盗版</span>
          </div>
          <p className="text-[#888888]/70 text-xs uppercase tracking-[0.3em] font-semibold mt-2">
            Means &quot;Pirated&quot; / &quot;Bootleg&quot;
          </p>
        </div>

        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D47A73]/50 to-transparent" />

        <p className="text-[#888888] text-lg md:text-xl leading-relaxed font-medium text-balance">
          Honestly we just built this so our friend group had a chill place to watch movies and anime together without all the annoying ads. 
          <br /><br />
          But hey the door is open, feel free to hang out and use it.
        </p>

      </div>
      
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D47A73]/5 rounded-full blur-[100px] pointer-events-none" />
    </main>
  );
}
