/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { PlayerProvider, usePlayer } from '../contexts/PlayerContext';
import { PlayerOverlay } from './player/PlayerOverlay';
import { PlayerGestures } from './player/PlayerGestures';
import { PlayerControls } from './player/PlayerControls';

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
  audioType?: string;
  audioTracks?: string[];
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
  canControlParty?: boolean;
  isHostPresent?: boolean;
  partySettings?: { anyoneCanControl: boolean };
  userId?: string;
}

const PlayerInner = ({ autoPlay, initialTime, onProgress, canControlParty = true }: any) => {
  const {
    videoRef, containerRef, hlsRef,
    sources, activeSourceIndex, setActiveSourceIndex, backendAudioTrack,
    setQualities, setAudioTracks, setCurrentAudioTrack, setHlsSubtitles, setCurrentQualityIndex, setCurrentSubtitleIndex,
    isPlaying, setIsPlaying, currentTime, setCurrentTime, duration, setDuration,
    setIsBuffering, volume, setVolume, isMuted, setIsMuted, playbackRate,
    socket, partyId, isInParty, isHost, hasReceivedInitialSync, setHasReceivedInitialSync, setIsFullscreen
  } = usePlayer();

  const activeSource = sources[activeSourceIndex];
  const canControl = !isInParty || canControlParty;
  const pendingSyncTime = useRef<number | null>(null);
  const pendingSyncPlay = useRef<boolean>(false);
  const gainNodeRef = useRef<GainNode | null>(null); // For volume logic
  const isRemoteAction = useRef<boolean>(false);
  const [serverFailed, setServerFailed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [hasFatalError, setHasFatalError] = useState(false);
  const lastProgressUpdate = useRef(0);

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
          }
        });
      }
    }
  };

    useEffect(() => {
    if (!socket || !isInParty || !partyId) return;

    const handleStateUpdate = (state: any) => {
      if (!videoRef.current) return;

      setHasReceivedInitialSync(true);

      const expectedTime = state.time;

      const drift = Math.abs(videoRef.current.currentTime - expectedTime);

      let actionTaken = false;
      try {
        if (drift > 1.5) {
          // If we just loaded the video, it might not be ready yet
          if (videoRef.current.readyState >= 1) {
            actionTaken = true;
            isRemoteAction.current = true;
            videoRef.current.currentTime = expectedTime;
          } else {
            pendingSyncTime.current = expectedTime;
            pendingSyncPlay.current = state.isPlaying;
          }
        }

        if (videoRef.current.readyState >= 1) {
          if (state.isPlaying && videoRef.current.paused) {
            actionTaken = true;
            isRemoteAction.current = true;
            videoRef.current.play().catch(e => console.warn("Remote play blocked:", e));
          } else if (!state.isPlaying && !videoRef.current.paused) {
            actionTaken = true;
            isRemoteAction.current = true;
            videoRef.current.pause();
          }
        }
      } catch (err) {
        console.error("Party sync error", err);
      }

      if (actionTaken) {
        if ((window as any).remoteActionTimeout) clearTimeout((window as any).remoteActionTimeout);
        (window as any).remoteActionTimeout = setTimeout(() => { isRemoteAction.current = false; }, 3000);
      }
    };

    socket.on("party_state_update", handleStateUpdate);
    socket.emit("request_party_state", partyId);

    const syncInterval = setInterval(() => {
      socket.emit("request_party_state", partyId);
    }, 5000);

    return () => {
      socket.off("party_state_update", handleStateUpdate);
      clearInterval(syncInterval);
    };
  }, [socket, isInParty, partyId]);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);

    useEffect(() => {
    let timer: NodeJS.Timeout;
    if (serverFailed && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (serverFailed && countdown === 0) {
      setServerFailed(false);
      setActiveSourceIndex(activeSourceIndex + 1);
    }
    return () => clearTimeout(timer);
  }, [serverFailed, countdown]);

    useEffect(() => {
      setActiveSourceIndex(0);
    }, [sources]);

    useEffect(() => {
      setIsBuffering(false);
      setHasFatalError(false);
      setCurrentQualityIndex(-1);
      setCurrentSubtitleIndex(-1);
    }, [activeSourceIndex, sources]);

    const isPlayingRef = useRef(isPlaying);
    useEffect(() => {
      isPlayingRef.current = isPlaying;
    }, [isPlaying]);

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
      let finalStreamUrl = streamUrl;
      if (activeSource.audioTracks && activeSource.audioTracks.length > 0 && backendAudioTrack !== "1") {
         finalStreamUrl = streamUrl + (streamUrl.includes('?') ? '&' : '?') + 'audioTrack=' + backendAudioTrack;
      }

      hls.loadSource(finalStreamUrl);
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

        if (autoPlay || isPlayingRef.current) safePlay();
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
                setServerFailed(true);
                setCountdown(5);
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
                setServerFailed(true);
                setCountdown(5);
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
          setServerFailed(true);
          setCountdown(5);
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

    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(
          !!document.fullscreenElement || 
          !!(document as any).webkitFullscreenElement ||
          !!(videoRef.current as any)?.webkitDisplayingFullscreen
        );
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      if (videoRef.current) {
        videoRef.current.addEventListener('webkitendfullscreen', handleFullscreenChange);
        videoRef.current.addEventListener('webkitbeginfullscreen', handleFullscreenChange);
      }

      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        if (videoRef.current) {
          videoRef.current.removeEventListener('webkitendfullscreen', handleFullscreenChange);
          videoRef.current.removeEventListener('webkitbeginfullscreen', handleFullscreenChange);
        }
      };
    }, [setIsFullscreen, videoRef]);

    useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'f':
          if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => console.error(err));
          } else {
            document.exitFullscreen();
          }
          break;
        case 'm':
          if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
          }
          break;
        case ' ':
        case 'k':
          e.preventDefault();
          if (canControl && videoRef.current) {
            if (isPlaying) {
              videoRef.current.pause();
              socket?.emit("party_pause", { partyId, time: videoRef.current.currentTime });
            } else {
              videoRef.current.play();
              socket?.emit("party_play", { partyId, time: videoRef.current.currentTime });
            }
          }
          break;
        case 'arrowleft':
        case 'j':
          if (canControl && videoRef.current) {
            const newTime = Math.max(0, videoRef.current.currentTime - 10);
            videoRef.current.currentTime = newTime;
            socket?.emit("party_seek", { partyId, time: newTime });
          }
          break;
        case 'arrowright':
        case 'l':
          if (canControl && videoRef.current) {
            const newTime = Math.min(duration, videoRef.current.currentTime + 10);
            videoRef.current.currentTime = newTime;
            socket?.emit("party_seek", { partyId, time: newTime });
          }
          break;
        case 'arrowup':
          e.preventDefault();
          const newVolUp = Math.min(1, volume + 0.1);
          setVolume(newVolUp);
          if (videoRef.current) videoRef.current.volume = newVolUp;
          if (newVolUp > 0) setIsMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          const newVolDown = Math.max(0, volume - 0.1);
          setVolume(newVolDown);
          if (videoRef.current) videoRef.current.volume = newVolDown;
          if (newVolDown === 0) setIsMuted(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume, canControl, duration, socket, partyId, setVolume, setIsMuted]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black group overflow-hidden touch-none select-none">
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        playsInline
        onError={(e) => {
          const error = videoRef.current?.error;
          if (error && error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            if (activeSourceIndex < sources.length - 1) {
              setActiveSourceIndex(activeSourceIndex + 1);
            } else {
              setHasFatalError(true);
            }
          }
        }}
        onPlay={() => {
          if (!canControl && !isRemoteAction.current) {
            videoRef.current?.pause();
            return;
          }
          setIsPlaying(true);
          if (socket && isInParty && !isRemoteAction.current) {
            socket.emit('party_play', { partyId, time: videoRef.current?.currentTime });
          }
          if (onProgress && videoRef.current) {
             onProgress(videoRef.current.currentTime, videoRef.current.duration, true);
             lastProgressUpdate.current = videoRef.current.currentTime;
          }
        }}
        onPause={() => {
          if (!canControl && !isRemoteAction.current) {
            videoRef.current?.play().catch(() => { });
            return;
          }
          setIsPlaying(false);
          setIsBuffering(false);
          if (socket && isInParty && !isRemoteAction.current) {
            socket.emit('party_pause', { partyId, time: videoRef.current?.currentTime });
          }
          if (onProgress && videoRef.current) {
             onProgress(videoRef.current.currentTime, videoRef.current.duration, false);
             lastProgressUpdate.current = videoRef.current.currentTime;
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          if (canControl && !isRemoteAction.current && socket && isInParty) {
            socket.emit('party_play', { partyId, time: videoRef.current?.currentTime });
          }
        }}
        onCanPlay={() => setIsBuffering(false)}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration);
            if (onProgress && Math.abs(videoRef.current.currentTime - lastProgressUpdate.current) > 10) {
              onProgress(videoRef.current.currentTime, videoRef.current.duration, !videoRef.current.paused);
              lastProgressUpdate.current = videoRef.current.currentTime;
            }
          }
        }}
        onLoadedMetadata={() => {
          if (!isInParty && initialTime > 0 && videoRef.current) {
            if (!(activeSource?.isM3U8 && Hls.isSupported())) {
              videoRef.current.currentTime = initialTime;
            }
          }
          if (pendingSyncTime.current !== null && videoRef.current) {
            isRemoteAction.current = true;
            videoRef.current.currentTime = pendingSyncTime.current;
            if (pendingSyncPlay.current) {
              videoRef.current.play().catch(e => console.warn(e));
            }
            pendingSyncTime.current = null;
            if ((window as any).remoteActionTimeout) clearTimeout((window as any).remoteActionTimeout);
            (window as any).remoteActionTimeout = setTimeout(() => { isRemoteAction.current = false; }, 3000);
          }
        }}
      >
        {activeSource?.subtitles?.filter((sub: any) => sub.format === 'vtt' || sub.url.endsWith('.vtt')).map((sub: any, i: number) => (
          <track
            key={i}
            kind="captions"
            label={sub.lang}
            src={`/api/proxy?url=${encodeURIComponent(sub.url)}`}
            srcLang={sub.lang.substring(0, 2).toLowerCase()}
          />
        ))}
      </video>
      <PlayerOverlay>
        <PlayerGestures />
        <PlayerControls />
      </PlayerOverlay>
    </div>
  );
};

export default function CustomVideoPlayer(props: CustomVideoPlayerProps) {
  return (
    <PlayerProvider 
      sources={props.sources} 
      isInParty={props.isInParty} 
      isHost={props.isHost} 
      socket={props.socket} 
      partyId={props.partyId ?? undefined}
    >
      <PlayerInner {...props} />
    </PlayerProvider>
  );
}
