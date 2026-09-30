import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  Sparkles,
  X,
  Volume2,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  Trash2,
  Ear,
  FileAudio,
  Radio,
  RefreshCw,
  Coins
} from 'lucide-react';
import { useMonetization } from '../context/MonetizationContext';

interface VoiceHearingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToTTS: (text: string) => void;
  onInsertToChat?: (text: string) => void;
}

export const VoiceHearingModal: React.FC<VoiceHearingModalProps> = ({
  isOpen,
  onClose,
  onInsertToTTS,
  onInsertToChat,
}) => {
  const [mode, setMode] = useState<'mic' | 'upload'>('mic');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [liveInterim, setLiveInterim] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { checkFeatureAllowance, consumeFeatureUsage, openPricingModal } = useMonetization();
  const voiceAllowance = checkFeatureAllowance('voice');

  // Stop recording handler (declared before useEffect to avoid TDZ / initialization error)
  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    setIsRecording(false);
  }, []);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
    }
  }, [isOpen, stopRecording]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  // Format recording timer seconds
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start live microphone recording & hearing
  const startRecording = async () => {
    try {
      setStatusMessage(null);
      setLiveInterim('');
      audioChunksRef.current = [];

      // Check browser microphone support
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        setStatusMessage('Microphone access is not supported in this browser or iframe. You can still upload audio files below.');
        setIsRecording(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        if (audioBlob.size > 0) {
          await transcribeRecordedAudio(audioBlob);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Initialize real-time Web Speech recognition if supported for immediate live feedback
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (final) {
            setTranscript((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
          }
          setLiveInterim(interim);
        };

        recognition.onerror = (event: any) => {
          console.warn('Live SpeechRecognition notice:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setStatusMessage('Microphone access denied or unavailable. Please check permissions.');
      setIsRecording(false);
    }
  };

  // Send recorded audio to Gemini Transcribe endpoint
  const transcribeRecordedAudio = async (blob: Blob) => {
    try {
      setIsTranscribing(true);
      setStatusMessage('AI is hearing and transcribing your voice with Gemini...');

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        try {
          const res = await fetch('/api/audio/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: blob.type || 'audio/webm',
            }),
          });

          const data = await res.json();

          if (res.ok && data.text) {
            setTranscript(data.text);
            setModelUsed(data.modelUsed || 'gemini-3.5-transcribe');
            setStatusMessage(`Successfully heard and transcribed with ${data.modelUsed || 'Gemini'}!`);
            consumeFeatureUsage('voice', { charCount: data.text.length });
          } else if (data.useFallback) {
            // Keep browser interim transcript if available
            setStatusMessage('Transcribed using local browser neural engine.');
          } else {
            if (!transcript) {
              setStatusMessage(data.error || 'No speech detected.');
            }
          }
        } catch (apiErr) {
          console.warn('API transcribe error, relying on live transcript:', apiErr);
          setStatusMessage('Captured speech via microphone.');
        } finally {
          setIsTranscribing(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setIsTranscribing(false);
      setStatusMessage(err.message || 'Failed to process audio.');
    }
  };

  // Handle uploaded audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setStatusMessage(`Loaded "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
  };

  // Transcribe uploaded audio file
  const transcribeUploadedFile = async () => {
    if (!selectedFile) return;

    try {
      setIsTranscribing(true);
      setStatusMessage('Transcribing uploaded audio file with Gemini 3.5 Transcribe...');

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        const res = await fetch('/api/audio/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: selectedFile.type || 'audio/mp3',
          }),
        });

        const data = await res.json();

        if (res.ok && data.text) {
          setTranscript(data.text);
          setModelUsed(data.modelUsed || 'gemini-3.5-transcribe');
          setStatusMessage(`Transcribed ${data.wordCount || 0} words via ${data.modelUsed}!`);
          consumeFeatureUsage('voice', { charCount: data.text.length });
        } else {
          setStatusMessage(data.error || 'Failed to transcribe audio file.');
        }
        setIsTranscribing(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err: any) {
      console.error('File transcribe error:', err);
      setIsTranscribing(false);
      setStatusMessage(err.message || 'Error processing audio file.');
    }
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = transcript.length;

  return (
    <div
      id="voice-hearing-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRecording) onClose();
      }}
    >
      <div
        id="voice-hearing-card"
        className="bg-[#0e1013] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-[#14171c]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Ear className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  AI Voice Hearing & Speech Transcriber
                </h2>
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                  gemini-3.5-transcribe
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Speak into your mic or upload audio. The AI listens, hears what you say, and writes the script.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 py-3 border-b border-white/5 bg-[#0a0b0d]/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!isRecording) setMode('mic');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'mic'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Microphone Hearing</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!isRecording) setMode('upload');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'upload'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Audio Clip</span>
            </button>
          </div>

          {/* Quota Badge */}
          <div className="text-xs font-mono">
            {voiceAllowance.isFreeTier && voiceAllowance.remainingFree !== Infinity ? (
              <span
                onClick={() => openPricingModal('usage')}
                className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full cursor-pointer hover:bg-emerald-500/20"
              >
                {voiceAllowance.remainingFree}/10 free clips today
              </span>
            ) : (
              <span
                onClick={() => openPricingModal('credits')}
                className="text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full cursor-pointer hover:text-white flex items-center gap-1"
              >
                <Coins className="w-3 h-3 text-emerald-400" />
                <span>1 Credit / Hearing</span>
              </span>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 space-y-6">
          {mode === 'mic' ? (
            /* Microphone Hearing Mode */
            <div className="bg-[#14171c] border border-white/5 rounded-2xl p-6 text-center space-y-4 relative overflow-hidden">
              {/* Animated Listening Soundwave Graphic */}
              {isRecording && (
                <div className="flex items-center justify-center gap-1.5 h-12 py-2">
                  {[40, 70, 90, 60, 30, 80, 100, 50, 85, 45, 95, 65].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-emerald-400 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                      }}
                    ></div>
                  ))}
                </div>
              )}

              {/* Big Mic Button */}
              <div className="flex flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isTranscribing}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                    isRecording
                      ? 'bg-red-500 text-white shadow-red-500/30 scale-105 animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/25 hover:scale-105'
                  }`}
                  title={isRecording ? 'Click to Stop Hearing' : 'Click to Start Hearing'}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-white flex items-center justify-center gap-2">
                    {isRecording ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                        <span className="text-red-400">Listening & Hearing...</span>
                        <span className="font-mono text-white bg-black/40 px-2 py-0.5 rounded text-xs">
                          {formatTimer(recordingSeconds)}
                        </span>
                      </>
                    ) : (
                      <span>Click to Start AI Voice Hearing</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {isRecording
                      ? 'Speak naturally in any accent or language. Click the red button when finished.'
                      : 'Speak your script thoughts, prompts, or stories directly. The AI transcribes speech into text.'}
                  </p>
                </div>
              </div>

              {/* Interim Real-time Preview */}
              {isRecording && liveInterim && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-emerald-300 italic text-left max-w-md mx-auto">
                  "{liveInterim}"
                </div>
              )}
            </div>
          ) : (
            /* Upload Audio Clip Mode */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.flac"
                onChange={handleFileUpload}
                className="hidden"
                id="voice-hearing-upload-input"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 bg-[#14171c] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                    <FileAudio className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    Upload audio clip to transcribe
                  </div>
                  <div className="text-xs text-slate-500">
                    MP3, WAV, M4A, WEBM, OGG up to 25MB
                  </div>
                </div>
              ) : (
                <div className="bg-[#14171c] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <FileAudio className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white truncate max-w-xs sm:max-w-md">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setAudioUrl(null);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {audioUrl && (
                    <audio src={audioUrl} controls className="w-full h-8 rounded-md" />
                  )}

                  <button
                    type="button"
                    onClick={transcribeUploadedFile}
                    disabled={isTranscribing}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Transcribing with Gemini 3.5...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Transcribe Audio File</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status / Loading notification */}
          {isTranscribing && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
              <span>Analyzing acoustic phonemes & converting speech to text with Gemini...</span>
            </div>
          )}

          {statusMessage && !isTranscribing && (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 flex items-center justify-between">
              <span>{statusMessage}</span>
              {modelUsed && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  via {modelUsed}
                </span>
              )}
            </div>
          )}

          {/* Transcribed Text Output Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-400 uppercase tracking-wider block">
                Transcribed Speech Text
              </label>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} characters</span>
              </div>
            </div>

            <textarea
              id="voice-hearing-transcript-output"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              placeholder="Your heard speech will appear here. You can also edit or fine-tune this text before using it..."
              className="w-full bg-[#14171c] border border-white/10 rounded-xl p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-y leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!transcript}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer disabled:opacity-40"
                title="Copy to Clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTranscript('')}
                disabled={!transcript}
                className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                title="Clear transcript"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onInsertToChat && (
                <button
                  type="button"
                  onClick={() => {
                    if (!transcript) return;
                    onInsertToChat(transcript);
                    onClose();
                  }}
                  disabled={!transcript}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <span>To Chat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!transcript) return;
                  onInsertToTTS(transcript);
                  onClose();
                }}
                disabled={!transcript}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40"
              >
                <span>Insert into TTS Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
