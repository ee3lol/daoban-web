import Link from 'next/link';

export default function DiscordBanner() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 md:px-12 py-10 relative z-20 mt-4">
      <div className="relative w-full h-[120px] md:h-[130px] rounded-[6px] overflow-hidden flex items-center border border-white/5 bg-[#111111] group">
        
        {}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 grayscale mix-blend-luminosity transition-transform duration-1000 group-hover:scale-105"
          style={{ backgroundImage: `url('/discord-party.png')`, backgroundPosition: 'center 40%' }}
        />
        
        {}
        <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/90 to-[#111111]/80" />
        
        {}
        <div className="relative z-10 px-6 md:px-10 flex flex-row items-center justify-between w-full gap-6">
          
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[#EAE8E3] text-[14px] md:text-[16px] font-bold tracking-[0.2em] uppercase">
              GET ON TO THE SHIP PIRATE
            </h2>
            <p className="text-[#888888] text-[10px] md:text-[11px] font-medium tracking-[0.1em] uppercase hidden sm:block">
              Join the official DAOBAN Discord server to chat with the crew.
            </p>
          </div>
          
          <Link 
            href="https://discord.com" 
            target="_blank"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-[#EAE8E3] hover:text-accent font-bold tracking-[0.1em] uppercase text-[11px] rounded-[4px] transition-colors flex items-center gap-2 backdrop-blur-md shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.58,67.58,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,.04-.06.09-.09C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96,46,95.89,53,90.84,65.69,84.69,65.69Z" />
            </svg>
            DISCORD
          </Link>
        </div>
      </div>
    </section>
  );
}
