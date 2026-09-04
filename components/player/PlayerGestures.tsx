import React, { useState } from 'react';
import { MdForward10, MdReplay10 } from 'react-icons/md';
import { usePlayer } from '../../contexts/PlayerContext';

export const PlayerGestures = () => {
  const {
    videoRef,
    currentTime,
    duration,
    isInParty,
    isHost,
    socket,
    partyId
  } = usePlayer();

  const [seekRipple, setSeekRipple] = useState<'left' | 'right' | null>(null);
  let lastTap = 0;

  const handleDoubleTap = (side: 'left' | 'right') => {
    const now = Date.now();
    const isDoubleTap = now - lastTap < 300;
    
    if (isDoubleTap) {
      if (isInParty && !isHost) return;
      
      const seekAmount = 10;
      let newTime = side === 'right' ? currentTime + seekAmount : currentTime - seekAmount;
      newTime = Math.max(0, Math.min(newTime, duration));
      
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
        socket?.emit("party_seek", { partyId, time: newTime });
      }

      setSeekRipple(side);
      setTimeout(() => setSeekRipple(null), 500); // Remove ripple after animation
    }
    
    lastTap = now;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex">
      {/* Left Double Tap Area */}
      <div 
        className="w-1/3 h-full pointer-events-auto"
        onClick={(e) => {
          // Only trigger on mobile/touch, but for now we'll allow it everywhere for testing
          handleDoubleTap('left');
        }}
      />
      {/* Right Double Tap Area */}
      <div 
        className="w-1/3 h-full ml-auto pointer-events-auto"
        onClick={(e) => {
          handleDoubleTap('right');
        }}
      />

      {/* Seek Ripple Animations */}
      <div
        className={`absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-white/20 to-transparent flex items-center justify-center transition-all duration-300 rounded-r-[100%] pointer-events-none ${seekRipple === 'left' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`}
      >
        <div className="flex flex-col items-center justify-center text-white bg-black/40 backdrop-blur-sm p-4 rounded-full">
          <MdReplay10 className="w-10 h-10 mb-1 animate-spin-reverse-once" />
          <span className="font-bold text-sm">10 sec</span>
        </div>
      </div>

      <div
        className={`absolute inset-y-0 right-0 w-[40%] bg-gradient-to-l from-white/20 to-transparent flex items-center justify-center transition-all duration-300 rounded-l-[100%] pointer-events-none ${seekRipple === 'right' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
      >
        <div className="flex flex-col items-center justify-center text-white bg-black/40 backdrop-blur-sm p-4 rounded-full">
          <MdForward10 className="w-10 h-10 mb-1 animate-spin-once" />
          <span className="font-bold text-sm">10 sec</span>
        </div>
      </div>
    </div>
  );
};
