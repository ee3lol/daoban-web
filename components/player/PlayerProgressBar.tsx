import React, { useRef, useState, useEffect } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';

export const PlayerProgressBar = () => {
  const {
    videoRef,
    currentTime,
    duration,
    isBuffering,
    isInParty,
    isHost,
    socket,
    partyId
  } = usePlayer();

  const progressRef = useRef<HTMLInputElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressThumbRef = useRef<HTMLDivElement>(null);
  const lastProgressUpdate = useRef(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);

  useEffect(() => {
    let animationFrameId: number;

    const updateProgress = () => {
      if (videoRef.current && progressRef.current && progressFillRef.current && progressThumbRef.current) {
        const ct = videoRef.current.currentTime;
        const dur = videoRef.current.duration || 1;
        const percent = (ct / dur) * 100;
        
        progressRef.current.value = ct.toString();
        progressFillRef.current.style.width = `${percent}%`;
        progressThumbRef.current.style.left = `${percent}%`;
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrameId);
  }, [videoRef]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isInParty && !isHost) return;
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      socket?.emit("party_seek", { partyId, time });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverPosition(Math.max(0, Math.min(1, pos)));
  };

  const formatT = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="relative w-full h-1 md:h-1.5 flex items-center group/progress cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <div className="absolute w-full h-1 md:h-1.5 bg-white/20 rounded-full overflow-hidden transition-all duration-200 group-hover/progress:h-2 md:group-hover/progress:h-2.5">
        <div className="absolute inset-0 bg-white/10" />
        {/* Buffering animation could go here */}
        <div
          ref={progressFillRef}
          className="absolute h-full bg-accent rounded-full transition-all ease-out will-change-[width]"
          style={{ width: '0%' }}
        />
      </div>

      <input
        ref={progressRef}
        type="range"
        min="0"
        max={duration || 100}
        step="0.1"
        defaultValue="0"
        onChange={handleSeek}
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 ${(!isHost && isInParty) ? 'cursor-not-allowed' : ''}`}
        disabled={!isHost && isInParty}
      />

      <div
        ref={progressThumbRef}
        className="absolute w-3 h-3 md:w-4 md:h-4 bg-accent rounded-full scale-0 group-hover/progress:scale-100 transition-transform duration-200 z-20 pointer-events-none -ml-1.5 md:-ml-2"
        style={{ left: '0%' }}
      />

      {/* Hover Time Tooltip */}
      {isHovering && duration > 0 && (
        <div 
          className="absolute -top-10 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-xs text-white pointer-events-none shadow-lg border border-white/10"
          style={{ left: `max(0px, min(calc(100% - 40px), calc(${hoverPosition * 100}% - 20px)))` }}
        >
          {formatT(hoverPosition * duration)}
        </div>
      )}
    </div>
  );
};
