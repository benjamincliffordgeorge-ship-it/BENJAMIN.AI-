import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { VoiceSelector } from './components/VoiceSelector';
import { TextInputArea } from './components/TextInputArea';
import { AudioPlayerSection } from './components/AudioPlayerSection';
import { ExportModal } from './components/ExportModal';
import { ClipHistory } from './components/ClipHistory';
import { VoiceId, ToneStyle, GeneratedClip, AudioFormat } from './types';
import { VOICES } from './data/voices';
import {
  pcmBase64ToFloat32,
  createAudioBufferFromFloat32,
  exportAudioBlob,
  triggerFileDownload,
} from './utils/audioEncoder';
import { synthesizeWebSpeech } from './utils/webSpeechFallback';
import confetti from 'canvas-confetti';
import { AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [text, setText] = useState<string>(
    'Namaste! Welcome to BENJAMIN.AI. Convert any script into high fidelity speech with natural Indian, American, British, and Australian accents, and easily export in MP3, WAV, and OGG formats.'
  );
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('Aarav');
  const [selectedTone, setSelectedTone] = useState<ToneStyle>('natural');
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentClip, setCurrentClip] = useState<GeneratedClip | null>(null);
  const [historyClips, setHistoryClips] = useState<GeneratedClip[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [exportingFormat, setExportingFormat] = useState<AudioFormat | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.text === msg ? null : curr));
    }, 4500);
  }, []);

  // Perform TTS Generation
  const handleSynthesize = async () => {
    if (!text.trim() || isGenerating) return;

    try {
      setIsGenerating(true);

      const voiceObj = VOICES.find((v) => v.id === selectedVoice);
      const voiceDisplayName = voiceObj ? voiceObj.name : selectedVoice;

      let audioBuffer: AudioBuffer | null = null;
      let rawBase64Pcm: string | undefined = undefined;

      try {
        const response = await fetch('/api/tts/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            voice: selectedVoice,
            tone: selectedTone,
            speed: speed,
            pitch: pitch,
          }),
        });

        const data = await response.json();

        if (response.ok && data.audioBase64) {
          rawBase64Pcm = data.audioBase64;
          const floatSamples = pcmBase64ToFloat32(data.audioBase64);
          audioBuffer = createAudioBufferFromFloat32(floatSamples, data.sampleRate || 24000);
        } else if (data.useFallback) {
          // Graceful fallback to client audio generator
          audioBuffer = await synthesizeWebSpeech(text, { rate: speed, pitch });
          showToast('Speech synthesized via studio harmonic engine.', 'info');
        } else {
          throw new Error(data.error || 'Failed to synthesize audio');
        }
      } catch (networkErr: unknown) {
        console.warn('Backend TTS request error, using studio engine fallback:', networkErr);
        audioBuffer = await synthesizeWebSpeech(text, { rate: speed, pitch });
        showToast('Speech synthesized via studio harmonic engine.', 'info');
      }

      if (!audioBuffer) {
        throw new Error('Could not generate speech audio buffer.');
      }

      const newClip: GeneratedClip = {
        id: `clip-${Date.now()}`,
        text: text.trim(),
        voice: selectedVoice,
        voiceName: voiceDisplayName,
        tone: selectedTone,
        speed: speed,
        pitch: pitch,
        createdAt: Date.now(),
        durationSeconds: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        audioBuffer: audioBuffer,
        base64Pcm: rawBase64Pcm,
      };

      setCurrentClip(newClip);
      setHistoryClips((prev) => [newClip, ...prev]);
      showToast(`Generated ${newClip.durationSeconds.toFixed(1)}s speech audio!`, 'success');
    } catch (err: unknown) {
      console.error('Speech synthesis error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to generate speech';
      showToast(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Instant export handler for MP3, WAV, OGG
  const handleQuickExport = async (format: AudioFormat) => {
    if (!currentClip || !currentClip.audioBuffer) return;
    try {
      setExportingFormat(format);
      const result = await exportAudioBlob(currentClip.audioBuffer, format, {
        mp3Bitrate: 192,
        normalize: true,
        fadeInOut: true,
      });

      const fileName = `speech-${currentClip.voice.toLowerCase()}-${currentClip.tone}-${Date.now().toString().slice(-4)}.${result.extension}`;
      triggerFileDownload(result.blob, fileName);

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
      });

      showToast(`Exported ${fileName}`, 'success');
    } catch (err: unknown) {
      console.error('Export failed:', err);
      showToast('Export failed. Please try another format.', 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  // Export clip from history
  const handleExportHistoryClip = async (clip: GeneratedClip, format: AudioFormat) => {
    if (!clip.audioBuffer) return;
    try {
      const result = await exportAudioBlob(clip.audioBuffer, format, {
        mp3Bitrate: 192,
        normalize: true,
        fadeInOut: true,
      });
      const fileName = `speech-${clip.voice.toLowerCase()}-${clip.tone}-${clip.id.slice(-4)}.${result.extension}`;
      triggerFileDownload(result.blob, fileName);
      showToast(`Exported ${fileName}`, 'success');
    } catch (err: unknown) {
      console.error('Export history clip error:', err);
      showToast('Export failed.', 'error');
    }
  };

  const handleDeleteClip = (id: string) => {
    setHistoryClips((prev) => prev.filter((c) => c.id !== id));
    if (currentClip?.id === id) {
      setCurrentClip(null);
    }
  };

  const handleClearHistory = () => {
    setHistoryClips([]);
    showToast('Library cleared', 'info');
  };

  return (
    <div id="tts-app" className="min-h-screen bg-[#0a0b0d] text-slate-200 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navigation */}
      <Navbar
        historyCount={historyClips.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Toast / Notification banner */}
        {toastMessage && (
          <div
            id="app-toast-message"
            className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-150 ${
              toastMessage.type === 'success'
                ? 'bg-[#14171c] border-emerald-500/40 text-emerald-400'
                : toastMessage.type === 'error'
                ? 'bg-[#14171c] border-red-500/40 text-red-400'
                : 'bg-[#14171c] border-white/10 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-500 hover:text-white text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Voice Models & Tuning (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <VoiceSelector
              selectedVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
              selectedTone={selectedTone}
              onSelectTone={setSelectedTone}
              speed={speed}
              onChangeSpeed={setSpeed}
              pitch={pitch}
              onChangePitch={setPitch}
            />
          </div>

          {/* Right Column: Script Input & Active Audio Player & Multi-Format Exporter (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <TextInputArea
              text={text}
              onChangeText={setText}
              onSynthesize={handleSynthesize}
              isGenerating={isGenerating}
              speed={speed}
            />

            <AudioPlayerSection
              currentClip={currentClip}
              onExport={handleQuickExport}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              exportingFormat={exportingFormat}
            />
          </div>
        </div>
      </main>

      {/* Export Customization Modal */}
      <ExportModal
        clip={currentClip}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* History Drawer */}
      <ClipHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        clips={historyClips}
        onSelectClip={(clip) => setCurrentClip(clip)}
        onDeleteClip={handleDeleteClip}
        onClearHistory={handleClearHistory}
        onExportClip={handleExportHistoryClip}
      />
    </div>
  );
}
