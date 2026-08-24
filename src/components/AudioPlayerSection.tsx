import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GeneratedClip, AudioFormat } from '../types';
import { formatTime } from '../utils/webSpeechFallback';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Settings2,
  FileAudio,
  Repeat,
} from 'lucide-react';

interface AudioPlayerSectionProps {
  currentClip: GeneratedClip | null;
  onExport: (format: AudioFormat) => void;
  onOpenExportModal: () => void;
  exportingFormat: AudioFormat | null;
}

export const AudioPlayerSection: React.FC<AudioPlayerSectionProps> = ({
  currentClip,
  onExport,
  onOpenExportModal,
  exportingFormat,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);

  // Initialize or reset when current clip changes
  useEffect(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    startOffsetRef.current = 0;

    if (currentClip?.audioBuffer) {
      setDuration(currentClip.audioBuffer.duration);
    } else {
      setDuration(0);
    }
  }, [currentClip]);

  // Audio Context management
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Stop playback helper
  const stopPlayback = useCallback((resetPosition = false) => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceNodeRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
    if (resetPosition) {
      setCurrentTime(0);
      startOffsetRef.current = 0;
    }
  }, []);

  // Play audio buffer from specific offset
  const playFromOffset = useCallback(
    (offset: number) => {
      if (!currentClip?.audioBuffer) return;

      const audioCtx = getAudioContext();
      stopPlayback(false);

      const source = audioCtx.createBufferSource();
      source.buffer = currentClip.audioBuffer;
      source.playbackRate.value = playbackRate;
      source.loop = isLooping;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = isMuted ? 0 : volume;

      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      sourceNodeRef.current = source;
      gainNodeRef.current = gainNode;

      const boundedOffset = Math.max(0, Math.min(offset, currentClip.audioBuffer.duration));
      startOffsetRef.current = boundedOffset;
      startTimeRef.current = audioCtx.currentTime;

      source.start(0, boundedOffset);
      setIsPlaying(true);

      const updateProgress = () => {
        if (!sourceNodeRef.current) return;
        const elapsed = (audioCtx.currentTime - startTimeRef.current) * playbackRate;
        const totalElapsed = startOffsetRef.current + elapsed;

        if (totalElapsed >= currentClip.audioBuffer!.duration) {
          if (isLooping) {
            startOffsetRef.current = 0;
            startTimeRef.current = audioCtx.currentTime;
            setCurrentTime(0);
            animationFrameRef.current = requestAnimationFrame(updateProgress);
          } else {
            stopPlayback(true);
          }
        } else {
          setCurrentTime(totalElapsed);
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateProgress);

      source.onended = () => {
        if (!isLooping && isPlaying) {
          stopPlayback(true);
        }
      };
    },
    [currentClip, getAudioContext, isLooping, isMuted, isPlaying, playbackRate, stopPlayback, volume]
  );

  const togglePlayPause = () => {
    if (!currentClip?.audioBuffer) return;
    if (isPlaying) {
      startOffsetRef.current = currentTime;
      stopPlayback(false);
    } else {
      playFromOffset(currentTime >= duration ? 0 : currentTime);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!currentClip?.audioBuffer || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newProgress = clickX / rect.width;
    const newTime = newProgress * duration;

    setCurrentTime(newTime);
    startOffsetRef.current = newTime;

    if (isPlaying) {
      playFromOffset(newTime);
    }
  };

  const handleSkip = (seconds: number) => {
    if (!currentClip?.audioBuffer) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(newTime);
    startOffsetRef.current = newTime;
    if (isPlaying) {
      playFromOffset(newTime);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : newVol;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = nextMuted ? 0 : volume;
    }
  };

  // Draw Waveform Visualizer on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!currentClip?.audioBuffer) {
      ctx.fillStyle = '#1c222b';
      const bars = 48;
      const barWidth = width / bars;
      for (let i = 0; i < bars; i++) {
        const h = Math.sin(i * 0.3) * 8 + 10;
        ctx.fillRect(i * barWidth + 2, (height - h) / 2, barWidth - 4, h);
      }
      return;
    }

    const channelData = currentClip.audioBuffer.getChannelData(0);
    const numBars = 72;
    const step = Math.floor(channelData.length / numBars);
    const barWidth = width / numBars;
    const progress = duration > 0 ? currentTime / duration : 0;

    for (let i = 0; i < numBars; i++) {
      let maxVal = 0;
      const start = i * step;
      for (let j = 0; j < step; j += 10) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > maxVal) maxVal = val;
      }

      const barHeight = Math.max(4, maxVal * (height * 0.85));
      const y = (height - barHeight) / 2;
      const barProgress = i / numBars;

      if (barProgress <= progress) {
        ctx.fillStyle = '#10b981'; // Emerald 500
      } else {
        ctx.fillStyle = '#272c35'; // Dark slate bar
      }

      const radius = 2;
      const x = i * barWidth + 1.5;
      const w = Math.max(2, barWidth - 3);

      ctx.beginPath();
      ctx.roundRect(x, y, w, barHeight, radius);
      ctx.fill();
    }

    if (duration > 0) {
      const cursorX = progress * width;
      ctx.fillStyle = '#34d399';
      ctx.fillRect(cursorX - 1, 0, 2, height);
    }
  }, [currentClip, currentTime, duration]);

  if (!currentClip) {
    return (
      <div id="audio-player-empty" className="bg-[#0e1013] rounded-xl p-8 border border-white/5 border-dashed text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
          <FileAudio className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-300">No Audio Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Type your text above, choose a voice profile, and click &quot;Generate Speech&quot; to preview and export.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="active-audio-player" className="bg-[#0e1013] rounded-xl p-6 border border-white/5 shadow-xl space-y-5">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold font-mono">
            {currentClip.voiceName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{currentClip.voiceName}</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono uppercase">
                {currentClip.tone}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-[260px] sm:max-w-md">
              &quot;{currentClip.text}&quot;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="more-export-opts-btn"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-3 py-1.5 rounded-md border border-white/10 text-xs font-medium transition-all cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Settings</span>
          </button>
        </div>
      </div>

      {/* Waveform & Scrub Area */}
      <div className="space-y-2">
        <div
          id="waveform-container"
          onClick={handleSeek}
          className="relative h-20 w-full bg-[#14171c] rounded-xl border border-white/5 p-2 flex items-center cursor-pointer hover:border-emerald-500/30 transition-all overflow-hidden group"
          title="Click to seek"
        >
          <canvas
            ref={canvasRef}
            width={720}
            height={80}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>
        </div>

        {/* Time bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
          <span className="text-emerald-400 font-bold">{formatTime(currentTime)}</span>
          <span>Est. Duration: {formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Left: Play/Pause, Skips, Loop */}
        <div className="flex items-center gap-3">
          <button
            id="audio-play-pause-btn"
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black flex items-center justify-center transition-transform cursor-pointer shadow-sm"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            id="audio-rewind-5s-btn"
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Rewind 5s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="audio-forward-5s-btn"
            onClick={() => handleSkip(5)}
            className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Forward 5s"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            id="audio-loop-toggle-btn"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-md border text-xs transition-colors cursor-pointer ${
              isLooping
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Loop"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Playback Speed selector */}
        <div className="flex items-center gap-1 bg-[#14171c] p-1 rounded-md border border-white/5 text-xs">
          {[0.75, 1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              id={`playback-rate-${rate}x-btn`}
              onClick={() => {
                setPlaybackRate(rate);
                if (sourceNodeRef.current) {
                  sourceNodeRef.current.playbackRate.value = rate;
                }
              }}
              className={`px-2 py-1 rounded font-mono text-[11px] font-medium transition-all cursor-pointer ${
                playbackRate === rate
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            id="audio-mute-toggle-btn"
            onClick={toggleMute}
            className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            id="audio-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20 sm:w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
            title="Volume"
          />
        </div>
      </div>

      {/* QUICK MULTI-FORMAT EXPORT BUTTONS (MP3, WAV, OGG) */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Export Format
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">Instant Download</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* MP3 Export Button */}
          <button
            id="quick-export-mp3-btn"
            onClick={() => onExport('mp3')}
            disabled={exportingFormat !== null}
            className="p-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-left transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-bold text-xs uppercase tracking-wider">
                MP3
              </span>
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <div className="text-[10px] font-medium opacity-80 leading-tight">
              192 kbps • Universal
            </div>
          </button>

          {/* WAV Export Button */}
          <button
            id="quick-export-wav-btn"
            onClick={() => onExport('wav')}
            disabled={exportingFormat !== null}
            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                WAV
              </span>
              <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              16-bit Lossless PCM
            </div>
          </button>

          {/* OGG Export Button */}
          <button
            id="quick-export-ogg-btn"
            onClick={() => onExport('ogg')}
            disabled={exportingFormat !== null}
            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                OGG
              </span>
              <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              Opus / Web Stream
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

