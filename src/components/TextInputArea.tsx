import React, { useState, useEffect } from 'react';
import { TEXT_TEMPLATES } from '../data/voices';
import { Trash2, Clock, Loader2, Volume2, Bookmark, Coins, Ear, Mic } from 'lucide-react';
import { useMonetization } from '../context/MonetizationContext';

interface TextInputAreaProps {
  text: string;
  onChangeText: (text: string) => void;
  onSynthesize: () => void;
  isGenerating: boolean;
  speed: number;
  onOpenVoiceHearing?: () => void;
}

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  text,
  onChangeText,
  onSynthesize,
  isGenerating,
  speed,
  onOpenVoiceHearing,
}) => {
  const [showTemplates, setShowTemplates] = useState(false);
  const { checkFeatureAllowance, openPricingModal } = useMonetization();
  const allowance = checkFeatureAllowance('voice');

  // Listen for custom events dispatched from Windows shortcuts
  useEffect(() => {
    const handleToggleTemplates = () => {
      setShowTemplates((prev) => !prev);
    };

    const handleClearScript = () => {
      onChangeText('');
    };

    window.addEventListener('benjamin:toggle-sample-scripts', handleToggleTemplates);
    window.addEventListener('benjamin:clear-script', handleClearScript);

    return () => {
      window.removeEventListener('benjamin:toggle-sample-scripts', handleToggleTemplates);
      window.removeEventListener('benjamin:clear-script', handleClearScript);
    };
  }, [onChangeText]);

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
          {onOpenVoiceHearing && (
            <button
              id="voice-hearing-btn"
              type="button"
              onClick={onOpenVoiceHearing}
              title="AI Voice Hearing & Speech Dictation [Alt + H]"
              className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium"
            >
              <Ear className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voice Hearing</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 bg-[#0a0b0d] border border-emerald-500/30 rounded text-[9px] font-mono text-emerald-400 ml-1">
                Alt+H
              </kbd>
            </button>
          )}

          <button
            id="toggle-templates-btn"
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            title="Toggle Sample Scripts [Ctrl + Shift + S]"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium"
          >
            <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sample Scripts</span>
            <kbd className="hidden sm:inline-block px-1 py-0.2 bg-[#0a0b0d] border border-white/10 rounded text-[9px] font-mono text-slate-400 ml-1">
              Ctrl+Shift+S
            </kbd>
          </button>

          {text && (
            <button
              id="clear-text-btn"
              type="button"
              onClick={() => onChangeText('')}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
              title="Clear text [Ctrl + Shift + X]"
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
      <div
        id="text-input-metrics-bar"
        className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5"
      >
        {/* Real-time word and character count indicator */}
        <div
          id="text-input-stats-indicator"
          className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 font-mono"
        >
          <span
            id="text-input-word-count"
            className="bg-white/5 border border-white/5 px-2.5 py-1 rounded-md text-slate-300 font-medium"
          >
            <strong className="text-white font-bold">{wordCount}</strong> {wordCount === 1 ? 'word' : 'words'}
          </span>
          <span
            id="text-input-char-count"
            className="bg-white/5 border border-white/5 px-2.5 py-1 rounded-md text-slate-300 font-medium"
          >
            <strong className="text-white font-bold">{charCount.toLocaleString()}</strong> chars
          </span>
          <div
            id="text-input-audio-duration"
            className="flex items-center gap-1.5 text-slate-400 bg-white/5 border border-white/5 px-2.5 py-1 rounded-md"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>~{estimatedSeconds}s audio</span>
          </div>
        </div>

        {/* Generate Button & Monetization Quota Indicator */}
        <div className="flex items-center gap-2">
          {allowance.isFreeTier && allowance.remainingFree !== Infinity ? (
            <span
              id="voice-free-quota-badge"
              className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md cursor-pointer hover:bg-emerald-500/20 transition-colors"
              onClick={() => openPricingModal('usage')}
              title="Daily free voice generations remaining"
            >
              {allowance.remainingFree}/10 free today
            </span>
          ) : (
            <span
              id="voice-credit-cost-badge"
              className="text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer hover:text-white"
              onClick={() => openPricingModal('credits')}
              title="1 Credit per voice generation"
            >
              <Coins className="w-3 h-3 text-emerald-400" />
              <span>1 Credit</span>
            </span>
          )}

          <kbd
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-[#14171c] border border-white/10 rounded text-[10px] font-mono text-slate-400 shadow-sm"
            title="Press Ctrl + Enter to synthesize speech"
          >
            <span className="text-white font-bold">Ctrl</span> + <span className="text-white font-bold">Enter</span>
          </kbd>
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

