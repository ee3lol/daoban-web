import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import Hls from 'hls.js';
import { Socket } from 'socket.io-client';

export interface Subtitle {
  lang: string;
  url: string;
  format: string;
}

export interface VideoSource {
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

interface PlayerContextProps {
  // Refs
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hlsRef: React.MutableRefObject<Hls | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  
  // Player State
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  currentTime: number;
  setCurrentTime: (val: number) => void;
  duration: number;
  setDuration: (val: number) => void;
  isBuffering: boolean;
  setIsBuffering: (val: boolean) => void;
  volume: number;
  setVolume: (val: number) => void;
  isMuted: boolean;
  setIsMuted: (val: boolean) => void;
  playbackRate: number;
  setPlaybackRate: (val: number) => void;
  isFullscreen: boolean;
  setIsFullscreen: (val: boolean) => void;
  
  // UI State
  showControls: boolean;
  setShowControls: (val: boolean) => void;
  isIdle: boolean;
  setIsIdle: (val: boolean) => void;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  settingsView: 'main' | 'source' | 'quality' | 'audio' | 'speed' | 'audioType' | 'subtitles';
  setSettingsView: (val: 'main' | 'source' | 'quality' | 'audio' | 'speed' | 'audioType' | 'subtitles') => void;
  
  // Sources & Settings
  sources: VideoSource[];
  activeSourceIndex: number;
  setActiveSourceIndex: (val: number) => void;
  qualities: any[];
  setQualities: (val: any[]) => void;
  currentQualityIndex: number;
  setCurrentQualityIndex: (val: number) => void;
  audioTracks: any[];
  setAudioTracks: (val: any[]) => void;
  currentAudioTrack: number;
  setCurrentAudioTrack: (val: number) => void;
  backendAudioTrack: string;
  setBackendAudioTrack: (val: string) => void;
  hlsSubtitles: any[];
  setHlsSubtitles: (val: any[]) => void;
  currentSubtitleIndex: number;
  setCurrentSubtitleIndex: (val: number) => void;

  // Party Sync
  isInParty?: boolean;
  isHost?: boolean;
  socket?: Socket | null;
  partyId?: string;
  hasReceivedInitialSync: boolean;
  setHasReceivedInitialSync: (val: boolean) => void;
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const PlayerProvider = ({ 
  children, 
  sources,
  isInParty,
  isHost,
  socket,
  partyId
}: { 
  children: ReactNode,
  sources: VideoSource[],
  isInParty?: boolean,
  isHost?: boolean,
  socket?: Socket | null,
  partyId?: string
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [showControls, setShowControls] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsView, setSettingsView] = useState<'main' | 'source' | 'quality' | 'audio' | 'speed' | 'audioType' | 'subtitles'>('main');

  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const [qualities, setQualities] = useState<any[]>([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState(-1);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [currentAudioTrack, setCurrentAudioTrack] = useState(-1);
  const [backendAudioTrack, setBackendAudioTrack] = useState("1");
  const [hlsSubtitles, setHlsSubtitles] = useState<any[]>([]);
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);

  const [hasReceivedInitialSync, setHasReceivedInitialSync] = useState(false);

  return (
    <PlayerContext.Provider
      value={{
        videoRef,
        hlsRef,
        containerRef,
        isPlaying, setIsPlaying,
        currentTime, setCurrentTime,
        duration, setDuration,
        isBuffering, setIsBuffering,
        volume, setVolume,
        isMuted, setIsMuted,
        playbackRate, setPlaybackRate,
        isFullscreen, setIsFullscreen,
        showControls, setShowControls,
        isIdle, setIsIdle,
        showSettings, setShowSettings,
        settingsView, setSettingsView,
        sources,
        activeSourceIndex, setActiveSourceIndex,
        qualities, setQualities,
        currentQualityIndex, setCurrentQualityIndex,
        audioTracks, setAudioTracks,
        currentAudioTrack, setCurrentAudioTrack,
        backendAudioTrack, setBackendAudioTrack,
        hlsSubtitles, setHlsSubtitles,
        currentSubtitleIndex, setCurrentSubtitleIndex,
        isInParty, isHost, socket, partyId,
        hasReceivedInitialSync, setHasReceivedInitialSync
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
