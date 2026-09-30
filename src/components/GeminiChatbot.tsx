import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Search,
  Globe,
  Loader2,
  Trash2,
  Bot,
  User,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Brain,
  Cpu,
  Settings2,
  Coins,
  Mic,
  MicOff,
  Ear
} from 'lucide-react';
import { useMonetization } from '../context/MonetizationContext';

interface GeminiChatbotProps {
  onInsertScriptToTTS: (script: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  modelUsed?: string;
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
  };
}

const BOT_ROLES = [
  {
    id: 'scriptwriter',
    title: 'Voiceover & Scriptwriter',
    description: 'Crafts high-impact voice scripts with pauses, inflections, and pacing for TTS.',
    systemInstruction:
      'You are BENJAMIN.AI Lead Voiceover Scriptwriter. You craft polished, engaging, and spoken-word optimized scripts for audiobooks, commercials, YouTube videos, and podcasts. Include natural pauses, pronunciation guidance, and clear tone cues.',
  },
  {
    id: 'storyteller',
    title: 'Cinematic Storyteller',
    description: 'Writes dramatic narratives, character dialogues, and vivid scene descriptions.',
    systemInstruction:
      'You are a master cinematic storyteller. You create vivid, evocative scenes, captivating dialogues, and emotional narrative arcs suitable for voice narration and video generation.',
  },
  {
    id: 'researcher',
    title: 'Fact Researcher & Summarizer',
    description: 'Researches breaking news and accurate facts with Google Search Grounding.',
    systemInstruction:
      'You are an authoritative research assistant. You verify real-time facts, current events, and statistics using Google Search and synthesize them into scannable summaries ready for voice broadcasting.',
  },
  {
    id: 'commercial',
    title: 'Commercial & Ad Copywriter',
    description: 'Generates high-converting 15s, 30s, and 60s radio and video ad copy.',
    systemInstruction:
      'You are an award-winning advertising copywriter. You write punchy, persuasive 15-second, 30-second, and 60-second commercials with strong hooks, clear benefits, and compelling calls-to-action.',
  },
];

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  onInsertScriptToTTS,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am your BENJAMIN.AI Creative Assistant. Ask me to write high-impact voiceover scripts, optimize pacing for studio speech, or toggle Google Search Grounding to research real-time facts.",
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<
    'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'
  >('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState(BOT_ROLES[0].id);
  const [useSearch, setUseSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHearing, setIsHearing] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  const { checkFeatureAllowance, consumeFeatureUsage, openPricingModal } = useMonetization();
  const chatAllowance = checkFeatureAllowance('chat');

  const threadEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const toggleVoiceHearing = () => {
    if (isHearing) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
      setIsHearing(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsHearing(true);
      };

      recognition.onresult = (event: any) => {
        let transcriptText = '';
        for (let i = 0; i < event.results.length; i++) {
          transcriptText += event.results[i][0].transcript;
        }
        if (transcriptText) {
          setInput(transcriptText);
        }
      };

      recognition.onend = () => {
        setIsHearing(false);
      };

      recognition.onerror = () => {
        setIsHearing(false);
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.warn('Voice hearing dictation error:', err);
      setIsHearing(false);
    }
  };

  // Listen for Windows shortcut events
  useEffect(() => {
    const handleToggleSearch = () => {
      setUseSearch((prev) => !prev);
    };

    window.addEventListener('benjamin:toggle-search-grounding', handleToggleSearch);
    return () => {
      window.removeEventListener('benjamin:toggle-search-grounding', handleToggleSearch);
    };
  }, []);

  const currentRoleObj = BOT_ROLES.find((r) => r.id === selectedRole) || BOT_ROLES[0];

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Check freemium limit / credits
    const allowance = checkFeatureAllowance('chat');
    if (!allowance.allowed) {
      await consumeFeatureUsage('chat');
      return;
    }

    const userText = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Map history for API
      const apiMessages = newHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: useSearch ? 'gemini-3.5-flash' : selectedModel,
          systemInstruction: currentRoleObj.systemInstruction,
          useSearch: useSearch,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const botMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
        groundingMetadata: data.groundingMetadata,
      };

      setMessages((prev) => [...prev, botMsg]);
      // Consume chat usage
      await consumeFeatureUsage('chat', {
        tokenCount: userText.length + (data.text?.length || 100),
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `Error: ${err.message || 'Could not connect to Gemini.'} Please check your GEMINI_API_KEY in Secrets.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        text: "Conversation cleared. Ready to brainstorm new scripts or search real-time web topics!",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div id="gemini-chatbot-container" className="bg-[#0e1013] border border-white/5 rounded-xl flex flex-col h-[750px] shadow-2xl overflow-hidden">
      {/* Chat Top Controls & Model Selector */}
      <div className="p-4 border-b border-white/5 bg-[#0a0b0d]/60 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Role and Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                Gemini Scriptwriter & Research Chat
              </h2>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                Multi-Turn
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate max-w-sm sm:max-w-md">
              {currentRoleObj.description}
            </p>
          </div>
        </div>

        {/* Right: Controls (Model selector, Search toggle, Clear) */}
        <div className="flex items-center gap-2">
          {/* Google Search Grounding Toggle */}
          <button
            type="button"
            onClick={() => setUseSearch(!useSearch)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              useSearch
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-sm'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
            title="Search Grounding using gemini-3.5-flash with googleSearch tool [Alt + G]"
          >
            <Globe className={`w-3.5 h-3.5 ${useSearch ? 'text-blue-400 animate-spin-slow' : 'text-slate-400'}`} />
            <span>Google Search Data</span>
            <kbd className="px-1 py-0.2 bg-[#0a0b0d] border border-white/10 rounded text-[9px] font-mono text-slate-300 ml-1 hidden sm:inline-block">
              Alt+G
            </kbd>
            <span className={`w-1.5 h-1.5 rounded-full ${useSearch ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
          </button>

          {/* Model Selector Dropdown */}
          <select
            value={useSearch ? 'gemini-3.5-flash' : selectedModel}
            disabled={useSearch}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="bg-[#14171c] border border-white/10 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="gemini-3.5-flash">gemini-3.5-flash (General Tasks)</option>
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Reasoning)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Speed)</option>
          </select>

          {/* Role Selector */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-[#14171c] border border-white/10 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500/50 cursor-pointer hidden sm:block"
          >
            {BOT_ROLES.map((role) => (
              <option key={role.id} value={role.id}>
                Role: {role.title}
              </option>
            ))}
          </select>

          {/* Clear Thread */}
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer rounded"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Grounding Active Banner */}
      {useSearch && (
        <div className="bg-blue-950/30 border-b border-blue-500/20 px-4 py-2 flex items-center justify-between text-xs text-blue-300">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>Search Grounding active: Questions will search real-time Google web data using <strong>gemini-3.5-flash</strong>.</span>
          </div>
          <span className="text-[10px] text-blue-400 font-mono">Live Grounding</span>
        </div>
      )}

      {/* Messages Scrollable Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                msg.role === 'user'
                  ? 'bg-slate-700 text-white'
                  : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Bubble Content */}
            <div className={`space-y-2 max-w-[85%]`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-black font-medium rounded-tr-none'
                    : 'bg-[#14171c] border border-white/5 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {msg.text}
              </div>

              {/* Search Grounding Sources & Queries (if available) */}
              {msg.groundingMetadata && (
                <div className="bg-[#0a0b0d] border border-blue-500/20 p-3 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px]">
                    <Globe className="w-3 h-3" />
                    <span>Google Search Grounding Sources:</span>
                  </div>

                  {msg.groundingMetadata.webSearchQueries && msg.groundingMetadata.webSearchQueries.length > 0 && (
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {msg.groundingMetadata.webSearchQueries.map((q, idx) => (
                        <span key={idx} className="bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                          "{q}"
                        </span>
                      ))}
                    </div>
                  )}

                  {msg.groundingMetadata.groundingChunks && msg.groundingMetadata.groundingChunks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.groundingMetadata.groundingChunks.map((chunk, idx) => {
                        if (!chunk.web?.uri) return null;
                        return (
                          <a
                            key={idx}
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[180px]">{chunk.web.title || chunk.web.uri}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Bot Action Bar (Copy, Send to TTS, Send to Video) */}
              {msg.role === 'model' && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(msg.id, msg.text)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onInsertScriptToTTS(msg.text)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>Use in TTS Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {msg.modelUsed && (
                    <span className="text-[10px] text-slate-600 font-mono ml-auto">
                      via {msg.modelUsed}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 mr-auto">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#14171c] border border-white/5 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>
                {useSearch ? 'Searching Google & synthesizing verified data...' : 'Generating script with Gemini...'}
              </span>
            </div>
          </div>
        )}
        <div ref={threadEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-white/5 bg-[#0a0b0d]/40 flex flex-wrap gap-1.5">
        <span className="text-[10px] font-semibold uppercase text-slate-600 self-center mr-1">
          Suggestions:
        </span>
        <button
          type="button"
          onClick={() => setInput('Write a 30-second energetic commercial script for an innovative electric car')}
          className="text-[11px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-white/5 transition-colors cursor-pointer"
        >
          30s Car Commercial
        </button>
        <button
          type="button"
          onClick={() => {
            setUseSearch(true);
            setInput('What are the latest breakthrough achievements in AI speech and video synthesis this year?');
          }}
          className="text-[11px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 transition-colors cursor-pointer"
        >
          🔍 Search Latest AI Breakthroughs
        </button>
        <button
          type="button"
          onClick={() => setInput('Write a calming 1-minute guided meditation script with soft breath cues')}
          className="text-[11px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-white/5 transition-colors cursor-pointer"
        >
          Meditation Script
        </button>

        {/* Quota Badge */}
        <div className="ml-auto self-center">
          {chatAllowance.isFreeTier && chatAllowance.remainingFree !== Infinity ? (
            <span
              onClick={() => openPricingModal('usage')}
              className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono cursor-pointer hover:bg-emerald-500/20"
              title="Daily free chatbot messages remaining"
            >
              {chatAllowance.remainingFree}/20 free msgs today
            </span>
          ) : (
            <span
              onClick={() => openPricingModal('credits')}
              className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-mono cursor-pointer hover:text-white flex items-center gap-1"
            >
              <Coins className="w-3 h-3 text-emerald-400" />
              <span>0.5 Credit / msg</span>
            </span>
          )}
        </div>
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 border-t border-white/5 bg-[#0e1013] flex items-center gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            useSearch
              ? 'Ask anything to search live web data and craft scripts...'
              : 'Ask Gemini to write, edit, or optimize your audio scripts...'
          }
          className="flex-1 bg-[#14171c] text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 border border-white/5 focus:border-emerald-500/50 focus:outline-none text-sm transition-all"
        />

        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-[#14171c] border border-white/10 rounded text-[10px] font-mono text-slate-400">
          <span className="text-white font-bold">Ctrl</span> + <span className="text-white font-bold">Enter</span>
        </kbd>

        <button
          type="button"
          onClick={toggleVoiceHearing}
          className={`p-3 rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer ${
            isHearing
              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
              : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 border border-white/5'
          }`}
          title={isHearing ? 'Hearing voice... Click to stop' : 'AI Voice Hearing (Dictate prompt)'}
        >
          {isHearing ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`p-3 rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer ${
            isLoading || !input.trim()
              ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-95'
          }`}
          title="Send message [Enter or Ctrl + Enter]"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
