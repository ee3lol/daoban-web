"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname() || '';
  if (pathname.startsWith('/watch') || pathname.startsWith('/me')) return null;

  return (
    <footer className="w-full bg-background-elevated border-t border-white/5 pt-16 pb-28 md:pb-8 relative z-50">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-2 flex flex-col items-start gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-[#EAE8E3] font-semibold text-lg tracking-[0.15em] transition-colors">DAOBAN</span>
              <span className="text-[#888888]/30 text-sm">|</span>
              <span className="text-accent text-[15px] font-medium transition-colors">盗版</span>
            </Link>
            <p className="text-[#888888] text-[13px] font-medium max-w-sm leading-relaxed tracking-wide">
              Your premium destination for streaming movies, tv shows, and anime. Designed with minimalism and cinematic immersion in mind.
            </p>
          </div>

          {/* Links Col 1 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#EAE8E3] text-[12px] font-bold tracking-[0.2em] uppercase mb-2">Explore</h3>
            <Link href="/movies" className="text-[#888888] hover:text-accent text-[13px] transition-colors w-fit">Movies</Link>
            <Link href="/tv" className="text-[#888888] hover:text-accent text-[13px] transition-colors w-fit">TV Shows</Link>
            <Link href="/anime" className="text-[#888888] hover:text-accent text-[13px] transition-colors w-fit">Anime</Link>
            <Link href="/trending" className="text-[#888888] hover:text-accent text-[13px] transition-colors w-fit">Trending</Link>
          </div>

          {/* Links Col 2 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#EAE8E3] text-[12px] font-bold tracking-[0.2em] uppercase mb-2">Legal</h3>
            <Link href="#" className="text-[#888888] hover:text-[#EAE8E3] text-[13px] transition-colors w-fit">Terms of Service</Link>
            <Link href="#" className="text-[#888888] hover:text-[#EAE8E3] text-[13px] transition-colors w-fit">Privacy Policy</Link>
            <Link href="#" className="text-[#888888] hover:text-[#EAE8E3] text-[13px] transition-colors w-fit">DMCA</Link>
            <Link href="#" className="text-[#888888] hover:text-[#EAE8E3] text-[13px] transition-colors w-fit">Contact</Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#888888] text-[11px] tracking-wider uppercase font-medium">
            &copy; {new Date().getFullYear()} DAOBAN. All rights reserved.
          </p>
          <div className="text-[#888888] text-[11px] tracking-wider uppercase flex items-center gap-1.5 font-medium">
            Made with <span className="text-accent text-[14px]">♥</span> for pirates
          </div>
        </div>
      </div>
    </footer>
  );
}
