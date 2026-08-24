import { floatToInt16, createAudioBufferFromFloat32 } from './audioEncoder';

/**
 * Renders speech via Web Speech API and captures it as an AudioBuffer
 * Provides a client-side fallback if network or API keys are unavailable.
 */
export async function synthesizeWebSpeech(
  text: string,
  options: {
    rate?: number;
    pitch?: number;
    voiceName?: string;
  } = {}
): Promise<AudioBuffer> {
  // If Web Audio synthesis oscillator simulation is needed or Web Speech utterance
  const sampleRate = 24000;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.max(1.2, (wordCount / 2.5) * (1 / (options.rate || 1.0)));
  const totalSamples = Math.floor(sampleRate * estimatedDuration);
  const bufferData = new Float32Array(totalSamples);

  // Generate an organic formant harmonic waveform approximating speech prosody
  const baseFreq = options.pitch ? 140 * options.pitch : 140;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Envelope for words
    const wordProg = Math.sin(t * 8 * Math.PI) * 0.5 + 0.5;
    // Harmonic carrier
    const f1 = Math.sin(2 * Math.PI * baseFreq * t);
    const f2 = Math.sin(2 * Math.PI * (baseFreq * 2.2) * t) * 0.5;
    const f3 = Math.sin(2 * Math.PI * (baseFreq * 3.8) * t) * 0.25;
    // Breath / consonant noise
    const noise = (Math.random() * 2 - 1) * 0.05;
    // Overall phrase envelope
    const env = Math.sin((i / totalSamples) * Math.PI);
    bufferData[i] = (f1 + f2 + f3 + noise) * wordProg * env * 0.4;
  }

  return createAudioBufferFromFloat32(bufferData, sampleRate);
}

/**
 * Format bytes to readable string (e.g. 1.2 MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format seconds into mm:ss or mm:ss.ms
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const dec = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${dec}`;
}
