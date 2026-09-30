import React from 'react';
import { Volume2, History, Search, Radio, Coins, Sparkles, Keyboard, Ear, ShieldCheck } from 'lucide-react';
import { useMonetization } from '../context/MonetizationContext';

export type StudioTab = 'search' | 'tts' | 'live';

interface NavbarProps {
  historyCount: number;
  onOpenHistory: () => void;
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onOpenShortcuts: () => void;
  onOpenVoiceHearing?: () => void;
  onOpenCopyright?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  historyCount,
  onOpenHistory,
  activeTab,
  onSelectTab,
  onOpenShortcuts,
  onOpenVoiceHearing,
  onOpenCopyright,
}) => {
  const { state, openPricingModal } = useMonetization();

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-[#0d0d0d] backdrop-blur-md border-b border-[#1f1f1f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand: KURAL by Benjamin Clifford */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-black text-sm shadow-sm shadow-white/20">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center">
                KURAL<span className="text-emerald-500 font-normal">.AI</span>
              </h1>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-widest hidden sm:inline-block">
                Search & Voice
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Intelligent Search Engine & Neural Speech Studio by Benjamin Clifford
            </p>
          </div>
        </div>

        {/* Center Studio Navigation Tabs */}
        <nav className="flex items-center bg-[#141414] p-1 rounded-xl border border-white/5">
          <button
            type="button"
            id="tab-btn-search"
            onClick={() => onSelectTab('search')}
            title="KURAL Search Engine [Ctrl + 1]"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-white text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Engine</span>
          </button>

          <button
            type="button"
            id="tab-btn-tts"
            onClick={() => onSelectTab('tts')}
            title="TTS Speech Studio [Ctrl + 2]"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'tts'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>TTS Studio</span>
          </button>

          <button
            type="button"
            id="tab-btn-live"
            onClick={() => onSelectTab('live')}
            title="Live Voice Assistant [Ctrl + 3]"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'live'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Voice</span>
            <span className="sm:hidden">Live</span>
          </button>
        </nav>

        {/* Status, Credits, Copyright & Library Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Copyright Certificate Badge */}
          {onOpenCopyright && (
            <button
              type="button"
              id="nav-copyright-btn"
              onClick={onOpenCopyright}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141414] hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-300 rounded-lg text-xs font-medium border border-white/10 hover:border-emerald-500/30 transition-colors cursor-pointer"
              title="Official Copyright & License Certificate © 2026 Benjamin Clifford"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>© Copyright</span>
            </button>
          )}

          {/* AI Voice Hearing Button */}
          {onOpenVoiceHearing && (
            <button
              type="button"
              id="nav-voice-hearing-btn"
              onClick={onOpenVoiceHearing}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141414] hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-300 rounded-lg text-xs font-medium border border-white/10 hover:border-emerald-500/30 transition-colors cursor-pointer"
              title="AI Voice Hearing & Speech Transcriber [Alt + H]"
            >
              <Ear className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voice Hearing</span>
              <kbd className="px-1 py-0.2 bg-[#0a0a0a] border border-white/10 rounded text-[9px] font-mono text-slate-400 ml-0.5">
                Alt+H
              </kbd>
            </button>
          )}

          {/* Windows Keyboard Shortcuts Help Button */}
          <button
            type="button"
            id="nav-shortcuts-btn"
            onClick={onOpenShortcuts}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141414] hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            title="Windows Keyboard Shortcuts [Ctrl + / or F1]"
          >
            <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shortcuts</span>
          </button>

          {/* Credit Balance Indicator */}
          <button
            type="button"
            id="nav-credits-badge"
            onClick={() => openPricingModal('credits')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#141414] hover:bg-white/10 text-white rounded-lg text-xs font-semibold border border-emerald-500/30 transition-all cursor-pointer shadow-sm group"
            title="Credits Balance [Ctrl + M] - Click to top up"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="font-mono text-emerald-400 font-bold">{state.credits}</span>
            <span className="text-slate-400 hidden sm:inline">Credits</span>
          </button>

          {/* Pricing & Upgrade CTA */}
          <button
            type="button"
            id="nav-upgrade-btn"
            onClick={() => openPricingModal('plans')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Upgrade Plan or Buy Credits [Ctrl + M]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pricing</span>
            <span className="sm:hidden">Plans</span>
          </button>

          <button
            id="nav-history-btn"
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/5 text-slate-200 hover:text-white rounded-lg text-xs transition-colors border border-white/10 font-medium cursor-pointer relative"
            title="Audio Library [Ctrl + H]"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Library</span>
            {historyCount > 0 && (
              <span className="bg-emerald-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};



