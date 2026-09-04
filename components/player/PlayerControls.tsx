import React from 'react';
import { MdPlayArrow, MdPause, MdVolumeUp, MdVolumeOff, MdFullscreen, MdFullscreenExit, MdSettings } from 'react-icons/md';
import { usePlayer } from '../../contexts/PlayerContext';
import { PlayerSettings } from './PlayerSettings';
import { PlayerProgressBar } from './PlayerProgressBar';

export const PlayerControls = () => {
  const {
    videoRef,
    containerRef,
    isPlaying,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    currentTime,
    duration,
    isFullscreen,
    showSettings,
    setShowSettings,
    showControls,
    isIdle,
    isInParty,
    isHost,
    socket,
    partyId,
    setSettingsView
  } = usePlayer();

  const togglePlay = () => {
    if (videoRef.current) {
      if (isInParty && !isHost) return;
      
      if (isPlaying) {
        videoRef.current.pause();
        socket?.emit("party_pause", { partyId, time: videoRef.current.currentTime });
      } else {
        videoRef.current.play();
        socket?.emit("party_play", { partyId, time: videoRef.current.currentTime });
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
      if (videoRef.current) videoRef.current.muted = true;
    } else {
      setIsMuted(false);
      if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = val;
      }
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
      (videoRef.current as any).webkitEnterFullscreen();
      return;
    }

    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
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
      className={`absolute bottom-0 left-0 right-0 px-4 md:px-6 pb-4 md:pb-6 pt-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-40 ${showControls && !isIdle ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <PlayerProgressBar />
      
      <div className="flex items-center justify-between mt-2 md:mt-4">
        {/* Left Controls */}
        <div className="flex items-center gap-3 md:gap-6">
          <button
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className={`transition-all transform hover:scale-110 ${(!isHost && isInParty) ? 'opacity-50 cursor-not-allowed' : 'text-[#EAE8E3]/90 hover:text-[#EAE8E3]'}`}
            title={(!isHost && isInParty) ? "Only the host can control playback" : (isPlaying ? "Pause" : "Play")}
          >
            {isPlaying ? <MdPause className="w-8 h-8 md:w-9 md:h-9" /> : <MdPlayArrow className="w-8 h-8 md:w-9 md:h-9" />}
          </button>
          
          <div className="flex items-center gap-2 group relative">
            <button
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className="text-[#EAE8E3]/90 hover:text-[#EAE8E3] transition-colors"
            >
              {isMuted || volume === 0 ? <MdVolumeOff className="w-6 h-6 md:w-7 md:h-7" /> : <MdVolumeUp className="w-6 h-6 md:w-7 md:h-7" />}
            </button>
              <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 ease-out origin-left flex items-center h-8">
                <div className="relative w-20 h-4 flex items-center ml-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  {/* Track Background */}
                  <div className="absolute left-0 right-0 h-1 md:h-1.5 bg-white/10 rounded-full">
                    {/* Fill */}
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-accent rounded-full pointer-events-none transition-all duration-75"
                      style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    />
                  </div>
                  {/* Thumb */}
                  <div
                    className="absolute h-3 w-3 md:h-3.5 md:w-3.5 bg-accent rounded-full shadow pointer-events-none transition-all duration-75"
                    style={{ left: `${(isMuted ? 0 : volume) * 100}%`, transform: 'translateX(-50%)' }}
                  />
                </div>
              </div>
          </div>
          
          <div className="text-[#EAE8E3] text-xs md:text-sm font-medium tracking-wide font-mono hidden sm:block">
            {formatT(currentTime)} <span className="text-white/30 mx-1">/</span> {formatT(duration)}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative">
            <button
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowSettings(!showSettings); 
                setSettingsView('main'); 
              }}
              className={`transition-all transform hover:scale-110 ${showSettings ? 'text-[#EAE8E3] rotate-90' : 'text-[#EAE8E3]/90 hover:text-[#EAE8E3]'}`}
              title="Settings"
            >
              <MdSettings className="w-6 h-6 md:w-7 md:h-7" />
            </button>
            
            {showSettings && <PlayerSettings />}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            className="text-[#EAE8E3]/90 hover:text-[#EAE8E3] transition-all transform hover:scale-110"
            title="Fullscreen"
          >
            {isFullscreen ? <MdFullscreenExit className="w-7 h-7 md:w-8 md:h-8" /> : <MdFullscreen className="w-7 h-7 md:w-8 md:h-8" />}
          </button>
        </div>
      </div>
    </div>
  );
};
