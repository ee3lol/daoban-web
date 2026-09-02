/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Hls from 'hls.js';
import { MdPlayArrow, MdPause, MdVolumeUp, MdVolumeOff, MdReplay10, MdForward10, MdFullscreen, MdFullscreenExit, MdSettings, MdSubtitles } from 'react-icons/md';
import { Volume2, VolumeX, ChevronLeft } from 'lucide-react';

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
  language?: string;
  headers?: Record<string, string>;
  subtitles?: Subtitle[];
}

interface CustomVideoPlayerProps {
  sources: VideoSource[];
  poster?: string;
  autoPlay?: boolean;
  initialTime?: number;
  onProgress?: (currentTime: number, duration: number, isPlaying: boolean) => void;
  socket?: any;
  partyId?: string | null;
  isInParty?: boolean;
  itemTitle?: string;
  itemDescription?: string;
  itemMetadata?: string;
  itemLogo?: string;
  isHost?: boolean;
  partySettings?: { anyoneCanControl: boolean };
  userId?: string;
}

export default function CustomVideoPlayer({ 
  sources, 
  poster, 
  autoPlay = true,
  initialTime = 0,
  onProgress,
  socket,
  partyId,
  isInParty,
  itemTitle,
  itemDescription,
  itemMetadata,
  itemLogo,
  isHost,
  partySettings,
  userId
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [hasReceivedInitialSync, setHasReceivedInitialSync] = useState(false);
  const pendingSyncTime = useRef<number | null>(null);
  const pendingSyncPlay = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const progressRef = useRef<HTMLInputElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressThumbRef = useRef<HTMLDivElement>(null);
  const lastProgressUpdate = useRef(0);
  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [qualities, setQualities] = useState<any[]>([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState<number>(-1); 
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<number>(-1);
  const [hlsSubtitles, setHlsSubtitles] = useState<any[]>([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [settingsView, setSettingsView] = useState<'main' | 'source' | 'quality' | 'audio' | 'speed'>('main');
  const [showSettings, setShowSettings] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isRemoteAction = useRef(false);

  const initAudio = () => {
    if (!audioCtxRef.current && videoRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(videoRef.current);
        const gainNode = ctx.createGain();
        gainNode.gain.value = isMuted ? 0 : volume * 2;
        
        // Add a compressor to act as a limiter and prevent audio clipping/distortion
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -5;
        compressor.knee.value = 5;
        compressor.ratio.value = 15;
        compressor.attack.value = 0.005;
        compressor.release.value = 0.1;

        source.connect(gainNode);
        gainNode.connect(compressor);
        compressor.connect(ctx.destination);
        
        audioCtxRef.current = ctx;
        gainNodeRef.current = gainNode;
      } catch (e) {
        console.warn("Audio Context init failed (can only create once per element):", e);
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const emitPartyAction = (type: 'PLAY' | 'PAUSE' | 'SEEK', time?: number) => {
    if (!socket || !isInParty || !partyId || isRemoteAction.current) return;
    socket.emit("party_action", { partyId, type, time });
  };

  useEffect(() => {
    if (!socket || !isInParty || !partyId) return;

    const handlePartyAction = (data: any) => {
      if (!videoRef.current) return;
      
      isRemoteAction.current = true;
      
      try {
        if (data.type === 'PLAY') {
          if (data.time !== undefined && Math.abs(videoRef.current.currentTime - data.time) > 2) {
            videoRef.current.currentTime = data.time;
          }
          videoRef.current.play().catch(e => console.warn("Remote play blocked:", e));
        } else if (data.type === 'PAUSE') {
          videoRef.current.pause();
        } else if (data.type === 'SEEK') {
          videoRef.current.currentTime = data.time;
        }
      } catch (err) {
        console.error("Party sync error", err);
      }
      
      setTimeout(() => { isRemoteAction.current = false; }, 500);
    };

    socket.on("party_action", handlePartyAction);
    return () => {
      socket.off("party_action", handlePartyAction);
    };
  }, [socket, isInParty, partyId]);

  useEffect(() => {
    if (!socket || !isInParty || !partyId) return;

    const handleRequestSync = (data: any) => {
      if (isHost && videoRef.current) {
         socket.emit("sync_state", {
           targetSocketId: data.targetSocketId,
           time: videoRef.current.currentTime,
           isPlaying: !videoRef.current.paused
         });
      }
    };

    const handleSyncState = (data: any) => {
      if (!isHost && videoRef.current) {
        setHasReceivedInitialSync(true);
        isRemoteAction.current = true;
        
        if (videoRef.current.readyState >= 1) {
          if (data.time !== undefined) {
             videoRef.current.currentTime = data.time;
          }
          if (data.isPlaying) {
             videoRef.current.play().catch(e => console.warn("Remote play blocked:", e));
          } else {
             videoRef.current.pause();
          }
        } else {
          pendingSyncTime.current = data.time;
          pendingSyncPlay.current = data.isPlaying;
        }
        
        setTimeout(() => { isRemoteAction.current = false; }, 500);
      }
    };

    const handleSyncUpdate = (data: any) => {
      if (!isHost && videoRef.current) {
        setHasReceivedInitialSync(true);
        const drift = Math.abs(videoRef.current.currentTime - data.time);
        if (drift > 2) {
           isRemoteAction.current = true;
           videoRef.current.currentTime = data.time;
           if (data.isPlaying && videoRef.current.paused) {
             videoRef.current.play().catch(e => console.warn("Remote play blocked:", e));
           } else if (!data.isPlaying && !videoRef.current.paused) {
             videoRef.current.pause();
           }
           setTimeout(() => { isRemoteAction.current = false; }, 500);
        }
      }
    };

    socket.on("request_sync", handleRequestSync);
    socket.on("sync_state", handleSyncState);
    socket.on("party_sync_update", handleSyncUpdate);

    if (!isHost) {
      socket.emit("request_sync", { partyId });
    }

    return () => {
      socket.off("request_sync", handleRequestSync);
      socket.off("sync_state", handleSyncState);
      socket.off("party_sync_update", handleSyncUpdate);
    };
  }, [socket, isInParty, partyId, isHost]);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
  const [hasFatalError, setHasFatalError] = useState(false);

  useEffect(() => {
    setActiveSourceIndex(0);
    setIsBuffering(false);
    setHasFatalError(false);
    setCurrentQualityIndex(-1);
    setCurrentSubtitleIndex(-1);
  }, [sources]);

  const [centerIndicator, setCenterIndicator] = useState<'play' | 'pause' | null>(null);
  const indicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeSource = sources[activeSourceIndex];
  const vttSubtitles = activeSource?.subtitles?.filter((sub: any) => sub.format === 'vtt') || [];
  
  // Combine native HLS subtitles and VTT subtitles
  const allSubtitles = useMemo(() => {
    const combined: any[] = [...vttSubtitles];
    hlsSubtitles.forEach((sub, index) => {
      combined.push({
        isNative: true,
        index: index,
        lang: sub.name || `Track ${index + 1}`
      });
    });
    return combined;
  }, [vttSubtitles, hlsSubtitles]);

  const getQualityLabel = (level: any) => {
    if (level.height) {
      if (level.height >= 2160) return "4K";
      if (level.height >= 1440) return "1440p";
      if (level.height >= 800) return "1080p";
      if (level.height >= 534) return "720p";
      if (level.height >= 360) return "480p";
      if (level.height >= 240) return "360p";
      return `${level.height}p`;
    }
    if (level.bitrate) {
      return `${Math.round(level.bitrate / 1000)} kbps`;
    }
    if (level.name) {
      return level.name;
    }
    return "Source";
  };

  const uniqueQualities = useMemo(() => {
    const unique: any[] = [];
    const seen = new Set();
    for (let i = qualities.length - 1; i >= 0; i--) {
      const label = getQualityLabel(qualities[i]);
      if (!seen.has(label)) {
        seen.add(label);
        unique.unshift({ index: i, label, height: qualities[i].height || 0, bitrate: qualities[i].bitrate || 0 });
      }
    }
    // Sort by height first, then bitrate
    return unique.sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);
  }, [qualities]);

  useEffect(() => {
    if (!videoRef.current || !activeSource) return;

    const safePlay = () => {
      if (videoRef.current) {
        if (isInParty && !isHost && !hasReceivedInitialSync && !pendingSyncPlay.current) {
           return;
        }
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name === 'NotAllowedError') {
              console.warn("Autoplay blocked by browser policy.");
              setIsPlaying(false);
            } else if (e.name === 'NotSupportedError') {
              console.warn("Play threw NotSupportedError. Ignoring to prevent premature failover:", e);
            } else if (e.name !== 'AbortError') {
              console.warn("Playback failed:", e);
            }
          });
        }
      }
    };

    if (activeSource.isM3U8 && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hlsConfig: any = {
        enableWorker: true,
        maxBufferLength: 30,
      };
      
      if (!isInParty && initialTime > 0) {
        hlsConfig.startPosition = initialTime;
      }
      
      const hls = new Hls(hlsConfig);
      hlsRef.current = hls;

      const streamUrl = activeSource.url;

      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setQualities(data.levels);
        setAudioTracks(hls.audioTracks || []);
        setCurrentAudioTrack(hls.audioTrack);

        let highestIndex = -1;
        let maxHeight = -1;
        let maxBitrate = -1;
        data.levels.forEach((level: any, index: number) => {
          if (level.height && level.height > maxHeight) {
            maxHeight = level.height;
            highestIndex = index;
            maxBitrate = level.bitrate || -1;
          } else if (level.height === maxHeight && level.bitrate && level.bitrate > maxBitrate) {
            highestIndex = index;
            maxBitrate = level.bitrate;
          }
        });
        
        if (highestIndex !== -1) {
          hls.currentLevel = highestIndex;
          setCurrentQualityIndex(highestIndex);
        }

        if (autoPlay) safePlay();
      });

      hls.on(Hls.Events.AUDIO_TRACK_LOADED, () => {
        setAudioTracks(hls.audioTracks || []);
        setCurrentAudioTrack(hls.audioTrack);
      });
      
      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (event, data) => {
        setCurrentAudioTrack(data.id);
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (event, data) => {
        setHlsSubtitles(data.subtitleTracks || []);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("HLS Network Error, attempting to recover...", data);
              
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
              console.warn("HLS Fatal Error, destroying player.", data);
              if (activeSourceIndex < sources.length - 1) {
                console.log(`Failing over to source index ${activeSourceIndex + 1}`);
                setActiveSourceIndex(activeSourceIndex + 1);
              } else {
                hls.destroy();
                setHasFatalError(true);
              }
              break;
          }
        }
      });
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      const streamUrl = activeSource.url;
      
      videoRef.current.src = streamUrl;
      if (autoPlay) safePlay();
    } else if (activeSource.isMP4) {
      videoRef.current.src = activeSource.url;
      
      videoRef.current.onloadedmetadata = () => {
        if (autoPlay) safePlay();
      };

      videoRef.current.onerror = (e) => {
        console.warn("Native video error, attempting to recover...", e);
        if (activeSourceIndex < sources.length - 1) {
          console.log(`Failing over to source index ${activeSourceIndex + 1}`);
          setActiveSourceIndex(activeSourceIndex + 1);
        } else {
          setHasFatalError(true);
        }
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = null;
        videoRef.current.onerror = null;
      }
    };
  }, [activeSource, autoPlay]);

  const togglePlay = () => {
    if (isBuffering) return; 

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
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = newMuted ? 0 : volume * 2;
      }
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
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      const p = (currentTime / duration) * 100;
      progressRef.current.value = (p || 0).toString();
      if (progressFillRef.current) progressFillRef.current.style.width = `${p || 0}%`;
      if (progressThumbRef.current) progressThumbRef.current.style.left = `${p || 0}%`;
      setCurrentTime(currentTime);
      setDuration(duration);

      if (onProgress && Math.abs(currentTime - lastProgressUpdate.current) > 10) {
        onProgress(currentTime, duration, !videoRef.current.paused);
        lastProgressUpdate.current = currentTime;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      if (isFinite(duration) && duration > 0) {
        const time = (val / 100) * duration;
        videoRef.current.currentTime = time;
        emitPartyAction('SEEK', time);
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
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : val * 2;
    } else if (videoRef.current) {
      videoRef.current.volume = Math.min(1, val * 2);
    }
    setIsMuted(val === 0);
  };

  const handleFastForward = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      if (isFinite(duration)) {
        const time = Math.min(videoRef.current.currentTime + 10, duration);
        videoRef.current.currentTime = time;
        emitPartyAction('SEEK', time);
      }
    }
  };

  const handleRewind = () => {
    if (videoRef.current) {
      const time = Math.max(videoRef.current.currentTime - 10, 0);
      videoRef.current.currentTime = time;
      emitPartyAction('SEEK', time);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      
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
          const newVolUp = Math.min(1, volume + 0.1);
          setVolume(newVolUp);
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = isMuted ? 0 : newVolUp * 2;
          } else if (videoRef.current) {
            videoRef.current.volume = Math.min(1, newVolUp * 2);
          }
          if (newVolUp > 0) setIsMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          const newVolDown = Math.max(0, volume - 0.1);
          setVolume(newVolDown);
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = isMuted ? 0 : newVolDown * 2;
          } else if (videoRef.current) {
            videoRef.current.volume = Math.min(1, newVolDown * 2);
          }
          if (newVolDown === 0) setIsMuted(true);
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

  const handleSubtitleChange = (globalIndex: number) => {
    setCurrentSubtitleIndex(globalIndex);
    
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'hidden';
      }
    }
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = -1;
    }

    if (globalIndex === -1) return;

    const selectedSub = allSubtitles[globalIndex];
    if (selectedSub?.isNative && hlsRef.current) {
      hlsRef.current.subtitleTrack = selectedSub.index;
    } else if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      if (tracks[globalIndex]) {
        tracks[globalIndex].mode = 'showing';
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

  const handleAudioTrackChange = (index: number) => {
    setCurrentAudioTrack(index);
    if (hlsRef.current) {
      hlsRef.current.audioTrack = index;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const canControl = !isInParty || isHost || (partySettings?.anyoneCanControl === true);

  useEffect(() => {
    let controlsTimeout: NodeJS.Timeout | undefined;
    let idleTimeout: NodeJS.Timeout | undefined;

    const resetIdle = () => {
      setIsIdle(false);
      clearTimeout(idleTimeout);
      if (!isPlaying) {
        idleTimeout = setTimeout(() => {
          setIsIdle(true);
        }, 5000);
      }
    };

    const handleMouseMove = () => {
      setShowControls(true);
      resetIdle();
      clearTimeout(controlsTimeout);
      controlsTimeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    if (!isPlaying) {
      resetIdle();
    } else {
      setIsIdle(false);
      clearTimeout(idleTimeout);
    }

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('click', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('click', handleMouseMove);
      }
      clearTimeout(controlsTimeout);
      clearTimeout(idleTimeout);
    };
  }, [isPlaying]);

  if (!sources || sources.length === 0 || hasFatalError) {
    return <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold tracking-widest text-sm uppercase">Currently Unavailable</div>;
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
        onError={(e) => {
          const error = videoRef.current?.error;
          if (error && error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
             if (activeSourceIndex < sources.length - 1) {
               setActiveSourceIndex(prev => prev + 1);
             } else {
               setHasFatalError(true);
             }
          }
        }}
        onPlay={() => {
          initAudio();
          setIsPlaying(true);
          emitPartyAction('PLAY', videoRef.current?.currentTime);
          if (onProgress && videoRef.current) {
            onProgress(videoRef.current.currentTime, videoRef.current.duration, true);
            lastProgressUpdate.current = videoRef.current.currentTime;
          }
        }}
        onPause={() => {
          setIsPlaying(false);
          setIsBuffering(false);
          emitPartyAction('PAUSE');
          if (onProgress && videoRef.current) {
            onProgress(videoRef.current.currentTime, videoRef.current.duration, false);
            lastProgressUpdate.current = videoRef.current.currentTime;
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (!isInParty && initialTime > 0 && videoRef.current) {
            
            if (!(activeSource?.isM3U8 && Hls.isSupported())) {
               videoRef.current.currentTime = initialTime;
            }
          }
          if (pendingSyncTime.current !== null && videoRef.current) {
             videoRef.current.currentTime = pendingSyncTime.current;
             if (pendingSyncPlay.current) {
               videoRef.current.play().catch(e => console.warn(e));
             }
             pendingSyncTime.current = null;
          }
        }}
        onClick={() => {
          if (canControl) togglePlay();
        }}
        playsInline
      >
        {}
        {/* Subtitles (Native fallback) */}
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

      {/* Waiting for Host Overlay */}
      {isInParty && !isHost && !hasReceivedInitialSync && (
        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
           <svg
             className="w-12 h-12 text-accent animate-spin mb-6"
             viewBox="0 0 24 24"
           >
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
           <h3 className="text-white font-bold tracking-widest uppercase text-lg mb-2">Waiting for Host</h3>
           <p className="text-white/50 text-sm">The movie will start automatically when the host begins playback.</p>
        </div>
      )}

      {}
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

      {}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-300 ${centerIndicator ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}
      >
        {centerIndicator && (
          <div className="flex items-center justify-center text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            {centerIndicator === 'play' ? <MdPlayArrow className="w-16 h-16 md:w-24 md:h-24" /> : <MdPause className="w-16 h-16 md:w-24 md:h-24" />}
          </div>
        )}
      </div>

      {/* Big Center Controls */}
      <div 
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-6 md:gap-12 z-30 transition-all duration-300 ${showControls && !isBuffering && canControl ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); handleRewind(); }}
          className="p-3 md:p-4 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all transform hover:scale-110 border border-white/5 shadow-xl"
        >
          <MdReplay10 className="w-8 h-8 md:w-12 md:h-12" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="p-4 md:p-5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all transform hover:scale-110 border border-white/5 shadow-xl"
        >
          {isPlaying ? <MdPause className="w-10 h-10 md:w-14 md:h-14" /> : <MdPlayArrow className="w-10 h-10 md:w-14 md:h-14" />}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleFastForward(); }}
          className="p-3 md:p-4 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all transform hover:scale-110 border border-white/5 shadow-xl"
        >
          <MdForward10 className="w-8 h-8 md:w-12 md:h-12" />
        </button>
      </div>

      {/* Idle Info Screen */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col justify-end p-8 md:p-16 transition-all duration-700 pointer-events-none ${isIdle && !isPlaying ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="max-w-3xl flex flex-col gap-4 transform transition-all duration-700 ease-out translate-y-0 opacity-100">
          {itemLogo ? (
            <img src={itemLogo} alt={itemTitle || "Logo"} className="h-24 md:h-32 object-contain object-left mb-2 drop-shadow-2xl" />
          ) : itemTitle ? (
            <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl mb-2">{itemTitle}</h2>
          ) : null}
          
          {itemMetadata && (
            <div className="flex items-center gap-3 text-white/70 text-sm md:text-base font-medium tracking-wide">
              {itemMetadata.split('•').map((part, i) => (
                <React.Fragment key={i}>
                  <span>{part.trim()}</span>
                  {i < itemMetadata.split('•').length - 1 && <span className="w-1.5 h-1.5 rounded-full bg-white/30" />}
                </React.Fragment>
              ))}
            </div>
          )}
          
          {itemDescription && (
            <p className="text-white/60 text-sm md:text-base line-clamp-3 leading-relaxed max-w-2xl mt-2 drop-shadow-md">
              {itemDescription}
            </p>
          )}

          <div className="flex items-center gap-3 mt-8 text-white/50 animate-pulse">
            <MdPlayArrow className="w-6 h-6" />
            <span className="text-sm tracking-widest uppercase font-bold">Click anywhere to resume video</span>
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-all duration-500 ease-out ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="w-full px-4 md:px-8 pb-4 md:pb-6 flex flex-col gap-3 md:gap-4">

          {}
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
            {}
            <div className="absolute left-0 right-0 h-1 md:h-1.5 bg-white/20 transition-all duration-300 group-hover/progress:h-1.5 md:group-hover/progress:h-2">
              {}
              <div
                ref={progressFillRef}
                className="absolute left-0 top-0 bottom-0 bg-accent pointer-events-none transition-all duration-75"
                style={{ width: '0%' }}
              />
            </div>
            {}
            <div
              ref={progressThumbRef}
              className="absolute h-3.5 w-3.5 md:h-4 md:w-4 bg-accent rounded-full pointer-events-none transition-all duration-300 scale-0 group-hover/progress:scale-100 opacity-0 group-hover/progress:opacity-100 shadow-md"
              style={{ left: '0%', transform: 'translateX(-50%)' }}
            />
          </div>

          {}
          <div className="flex items-center justify-between">
            {}
            <div className="flex items-center gap-2 md:gap-6">
              <button onClick={togglePlay} className="text-white hover:text-white transition-transform transform hover:scale-110" title="Play/Pause">
                {isPlaying ? <MdPause className="w-6 h-6 md:w-8 md:h-8" /> : <MdPlayArrow className="w-6 h-6 md:w-8 md:h-8" />}
              </button>
              <button onClick={handleRewind} className="relative text-white/90 hover:text-white transition-all flex items-center justify-center transform hover:scale-110" title="Rewind 10s">
                <MdReplay10 className="w-6 h-6 md:w-7 md:h-7" />
              </button>
              <button onClick={handleFastForward} className="relative text-white/90 hover:text-white transition-all flex items-center justify-center transform hover:scale-110" title="Fast Forward 10s">
                <MdForward10 className="w-6 h-6 md:w-7 md:h-7" />
              </button>

              {}
              <div className="flex items-center gap-2 group/volume relative hidden sm:flex">
                <button onClick={toggleMute} className="text-white/90 hover:text-white transition-colors transform hover:scale-110" title="Mute/Unmute">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
                </button>
                <div className="w-0 overflow-hidden transition-all duration-300 ease-out group-hover/volume:w-24 opacity-0 group-hover/volume:opacity-100 flex items-center h-6">
                  {}
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
                    {}
                    <div className="absolute left-0 right-0 h-1 md:h-1.5 bg-white/20 rounded-full">
                      {}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-accent rounded-full pointer-events-none transition-all duration-75"
                        style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                      />
                    </div>
                    {}
                    <div
                      className="absolute h-3 w-3 md:h-3.5 md:w-3.5 bg-accent rounded-full pointer-events-none shadow-md transition-all duration-75"
                      style={{ left: `${(isMuted ? 0 : volume) * 100}%`, transform: 'translateX(-50%)' }}
                    />
                  </div>
                </div>
              </div>

              {}
              <div className="text-white/90 text-xs md:text-sm font-medium tracking-wide">
                {formatTime(currentTime)} <span className="text-white/50 mx-1">/</span> {formatTime(duration)}
              </div>
            </div>

            {}
            <div className="flex items-center gap-2 md:gap-6">
              {}
              {allSubtitles.length > 0 && (
                <div className="relative">
                  <button 
                    onClick={() => { setShowSubtitlesMenu(!showSubtitlesMenu); setShowSettings(false); }} 
                    className={`transition-all transform hover:scale-110 ${showSubtitlesMenu ? 'text-white' : currentSubtitleIndex !== -1 ? 'text-accent' : 'text-white/90 hover:text-white'}`} 
                    title="Captions"
                  >
                    <MdSubtitles className="w-6 h-6 md:w-7 md:h-7" />
                  </button>

                  {showSubtitlesMenu && (
                    <div className="absolute bottom-full right-[-20px] md:right-[-30px] mb-6 w-56 bg-[rgba(20,20,20,0.9)] backdrop-blur-xl rounded-md overflow-hidden shadow-2xl flex flex-col origin-bottom animate-in fade-in duration-200 z-50">
                      <div className="px-4 py-3 border-b border-white/10 shrink-0">
                        <span className="text-[11px] font-bold tracking-wider text-white uppercase">Captions</span>
                      </div>
                      <div className="flex flex-col py-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
                        <button
                          onClick={() => { handleSubtitleChange(-1); setShowSubtitlesMenu(false); }}
                          className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${currentSubtitleIndex === -1 ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                        >
                          Off
                        </button>
                        {allSubtitles.map((sub: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => { handleSubtitleChange(i); setShowSubtitlesMenu(false); }}
                            className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${currentSubtitleIndex === i ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                          >
                            {sub.lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {}
              <div className="relative">
                <button
                  onClick={() => { setShowSettings(!showSettings); setShowSubtitlesMenu(false); }}
                  className={`transition-all transform hover:scale-110 ${showSettings ? 'text-white rotate-90' : 'text-white/90 hover:text-white'}`}
                  title="Settings"
                >
                  <MdSettings className="w-6 h-6 md:w-7 md:h-7" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-6 w-60 bg-[rgba(20,20,20,0.9)] backdrop-blur-xl rounded-md overflow-hidden shadow-2xl flex flex-col origin-bottom-right animate-in fade-in duration-200 z-50">
                    
                    {settingsView === 'main' && (
                      <div className="flex flex-col py-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                        <div className="px-4 py-1.5 mt-1 shrink-0">
                          <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase">Sources</span>
                        </div>
                        <button
                          onClick={() => setSettingsView('quality')}
                          className="flex items-center justify-between px-4 py-2.5 text-sm transition-all hover:bg-white/10 text-white/90"
                        >
                          <span>Quality</span>
                          <span className="text-white/50 text-xs truncate max-w-[100px]">{currentQualityIndex === -1 ? 'Auto' : uniqueQualities.find(q => q.index === currentQualityIndex)?.label} &gt;</span>
                        </button>
                        <button
                          onClick={() => setSettingsView('source')}
                          className="flex items-center justify-between px-4 py-2.5 text-sm transition-all hover:bg-white/10 text-white/90"
                        >
                          <span>Server</span>
                          <span className="text-white/50 text-xs truncate max-w-[100px]">{sources[activeSourceIndex]?.serverName || `Server ${activeSourceIndex + 1}`} &gt;</span>
                        </button>

                        <div className="px-4 py-1.5 mt-2 border-t border-white/10 shrink-0 pt-3">
                          <span className="text-[10px] font-bold tracking-wider text-white/40 uppercase">Video & Audio</span>
                        </div>
                        <button
                          onClick={() => setSettingsView('speed')}
                          className="flex items-center justify-between px-4 py-2.5 text-sm transition-all hover:bg-white/10 text-white/90"
                        >
                          <span>Speed</span>
                          <span className="text-white/50 text-xs">{playbackRate}x &gt;</span>
                        </button>
                        
                        {audioTracks.length > 1 && (
                          <button
                            onClick={() => setSettingsView('audio')}
                            className="flex items-center justify-between px-4 py-2.5 text-sm transition-all hover:bg-white/10 text-white/90"
                          >
                            <span>Audio</span>
                            <span className="text-white/50 text-xs truncate max-w-[100px]">{audioTracks[currentAudioTrack]?.name || `Track ${currentAudioTrack + 1}`} &gt;</span>
                          </button>
                        )}
                      </div>
                    )}

                    {settingsView === 'source' && (
                      <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
                        <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
                          <button onClick={() => setSettingsView('main')} className="text-white/70 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                          <span className="text-[11px] font-bold tracking-wider text-white uppercase">Source</span>
                        </div>
                        <div className="flex flex-col py-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
                          {sources.map((src, i) => (
                            <button
                              key={i}
                              onClick={() => { setActiveSourceIndex(i); setShowSettings(false); setSettingsView('main'); }}
                              className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${activeSourceIndex === i ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                            >
                              {src.serverName || `Server ${i + 1}`}
                              {src.language && (
                                <span className="ml-2 text-xs font-normal opacity-75">[{src.language}]</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {settingsView === 'quality' && (
                      <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
                        <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
                          <button onClick={() => setSettingsView('main')} className="text-white/70 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                          <span className="text-[11px] font-bold tracking-wider text-white uppercase">Video Quality</span>
                        </div>
                        <div className="flex flex-col py-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
                          <button
                            onClick={() => { handleQualityChange({ target: { value: -1 } } as any); setShowSettings(false); setSettingsView('main'); }}
                            className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${currentQualityIndex === -1 ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                          >
                            Auto
                          </button>
                          {uniqueQualities.map((level) => (
                            <button
                              key={level.index}
                              onClick={() => { handleQualityChange({ target: { value: level.index } } as any); setShowSettings(false); setSettingsView('main'); }}
                              className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${currentQualityIndex === level.index ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                            >
                              {level.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {settingsView === 'audio' && (
                      <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
                        <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
                          <button onClick={() => setSettingsView('main')} className="text-white/70 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                          <span className="text-[11px] font-bold tracking-wider text-white uppercase">Audio Track</span>
                        </div>
                        <div className="flex flex-col py-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
                          {audioTracks.map((track, i) => (
                            <button
                              key={i}
                              onClick={() => { handleAudioTrackChange(i); setShowSettings(false); setSettingsView('main'); }}
                              className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${currentAudioTrack === i ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                            >
                              {track.name || `Audio Track ${i + 1}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {settingsView === 'speed' && (
                      <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
                        <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
                          <button onClick={() => setSettingsView('main')} className="text-white/70 hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
                          <span className="text-[11px] font-bold tracking-wider text-white uppercase">Speed</span>
                        </div>
                        <div className="flex flex-col py-2 max-h-[30vh] overflow-y-auto custom-scrollbar">
                          {[0.5, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => { handleSpeedChange(speed); setShowSettings(false); setSettingsView('main'); }}
                              className={`text-left px-6 py-2.5 text-sm transition-all hover:bg-white/10 ${playbackRate === speed ? 'text-accent bg-white/10 font-bold' : 'text-white/70'}`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {sources.length <= 1 && uniqueQualities.length <= 1 && audioTracks.length <= 1 && settingsView !== 'main' && (
                      <div className="px-6 py-4 text-sm text-white/50 text-center">
                        No additional settings
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
