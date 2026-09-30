import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  PhoneOff,
  Sparkles,
  AlertCircle,
  Activity,
  Layers,
  Send,
  MessageSquare,
  Coins
} from 'lucide-react';
import { useMonetization } from '../context/MonetizationContext';

interface LiveVoiceAssistantProps {
  onInsertScriptToTTS?: (text: string) => void;
}

export const LiveVoiceAssistant: React.FC<LiveVoiceAssistantProps> = ({
  onInsertScriptToTTS,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState('Ready to connect to Gemini 3.8 Live API');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Real-time transcript history
  const [transcripts, setTranscripts] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: 'Click "Start Voice Conversation" to talk in real-time with Gemini 3.8 Live.',
    },
  ]);
  const [textPrompt, setTextPrompt] = useState('');

  // Audio Context and Stream References
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const scheduledTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Clean up all audio and WS connections on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Float32 to 16-bit PCM base64
  const float32To16BitPCMBase64 = (float32Array: Float32Array): string => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Convert incoming 24kHz 16-bit PCM base64 to AudioBuffer and schedule playback
  const playIncomingAudioChunk = (base64Audio: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }

      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const binary = atob(base64Audio);
      const byteLength = binary.length;
      const sampleCount = Math.floor(byteLength / 2);
      const float32 = new Float32Array(sampleCount);

      for (let i = 0; i < sampleCount; i++) {
        const byte1 = binary.charCodeAt(i * 2);
        const byte2 = binary.charCodeAt(i * 2 + 1);
        let val = (byte2 << 8) | byte1;
        if (val >= 0x8000) val -= 0x10000;
        float32[i] = val / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (scheduledTimeRef.current < currentTime) {
        scheduledTimeRef.current = currentTime;
      }

      source.start(scheduledTimeRef.current);
      scheduledTimeRef.current += audioBuffer.duration;

      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      };
    } catch (e) {
      console.error('Error playing incoming audio chunk:', e);
    }
  };

  // Interruption handler: immediately halt any scheduled or playing audio
  const handleInterruption = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      scheduledTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setStatusText('Interrupted by user speech — listening...');
  };

  const { checkFeatureAllowance, consumeFeatureUsage, openPricingModal } = useMonetization();
  const liveAllowance = checkFeatureAllowance('live');

  const startVoiceConversation = async () => {
    // Check freemium allowance
    const allowance = checkFeatureAllowance('live');
    if (!allowance.allowed) {
      await consumeFeatureUsage('live');
      return;
    }

    try {
      setErrorMessage(null);
      setIsConnecting(true);
      setStatusText('Requesting microphone & connecting to Gemini 3.8 Live...');

      // 1. Microphone access
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        throw new Error('Microphone access is not supported in this browser or iframe environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      // 2. AudioContext at 16kHz for Gemini input
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inCtx = new AudioCtx({ sampleRate: 16000 });
      inputAudioCtxRef.current = inCtx;

      // Output AudioContext at 24kHz for playback
      const outCtx = new AudioCtx({ sampleRate: 24000 });
      outputAudioCtxRef.current = outCtx;

      // 3. Connect WebSocket to /api/live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnecting(false);
        setIsConnected(true);
        setStatusText('Live Audio Channel Active (gemini-3.8-live)');
        consumeFeatureUsage('live', { durationSeconds: 60 });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            setStatusText('Live API Connected. Speak anytime!');
          } else if (msg.type === 'audio' && msg.audio) {
            playIncomingAudioChunk(msg.audio);
            setStatusText('Gemini is speaking...');
          } else if (msg.type === 'interrupted') {
            handleInterruption();
          } else if (msg.type === 'text' && msg.text) {
            setTranscripts((prev) => [
              ...prev,
              { role: 'model', text: msg.text },
            ]);
          } else if (msg.type === 'error') {
            setErrorMessage(msg.error);
          }
        } catch (err) {
          console.error('Error handling WS message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setErrorMessage('WebSocket connection error. Ensure GEMINI_API_KEY is active in Secrets.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatusText('Live voice session ended.');
      };

      // 4. Hook microphone processor to stream 16kHz PCM chunks
      const micSource = inCtx.createMediaStreamSource(stream);
      const processor = inCtx.createScriptProcessor(4096, 1, 1);
      audioProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        if (isMutedRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Check if there is actual sound
        const base64PCM = float32To16BitPCMBase64(inputData);
        ws.send(JSON.stringify({ audio: base64PCM }));
      };

      micSource.connect(processor);
      processor.connect(inCtx.destination);

    } catch (err: any) {
      console.error('Failed to start Live API:', err);
      setIsConnecting(false);
      setIsConnected(false);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access to talk with Gemini.'
          : err.message || 'Failed to start Live session.'
      );
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setStatusText('Session disconnected.');
  };

  // Listen for Windows shortcut: Alt + V to Start / Disconnect Live Conversation
  useEffect(() => {
    const handleToggleLiveCall = () => {
      if (isConnected) {
        disconnect();
      } else if (!isConnecting) {
        startVoiceConversation();
      }
    };

    window.addEventListener('benjamin:toggle-live-call', handleToggleLiveCall);
    return () => {
      window.removeEventListener('benjamin:toggle-live-call', handleToggleLiveCall);
    };
  }, [isConnected, isConnecting]);

  const sendTextPromptToLive = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textPrompt.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ text: textPrompt.trim() }));
    setTranscripts((prev) => [...prev, { role: 'user', text: textPrompt.trim() }]);
    setTextPrompt('');
  };

  return (
    <div id="live-voice-assistant" className="bg-[#0e1013] border border-white/5 rounded-xl p-6 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'
              }`}
            ></span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Gemini Live API
            </span>
            <span className="text-[10px] bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              gemini-3.8-live
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Real-Time Voice Conversation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Low-latency bidirectional speech conversation with interruption support.
          </p>
        </div>

        {/* Live Status Pill */}
        <div
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            isConnected
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : isConnecting
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-white/5 border-white/5 text-slate-400'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse text-emerald-400' : ''}`} />
          <span>{isConnected ? 'LIVE CONNECTED' : isConnecting ? 'CONNECTING...' : 'DISCONNECTED'}</span>
        </div>
      </div>

      {/* Center Interactive Visualizer & Controls */}
      <div className="bg-[#14171c] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
        {/* Ambient Glow */}
        <div
          className={`absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isConnected ? 'bg-emerald-500/15' : 'bg-white/[0.02]'
          }`}
        ></div>

        {/* Pulsing Orb / Microphone Hub */}
        <div className="relative">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
              isConnected
                ? 'bg-emerald-500 text-black shadow-2xl shadow-emerald-500/40 ring-8 ring-emerald-500/20 animate-pulse'
                : isConnecting
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 ring-4 ring-amber-500/10'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
            }`}
          >
            {isConnected ? (
              <Mic className="w-12 h-12" />
            ) : isConnecting ? (
              <Activity className="w-12 h-12 animate-spin" />
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </div>

          {/* Animated sound wave bars when connected */}
          {isConnected && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <span className="w-1.5 h-4 bg-emerald-500 animate-bounce rounded-full"></span>
              <span className="w-1.5 h-8 bg-emerald-400 animate-bounce delay-75 rounded-full"></span>
              <span className="w-1.5 h-6 bg-emerald-500 animate-bounce delay-150 rounded-full"></span>
              <span className="w-1.5 h-10 bg-emerald-400 animate-bounce delay-100 rounded-full"></span>
              <span className="w-1.5 h-5 bg-emerald-500 animate-bounce delay-200 rounded-full"></span>
            </div>
          )}
        </div>

        {/* Status Line */}
        <div className="space-y-1 z-10 max-w-md">
          <p className="text-sm font-semibold text-white">{statusText}</p>
          <p className="text-xs text-slate-500">
            {isConnected
              ? 'Speak naturally through your microphone. Gemini 3.8 Live responds in real-time with full vocal inflections.'
              : 'Requires microphone access. Click the button below to start talking.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-3 z-10 pt-2">
          {!isConnected && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Session Quota:</span>
              {liveAllowance.isFreeTier && liveAllowance.remainingFree !== Infinity ? (
                <span
                  onClick={() => openPricingModal('usage')}
                  className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono cursor-pointer hover:bg-emerald-500/20"
                >
                  {liveAllowance.remainingFree}m free today
                </span>
              ) : (
                <span
                  onClick={() => openPricingModal('credits')}
                  className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-mono cursor-pointer hover:text-white flex items-center gap-1"
                >
                  <Coins className="w-3 h-3 text-emerald-400" />
                  <span>2 Credits / min</span>
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
          {!isConnected ? (
            <button
              type="button"
              onClick={startVoiceConversation}
              disabled={isConnecting}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center gap-2 cursor-pointer"
              title="Start Voice Conversation [Alt + V]"
            >
              <Mic className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting Live...' : 'Start Voice Conversation'}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-black/20 border border-black/20 rounded text-[10px] font-mono text-black font-semibold ml-1">
                Alt+V
              </kbd>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer ${
                  isMuted
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                }`}
                title="Toggle Mic Mute"
              >
                {isMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                <span>{isMuted ? 'Microphone Muted' : 'Mute Mic'}</span>
              </button>

              <button
                type="button"
                onClick={disconnect}
                className="px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                title="End Call [Alt + V]"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End Call</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-[10px] font-mono text-red-300 ml-1">
                  Alt+V
                </kbd>
              </button>
            </>
          )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2 z-10 max-w-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Transcript Log & Text Fallback */}
      <div className="bg-[#14171c] border border-white/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Conversation Transcripts</span>
          </span>
          <span className="text-[10px] text-slate-500">{transcripts.length} items</span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
          {transcripts.map((t, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg flex items-start gap-2 ${
                t.role === 'user' ? 'bg-white/5 text-slate-300' : 'bg-emerald-500/10 text-emerald-300'
              }`}
            >
              <span className="font-bold text-[10px] uppercase font-mono mt-0.5">
                {t.role === 'user' ? 'You:' : 'Gemini:'}
              </span>
              <span className="flex-1 leading-relaxed">{t.text}</span>
              {t.role === 'model' && onInsertScriptToTTS && (
                <button
                  type="button"
                  onClick={() => onInsertScriptToTTS(t.text)}
                  className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded cursor-pointer whitespace-nowrap"
                >
                  Use in TTS
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Text prompt fallback into active live session */}
        {isConnected && (
          <form onSubmit={sendTextPromptToLive} className="flex gap-2 pt-2 border-t border-white/5">
            <input
              type="text"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              placeholder="Send text cue to Gemini Live in real-time..."
              className="flex-1 bg-[#0a0b0d] border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={!textPrompt.trim()}
              className="px-3 py-2 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
