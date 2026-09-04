import React, { useMemo, useState } from 'react';
import { Volume2, VolumeX, ChevronLeft, Monitor, Server, Subtitles as SubtitlesIcon, Headphones, Users, Moon, Gauge, Settings2, CheckCircle2, Music, Upload, Search, ChevronRight, Languages } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';

export const PlayerSettings = () => {
  const {
    videoRef,
    hlsRef,
    sources,
    activeSourceIndex,
    setActiveSourceIndex,
    qualities,
    currentQualityIndex,
    setCurrentQualityIndex,
    audioTracks,
    currentAudioTrack,
    setCurrentAudioTrack,
    backendAudioTrack,
    setBackendAudioTrack,
    hlsSubtitles,
    currentSubtitleIndex,
    setCurrentSubtitleIndex,
    playbackRate,
    setPlaybackRate,
    settingsView,
    setSettingsView,
    setShowSettings
  } = usePlayer();

  const [subtitleSearch, setSubtitleSearch] = useState('');
  const [subtitleGroupView, setSubtitleGroupView] = useState<string | null>(null);

  const activeSource = sources[activeSourceIndex];

  // Helpers
  const getQualityLabel = (level: any) => {
    if (!level) return 'Auto';
    if (level.height >= 2160) return '4K';
    if (level.height >= 1440) return '1440p';
    if (level.height >= 1080) return '1080p';
    if (level.height >= 720) return '720p';
    if (level.height >= 480) return '480p';
    if (level.height >= 360) return '360p';
    return `${level.height}p`;
  };

  const getAudioTrackLabel = (track: any, index: number) => {
    return track.name || `Audio Track ${index + 1}`;
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
    return unique.sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);
  }, [qualities]);

  const getFlagForLang = (lang: string) => {
    const l = lang.toLowerCase();
    if (l.includes('eng')) return '🇺🇸';
    if (l.includes('ara')) return '🇸🇦';
    if (l.includes('bul')) return '🇧🇬';
    if (l.includes('ban')) return '🇮🇳';
    if (l.includes('cze')) return '🇨🇿';
    if (l.includes('dan')) return '🇩🇰';
    if (l.includes('ger')) return '🇩🇪';
    if (l.includes('gre')) return '🇬🇷';
    if (l.includes('spa')) return '🇪🇸';
    if (l.includes('fre') || l.includes('fra')) return '🇫🇷';
    if (l.includes('ita')) return '🇮🇹';
    if (l.includes('jap') || l.includes('jpn')) return '🇯🇵';
    if (l.includes('kor')) return '🇰🇷';
    if (l.includes('por')) return '🇵🇹';
    if (l.includes('rus')) return '🇷🇺';
    if (l.includes('chi') || l.includes('zho')) return '🇨🇳';
    return '🏳️';
  };

  const groupedSubtitles = useMemo(() => {
    const groups: Record<string, { originalIndex: number; sub: any }[]> = {};
    const all = activeSource?.subtitles && activeSource.subtitles.length > 0 ? activeSource.subtitles : hlsSubtitles;

    all.forEach((sub, i) => {
      let lang = sub.lang;
      const match = lang.match(/^(.*?)(?:\s*\(\d+\))?$/);
      if (match) lang = match[1].trim();
      lang = lang.charAt(0).toUpperCase() + lang.slice(1);

      if (!groups[lang]) groups[lang] = [];
      groups[lang].push({ originalIndex: i, sub });
    });
    return groups;
  }, [activeSource?.subtitles, hlsSubtitles]);

  // Handlers
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

    if (activeSource?.subtitles && activeSource.subtitles.length > 0) {
      if (videoRef.current) {
        const tracks = videoRef.current.textTracks;
        const targetLabel = activeSource.subtitles[globalIndex].lang;
        for (let i = 0; i < tracks.length; i++) {
          if (tracks[i].label === targetLabel) {
            tracks[i].mode = 'showing';
            break;
          }
        }
      }
    } else if (hlsRef.current) {
      hlsRef.current.subtitleTrack = globalIndex;
    }
  };

  const handleQualityChange = (index: number) => {
    setCurrentQualityIndex(index);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
    }
  };

  const handleAudioTrackChange = (index: number) => {
    if (activeSource?.audioTracks && activeSource.audioTracks.length > 0) {
      setBackendAudioTrack(activeSource.audioTracks[index]);
      return;
    }
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

  // UI Render
  return (
    <div
      className="absolute bottom-full right-0 mb-4 md:mb-6 w-full md:w-80 bg-[rgba(25,25,25,0.9)] md:bg-[rgba(25,25,25,0.6)] backdrop-blur-3xl border-t md:border border-white/10 md:rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col origin-bottom-right animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300 z-50 fixed md:absolute bottom-0 left-0 right-0 md:left-auto max-h-[80vh] md:max-h-none rounded-t-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {settingsView === 'main' && (
        <div className="flex flex-col py-4 px-4 max-h-[60vh] overflow-y-auto custom-scrollbar gap-4">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setSettingsView('source')}
              className="flex items-center justify-between px-3 py-2.5 text-sm transition-all hover:bg-white/5 text-[#EAE8E3] rounded-lg mx-1 group"
            >
              <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-[#888888] group-hover:text-[#EAE8E3] transition-colors" />
                <span>Source</span>
              </div>
              <div className="flex items-center gap-2 text-[#888888]">
                <span className="text-xs font-semibold uppercase">{activeSource?.serverName?.replace(/Vidking - /i, '') || 'Unknown'}</span>
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </div>
            </button>

            <button
              onClick={() => setSettingsView('quality')}
              className={`flex items-center justify-between px-3 py-2.5 text-sm transition-all hover:bg-white/5 text-[#EAE8E3] rounded-lg mx-1 group ${qualities.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={qualities.length === 0}
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-[#888888] group-hover:text-[#EAE8E3] transition-colors" />
                <span>Quality</span>
              </div>
              <div className="flex items-center gap-2 text-[#888888]">
                <span className="text-xs font-semibold">{currentQualityIndex === -1 ? 'Auto' : getQualityLabel(qualities[currentQualityIndex])}</span>
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </div>
            </button>

            <button
              onClick={() => setSettingsView('audio')}
              className={`flex items-center justify-between px-3 py-2.5 text-sm transition-all hover:bg-white/5 text-[#EAE8E3] rounded-lg mx-1 group ${audioTracks.length <= 1 && (!activeSource?.audioTracks || activeSource.audioTracks.length <= 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={audioTracks.length <= 1 && (!activeSource?.audioTracks || activeSource.audioTracks.length <= 1)}
            >
              <div className="flex items-center gap-3">
                <Headphones className="w-4 h-4 text-[#888888] group-hover:text-[#EAE8E3] transition-colors" />
                <span>Audio Track</span>
              </div>
              <ChevronLeft className="w-4 h-4 rotate-180 text-[#888888]" />
            </button>

            <button
              onClick={() => setSettingsView('speed')}
              className="flex items-center justify-between px-3 py-2.5 text-sm transition-all hover:bg-white/5 text-[#EAE8E3] rounded-lg mx-1 group"
            >
              <div className="flex items-center gap-3">
                <Gauge className="w-4 h-4 text-[#888888] group-hover:text-[#EAE8E3] transition-colors" />
                <span>Playback Speed</span>
              </div>
              <div className="flex items-center gap-2 text-[#888888]">
                <span className="text-xs font-semibold">{playbackRate === 1 ? 'Normal' : `${playbackRate}x`}</span>
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </div>
            </button>

            <button
              onClick={() => setSettingsView('subtitles')}
              className="flex items-center justify-between px-3 py-2.5 text-sm transition-all hover:bg-white/5 text-[#EAE8E3] rounded-lg mx-1 group"
            >
              <div className="flex items-center gap-3">
                <Settings2 className="w-4 h-4 text-[#888888] group-hover:text-[#EAE8E3] transition-colors" />
                <span>Subtitles</span>
              </div>
              <ChevronLeft className="w-4 h-4 rotate-180 text-[#888888]" />
            </button>
          </div>
        </div>
      )}

      {settingsView === 'source' && (
        <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
          <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
            <button onClick={() => setSettingsView('main')} className="text-[#888888] hover:text-[#EAE8E3] transition-colors p-2 -ml-2"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-[12px] font-bold tracking-wider text-[#EAE8E3] uppercase">Source</span>
          </div>
          <div className="flex flex-col py-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {sources.map((src, i) => {
              const isActive = i === activeSourceIndex;
              const lowerName = src.serverName.toLowerCase();
              let flag = '🏳️';
              if (lowerName.includes('lisbon')) flag = '🇺🇸';
              else if (lowerName.includes('nebula') || lowerName.includes('solara') || lowerName.includes('joy') || lowerName.includes('castle')) flag = '🇺🇸';
              else if (lowerName.includes('sakura') || lowerName.includes('japan')) flag = '🇯🇵';
              else if (lowerName.includes('canaias') || lowerName.includes('brazil')) flag = '🇧🇷';
              else if (lowerName.includes('athens') || lowerName.includes('greece')) flag = '🇬🇷';

              const cleanName = src.serverName.replace(/Vidking - /i, '') || `Server ${i + 1}`;

              return (
                <button
                  key={i}
                  onClick={() => { setActiveSourceIndex(i); setShowSettings(false); setSettingsView('main'); }}
                  className="flex items-center gap-4 px-6 py-3 transition-all hover:bg-white/5 w-full group"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${isActive ? 'bg-accent shadow-[0_0_8px_var(--color-accent)]' : 'bg-white/20 group-hover:bg-white/30'}`}></div>
                  <span className="text-[18px] leading-none">{flag}</span>
                  <span className={`text-[15px] flex-1 text-left transition-colors ${isActive ? 'text-[#EAE8E3] font-semibold' : 'text-[#888888] group-hover:text-[#AAAAAA]'}`}>
                    {cleanName}
                  </span>
                  {isActive && <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {settingsView === 'quality' && (
        <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
          <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
            <button onClick={() => setSettingsView('main')} className="text-[#888888] hover:text-[#EAE8E3] transition-colors p-2 -ml-2"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-[12px] font-bold tracking-wider text-[#EAE8E3] uppercase">Quality</span>
          </div>
          <div className="flex flex-col py-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => { handleQualityChange(-1); setShowSettings(false); setSettingsView('main'); }}
              className="flex items-center justify-between px-6 py-3 text-sm transition-all hover:bg-white/5 w-full group"
            >
              <span className="text-[#EAE8E3] text-[15px]">Auto</span>
              {currentQualityIndex === -1 && <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />}
            </button>
            {uniqueQualities.map((level) => (
              <button
                key={level.index}
                onClick={() => { handleQualityChange(level.index); setShowSettings(false); setSettingsView('main'); }}
                className="flex items-center justify-between px-6 py-3 text-sm transition-all hover:bg-white/5 w-full group"
              >
                <span className="text-[#EAE8E3] text-[15px]">{level.label}</span>
                {currentQualityIndex === level.index && <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {settingsView === 'audio' && (
        <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
          <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
            <button onClick={() => setSettingsView('main')} className="text-[#888888] hover:text-[#EAE8E3] transition-colors p-2 -ml-2"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-[12px] font-bold tracking-wider text-[#EAE8E3] uppercase">Audio Track</span>
          </div>
          <div className="flex flex-col py-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {activeSource?.audioTracks ? (
              activeSource.audioTracks.map((track: string, i: number) => (
                <button
                  key={i}
                  onClick={() => { handleAudioTrackChange(i); setShowSettings(false); setSettingsView('main'); }}
                  className="flex items-center justify-between px-6 py-3 text-sm transition-all hover:bg-white/5 w-full group"
                >
                  <div className="flex items-center gap-4">
                    <Music className="w-5 h-5 text-[#888888] group-hover:text-[#EAE8E3]" />
                    <span className="text-[#EAE8E3] text-[15px]">Track {track}</span>
                  </div>
                  {backendAudioTrack === track && <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />}
                </button>
              ))
            ) : (
              audioTracks.map((track, i) => (
                <button
                  key={i}
                  onClick={() => { handleAudioTrackChange(i); setShowSettings(false); setSettingsView('main'); }}
                  className="flex items-center justify-between px-6 py-3 text-sm transition-all hover:bg-white/5 w-full group"
                >
                  <div className="flex items-center gap-4">
                    <Music className="w-5 h-5 text-[#888888] group-hover:text-[#EAE8E3]" />
                    <span className="text-[#EAE8E3] text-[15px]">{getAudioTrackLabel(track, i)}</span>
                  </div>
                  {currentAudioTrack === i && <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {settingsView === 'speed' && (
        <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
          <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
            <button onClick={() => setSettingsView('main')} className="text-[#888888] hover:text-[#EAE8E3] transition-colors p-2 -ml-2"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-[12px] font-bold tracking-wider text-[#EAE8E3] uppercase">Speed</span>
          </div>
          <div className="flex flex-col py-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
              <button
                key={speed}
                onClick={() => { handleSpeedChange(speed); setShowSettings(false); setSettingsView('main'); }}
                className="flex items-center justify-between px-6 py-3 text-sm transition-all hover:bg-white/5 w-full group"
              >
                <span className="text-[#EAE8E3] text-[15px]">{speed === 1 ? 'Normal' : `${speed}x`}</span>
                {playbackRate === speed && <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {settingsView === 'subtitles' && !subtitleGroupView && (
        <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
          <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => { setSettingsView('main'); setSubtitleSearch(''); }} className="text-[#888888] hover:text-[#EAE8E3] transition-colors p-2 -ml-2"><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-[13px] font-bold text-[#EAE8E3]">Subtitles</span>
            </div>
            <button className="text-[11px] text-[#888888] hover:text-[#EAE8E3] transition-colors">Customize</button>
          </div>
          <div className="flex flex-col py-2 max-h-[50vh] md:max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between px-6 py-3 w-full border-b border-white/10 mb-2">
              <span className="text-[#EAE8E3] text-[15px] font-medium">Show Subtitles</span>
              <button
                onClick={() => {
                  if (currentSubtitleIndex !== -1) {
                    handleSubtitleChange(-1);
                  } else {
                    // If turning on and there is a subtitle, pick the first one (or English if possible)
                    if (groupedSubtitles['English'] && groupedSubtitles['English'].length > 0) {
                      handleSubtitleChange(groupedSubtitles['English'][0].originalIndex);
                    } else if (hlsSubtitles.length > 0) {
                      handleSubtitleChange(0);
                    }
                  }
                }}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${currentSubtitleIndex !== -1 ? 'bg-accent' : 'bg-white/20'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm ${currentSubtitleIndex !== -1 ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>



            <div className="px-4 mb-3 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <input
                  type="text"
                  placeholder="Search"
                  value={subtitleSearch}
                  onChange={(e) => setSubtitleSearch(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder-[#555555]"
                />
              </div>
            </div>

            {Object.keys(groupedSubtitles)
              .filter(lang => lang.toLowerCase().includes(subtitleSearch.toLowerCase()))
              .map((lang) => {
                const group = groupedSubtitles[lang];
                const isSelected = group.some(g => g.originalIndex === currentSubtitleIndex);

                return (
                  <button
                    key={lang}
                    onClick={() => {
                      if (group.length === 1) {
                        handleSubtitleChange(group[0].originalIndex);
                        setShowSettings(false);
                        setSettingsView('main');
                        setSubtitleSearch('');
                      } else {
                        setSubtitleGroupView(lang);
                      }
                    }}
                    className="flex items-center justify-between px-6 py-3 text-sm transition-all hover:bg-white/5 w-full group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[18px] leading-none">{getFlagForLang(lang)}</span>
                      <span className={`text-[15px] ${isSelected ? 'text-[#EAE8E3] font-semibold' : 'text-[#EAE8E3]'}`}>{lang}</span>
                      {group.length === 1 && <span className="bg-[#2A2A2A] text-[#888888] text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wider">EXTERNAL</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {group.length > 1 && <span className="text-[#888888] text-[13px] font-medium">{group.length}</span>}
                      {group.length > 1 ? (
                        <ChevronRight className="w-5 h-5 text-[#888888]" />
                      ) : (
                        <Languages className="w-5 h-5 text-[#888888]" />
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {settingsView === 'subtitles' && subtitleGroupView && (
        <div className="flex flex-col animate-in slide-in-from-right-4 duration-200">
          <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
            <button onClick={() => setSubtitleGroupView(null)} className="text-[#888888] hover:text-[#EAE8E3] transition-colors p-2 -ml-2"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-[12px] font-bold tracking-wider text-[#EAE8E3] uppercase">{subtitleGroupView} Captions</span>
          </div>
          <div className="flex flex-col py-2 max-h-[50vh] md:max-h-[60vh] overflow-y-auto custom-scrollbar">
            {groupedSubtitles[subtitleGroupView]?.map((item) => (
              <button
                key={item.originalIndex}
                onClick={() => { handleSubtitleChange(item.originalIndex); setShowSettings(false); setSettingsView('main'); setSubtitleGroupView(null); setSubtitleSearch(''); }}
                className="flex items-center justify-between px-6 py-3 text-sm transition-all hover:bg-white/5 w-full group"
              >
                <span className="text-[#EAE8E3] text-[15px]">{item.sub.lang}</span>
                {currentSubtitleIndex === item.originalIndex && <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
