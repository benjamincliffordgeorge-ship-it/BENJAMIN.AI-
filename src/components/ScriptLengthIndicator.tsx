import React from 'react';
import {
  FileText,
  Type,
  Clock,
  Gauge,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ScriptLengthIndicatorProps {
  text: string;
  speed: number;
  maxRecommendedChars?: number;
}

export const ScriptLengthIndicator: React.FC<ScriptLengthIndicatorProps> = ({
  text,
  speed,
  maxRecommendedChars = 5000,
}) => {
  // Real-time metrics calculations
  const trimmed = text.trim();
  const charCount = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  
  // Sentence count (split on . ! ? followed by whitespace or end of text)
  const sentences = trimmed
    ? trimmed.split(/[.!?]+(?:\s+|$)/).filter((s) => s.trim().length > 0)
    : [];
  const sentenceCount = sentences.length;

  // Paragraph count (split on double newline or newline)
  const paragraphs = text
    ? text.split(/\n+/).filter((p) => p.trim().length > 0)
    : [];
  const paragraphCount = paragraphs.length;

  // Reading / speaking duration calculation based on speed
  const baseWordsPerMinute = 150;
  const effectiveWpm = Math.round(baseWordsPerMinute * (speed || 1.0));
  const totalSeconds = wordCount > 0 ? Math.ceil((wordCount / effectiveWpm) * 60) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime =
    wordCount === 0
      ? '0:00'
      : `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Percentage of recommended limit
  const percentUsed = Math.min(100, Math.round((charCount / maxRecommendedChars) * 100));

  // Determine script length categorization
  const getScriptCategory = () => {
    if (wordCount === 0) return { label: 'Empty Script', color: 'text-slate-500', bg: 'bg-slate-500/10' };
    if (wordCount <= 40) return { label: 'Short Hook / Intro', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (wordCount <= 90) return { label: 'Social Reel (30s)', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (wordCount <= 180) return { label: 'Commercial / 60s Spot', color: 'text-cyan-400', bg: 'bg-cyan-500/10' };
    if (wordCount <= 350) return { label: 'Podcast Intro / Segment', color: 'text-purple-400', bg: 'bg-purple-500/10' };
    if (wordCount <= 800) return { label: 'Story / Explainer', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    return { label: 'Longform Narrative', color: 'text-amber-400', bg: 'bg-amber-500/10' };
  };

  const category = getScriptCategory();

  // Target presets guide
  const targetBenchmarks = [
    { label: '30s Reel', minWords: 60, maxWords: 80 },
    { label: '60s Short', minWords: 130, maxWords: 160 },
    { label: '2m Explainer', minWords: 280, maxWords: 320 },
  ];

  return (
    <section
      id="script-length-indicator"
      aria-label="Script length and metrics tracker"
      className="bg-[#0e1013] border border-white/5 rounded-xl p-5 shadow-lg space-y-4 transition-all"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Gauge className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Real-Time Script Tracker
          </span>
          <span className="text-[10px] bg-white/5 text-slate-400 px-2 py-0.5 rounded-full border border-white/5 font-mono">
            Live
          </span>
        </div>

        {/* Current Content Format Badge */}
        <div
          id="script-format-category"
          className={`text-[11px] font-medium px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-1.5 ${category.bg} ${category.color}`}
        >
          <Sparkles className="w-3 h-3" />
          <span>{category.label}</span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Word Count Indicator */}
        <div
          id="script-word-count-card"
          className="bg-[#14171c] border border-white/5 hover:border-emerald-500/30 rounded-lg p-3 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Words</span>
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              id="script-words-value"
              className="text-xl sm:text-2xl font-bold font-mono text-white"
            >
              {wordCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500">words</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            {trimmed ? `${Math.round(wordCount / Math.max(1, sentenceCount))} words/sent.` : 'No text yet'}
          </div>
        </div>

        {/* Character Count Indicator */}
        <div
          id="script-char-count-card"
          className="bg-[#14171c] border border-white/5 hover:border-emerald-500/30 rounded-lg p-3 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Characters</span>
            <Type className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              id="script-characters-value"
              className="text-xl sm:text-2xl font-bold font-mono text-white"
            >
              {charCount.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500">chars</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            {charsNoSpaces.toLocaleString()} excl. spaces
          </div>
        </div>

        {/* Estimated Duration Indicator */}
        <div
          id="script-duration-card"
          className="bg-[#14171c] border border-white/5 hover:border-emerald-500/30 rounded-lg p-3 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Est. Duration</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              id="script-duration-value"
              className="text-xl sm:text-2xl font-bold font-mono text-emerald-400"
            >
              {formattedTime}
            </span>
            <span className="text-[11px] text-slate-500">{totalSeconds >= 60 ? 'min' : 'sec'}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            @{speed}x ({effectiveWpm} wpm)
          </div>
        </div>

        {/* Sentences & Paragraphs Structure */}
        <div
          id="script-structure-card"
          className="bg-[#14171c] border border-white/5 hover:border-emerald-500/30 rounded-lg p-3 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Structure</span>
            <Layers className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-white">
              {sentenceCount}
            </span>
            <span className="text-[11px] text-slate-400">snt.</span>
            <span className="text-slate-600">/</span>
            <span className="text-lg font-bold font-mono text-slate-300">
              {paragraphCount}
            </span>
            <span className="text-[11px] text-slate-500">para</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            {sentenceCount > 0 ? `${(charCount / sentenceCount).toFixed(0)} avg chars/snt` : 'Paced for clarity'}
          </div>
        </div>
      </div>

      {/* Script Capacity & Progress Bar */}
      <div className="space-y-1.5 bg-[#14171c] p-3 rounded-lg border border-white/5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[11px] font-medium text-slate-300">Script Capacity:</span>
            <span className="font-mono text-emerald-400 font-semibold">{charCount.toLocaleString()}</span>
            <span className="text-slate-500">/ {maxRecommendedChars.toLocaleString()} characters</span>
          </div>
          <span className="font-mono text-slate-400 text-[11px]">
            {percentUsed}% capacity used
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
          <div
            id="script-capacity-progress-bar"
            role="progressbar"
            aria-valuenow={charCount}
            aria-valuemin={0}
            aria-valuemax={maxRecommendedChars}
            className={`h-full transition-all duration-300 rounded-full ${
              percentUsed > 90
                ? 'bg-amber-400'
                : percentUsed > 70
                ? 'bg-cyan-400'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(1, percentUsed)}%` }}
          />
        </div>

        {/* Benchmarks / Target Duration Reference Bar */}
        <div className="flex flex-wrap items-center justify-between pt-1 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            {percentUsed > 90 ? (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Approaching single-clip character limit
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Optimal length for neural speech synthesis
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {targetBenchmarks.map((bench, idx) => {
              const isMatch = wordCount >= bench.minWords && wordCount <= bench.maxWords;
              return (
                <span
                  key={idx}
                  className={`transition-colors ${
                    isMatch
                      ? 'text-emerald-400 font-semibold border-b border-emerald-400'
                      : 'text-slate-500'
                  }`}
                  title={`${bench.minWords}-${bench.maxWords} words`}
                >
                  {bench.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
