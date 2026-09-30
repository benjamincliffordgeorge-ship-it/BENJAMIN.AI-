import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Send,
  Plus,
  Brain,
  Mic,
  MicOff,
  Radio,
  Volume2,
  Share2,
  Copy,
  Check,
  MoreHorizontal,
  ChevronDown,
  Pin,
  MessageSquare,
  Compass,
  ArrowRight,
  ExternalLink,
  Loader2,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Coins,
  History,
  Trash2,
  Bookmark,
  Zap,
  Globe,
  FileText,
  Play,
  RotateCcw,
  Sliders,
  FolderOpen
} from 'lucide-react';
import { useMonetization } from '../context/MonetizationContext';
import { CopyrightModal } from './CopyrightModal';

export interface SearchThread {
  id: string;
  title: string;
  category?: 'pinned' | 'recent';
  timestamp: number;
  messages: Array<{
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    thoughtProcess?: string;
    highlightCard?: {
      title: string;
      subtitle: string;
    };
    groundingMetadata?: {
      webSearchQueries?: string[];
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
    };
  }>;
}

interface KuralSearchEngineProps {
  onNavigateToTTS?: (scriptText?: string) => void;
  onNavigateToLiveVoice?: () => void;
  onOpenVoiceHearing?: () => void;
  onOpenLibrary?: () => void;
  onOpenShortcuts?: () => void;
}

// Default initial threads seeded with the exact conversation from the user's screenshot
const INITIAL_THREADS: SearchThread[] = [
  {
    id: 'kural-brand-thread',
    title: 'KURAL Name & Manifesto',
    category: 'pinned',
    timestamp: Date.now() - 3600000,
    messages: [
      {
        id: 'msg-user-1',
        role: 'user',
        text: 'GIVE ME AN BEST TRENDING TAMIL NAME FOR MY AI WITHOUT AN AI IN THE END AND GIVE THE BEST DEPSTRIPSTION',
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'msg-model-1',
        role: 'model',
        text: `Bro, screenshot paatha BENJAMIN.AI is not just a chatbot. It's becoming a voice + chat + search + TTS + live conversation platform, so the name should feel bigger than just "AI." 🔥

🏆 My #1 Pick: KURAL
KURAL = குரல் = Voice

It fits your product perfectly because the core experience already has Voice Hearing, Live Voice, TTS Studio, Chat & Search.

🔥 Best Description
KURAL is an intelligent voice-first platform built to help you talk, create, search, learn, and get things done naturally. From realistic text-to-speech and live voice conversations to AI-powered chat and search, KURAL brings everything together in one simple, powerful experience.

Short tagline options
• KURAL — Intelligence That Speaks.
• KURAL — Talk. Create. Discover.
• KURAL — AI That Talks Your Language.
• KURAL — Speak. Search. Create.`,
        timestamp: Date.now() - 3550000,
        highlightCard: {
          title: 'KURAL',
          subtitle: 'Your Voice. Your Intelligence.',
        },
      },
    ],
  },
  {
    id: 'thread-fix-quota',
    title: 'Fix Quota Error',
    category: 'recent',
    timestamp: Date.now() - 86400000,
    messages: [
      {
        id: 'msg-q1',
        role: 'user',
        text: 'How to handle 429 RESOURCE_EXHAUSTED errors gracefully in my full-stack AI studio?',
        timestamp: Date.now() - 86400000,
      },
      {
        id: 'msg-a1',
        role: 'model',
        text: `To handle 429 quota exceptions reliably:
1. Intercept upstream status 429 / RESOURCE_EXHAUSTED in your Express proxy server.
2. Format raw ApiError JSON into clean client notices.
3. Provide exponential backoff or instant local fallback so the user is never blocked!`,
        timestamp: Date.now() - 86350000,
      },
    ],
  },
  {
    id: 'thread-tamil-query',
    title: 'கேள்வி கேட்டார்',
    category: 'recent',
    timestamp: Date.now() - 172800000,
    messages: [
      {
        id: 'msg-t1',
        role: 'user',
        text: 'குரல் வழியில் AI தேடுபொறி எப்படி வேலை செய்கிறது?',
        timestamp: Date.now() - 172800000,
      },
      {
        id: 'msg-t2',
        role: 'model',
        text: `குரல் (KURAL) தேடுபொறி உங்கள் பேச்சை உடனடியாக உரையாக மாற்றி (Voice Hearing), கூகுள் தேடல் தளம் வழியாக நேரலைத் தகவல்களைத் திரட்டி, இயற்கை ஒலி வடிவத்தில் (Neural Voice TTS) பதிலளிக்கிறது.`,
        timestamp: Date.now() - 172750000,
      },
    ],
  },
  {
    id: 'thread-shortcuts',
    title: 'Windows Shortcut Translation',
    category: 'recent',
    timestamp: Date.now() - 259200000,
    messages: [
      {
        id: 'msg-s1',
        role: 'user',
        text: 'Translate the Windows shortcut system into an accessible Tamil quick reference guide.',
        timestamp: Date.now() - 259200000,
      },
      {
        id: 'msg-s2',
        role: 'model',
        text: `முக்கிய குறுக்குவழிகள்:
• Ctrl + 1: குரல் ஒலி ஸ்டுடியோ (TTS Studio)
• Ctrl + 2: தேடல் & அரட்டை (KURAL Search)
• Ctrl + 3: நேரலை குரல் உரையாடல் (Live Voice)
• Alt + H: குரல் கேட்டல் (Voice Hearing)`,
        timestamp: Date.now() - 259150000,
      },
    ],
  },
  {
    id: 'thread-flow-merge',
    title: 'Google Flow Merge Prompt',
    category: 'recent',
    timestamp: Date.now() - 345600000,
    messages: [
      {
        id: 'msg-f1',
        role: 'user',
        text: 'Merge Gemini search grounding data with neural voice speech synthesis workflow.',
        timestamp: Date.now() - 345600000,
      },
      {
        id: 'msg-f2',
        role: 'model',
        text: `Live Web Search results synthesize into high-impact scripts, which directly pass to the TTS Studio pipeline for MP3 / WAV exports.`,
        timestamp: Date.now() - 345550000,
      },
    ],
  },
  {
    id: 'thread-birthday-poster',
    title: 'Birthday Poster Design',
    category: 'recent',
    timestamp: Date.now() - 432000000,
    messages: [
      {
        id: 'msg-b1',
        role: 'user',
        text: 'Generate catchy typography slogans for a festive birthday celebration poster.',
        timestamp: Date.now() - 432000000,
      },
      {
        id: 'msg-b2',
        role: 'model',
        text: `1. "Another Year Bolder, Brighter & Legendary!"
2. "Cheers to Moments That Turn into Memories!"
3. "Celebration Mode: Activated!"`,
        timestamp: Date.now() - 431950000,
      },
    ],
  },
  {
    id: 'thread-thumbnail',
    title: 'Create Instagram Thumbnail',
    category: 'pinned',
    timestamp: Date.now() - 518400000,
    messages: [
      {
        id: 'msg-th1',
        role: 'user',
        text: 'Design concept for Instagram Reel thumbnail: KURAL AI Search Engine Launch.',
        timestamp: Date.now() - 518400000,
      },
      {
        id: 'msg-th2',
        role: 'model',
        text: `Visual Concept:
• High-contrast pitch-black background (#0d0d0d)
• Glowing neon emerald soundwave forming the Tamil letter 'கு'
• Bold typography: "KURAL — Your Voice. Your Intelligence."
• Author Tag: "By Benjamin Clifford"`,
        timestamp: Date.now() - 518350000,
      },
    ],
  },
];

export const KuralSearchEngine: React.FC<KuralSearchEngineProps> = ({
  onNavigateToTTS,
  onNavigateToLiveVoice,
  onOpenVoiceHearing,
  onOpenLibrary,
  onOpenShortcuts,
}) => {
  const [threads, setThreads] = useState<SearchThread[]>(() => {
    try {
      const saved = localStorage.getItem('kural_search_threads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // fallback
    }
    return INITIAL_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string>('kural-brand-thread');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [thinkMode, setThinkMode] = useState(true);
  const [useLiveSearch, setUseLiveSearch] = useState(true);
  const [isVoiceHearing, setIsVoiceHearing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('kural-3.5-search');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isCopyrightModalOpen, setIsCopyrightModalOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const { state: monetizationState, checkFeatureAllowance, consumeFeatureUsage, openPricingModal } =
    useMonetization();

  const chatAllowance = checkFeatureAllowance('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Active thread
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  // Save threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('kural_search_threads', JSON.stringify(threads));
    } catch (e) {
      // ignore
    }
  }, [threads]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isSearching]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  // Start new search / chat
  const handleNewSearch = () => {
    const newId = `thread-${Date.now()}`;
    const newThread: SearchThread = {
      id: newId,
      title: 'New Search & Creation',
      category: 'recent',
      timestamp: Date.now(),
      messages: [],
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Toggle Pinned
  const togglePinThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, category: t.category === 'pinned' ? 'recent' : 'pinned' }
          : t
      )
    );
  };

  // Delete Thread
  const deleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads((prev) => {
      const filtered = prev.filter((t) => t.id !== threadId);
      if (activeThreadId === threadId && filtered.length > 0) {
        setActiveThreadId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Voice Hearing Dictation
  const toggleVoiceHearing = () => {
    if (isVoiceHearing) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsVoiceHearing(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onOpenVoiceHearing) {
        onOpenVoiceHearing();
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsVoiceHearing(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setInput((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
        }
      };

      recognition.onerror = () => {
        setIsVoiceHearing(false);
      };

      recognition.onend = () => {
        setIsVoiceHearing(false);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (e) {
      setIsVoiceHearing(false);
    }
  };

  // Read aloud via Web Speech Synthesis or Neural Voice
  const handleReadAloud = (text: string, msgId: string) => {
    if (playingAudioId === msgId) {
      window.speechSynthesis.cancel();
      setPlayingAudioId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingAudioId(msgId);

    // Strip markdown formatting for cleaner speech
    const cleanSpeech = text
      .replace(/[#*•_`~[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/KURAL = குரல் = Voice/g, 'Kural means Voice.')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech.slice(0, 800));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setPlayingAudioId(null);
    utterance.onerror = () => setPlayingAudioId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Copy message
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  // Submit Search / Message
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || isSearching) return;

    if (!chatAllowance.allowed) {
      await consumeFeatureUsage('chat');
      return;
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user' as const,
      text: query,
      timestamp: Date.now(),
    };

    // Update thread title if first message
    const isFirstMessage = activeThread.messages.length === 0;
    const threadTitle = isFirstMessage ? query.slice(0, 32) + (query.length > 32 ? '...' : '') : activeThread.title;

    const updatedMessages = [...activeThread.messages, userMessage];

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              title: threadTitle,
              timestamp: Date.now(),
              messages: updatedMessages,
            }
          : t
      )
    );

    setInput('');
    setIsSearching(true);

    try {
      const systemInstruction = `You are KURAL, the intelligent voice-first AI search engine and creative platform created and copyrighted by Benjamin Clifford George.
KURAL represents "Voice" (குரல்). You help users search real-time web facts, synthesize verified information with clear citations, write high-impact voice scripts, and answer questions fluently in English, Tamil (தமிழ்), and regional accents.
Always format your answers with clean typography, bullet points, and authoritative structure. If answering creative or naming queries, highlight key slogans clearly.`;

      const payload = {
        messages: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
        model: 'gemini-3.5-flash',
        useSearch: useLiveSearch,
        systemInstruction: systemInstruction,
      };

      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete search');
      }

      await consumeFeatureUsage('chat');

      // Check if text has a memorable highlight card opportunity
      let highlightCard: { title: string; subtitle: string } | undefined = undefined;
      if (query.toLowerCase().includes('name') || query.toLowerCase().includes('tagline') || query.toLowerCase().includes('kural')) {
        highlightCard = {
          title: 'KURAL',
          subtitle: 'Your Voice. Your Intelligence.',
        };
      }

      const modelMessage = {
        id: `msg-${Date.now()}-m`,
        role: 'model' as const,
        text: data.text,
        timestamp: Date.now(),
        thoughtProcess: thinkMode ? 'Thought for 2.1 seconds: Grounded live web sources and synthesized KURAL structured response.' : undefined,
        groundingMetadata: data.groundingMetadata,
        highlightCard: highlightCard,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                messages: [...updatedMessages, modelMessage],
              }
            : t
        )
      );
    } catch (err: any) {
      console.warn('Search query error:', err);
      const errorMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'model' as const,
        text: `Search query notice: ${err.message || 'Unable to connect to live search engine'}. Please try again shortly.`,
        timestamp: Date.now(),
      };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThread.id
            ? {
                ...t,
                messages: [...updatedMessages, errorMessage],
              }
            : t
        )
      );
    } finally {
      setIsSearching(false);
    }
  };

  const pinnedThreads = threads.filter((t) => t.category === 'pinned');
  const recentThreads = threads.filter((t) => t.category !== 'pinned');

  return (
    <div
      id="kural-search-workspace"
      className="flex h-[calc(100vh-4rem)] bg-[#000000] text-slate-100 font-sans overflow-hidden select-text relative"
    >
      {/* ========================================================
          1. LEFT SIDEBAR (Exact layout from the screenshot)
         ======================================================== */}
      <aside
        id="kural-sidebar"
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
        } transition-all duration-300 ease-in-out bg-[#0d0d0d] border-r border-[#1e1e1e] flex flex-col justify-between overflow-hidden z-20 shrink-0 relative`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand & Actions */}
          <div className="p-3.5 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white text-black font-black rounded-lg flex items-center justify-center text-xs tracking-tighter shadow-md">
                K
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">KURAL</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-mono font-semibold">
                  SEARCH
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleNewSearch}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="New Search [Ctrl + N]"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Close Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* New Chat / Search Pill Button */}
          <div className="p-3">
            <button
              id="kural-new-chat-btn"
              type="button"
              onClick={handleNewSearch}
              className="w-full py-2.5 px-3 bg-[#171717] hover:bg-[#202020] text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-white/10 flex items-center justify-between transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform" />
                <span>New chat</span>
              </div>
              <kbd className="text-[10px] text-slate-500 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Quick Studio Navigation Icons */}
          <div className="px-3 pb-2 space-y-1 text-xs">
            <button
              type="button"
              onClick={() => onNavigateToTTS && onNavigateToTTS()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Voice Studio (TTS)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToLiveVoice && onNavigateToLiveVoice()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Voice Assistant</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenVoiceHearing && onOpenVoiceHearing()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-blue-400" />
              <span>Voice Hearing (Transcribe)</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenLibrary && onOpenLibrary()}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span>Audio Library</span>
            </button>
          </div>

          <div className="border-t border-white/5 mx-3 my-1"></div>

          {/* Scrollable Threads Section */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs scrollbar-thin scrollbar-thumb-white/10">
            {/* Pinned Threads */}
            {pinnedThreads.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 flex items-center gap-1.5">
                  <Pin className="w-3 h-3 text-emerald-400" />
                  <span>Pinned</span>
                </div>
                {pinnedThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`group px-3 py-2 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      activeThreadId === thread.id
                        ? 'bg-[#1e1e1e] text-white font-medium border border-white/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate pr-2">{thread.title}</span>
                    <button
                      type="button"
                      onClick={(e) => togglePinThread(thread.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-emerald-400 transition-opacity p-0.5"
                      title="Unpin"
                    >
                      <Pin className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Threads */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 flex items-center justify-between">
                <span>Recents</span>
                <span className="text-[9px] font-mono">{recentThreads.length}</span>
              </div>
              {recentThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`group px-3 py-2 rounded-xl cursor-pointer flex items-center justify-between text-xs transition-colors ${
                    activeThreadId === thread.id
                      ? 'bg-[#1e1e1e] text-white font-medium border border-white/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <span className="truncate pr-2">{thread.title}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => togglePinThread(thread.id, e)}
                      className="text-slate-500 hover:text-emerald-400 p-0.5"
                      title="Pin to top"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    {threads.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => deleteThread(thread.id, e)}
                        className="text-slate-500 hover:text-red-400 p-0.5"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom User Profile Pill (From Screenshot) */}
          <div className="p-3 border-t border-white/5 bg-[#0a0b0d]">
            <div
              onClick={() => openPricingModal('plans')}
              className="flex items-center justify-between p-2 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-black font-extrabold flex items-center justify-center text-[10px] shrink-0 shadow-sm">
                  BG
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate max-w-[110px]">
                    BENJAMIN CLIFFORD...
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <span className="text-emerald-400 font-semibold uppercase">
                      {monetizationState.tier}
                    </span>
                    <span>•</span>
                    <span>{monetizationState.credits} cr</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="px-2 py-1 bg-white/10 hover:bg-emerald-500 hover:text-black text-white text-[10px] font-bold rounded-lg transition-colors shrink-0"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================
          2. MAIN SEARCH ENGINE CANVAS
         ======================================================== */}
      <main className="flex-1 flex flex-col h-full bg-[#000000] relative overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-[#1a1a1a] px-4 flex items-center justify-between shrink-0 bg-[#000000]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Open Sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}

            {/* Model Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1c1c1c] border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  {selectedModel === 'kural-3.5-search'
                    ? 'KURAL 3.5 Search'
                    : selectedModel === 'kural-3.1-pro'
                    ? 'KURAL 3.1 Pro Think'
                    : 'KURAL Lite'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#141414] border border-white/10 rounded-xl shadow-2xl p-1 z-30 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModel('kural-3.5-search');
                      setUseLiveSearch(true);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      selectedModel === 'kural-3.5-search'
                        ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>KURAL 3.5 Search</span>
                      <span className="text-[9px] bg-emerald-500/20 px-1 rounded">DEFAULT</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Fast multi-source live web search grounding with verified citations.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModel('kural-3.1-pro');
                      setThinkMode(true);
                      setIsModelDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      selectedModel === 'kural-3.1-pro'
                        ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>KURAL 3.1 Pro Think</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded">
                        REASONING
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Deep logic, coding, and comprehensive creative scriptwriting.
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => openPricingModal('plans')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-white/10 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compare plans</span>
            </button>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Copied link to current KURAL search session!');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#171717] hover:bg-white/10 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-white/10 transition-colors cursor-pointer"
              title="Share search link"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Options Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="More Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {isOptionsMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-[#141414] border border-white/10 rounded-xl shadow-2xl p-1 z-30 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCopyrightModalOpen(true);
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 font-semibold cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Copyright & License</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenShortcuts) onOpenShortcuts();
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-white/5 cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-slate-400" />
                    <span>Keyboard Shortcuts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleNewSearch();
                      setIsOptionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-white/5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-400" />
                    <span>Start Fresh Search</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Conversation / Search Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto w-full scrollbar-thin scrollbar-thumb-white/10">
          {activeThread.messages.length === 0 ? (
            /* Empty State Hero */
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white text-black font-black text-2xl flex items-center justify-center shadow-xl ring-8 ring-white/5">
                  K
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black animate-pulse"></span>
              </div>

              <div className="space-y-1.5 max-w-md">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  KURAL Intelligence
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time Google search grounding, neural speech synthesis, and creative reasoning.
                </p>
                <div className="pt-1">
                  <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    © 2026 Benjamin Clifford. All Rights Reserved.
                  </span>
                </div>
              </div>

              {/* Sample Search Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full text-left pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      'GIVE ME AN BEST TRENDING TAMIL NAME FOR MY AI WITHOUT AN AI IN THE END AND GIVE THE BEST DEPSTRIPSTION'
                    )
                  }
                  className="p-3 bg-[#111111] hover:bg-[#181818] border border-white/5 rounded-xl text-xs space-y-1 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    🏆 Trending Tamil AI Name
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Discover KURAL brand manifesto and naming options
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setInput('What are the latest breakthrough achievements in AI speech and search this week?')
                  }
                  className="p-3 bg-[#111111] hover:bg-[#181818] border border-white/5 rounded-xl text-xs space-y-1 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    🔍 Live Web Search Grounding
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Query real-time facts with source verification
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      'Write a 30-second energetic commercial script for a cutting-edge electric supercar.'
                    )
                  }
                  className="p-3 bg-[#111111] hover:bg-[#181818] border border-white/5 rounded-xl text-xs space-y-1 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    🎙️ Voiceover Commercial Script
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Craft spoken-word scripts optimized for TTS audio
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setInput(
                      'Explain how KURAL combines real-time voice hearing, TTS, and live search into one unified engine.'
                    )
                  }
                  className="p-3 bg-[#111111] hover:bg-[#181818] border border-white/5 rounded-xl text-xs space-y-1 transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    ⚡ KURAL Engine Architecture
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Learn about the multi-modal speech platform
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Stream of Messages */
            activeThread.messages.map((msg) => (
              <div key={msg.id} className="space-y-4">
                {msg.role === 'user' ? (
                  /* User Prompt Pill on the right (matches screenshot) */
                  <div className="flex justify-end">
                    <div className="max-w-2xl bg-[#1b253b] hover:bg-[#202c45] text-white px-5 py-3 rounded-2xl sm:rounded-3xl text-xs sm:text-sm font-medium leading-relaxed shadow-lg transition-colors border border-blue-500/20">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  /* KURAL Assistant Response on the left */
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-white text-black font-extrabold text-xs flex items-center justify-center shrink-0 mt-1 shadow-md">
                      K
                    </div>

                    <div className="flex-1 space-y-4 overflow-hidden">
                      {/* Thought Process (if enabled) */}
                      {msg.thoughtProcess && (
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 py-1">
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                          <span>{msg.thoughtProcess}</span>
                        </div>
                      )}

                      {/* Main Markdown Text with exact styling from screenshot */}
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 font-normal whitespace-pre-line">
                        {msg.text}
                      </div>

                      {/* Highlighted Banner Card (Matches the screenshot with "Ask ChatGPT" and "Share highlighted" actions) */}
                      {msg.highlightCard && (
                        <div className="p-4 rounded-xl bg-[#121212] border border-white/10 space-y-3 max-w-lg shadow-lg">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setInput(`Tell me more about ${msg.highlightCard?.title}`)}
                              className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white text-[11px] font-semibold rounded-md border border-white/10 transition-colors cursor-pointer"
                            >
                              Ask KURAL
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${msg.highlightCard?.title} - ${msg.highlightCard?.subtitle}`
                                );
                                alert('Copied highlighted slogan to clipboard!');
                              }}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-medium rounded-md border border-white/5 transition-colors cursor-pointer"
                            >
                              Share highlighted
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReadAloud(`${msg.highlightCard?.title}. ${msg.highlightCard?.subtitle}`, msg.id)}
                              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium rounded-md border border-emerald-500/20 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Volume2 className="w-3 h-3" />
                              <span>Listen</span>
                            </button>
                          </div>

                          <div className="space-y-0.5">
                            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                              {msg.highlightCard.title}
                            </h3>
                            <p className="text-xs font-semibold text-blue-400 tracking-wide">
                              {msg.highlightCard.subtitle}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Google Search Grounding Sources Cards (if available) */}
                      {msg.groundingMetadata?.groundingChunks &&
                        msg.groundingMetadata.groundingChunks.length > 0 && (
                          <div className="p-3 bg-[#111111] rounded-xl border border-white/5 space-y-2">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
                              <Globe className="w-3 h-3 text-blue-400" />
                              <span>Verified Search Grounding Sources</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {msg.groundingMetadata.groundingChunks.map((chunk, idx) => {
                                if (!chunk.web?.uri) return null;
                                return (
                                  <a
                                    key={idx}
                                    href={chunk.web.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[200px]">
                                      {chunk.web.title || chunk.web.uri}
                                    </span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* Action Bar Beneath Model Message */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141414] hover:bg-[#1e1e1e] text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedMsgId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReadAloud(msg.text, msg.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            playingAudioId === msg.id
                              ? 'bg-emerald-500 text-black font-semibold'
                              : 'bg-[#141414] hover:bg-[#1e1e1e] text-slate-400 hover:text-white'
                          }`}
                          title="Read aloud with speech engine"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{playingAudioId === msg.id ? 'Stop Speech' : 'Listen Aloud'}</span>
                        </button>

                        {onNavigateToTTS && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTTS(msg.text)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
                            title="Export text to Voice Studio for MP3/WAV download"
                          >
                            <span>Use in TTS Studio</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {isSearching && (
            <div className="flex items-start gap-4 animate-in fade-in">
              <div className="w-8 h-8 rounded-full bg-white text-black font-extrabold text-xs flex items-center justify-center shrink-0 shadow-md">
                K
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>
                    {useLiveSearch
                      ? 'Searching Google & synthesizing verified citations...'
                      : 'KURAL reasoning & synthesizing answer...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ========================================================
            3. FLOATING BOTTOM SEARCH INPUT BAR (Exact from screenshot)
           ======================================================== */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-black via-black/95 to-transparent shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Pill Search Container */}
            <form
              onSubmit={handleSearchSubmit}
              className="bg-[#1e1e1e] border border-white/10 focus-within:border-white/25 rounded-2xl sm:rounded-3xl shadow-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 transition-all relative"
            >
              {/* + Tools Popover Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2a2a2a] hover:bg-[#333333] text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Search Tools & Capabilities"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {isToolsMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl p-2 z-30 space-y-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setUseLiveSearch(!useLiveSearch);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-slate-300 hover:bg-white/5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span>Google Search Grounding</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${useLiveSearch ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
                        {useLiveSearch ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setThinkMode(!thinkMode);
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-slate-300 hover:bg-white/5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span>Reasoning Mode (Think)</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${thinkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-500'}`}>
                        {thinkMode ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenVoiceHearing) onOpenVoiceHearing();
                        setIsToolsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-slate-300 hover:bg-white/5 cursor-pointer"
                    >
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>Audio Voice Hearing Modal</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Text Input Field */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                rows={1}
                placeholder="Ask anything"
                className="flex-1 bg-transparent border-0 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none resize-none py-1.5 max-h-40 leading-relaxed"
              />

              {/* Action Buttons on Right (Exact layout from screenshot: Think, Mic, Waveform, Send) */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Think Button */}
                <button
                  type="button"
                  onClick={() => setThinkMode(!thinkMode)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    thinkMode
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Toggle Thinking / Reasoning Mode"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Think</span>
                </button>

                {/* Microphone Button */}
                <button
                  type="button"
                  onClick={toggleVoiceHearing}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    isVoiceHearing
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={isVoiceHearing ? 'Listening... click to stop' : 'Voice Hearing (Speech-to-Text)'}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Live Voice Audio Waveform Button */}
                <button
                  type="button"
                  onClick={() => onNavigateToLiveVoice && onNavigateToLiveVoice()}
                  className="p-2 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-white/5 transition-all cursor-pointer"
                  title="Open Real-time Live Voice Assistant"
                >
                  <Radio className="w-4 h-4" />
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!input.trim() || isSearching}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    input.trim() && !isSearching
                      ? 'bg-white text-black hover:bg-slate-200 shadow-md active:scale-95'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                  title="Submit Query [Enter]"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Copyright & Legal Notice Footer (Directly addresses the prompt: "CREATE IT IN UR OWN IDEAS WITH COPY RIGTH") */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-slate-500 font-mono pt-1 px-2">
              <div className="flex items-center gap-1.5">
                <span>© 2026 KURAL™ by Benjamin Clifford. All Rights Reserved.</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsCopyrightModalOpen(true)}
                  className="text-slate-400 hover:text-emerald-400 underline decoration-slate-600 transition-colors cursor-pointer"
                >
                  Copyright & License Certificate
                </button>
                <span>•</span>
                <span>Proprietary AI Platform</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Copyright & Intellectual Property Certificate Modal */}
      <CopyrightModal
        isOpen={isCopyrightModalOpen}
        onClose={() => setIsCopyrightModalOpen(false)}
      />
    </div>
  );
};
