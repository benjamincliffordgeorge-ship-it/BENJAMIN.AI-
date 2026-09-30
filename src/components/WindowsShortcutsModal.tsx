import React, { useState } from 'react';
import {
  X,
  Keyboard,
  Sparkles,
  Volume2,
  MessageSquare,
  Radio,
  Zap,
  Check,
  Search,
  Sliders,
  Monitor
} from 'lucide-react';

interface WindowsShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: 'search' | 'tts' | 'live') => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'global' | 'tts' | 'chat';
  badge?: string;
}

const SHORTCUTS: ShortcutItem[] = [
  // Global & Navigation
  {
    keys: ['Ctrl', '1'],
    description: 'Switch to KURAL Search Engine',
    category: 'global',
    badge: 'Navigation',
  },
  {
    keys: ['Ctrl', '2'],
    description: 'Switch to TTS Speech Studio',
    category: 'global',
    badge: 'Navigation',
  },
  {
    keys: ['Ctrl', '3'],
    description: 'Switch to Live Voice Assistant',
    category: 'global',
    badge: 'Navigation',
  },
  {
    keys: ['Ctrl', 'K'],
    description: 'Start New KURAL Search & Chat Session',
    category: 'global',
    badge: 'Search',
  },
  {
    keys: ['Ctrl', 'H'],
    description: 'Open Audio Library & Generation History',
    category: 'global',
    badge: 'Drawer',
  },
  {
    keys: ['Alt', 'H'],
    description: 'Open AI Voice Hearing & Speech Transcriber',
    category: 'global',
    badge: 'Hearing',
  },
  {
    keys: ['Ctrl', 'M'],
    description: 'Open Pricing Plans, Credit Packs & Invoices',
    category: 'global',
    badge: 'Billing',
  },
  {
    keys: ['Ctrl', '/'],
    description: 'Open Windows Keyboard Shortcuts guide (or press F1)',
    category: 'global',
    badge: 'Help',
  },
  {
    keys: ['Esc'],
    description: 'Close active modal, drawer, or dropdown',
    category: 'global',
  },

  // TTS Studio
  {
    keys: ['Ctrl', 'Enter'],
    description: 'Synthesize speech from prompt text',
    category: 'tts',
    badge: 'Primary',
  },
  {
    keys: ['Space'],
    description: 'Play / Pause active audio (when not typing in text field)',
    category: 'tts',
    badge: 'Playback',
  },
  {
    keys: ['Alt', 'P'],
    description: 'Play / Pause active audio from anywhere',
    category: 'tts',
    badge: 'Playback',
  },
  {
    keys: ['Ctrl', 'E'],
    description: 'Open Multi-Format Export dialog (MP3, WAV, OGG)',
    category: 'tts',
    badge: 'Export',
  },
  {
    keys: ['Ctrl', 'Shift', 'S'],
    description: 'Toggle Sample Scripts template picker',
    category: 'tts',
  },
  {
    keys: ['Ctrl', 'Shift', 'X'],
    description: 'Clear script input text field',
    category: 'tts',
  },
  {
    keys: ['Alt', '←'],
    description: 'Seek backward 5 seconds in player',
    category: 'tts',
    badge: 'Seek',
  },
  {
    keys: ['Alt', '→'],
    description: 'Seek forward 5 seconds in player',
    category: 'tts',
    badge: 'Seek',
  },
  {
    keys: ['Alt', 'M'],
    description: 'Toggle mute / unmute audio player volume',
    category: 'tts',
  },

  // Chat & Live Audio
  {
    keys: ['Ctrl', 'Enter'],
    description: 'Send chat prompt / message to Gemini',
    category: 'chat',
  },
  {
    keys: ['Alt', 'G'],
    description: 'Toggle Google Search Grounding on / off',
    category: 'chat',
    badge: 'Search',
  },
  {
    keys: ['Alt', 'V'],
    description: 'Start or Disconnect Live Voice bidirectional call',
    category: 'chat',
    badge: 'Live',
  },
];

export const WindowsShortcutsModal: React.FC<WindowsShortcutsModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'global' | 'tts' | 'video' | 'chat'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredShortcuts = SHORTCUTS.filter((s) => {
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.badge && s.badge.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      id="windows-shortcuts-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="windows-shortcuts-card"
        className="bg-[#0e1013] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-[#14171c]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Windows Keyboard Shortcuts
                </h2>
                <span className="text-[10px] bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  <span>PC / Windows</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Speed up your workflow using fast keyboard commands. Press <kbd className="px-1.5 py-0.5 bg-[#14171c] border border-white/10 rounded text-[10px] font-mono text-white">Ctrl + /</kbd> anytime.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="px-6 py-3 border-b border-white/5 bg-[#0a0b0d]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === 'all'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Shortcuts ({SHORTCUTS.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('global')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === 'global'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Global & Navigation
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('tts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === 'tts'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              TTS Studio
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('chat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === 'chat'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Chat & Live
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcut (e.g. Enter, Export)..."
              className="w-full bg-[#14171c] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Keyboard className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">No shortcuts matching "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#14171c] border border-white/5 hover:border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {item.description}
                      </span>
                      {item.badge && (
                        <span className="text-[9px] bg-white/5 text-slate-400 border border-white/5 px-1.5 py-0.2 rounded font-mono">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Windows Keycaps */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        <kbd className="px-2 py-1 bg-[#1a1f26] border border-white/15 rounded-md shadow-sm text-[11px] font-mono font-bold text-white tracking-wider min-w-[24px] text-center">
                          {k}
                        </kbd>
                        {kIdx < item.keys.length - 1 && (
                          <span className="text-[10px] text-slate-500 font-bold">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-white/5 bg-[#0a0b0d]/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All Windows shortcuts are active globally throughout the studio app.</span>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="px-2 py-0.5 bg-[#14171c] border border-white/10 rounded text-[10px] font-mono text-slate-300">
              Esc
            </kbd>
            <span className="text-[11px] text-slate-500">to dismiss</span>
          </div>
        </div>
      </div>
    </div>
  );
};
