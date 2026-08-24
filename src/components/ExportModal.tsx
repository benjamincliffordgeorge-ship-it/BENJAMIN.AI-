import React, { useState } from 'react';
import { GeneratedClip, AudioFormat } from '../types';
import { exportAudioBlob, triggerFileDownload } from '../utils/audioEncoder';
import { formatBytes } from '../utils/webSpeechFallback';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Share2,
  Check,
  Layers,
} from 'lucide-react';

interface ExportModalProps {
  clip: GeneratedClip | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ clip, isOpen, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>('mp3');
  const [mp3Bitrate, setMp3Bitrate] = useState<128 | 192 | 320>(192);
  const [normalize, setNormalize] = useState(true);
  const [fadeInOut, setFadeInOut] = useState(true);
  const [customFileName, setCustomFileName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen || !clip || !clip.audioBuffer) return null;

  const defaultBaseName = `speech-${clip.voice.toLowerCase()}-${clip.tone}-${Date.now().toString().slice(-4)}`;
  const finalBaseName = customFileName.trim() || defaultBaseName;

  // Approximate file size calculations
  const duration = clip.audioBuffer.duration;
  const sampleRate = clip.audioBuffer.sampleRate;
  const estimatedWavBytes = Math.round(duration * sampleRate * 2 + 44);
  const estimatedMp3Bytes = Math.round((duration * (mp3Bitrate * 1000)) / 8);
  const estimatedOggBytes = Math.round((duration * 128000) / 8);

  const getEstimatedSize = (fmt: AudioFormat) => {
    if (fmt === 'wav') return formatBytes(estimatedWavBytes);
    if (fmt === 'mp3') return formatBytes(estimatedMp3Bytes);
    return formatBytes(estimatedOggBytes);
  };

  const handleExportSingle = async (format: AudioFormat) => {
    if (!clip.audioBuffer) return;
    try {
      setIsExporting(true);
      setExportSuccess(null);

      const result = await exportAudioBlob(clip.audioBuffer, format, {
        mp3Bitrate: mp3Bitrate,
        normalize: normalize,
        fadeInOut: fadeInOut,
      });

      const fullFileName = `${finalBaseName}.${result.extension}`;
      triggerFileDownload(result.blob, fullFileName);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });

      setExportSuccess(`Successfully downloaded ${fullFileName}`);
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    if (!clip.audioBuffer) return;
    try {
      setIsExporting(true);
      const formats: AudioFormat[] = ['mp3', 'wav', 'ogg'];
      for (const fmt of formats) {
        const result = await exportAudioBlob(clip.audioBuffer, fmt, {
          mp3Bitrate: mp3Bitrate,
          normalize: normalize,
          fadeInOut: fadeInOut,
        });
        const fullFileName = `${finalBaseName}.${result.extension}`;
        triggerFileDownload(result.blob, fullFileName);
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });

      setExportSuccess(`Successfully downloaded MP3, WAV, and OGG files!`);
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err) {
      console.error('Batch export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleWebShare = async () => {
    if (!clip.audioBuffer) return;
    try {
      setIsExporting(true);
      const result = await exportAudioBlob(clip.audioBuffer, selectedFormat, {
        mp3Bitrate,
        normalize,
        fadeInOut,
      });
      const file = new File([result.blob], `${finalBaseName}.${result.extension}`, {
        type: result.mimeType,
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Exported Speech Audio',
          text: `Audio speech generated with ${clip.voiceName} Voice`,
        });
      } else {
        triggerFileDownload(result.blob, `${finalBaseName}.${result.extension}`);
        setExportSuccess('Native Web Share not supported in this browser; downloaded file instead.');
      }
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="export-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="export-modal-content"
        className="bg-[#0e1013] border border-white/10 rounded-xl w-full max-w-xl shadow-2xl p-6 relative space-y-6 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Audio</h2>
              <p className="text-xs text-slate-500">
                Choose format, quality, and audio tuning parameters
              </p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2.5">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {/* MP3 */}
            <button
              id="format-tab-mp3"
              onClick={() => setSelectedFormat('mp3')}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                selectedFormat === 'mp3'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-emerald-400">MP3</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  Compressed
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Universal compatibility (~{getEstimatedSize('mp3')})</p>
            </button>

            {/* WAV */}
            <button
              id="format-tab-wav"
              onClick={() => setSelectedFormat('wav')}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                selectedFormat === 'wav'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-200">WAV</span>
                <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                  Lossless
                </span>
              </div>
              <p className="text-[11px] text-slate-500">16-bit Studio Master (~{getEstimatedSize('wav')})</p>
            </button>

            {/* OGG */}
            <button
              id="format-tab-ogg"
              onClick={() => setSelectedFormat('ogg')}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                selectedFormat === 'ogg'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-200">OGG</span>
                <span className="text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                  Opus
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Modern web & apps (~{getEstimatedSize('ogg')})</p>
            </button>
          </div>
        </div>

        {/* MP3-specific bitrate */}
        {selectedFormat === 'mp3' && (
          <div className="bg-[#14171c] border border-white/5 p-3.5 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">MP3 Quality Bitrate</span>
              <span className="font-mono text-emerald-400 font-bold">{mp3Bitrate} kbps</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([128, 192, 320] as const).map((rate) => (
                <button
                  key={rate}
                  id={`bitrate-btn-${rate}`}
                  onClick={() => setMp3Bitrate(rate)}
                  className={`py-1.5 px-2 rounded-md text-xs font-mono font-medium border transition-all cursor-pointer ${
                    mp3Bitrate === rate
                      ? 'bg-emerald-500 text-black font-bold border-emerald-500'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {rate} kbps {rate === 192 ? '(Default)' : rate === 320 ? '(HD)' : '(Voice)'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audio Tuning Options */}
        <div className="space-y-3">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Audio Enhancements
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Normalize Gain */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-[#14171c] border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
              <div>
                <div className="text-xs font-semibold text-slate-200">Volume Normalization</div>
                <div className="text-[11px] text-slate-500">Peak boost to -0.5 dB</div>
              </div>
              <input
                id="toggle-normalize"
                type="checkbox"
                checked={normalize}
                onChange={(e) => setNormalize(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-white/10 focus:ring-emerald-500 cursor-pointer"
              />
            </label>

            {/* Smooth Fade In/Out */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-[#14171c] border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
              <div>
                <div className="text-xs font-semibold text-slate-200">Smooth Edge Fade</div>
                <div className="text-[11px] text-slate-500">Eliminate start/end pops</div>
              </div>
              <input
                id="toggle-fade"
                type="checkbox"
                checked={fadeInOut}
                onChange={(e) => setFadeInOut(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-white/10 focus:ring-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Custom File Name */}
        <div>
          <label htmlFor="custom-filename-input" className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1.5">
            File Name
          </label>
          <div className="flex items-center bg-[#14171c] border border-white/5 rounded-lg px-3 py-2 text-sm focus-within:border-emerald-500/50">
            <input
              id="custom-filename-input"
              type="text"
              placeholder={defaultBaseName}
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              className="w-full bg-transparent text-slate-200 placeholder-slate-600 outline-none"
            />
            <span className="text-slate-500 font-mono text-xs ml-2">
              .{selectedFormat}
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        {exportSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-white/5">
          {/* Main Download Button */}
          <button
            id="download-selected-format-btn"
            onClick={() => handleExportSingle(selectedFormat)}
            disabled={isExporting}
            className="w-full py-3 px-4 rounded-lg bg-white hover:bg-slate-200 active:scale-[0.99] text-black font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isExporting ? 'Encoding Audio...' : `Download .${selectedFormat.toUpperCase()} Audio`}
            </span>
          </button>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="download-all-formats-btn"
              onClick={handleExportAll}
              disabled={isExporting}
              className="py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download All 3</span>
            </button>

            <button
              id="share-native-btn"
              onClick={handleWebShare}
              disabled={isExporting}
              className="py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Share File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

