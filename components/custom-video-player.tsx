"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { MdPlayArrow, MdPause, MdVolumeUp, MdVolumeOff, MdReplay10, MdForward10, MdFullscreen, MdFullscreenExit, MdSettings, MdSubtitles } from 'react-icons/md';
import { Volume2, VolumeX } from 'lucide-react';

interface Subtitle {
  lang: string;
  url: string;
  format: string;
}

interface VideoSource {
  quality: string;
  url: string;
  isM3U8: boolean;
  isMP4: boolean;
  serverName: string;
  headers?: Record<string, string>;
  subtitles?: Subtitle[];
}

interface CustomVideoPlayerProps {
  sources: VideoSource[];
  poster?: string;
  autoPlay?: boolean;
}

export default function CustomVideoPlayer({ sources, poster, autoPlay = true }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const progressRef = useRef<HTMLInputElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressThumbRef = useRef<HTMLDivElement>(null);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [qualities, setQualities] = useState<any[]>([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState<number>(-1); // -1 is Auto
  const [showSettings, setShowSettings] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
  const [centerIndicator, setCenterIndicator] = useState<'play' | 'pause' | null>(null);
  const indicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeSource = sources[activeSourceIndex];
  const vttSubtitles = activeSource?.subtitles?.filter((sub: any) => sub.format === 'vtt') || [];

  const getQualityLabel = (height: number) => {
    if (height >= 2160) return "4K";
    if (height >= 1440) return "1440p";
    if (height >= 800) return "1080p";
    if (height >= 534) return "720p";
    if (height >= 360) return "480p";
    if (height >= 240) return "360p";
    return `${height}p`;
  };

  // Initialize HLS
  useEffect(() => {
    if (!videoRef.current || !activeSource) return;

    const safePlay = () => {
      if (videoRef.current) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name === 'NotAllowedError') {
              console.warn("Autoplay blocked by browser policy.");
              setIsPlaying(false);
            } else if (e.name !== 'AbortError') {
              console.error("Playback failed:", e);
            }
          });
        }
      }
    };

    if (activeSource.isM3U8 && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
      });
      hlsRef.current = hls;

      let streamUrl = activeSource.url;

      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setQualities(data.levels);
        if (autoPlay) safePlay();
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS Network Error, attempting to recover...", data);
              // If recovery fails, fallback to next source
              if (activeSourceIndex < sources.length - 1) {
                console.log(`Failing over to source index ${activeSourceIndex + 1}`);
                setActiveSourceIndex(activeSourceIndex + 1);
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS Media Error, attempting to recover...", data);
              hls.recoverMediaError();
              break;
            default:
              console.error("HLS Fatal Error, destroying player.", data);
              if (activeSourceIndex < sources.length - 1) {
                console.log(`Failing over to source index ${activeSourceIndex + 1}`);
                setActiveSourceIndex(activeSourceIndex + 1);
              } else {
                hls.destroy();
              }
              break;
          }
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      let streamUrl = activeSource.url;
      if (activeSource.url.startsWith('http')) {
        const headers = activeSource.headers || {};
        streamUrl = `/api/proxy?url=${encodeURIComponent(activeSource.url)}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
      }
      // Native Safari HLS support
      videoRef.current.src = streamUrl;
      if (autoPlay) safePlay();
    } else if (activeSource.isMP4) {
      // Fallback for MP4
      videoRef.current.src = activeSource.url;
      if (autoPlay) safePlay();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [activeSource, autoPlay]);

  // Controls logic
  const togglePlay = () => {
    if (isBuffering) return; // Prevent pausing/playing while buffering

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        showIndicator('pause');
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name === 'NotAllowedError') {
              console.warn("Play blocked by browser policy.");
              setIsPlaying(false);
            } else if (e.name !== 'AbortError') {
              console.error("Playback failed:", e);
            }
          });
        }
        showIndicator('play');
      }
      setIsPlaying(!isPlaying);
    }
  };

  const showIndicator = (type: 'play' | 'pause') => {
    setCenterIndicator(type);
    if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
    indicatorTimeoutRef.current = setTimeout(() => {
      setCenterIndicator(null);
    }, 600);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && progressRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      progressRef.current.value = (p || 0).toString();
      if (progressFillRef.current) progressFillRef.current.style.width = `${p || 0}%`;
      if (progressThumbRef.current) progressThumbRef.current.style.left = `${p || 0}%`;
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      if (isFinite(duration) && duration > 0) {
        videoRef.current.currentTime = (val / 100) * duration;
      }
      if (progressRef.current) {
        progressRef.current.value = val.toString();
      }
      if (progressFillRef.current) progressFillRef.current.style.width = `${val}%`;
      if (progressThumbRef.current) progressThumbRef.current.style.left = `${val}%`;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleFastForward = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      if (isFinite(duration)) {
        videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
      }
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
        case 'j':
          handleRewind();
          break;
        case 'arrowright':
        case 'l':
          handleFastForward();
          break;
        case 'arrowup':
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(1, videoRef.current.volume + 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            if (newVol > 0) setIsMuted(false);
          }
          break;
        case 'arrowdown':
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(0, videoRef.current.volume - 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            if (newVol === 0) setIsMuted(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen, isMuted, volume]);

  useEffect(() => {
    return () => {
      if (indicatorTimeoutRef.current) clearTimeout(indicatorTimeoutRef.current);
    };
  }, []);

  const handleSubtitleChange = (index: number) => {
    setCurrentSubtitleIndex(index);
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = i === index ? 'showing' : 'hidden';
      }
    }
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = Number(e.target.value);
    setCurrentQualityIndex(index);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
    }
  };

  // Hide controls on inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }
    return () => {
      if (container) container.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying]);

  if (!sources || sources.length === 0) {
    return <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold tracking-widest text-sm uppercase">No sources available</div>;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group overflow-hidden flex flex-col justify-center"
    >
      <video
        ref={videoRef}
        poster={poster}
        crossOrigin="anonymous"
        className="w-full h-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        playsInline
      >
        {/* Render subtitles if available and format is vtt */}
        {vttSubtitles.map((sub: any, i: number) => (
          <track
            key={i}
            kind="captions"
            label={sub.lang}
            src={`/api/proxy?url=${encodeURIComponent(sub.url)}`}
            srcLang={sub.lang.substring(0, 2).toLowerCase()}
          />
        ))}
      </video>

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 bg-black/10">
          <svg
            className="w-14 h-14 md:w-16 md:h-16 text-accent animate-[spin_0.8s_linear_infinite] drop-shadow-lg"
            viewBox="0 0 50 50"
          >
            <circle
              cx="25" cy="25" r="20"
              fill="none"
              strokeWidth="4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeDasharray="90, 150"
            />
          </svg>
        </div>
      )}

      {/* Center Screen Indicator (Fleeting) */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-300 ${centerIndicator ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}
      >
        {centerIndicator && (
          <div className="flex items-center justify-center text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            {centerIndicator === 'play' ? <MdPlayArrow className="w-16 h-16 md:w-24 md:h-24" /> : <MdPause className="w-16 h-16 md:w-24 md:h-24" />}
          </div>
        )}
      </div>

      {/* Netflix-Style Controls Overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-all duration-500 ease-out ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="w-full px-4 md:px-8 pb-4 md:pb-6 flex flex-col gap-3 md:gap-4">

          {/* Progress Bar Container */}
          <div className="relative w-full h-4 group/progress cursor-pointer flex items-center z-10">
            <input
              ref={progressRef}
              type="range"
              min="0"
              max="100"
              step="0.1"
              defaultValue="0"
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            {/* Visual Track */}
            <div className="absolute left-0 right-0 h-1 md:h-1.5 bg-white/20 transition-all duration-300 group-hover/progress:h-1.5 md:group-hover/progress:h-2">
              {/* Fill */}
              <div
                ref={progressFillRef}
                className="absolute left-0 top-0 bottom-0 bg-accent pointer-events-none transition-all duration-75"
                style={{ width: '0%' }}
              />
            </div>
            {/* Thumb */}
            <div
              ref={progressThumbRef}
              className="absolute h-3.5 w-3.5 md:h-4 md:w-4 bg-accent rounded-full pointer-events-none transition-all duration-300 scale-0 group-hover/progress:scale-100 opacity-0 group-hover/progress:opacity-100 shadow-md"
              style={{ left: '0%', transform: 'translateX(-50%)' }}
            />
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-4 md:gap-6">
              <button onClick={togglePlay} className="text-white hover:text-white transition-transform transform hover:scale-110" title="Play/Pause">
                {isPlaying ? <MdPause className="w-6 h-6 md:w-8 md:h-8" /> : <MdPlayArrow className="w-6 h-6 md:w-8 md:h-8" />}
              </button>
              <button onClick={handleRewind} className="relative text-white/90 hover:text-white transition-all flex items-center justify-center transform hover:scale-110" title="Rewind 10s">
                <MdReplay10 className="w-6 h-6 md:w-7 md:h-7" />
              </button>
              <button onClick={handleFastForward} className="relative text-white/90 hover:text-white transition-all flex items-center justify-center transform hover:scale-110" title="Fast Forward 10s">
                <MdForward10 className="w-6 h-6 md:w-7 md:h-7" />
              </button>

              {/* Volume Control Group */}
              <div className="flex items-center gap-2 group/volume relative hidden sm:flex">
                <button onClick={toggleMute} className="text-white/90 hover:text-white transition-colors transform hover:scale-110" title="Mute/Unmute">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
                </button>
                <div className="w-0 overflow-hidden transition-all duration-300 ease-out group-hover/volume:w-24 opacity-0 group-hover/volume:opacity-100 flex items-center h-6">
                  {/* Inner track container with horizontal margin to prevent the thumb from being cropped by the parent's overflow-hidden */}
                  <div className="relative w-20 mx-2 h-4 flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    {/* Visual Track */}
                    <div className="absolute left-0 right-0 h-1 md:h-1.5 bg-white/20 rounded-full">
                      {/* Fill */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-accent rounded-full pointer-events-none transition-all duration-75"
                        style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                      />
                    </div>
                    {/* Thumb */}
                    <div
                      className="absolute h-3 w-3 md:h-3.5 md:w-3.5 bg-accent rounded-full pointer-events-none shadow-md transition-all duration-75"
                      style={{ left: `${(isMuted ? 0 : volume) * 100}%`, transform: 'translateX(-50%)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Time Display */}
              <div className="text-white/90 text-xs md:text-sm font-medium tracking-wide">
                {formatTime(currentTime)} <span className="text-white/50 mx-1">/</span> {formatTime(duration)}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Captions Popover */}
              {(vttSubtitles.length > 0 || sources.length > 1) && (
                <div className="relative">
                  <button 
                    onClick={() => { setShowSubtitlesMenu(!showSubtitlesMenu); setShowSettings(false); }} 
                    className={`transition-all transform hover:scale-110 ${showSubtitlesMenu ? 'text-white' : currentSubtitleIndex !== -1 ? 'text-accent' : 'text-white/90 hover:text-white'}`} 
                    title="Audio & Subtitles"
                  >
                    <MdSubtitles className="w-6 h-6 md:w-7 md:h-7" />
                  </button>

                  {showSubtitlesMenu && (
                    <div className="absolute bottom-full right-[-20px] md:right-[-30px] mb-6 w-56 bg-[rgba(20,20,20,0.9)] backdrop-blur-xl rounded-md overflow-hidden shadow-2xl flex flex-col origin-bottom animate-in fade-in duration-200 z-50">
                      
                      {sources.length > 1 && (
                        <>
                          <div className="px-4 py-3 border-b border-white/10 shrink-0">
                            <span className="text-[11px] font-bold tracking-wider text-white uppercase">Audio & Source</span>
                          </div>
                          <div className="flex flex-col py-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
                            {sources.map((src, i) => (
                              <button
                                key={i}
                                onClick={() => { setActiveSourceIndex(i); setShowSubtitlesMenu(false); }}
                                className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${activeSourceIndex === i ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                              >
                                {src.serverName || `Server ${i + 1}`}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {vttSubtitles.length > 0 && (
                        <>
                          <div className={`px-4 py-3 border-white/10 shrink-0 ${sources.length > 1 ? 'border-y' : 'border-b'}`}>
                            <span className="text-[11px] font-bold tracking-wider text-white uppercase">Subtitles</span>
                          </div>
                          <div className="flex flex-col py-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
                            <button
                              onClick={() => { handleSubtitleChange(-1); setShowSubtitlesMenu(false); }}
                              className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${currentSubtitleIndex === -1 ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                            >
                              Off
                            </button>
                            {vttSubtitles.map((sub: any, i: number) => (
                              <button
                                key={i}
                                onClick={() => { handleSubtitleChange(i); setShowSubtitlesMenu(false); }}
                                className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${currentSubtitleIndex === i ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                              >
                                {sub.lang}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Settings Popover */}
              <div className="relative">
                <button
                  onClick={() => { setShowSettings(!showSettings); setShowSubtitlesMenu(false); }}
                  className={`transition-all transform hover:scale-110 ${showSettings ? 'text-white rotate-90' : 'text-white/90 hover:text-white'}`}
                  title="Settings"
                >
                  <MdSettings className="w-6 h-6 md:w-7 md:h-7" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-6 w-48 bg-[rgba(20,20,20,0.9)] backdrop-blur-xl rounded-md overflow-hidden shadow-2xl flex flex-col origin-bottom-right animate-in fade-in duration-200 z-50">
                    <div className="px-4 py-3 border-b border-white/10 shrink-0">
                      <span className="text-[11px] font-bold tracking-wider text-white uppercase">Video Quality</span>
                    </div>

                    {/* Quality Section */}
                    {qualities.length > 0 && (
                      <div className="flex flex-col py-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                        <button
                          onClick={() => { handleQualityChange({ target: { value: -1 } } as any); setShowSettings(false); }}
                          className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${currentQualityIndex === -1 ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                        >
                          Auto
                        </button>
                        {qualities.map((level, i) => (
                          <button
                            key={i}
                            onClick={() => { handleQualityChange({ target: { value: i } } as any); setShowSettings(false); }}
                            className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${currentQualityIndex === i ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                          >
                            {getQualityLabel(level.height)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="text-white/90 hover:text-white transition-all transform hover:scale-110" title="Fullscreen">
                {isFullscreen ? <MdFullscreenExit className="w-7 h-7 md:w-8 md:h-8" /> : <MdFullscreen className="w-7 h-7 md:w-8 md:h-8" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
