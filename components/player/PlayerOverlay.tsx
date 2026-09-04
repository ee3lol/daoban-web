import React, { useState, useEffect, useRef } from 'react';
import { MdPlayArrow, MdPause, MdFastForward, MdFastRewind } from 'react-icons/md';
import { usePlayer } from '../../contexts/PlayerContext';

export const PlayerOverlay = ({ children }: { children: React.ReactNode }) => {
  const {
    videoRef,
    isPlaying,
    isBuffering,
    showControls,
    setShowControls,
    isIdle,
    setIsIdle,
    showSettings,
    setShowSettings,
    isInParty,
    isHost,
    socket,
    partyId
  } = usePlayer();

  const [centerIndicator, setCenterIndicator] = useState<'play' | 'pause' | 'forward' | 'rewind' | null>(null);
  const lastTapRef = useRef<{ time: number, x: number } | null>(null);
  
  // Idle timeout logic
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetIdle = () => {
      clearTimeout(timeoutId);
      setIsIdle(false);
      setShowControls(true);
      if (isPlaying && !showSettings) {
        timeoutId = setTimeout(() => {
          setIsIdle(true);
          setShowControls(false);
        }, 3000); // 3 seconds idle
      }
    };

    const handleMouseMove = () => resetIdle();
    const handleTouchStart = () => resetIdle();
    const handleKeyDown = () => resetIdle();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('keydown', handleKeyDown);
    
    // Start initial timer
    resetIdle();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, showSettings, setIsIdle, setShowControls]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isInParty && !isHost) return;
      
      if (isPlaying) {
        videoRef.current.pause();
        socket?.emit("party_pause", { partyId, time: videoRef.current.currentTime });
        showCenterIndicator('pause');
      } else {
        videoRef.current.play();
        socket?.emit("party_play", { partyId, time: videoRef.current.currentTime });
        showCenterIndicator('play');
      }
    }
  };

  const handleSeekRelative = (seconds: number) => {
    if (!videoRef.current) return;
    if (isInParty && !isHost) return;
    
    let newTime = videoRef.current.currentTime + seconds;
    if (newTime < 0) newTime = 0;
    if (newTime > (videoRef.current.duration || 0)) newTime = videoRef.current.duration || 0;
    
    videoRef.current.currentTime = newTime;
    socket?.emit("party_seek", { partyId, time: newTime });
    showCenterIndicator(seconds > 0 ? 'forward' : 'rewind');
  };

  const showCenterIndicator = (state: 'play' | 'pause' | 'forward' | 'rewind') => {
    setCenterIndicator(state);
    setTimeout(() => {
      setCenterIndicator(null);
    }, 500); // Hide after animation
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (showSettings) {
      setShowSettings(false);
      return;
    }
    
    const now = Date.now();
    const x = e.clientX;
    const width = window.innerWidth;
    const isMobile = window.matchMedia("(hover: none)").matches;

    if (isMobile) {
      if (lastTapRef.current && now - lastTapRef.current.time < 300) {
        // Double tap
        if (x < width * 0.3) {
          handleSeekRelative(-10);
        } else if (x > width * 0.7) {
          handleSeekRelative(10);
        } else {
          togglePlay();
        }
        lastTapRef.current = null;
        return;
      }

      lastTapRef.current = { time: now, x };
      setShowControls(!showControls);

      // Tap middle toggles play/pause
      if (x >= width * 0.3 && x <= width * 0.7) {
        togglePlay();
      }
    } else {
      // Desktop
      togglePlay();
    }
  };

  return (
    <div 
      className={`absolute inset-0 z-20 ${showControls && !isIdle ? 'cursor-default' : 'cursor-none'}`}
      onClick={handleOverlayClick}
    >
      {/* Dark gradient at top for title, dark gradient at bottom for controls */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${showControls && !isIdle ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 70%, rgba(0,0,0,0.8) 100%)'
        }}
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-30">
          <svg className="animate-spin w-12 h-12 md:w-16 md:h-16 text-white/80" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" strokeWidth="4" stroke="currentColor" strokeLinecap="round" strokeDasharray="90, 150" />
          </svg>
        </div>
      )}

      {/* Play/Pause Center Indicator */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-300 ${centerIndicator ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}
      >
        {centerIndicator && (
          <div className="flex items-center justify-center text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            {centerIndicator === 'play' ? <MdPlayArrow className="w-16 h-16 md:w-24 md:h-24" /> : 
             centerIndicator === 'pause' ? <MdPause className="w-16 h-16 md:w-24 md:h-24" /> :
             centerIndicator === 'forward' ? <MdFastForward className="w-16 h-16 md:w-24 md:h-24" /> :
             <MdFastRewind className="w-16 h-16 md:w-24 md:h-24" />}
          </div>
        )}
      </div>

      {children}
    </div>
  );
};
