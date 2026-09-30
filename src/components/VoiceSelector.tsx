import React, { useState, useMemo, useEffect, useRef } from 'react';
import { VoiceId, ToneStyle, AccentRegion, VoiceOption } from '../types';
import { VOICES, TONE_STYLES } from '../data/voices';
import { Check, Search, Globe, Sparkles, Volume2, VolumeX, Ear, Play, Square } from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoice: VoiceId;
  onSelectVoice: (voice: VoiceId) => void;
  selectedTone: ToneStyle;
  onSelectTone: (tone: ToneStyle) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  pitch: number;
  onChangePitch: (pitch: number) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  selectedTone,
  onSelectTone,
  speed,
  onChangeSpeed,
  pitch,
  onChangePitch,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<'All' | AccentRegion>('All');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Female' | 'Male'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Clean up any ongoing speech synthesis on unmount
  useEffect(() => {
    return () => {
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {
        // Safe fallback in restricted iframes
      }
    };
  }, []);

  const handleHearVoice = (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation();

    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      if (playingVoiceId === voice.id) {
        window.speechSynthesis.cancel();
        setPlayingVoiceId(null);
        return;
      }

      window.speechSynthesis.cancel();
      setPlayingVoiceId(voice.id);

      const auditionPhrase = `Hello! I'm ${voice.name}. I can voice your scripts with a natural ${voice.accent} accent.`;
      const utterance = new SpeechSynthesisUtterance(auditionPhrase);

      utterance.rate = Math.max(0.8, Math.min(1.4, speed || 1.0));
      utterance.pitch = voice.gender === 'Female' ? 1.15 * (pitch || 1.0) : 0.95 * (pitch || 1.0);

      const sysVoices = window.speechSynthesis.getVoices();
      if (sysVoices && sysVoices.length > 0) {
        const langMatch =
          voice.accentRegion === 'Indian'
            ? sysVoices.find((sv) => sv.lang.includes('en-IN') || sv.name.toLowerCase().includes('india'))
            : voice.accentRegion === 'British'
            ? sysVoices.find((sv) => sv.lang.includes('en-GB') || sv.name.toLowerCase().includes('uk'))
            : voice.accentRegion === 'Australian'
            ? sysVoices.find((sv) => sv.lang.includes('en-AU'))
            : sysVoices.find((sv) => sv.lang.includes('en-US'));

        if (langMatch) {
          utterance.voice = langMatch;
        }
      }

      utterance.onend = () => {
        setPlayingVoiceId(null);
      };

      utterance.onerror = () => {
        setPlayingVoiceId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis preview unavailable:', err);
      setPlayingVoiceId(null);
    }
  };

  // Filtered voice list
  const filteredVoices = useMemo(() => {
    return VOICES.filter((v) => {
      // Region filter
      if (selectedRegion !== 'All' && v.accentRegion !== selectedRegion) {
        return false;
      }
      // Gender filter
      if (genderFilter !== 'All' && v.gender !== genderFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesAccent = v.accent.toLowerCase().includes(q);
        const matchesDesc = v.description.toLowerCase().includes(q);
        const matchesFor = v.recommendedFor.toLowerCase().includes(q);
        return matchesName || matchesAccent || matchesDesc || matchesFor;
      }
      return true;
    });
  }, [selectedRegion, genderFilter, searchQuery]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: VOICES.length,
      Indian: 0,
      American: 0,
      British: 0,
      Australian: 0,
      Global: 0,
    };
    VOICES.forEach((v) => {
      counts[v.accentRegion] = (counts[v.accentRegion] || 0) + 1;
    });
    return counts;
  }, []);

  const getRegionFlag = (region: AccentRegion) => {
    switch (region) {
      case 'Indian':
        return '🇮🇳';
      case 'American':
        return '🇺🇸';
      case 'British':
        return '🇬🇧';
      case 'Australian':
        return '🇦🇺';
      case 'Global':
      default:
        return '🌐';
    }
  };

  return (
    <div id="voice-settings-panel" className="bg-[#0e1013] rounded-xl p-6 border border-white/5 shadow-xl space-y-6">
      {/* Voices Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Voice & Accent Library
              </h2>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-medium">
                {VOICES.length} Voices
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Ear className="w-3 h-3 text-emerald-400" />
              <span>Click <strong className="text-slate-200">Hear</strong> on any voice card to audition instant audio</span>
            </p>
          </div>

          {/* Gender Filter Buttons */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 text-[11px]">
            {(['All', 'Female', 'Male'] as const).map((g) => (
              <button
                key={g}
                id={`gender-filter-${g.toLowerCase()}`}
                type="button"
                onClick={() => setGenderFilter(g)}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                  genderFilter === g
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Region & Accent Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <button
            id="accent-tab-all"
            type="button"
            onClick={() => setSelectedRegion('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRegion === 'All'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-sm'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>All Accents</span>
            <span className="text-[10px] opacity-70 font-mono">({regionCounts.All})</span>
          </button>

          <button
            id="accent-tab-indian"
            type="button"
            onClick={() => setSelectedRegion('Indian')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRegion === 'Indian'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-sm'
                : 'bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🇮🇳 Indian Accent</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
              {regionCounts.Indian}
            </span>
          </button>

          <button
            id="accent-tab-american"
            type="button"
            onClick={() => setSelectedRegion('American')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRegion === 'American'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-sm'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🇺🇸 American</span>
            <span className="text-[10px] opacity-70 font-mono">({regionCounts.American})</span>
          </button>

          <button
            id="accent-tab-british"
            type="button"
            onClick={() => setSelectedRegion('British')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRegion === 'British'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-sm'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🇬🇧 British</span>
            <span className="text-[10px] opacity-70 font-mono">({regionCounts.British})</span>
          </button>

          <button
            id="accent-tab-australian"
            type="button"
            onClick={() => setSelectedRegion('Australian')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedRegion === 'Australian'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-sm'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🇦🇺 Australian</span>
            <span className="text-[10px] opacity-70 font-mono">({regionCounts.Australian})</span>
          </button>
        </div>

        {/* Search Input Filter */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="voice-search-input"
            type="text"
            placeholder="Search by voice name, accent (e.g. Indian, British, Mumbai), or style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#14171c] text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-8 pr-3 py-2 border border-white/5 focus:border-emerald-500/40 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Voice Grid */}
        {filteredVoices.length === 0 ? (
          <div className="p-6 text-center bg-white/5 rounded-lg border border-white/5 text-xs text-slate-400">
            No voices found matching your criteria. Try resetting filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
            {filteredVoices.map((v) => {
              const isSelected = selectedVoice === v.id;
              const initials = v.name.slice(0, 2).toUpperCase();
              return (
                <div
                  key={v.id}
                  id={`voice-btn-${v.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectVoice(v.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectVoice(v.id);
                    }
                  }}
                  className={`text-left p-3 rounded-lg border transition-all cursor-pointer relative flex items-center justify-between group ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white shadow-sm'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 relative ${
                        isSelected
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-800 border border-white/5 text-slate-400'
                      }`}
                    >
                      {initials}
                      <span className="absolute -bottom-1 -right-1 text-[10px] leading-none">
                        {getRegionFlag(v.accentRegion)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold leading-none truncate text-slate-100 group-hover:text-white">
                          {v.name}
                        </p>
                        <span className="text-[9px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded font-mono">
                          {v.gender}
                        </span>
                        {v.featuredTag && (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-medium truncate">
                            {v.featuredTag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-400/90 font-medium mt-1 truncate">
                        {v.accent}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {v.recommendedFor}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      type="button"
                      id={`hear-voice-btn-${v.id}`}
                      onClick={(e) => handleHearVoice(e, v)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                        playingVoiceId === v.id
                          ? 'bg-emerald-500 text-black border-emerald-400 animate-pulse'
                          : 'bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-300 border-white/5 hover:border-emerald-500/30'
                      }`}
                      title={playingVoiceId === v.id ? 'Stop Voice Audition' : `Hear AI Voice Preview (${v.name})`}
                    >
                      {playingVoiceId === v.id ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span className="text-[10px] font-bold">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span className="text-[10px] font-medium hidden sm:inline">Hear</span>
                        </>
                      )}
                    </button>

                    {isSelected && (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tone & Emotion Delivery */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Tone & Cadence
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            {TONE_STYLES.length} Styles
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {TONE_STYLES.map((t) => {
            const isSelected = selectedTone === t.id;
            return (
              <button
                key={t.id}
                id={`tone-btn-${t.id}`}
                onClick={() => onSelectTone(t.id)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200'
                }`}
                title={t.description}
              >
                <span>{t.emoji}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed & Pitch Controls */}
      <div className="pt-4 border-t border-white/5 space-y-5">
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          Audio Settings
        </h2>

        {/* Speed Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Speed</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-emerald-400 font-bold">{speed.toFixed(2)}x</span>
              {speed !== 1.0 && (
                <button
                  id="reset-speed-btn"
                  onClick={() => onChangeSpeed(1.0)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <input
            id="speed-slider"
            type="range"
            min="0.5"
            max="1.75"
            step="0.05"
            value={speed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-600 font-mono">
            <span>0.5x (Slow)</span>
            <span>1.0x (Normal)</span>
            <span>1.75x (Fast)</span>
          </div>
        </div>

        {/* Pitch Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Pitch / Modulation</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-emerald-400 font-bold">{pitch.toFixed(2)}x</span>
              {pitch !== 1.0 && (
                <button
                  id="reset-pitch-btn"
                  onClick={() => onChangePitch(1.0)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <input
            id="pitch-slider"
            type="range"
            min="0.75"
            max="1.35"
            step="0.05"
            value={pitch}
            onChange={(e) => onChangePitch(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-600 font-mono">
            <span>Deeper</span>
            <span>Standard</span>
            <span>Higher</span>
          </div>
        </div>
      </div>
    </div>
  );
};

