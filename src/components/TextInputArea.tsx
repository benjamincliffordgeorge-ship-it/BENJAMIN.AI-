import React, { useState } from 'react';
import { TEXT_TEMPLATES } from '../data/voices';
import { Trash2, Clock, Loader2, Volume2, Bookmark } from 'lucide-react';

interface TextInputAreaProps {
  text: string;
  onChangeText: (text: string) => void;
  onSynthesize: () => void;
  isGenerating: boolean;
  speed: number;
}

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  text,
  onChangeText,
  onSynthesize,
  isGenerating,
  speed,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);

  // Calculate statistics
  const trimmed = text.trim();
  const charCount = text.length;
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const wordsPerMinute = 150 * speed;
  const estimatedSeconds = wordCount > 0 ? Math.ceil((wordCount / wordsPerMinute) * 60) : 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isGenerating && trimmed.length > 0) {
        onSynthesize();
      }
    }
  };

  const insertHelper = (helperText: string) => {
    onChangeText(text ? `${text} ${helperText}` : helperText);
  };

  return (
    <div id="text-input-container" className="bg-[#0e1013] rounded-xl p-6 border border-white/5 shadow-xl space-y-4">
      {/* Header with Title and Quick Template Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          Input Text
        </h2>

        <div className="flex items-center gap-2">
          <button
            id="toggle-templates-btn"
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium"
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sample Scripts</span>
          </button>

          {text && (
            <button
              id="clear-text-btn"
              type="button"
              onClick={() => onChangeText('')}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
              title="Clear text"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Templates Row */}
      {showTemplates && (
        <div className="bg-[#14171c] border border-white/5 p-3 rounded-lg space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Quick Sample Scripts:
          </div>
          <div className="flex flex-wrap gap-2">
            {TEXT_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                id={`template-btn-${idx}`}
                type="button"
                onClick={() => {
                  onChangeText(tmpl.text);
                  setShowTemplates(false);
                }}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-emerald-400 text-[10px] font-mono font-bold">
                  [{tmpl.category}]
                </span>
                <span>{tmpl.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          id="tts-text-input"
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={6}
          placeholder="Type or paste your text here..."
          className="w-full bg-[#14171c] text-slate-200 placeholder-slate-600 rounded-xl p-5 border border-white/5 focus:border-emerald-500/50 focus:outline-none resize-y text-base leading-relaxed transition-all font-normal"
        />

        {/* Quick prosody insert chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[11px] text-slate-500 mr-1">Quick cues:</span>
          <button
            type="button"
            id="cue-pause-btn"
            onClick={() => insertHelper('[pause: 1s]')}
            className="text-[11px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-white/10 transition-colors cursor-pointer"
          >
            + [pause: 1s]
          </button>
          <button
            type="button"
            id="cue-emphasis-btn"
            onClick={() => insertHelper('[emphasize]')}
            className="text-[11px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-white/10 transition-colors cursor-pointer"
          >
            + [emphasize]
          </button>
          <button
            type="button"
            id="cue-whisper-btn"
            onClick={() => insertHelper('[whisper]')}
            className="text-[11px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-white/10 transition-colors cursor-pointer"
          >
            + [whisper]
          </button>
        </div>
      </div>

      {/* Stats Bar & Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5">
        {/* Character & Reading duration stats */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
          <span className="bg-white/5 px-2 py-1 rounded text-slate-400">
            {charCount.toLocaleString()} chars
          </span>
          <span className="bg-white/5 px-2 py-1 rounded text-slate-400">
            {wordCount} words
          </span>
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>~{estimatedSeconds}s audio</span>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] text-slate-600 font-mono">
            ⌘ + Enter
          </span>
          <button
            id="synthesize-audio-btn"
            type="button"
            onClick={onSynthesize}
            disabled={isGenerating || trimmed.length === 0}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-transform flex items-center gap-2 cursor-pointer ${
              isGenerating || trimmed.length === 0
                ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm active:scale-95'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-black" />
                <span>Generate Speech</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

