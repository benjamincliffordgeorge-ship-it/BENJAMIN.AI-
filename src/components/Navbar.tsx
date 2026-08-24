import React from 'react';
import { Volume2, History } from 'lucide-react';

interface NavbarProps {
  historyCount: number;
  onOpenHistory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ historyCount, onOpenHistory }) => {
  return (
    <header id="app-header" className="sticky top-0 z-30 bg-[#0e1013] backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-[#0a0b0d] shadow-sm shadow-emerald-500/20">
            <Volume2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center">
                BENJAMIN<span className="text-emerald-500">.AI</span>
              </h1>
              <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-widest">
                Multi-Format
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Export high-fidelity audio in MP3, WAV, and OGG
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-widest bg-white/[0.03] border border-white/5 px-3 py-1.5 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Ready
          </div>

          <button
            id="nav-history-btn"
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/5 text-slate-200 hover:text-white rounded-md text-sm transition-colors border border-white/10 font-medium cursor-pointer relative"
            title="Audio Library"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Library</span>
            {historyCount > 0 && (
              <span className="bg-emerald-500 text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

