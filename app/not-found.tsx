import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/sunken-ship.png"
          alt="Sunken pirate ship"
          fill
          className="object-cover opacity-30 mix-blend-luminosity scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mt-20">
        <h1 className="text-[120px] md:text-[180px] font-black text-accent leading-none tracking-tighter opacity-90 drop-shadow-2xl">
          404
        </h1>
        
        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-[#EAE8E3] text-2xl md:text-3xl font-bold tracking-[0.2em] uppercase">
            Lost at Sea
          </h2>
          <p className="text-[#888888] text-[15px] md:text-[17px] font-medium leading-relaxed max-w-lg mx-auto text-balance">
            The page you're looking for has sunk to the bottom of the ocean. It might have been moved, deleted, or never existed in these waters.
          </p>
        </div>

        <Link 
          href="/" 
          className="mt-12 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold tracking-[0.15em] uppercase text-[13px] transition-all hover:scale-105 backdrop-blur-sm"
        >
          Return to Surface
        </Link>
      </div>

      {/* Film grain effect */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-20 film-grain" />
    </div>
  );
}
