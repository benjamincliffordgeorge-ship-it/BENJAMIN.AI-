import React from 'react';
import { GeneratedClip, AudioFormat } from '../types';
import { formatTime } from '../utils/webSpeechFallback';
import {
  History,
  Play,
  Trash2,
  Copy,
  Check,
  X,
  Clock,
  FileAudio,
} from 'lucide-react';

interface ClipHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  clips: GeneratedClip[];
  onSelectClip: (clip: GeneratedClip) => void;
  onDeleteClip: (id: string) => void;
  onClearHistory: () => void;
  onExportClip: (clip: GeneratedClip, format: AudioFormat) => void;
}

export const ClipHistory: React.FC<ClipHistoryProps> = ({
  isOpen,
  onClose,
  clips,
  onSelectClip,
  onDeleteClip,
  onClearHistory,
  onExportClip,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div
      id="history-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="history-drawer"
        className="bg-[#0e1013] border-l border-white/10 w-full max-w-md h-full flex flex-col shadow-2xl p-6 relative animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Generated Audio Library</h2>
              <p className="text-xs text-slate-500">
                {clips.length} {clips.length === 1 ? 'audio clip' : 'audio clips'} in session
              </p>
            </div>
          </div>
          <button
            id="close-history-btn"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Clips */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {clips.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mx-auto">
                <FileAudio className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-300">No History Yet</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Generate your first speech audio to start saving clips to your library.
              </p>
            </div>
          ) : (
            clips.map((clip) => (
              <div
                key={clip.id}
                id={`clip-card-${clip.id}`}
                className="p-3.5 rounded-lg bg-[#14171c] border border-white/5 hover:border-white/10 transition-all space-y-2.5 group"
              >
                {/* Top row with Voice and duration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-emerald-400">
                      {clip.voiceName}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono uppercase">
                      {clip.tone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatTime(clip.durationSeconds)}</span>
                  </div>
                </div>

                {/* Script text snippet */}
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  &quot;{clip.text}&quot;
                </p>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  {/* Play / Load into player */}
                  <button
                    id={`load-clip-btn-${clip.id}`}
                    onClick={() => {
                      onSelectClip(clip);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Load & Play</span>
                  </button>

                  {/* Format export buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      id={`export-clip-mp3-${clip.id}`}
                      onClick={() => onExportClip(clip, 'mp3')}
                      className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Download MP3"
                    >
                      MP3
                    </button>
                    <button
                      id={`export-clip-wav-${clip.id}`}
                      onClick={() => onExportClip(clip, 'wav')}
                      className="text-[10px] font-mono font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Download WAV"
                    >
                      WAV
                    </button>
                    <button
                      id={`export-clip-ogg-${clip.id}`}
                      onClick={() => onExportClip(clip, 'ogg')}
                      className="text-[10px] font-mono font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      title="Download OGG"
                    >
                      OGG
                    </button>

                    {/* Copy Text */}
                    <button
                      id={`copy-clip-text-${clip.id}`}
                      onClick={() => handleCopyText(clip.id, clip.text)}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      title="Copy text script"
                    >
                      {copiedId === clip.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      id={`delete-clip-${clip.id}`}
                      onClick={() => onDeleteClip(clip.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete clip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Clear All */}
        {clips.length > 0 && (
          <div className="pt-4 border-t border-white/5 flex justify-between items-center">
            <button
              id="clear-all-history-btn"
              onClick={onClearHistory}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Session Library</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              In-Memory Storage
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

