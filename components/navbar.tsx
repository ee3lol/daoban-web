
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, User, Home, Compass } from 'lucide-react';
import AuthModal from './auth-modal';
import SearchModal from './search-modal';
import NotificationsPopover from './notifications-popover';
import PwaInstallButton from './pwa-install-button';

export default function Navbar({ user }: { user?: { image?: string | null; name?: string | null; username?: string | null } | null }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tooltipArrowX, setTooltipArrowX] = useState(45);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavigatingToMe, setIsNavigatingToMe] = useState(false);
  const navLinks = [
    { label: 'ANIME', href: '/anime' },
    { label: 'MOVIES', href: '/movies' },
    { label: 'TV SHOWS', href: '/tv' },
    { label: 'SOCIAL', href: '/social' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setIsNavigatingToMe(false);
  }, [pathname]);

  if (pathname.startsWith('/watch') || pathname.startsWith('/me') || pathname.startsWith('/social') || pathname.startsWith('/friends') || pathname.startsWith('/admin')) return null;

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  };

  return (
    <>
      { }

      { }
      <div className="md:hidden fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#151515] via-[#151515]/70 to-transparent pointer-events-none z-40" />

      {/* Mobile Top Navbar Area */}
      <div className="md:hidden fixed top-6 left-0 right-0 z-[100] flex items-center justify-between px-6 pointer-events-none">

        {/* Left: PWA Install */}
        <div className="pointer-events-auto">
          <PwaInstallButton />
        </div>

        {/* Center: Logo */}
        <Link href="/" className="flex items-center gap-3 pointer-events-auto absolute left-1/2 -translate-x-1/2">
          <span className="text-[#EAE8E3] font-semibold text-[16px] tracking-[0.15em] drop-shadow-md">DAOBAN</span>
          <span className="text-[#888888]/40 text-xs">|</span>
          <span className="text-accent text-[13px] font-medium drop-shadow-md">盗版</span>
        </Link>

        {/* Right: Notifications */}
        <div className="pointer-events-auto">
          <NotificationsPopover user={user} />
        </div>
      </div>

      { }
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-[100] flex flex-col items-center">

        { }
        <div
          className={`absolute bottom-[calc(100%+16px)] left-0 right-0 py-4 rounded-[20px] flex flex-col items-center gap-4 transition-all duration-300 origin-bottom ${isMobileMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          style={glassStyle}
        >
          {navLinks.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-[12px] font-medium tracking-[0.2em] transition-colors py-2 w-full text-center ${isActive ? 'text-accent' : 'text-[#888888] hover:text-[#EAE8E3]'}`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <nav className="w-full flex items-center justify-around py-4 rounded-[24px]" style={glassStyle}>
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col items-center gap-1.5 text-accent">
            <Home className="w-[22px] h-[22px]" strokeWidth={2} />
            <span className="text-[9px] font-bold tracking-widest">HOME</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center gap-1.5 transition-colors ${isMobileMenuOpen ? 'text-[#EAE8E3]' : 'text-[#888888] hover:text-accent'}`}
          >
            <Compass className="w-[22px] h-[22px]" strokeWidth={2} />
            <span className="text-[9px] font-bold tracking-widest">BROWSE</span>
          </button>
          <button
            onClick={() => { setIsSearchOpen(true); setIsMobileMenuOpen(false); }}
            className="flex flex-col items-center gap-1.5 text-[#888888] hover:text-accent transition-colors"
          >
            <Search className="w-[22px] h-[22px]" strokeWidth={2} />
            <span className="text-[9px] font-bold tracking-widest">SEARCH</span>
          </button>
          <button
            disabled={isNavigatingToMe}
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (user) {
                setIsNavigatingToMe(true);
                router.push('/me');
              } else {
                setIsAuthModalOpen(true);
              }
            }}
            className="group flex flex-col items-center gap-1.5 text-[#888888] hover:text-[#EAE8E3] transition-all duration-300 active:scale-90 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isNavigatingToMe ? (
              <div className="w-[26px] h-[26px] flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : user?.image ? (
              <div className="w-[26px] h-[26px] rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ring-2 ring-transparent group-hover:ring-accent/50 group-hover:shadow-[0_0_10px_rgba(212,122,115,0.3)]">
                <img src={user.image} alt="avatar" className="w-full h-full object-cover scale-[1.15]" />
              </div>
            ) : (
              <User className="w-[22px] h-[22px] transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
            )}
            <span className="text-[9px] font-bold tracking-widest">ME</span>
          </button>
        </nav>
      </div>

      { }
      <div className="hidden md:flex fixed top-8 left-0 right-0 z-50 justify-center px-6 pointer-events-none">
        <nav
          className={`flex items-center justify-between w-full max-w-5xl px-8 py-4 rounded-[16px] transition-all duration-500 relative border pointer-events-auto ${isScrolled
              ? 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.05)] backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.1)]'
              : 'bg-transparent border-transparent'
            }`}
        >
          { }
          <Link
            href="/"
            className="flex items-center gap-4 group relative"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              setTooltipArrowX(Math.max(15, Math.min(x, 260)));
            }}
          >
            <span className="text-[#EAE8E3] font-semibold text-lg tracking-[0.15em] transition-colors">DAOBAN</span>
            <span className="text-[#888888]/30 text-sm">|</span>
            <span className="text-accent text-[15px] font-medium transition-colors">盗版</span>

            { }
            <div className="absolute top-full mt-4 left-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-[500ms] pointer-events-none z-50 translate-y-2 group-hover:translate-y-0">

              { }
              <div
                className="absolute -top-[6px] w-3 h-3 bg-[rgba(21,21,21,0.95)] border-t border-l border-[rgba(255,255,255,0.08)] transform rotate-45 z-10 backdrop-blur-xl transition-all duration-75 ease-out"
                style={{ left: `${tooltipArrowX}px` }}
              />

              <div className="bg-[rgba(21,21,21,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_20px_40px_rgba(0,0,0,0.4)] p-5 rounded-[16px] w-[280px] flex flex-col gap-2 relative overflow-hidden mt-0">
                { }
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

                <div className="flex items-center gap-2">
                  <span className="text-[#EAE8E3] text-[13px] font-bold tracking-widest uppercase">DAOBAN</span>
                  <span className="text-accent text-[13px] font-medium tracking-widest">盗版</span>
                </div>
                <p className="text-[#888888]/70 text-[10px] uppercase tracking-widest font-semibold border-b border-[#888888]/10 pb-3 mb-1">
                  Means &quot;Pirated&quot; / &quot;Bootleg&quot;
                </p>
                <p className="text-[#888888] text-[12px] leading-[1.7] font-medium whitespace-normal relative z-20">
                  Honestly we just built this so our friend group had a chill place to watch movies and anime together without all the annoying ads. But hey the door is open, feel free to hang out and use it.
                </p>
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links (Full width on large screens) */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-10">
            {navLinks.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative text-[11px] xl:text-[12px] font-medium tracking-[0.2em] transition-colors duration-200 py-1 ${isActive ? 'text-[#EAE8E3]' : 'text-[#888888] hover:text-[#EAE8E3]'}`}
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="navbar-underline"
                      className="absolute left-0 -bottom-1 w-full h-[1.5px] bg-accent"
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Browse Dropdown (Medium screens only) */}
          <div className="hidden md:flex lg:hidden items-center group relative">
            <button className="flex items-center gap-2 text-[#888888] hover:text-[#EAE8E3] transition-colors text-[12px] font-medium tracking-[0.2em] py-1">
              BROWSE
            </button>
            <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-50 translate-y-2 group-hover:translate-y-0">
              <div className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[rgba(21,21,21,0.95)] border-t border-l border-[rgba(255,255,255,0.08)] transform rotate-45 z-10 backdrop-blur-xl transition-all duration-75 ease-out" />
              <div className="bg-[rgba(21,21,21,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[0_20px_40px_rgba(0,0,0,0.4)] p-2 rounded-[16px] w-[180px] flex flex-col gap-1 relative overflow-hidden">
                {navLinks.map(item => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`px-4 py-2.5 rounded-xl transition-colors text-[11px] font-medium tracking-[0.2em] ${isActive ? 'bg-white/10 text-white' : 'text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5'}`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          { }
          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-[#888888] hover:text-[#EAE8E3] group"
            >
              <Search className="w-[16px] h-[16px] group-hover:scale-110 group-hover:text-accent transition-all" strokeWidth={2.5} />
              <div className="flex items-center gap-1 opacity-60">
                <span className="text-[9px] font-bold tracking-widest uppercase border border-white/10 px-1.5 py-0.5 rounded-sm bg-black/40">CTRL</span>
                <span className="text-[9px] font-bold tracking-widest uppercase border border-white/10 px-1.5 py-0.5 rounded-sm bg-black/40">K</span>
              </div>
            </button>
            {user && <NotificationsPopover user={user} />}
            <button
              disabled={isNavigatingToMe}
              onClick={() => {
                if (user) {
                  setIsNavigatingToMe(true);
                  router.push('/me');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="group text-[#888888] hover:text-[#EAE8E3] transition-all duration-300 transform active:scale-90 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
            >
              {isNavigatingToMe ? (
                <div className="w-[30px] h-[30px] flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : user?.image ? (
                <div className="w-[30px] h-[30px] rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ring-2 ring-transparent group-hover:ring-accent/50 group-hover:shadow-[0_0_15px_rgba(212,122,115,0.3)] group-hover:scale-110">
                  <img src={user.image} alt="avatar" className="w-full h-full object-cover scale-[1.15]" />
                </div>
              ) : (
                <User className="w-[20px] h-[20px] transition-transform duration-300 group-hover:scale-110" strokeWidth={2} />
              )}
            </button>
          </div>
        </nav>
      </div>

      { }
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      { }
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
