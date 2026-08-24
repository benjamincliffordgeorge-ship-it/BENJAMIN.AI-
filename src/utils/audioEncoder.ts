import { Mp3Encoder } from '@breezystack/lamejs';
import { AudioFormat } from '../types';

/**
 * Converts Float32Array audio samples into Int16Array PCM samples
 */
export function floatToInt16(floatSamples: Float32Array): Int16Array {
  const int16Samples = new Int16Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i++) {
    const s = Math.max(-1, Math.min(1, floatSamples[i]));
    int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Samples;
}

/**
 * Normalizes audio float array to peak amplitude of targetPeak (-0.5 dB ~= 0.94)
 */
export function normalizeAudioData(samples: Float32Array, targetPeak: number = 0.95): Float32Array {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > peak) peak = abs;
  }

  if (peak === 0 || peak === targetPeak) {
    return new Float32Array(samples);
  }

  const multiplier = targetPeak / peak;
  const normalized = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    normalized[i] = Math.max(-1, Math.min(1, samples[i] * multiplier));
  }
  return normalized;
}

/**
 * Applies a quick fade in (e.g. 15ms) and fade out (e.g. 30ms) to avoid clicks
 */
export function applyFade(samples: Float32Array, sampleRate: number): Float32Array {
  const result = new Float32Array(samples);
  const fadeInFrames = Math.min(Math.floor(sampleRate * 0.02), Math.floor(result.length / 4));
  const fadeOutFrames = Math.min(Math.floor(sampleRate * 0.04), Math.floor(result.length / 4));

  for (let i = 0; i < fadeInFrames; i++) {
    const factor = i / fadeInFrames;
    result[i] *= factor;
  }

  const end = result.length;
  for (let i = 0; i < fadeOutFrames; i++) {
    const factor = (fadeOutFrames - i) / fadeOutFrames;
    result[end - fadeOutFrames + i] *= factor;
  }

  return result;
}

/**
 * Encodes audio PCM into uncompressed standard 16-bit RIFF WAV format
 */
export function encodeWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const int16Samples = floatToInt16(samples);
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = int16Samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM audio data
  let offset = 44;
  for (let i = 0; i < int16Samples.length; i++, offset += 2) {
    view.setInt16(offset, int16Samples[i], true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Encodes audio PCM into high-quality MP3 format using LAME encoder
 */
export function encodeMp3Blob(samples: Float32Array, sampleRate: number, kbps: 128 | 192 | 320 = 192): Blob {
  const int16Samples = floatToInt16(samples);
  const channels = 1;
  const encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];
  const sampleBlockSize = 1152;

  for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
    const chunk = int16Samples.subarray(i, i + sampleBlockSize);
    const mp3buf = encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const flushBuf = encoder.flush();
  if (flushBuf.length > 0) {
    mp3Data.push(new Uint8Array(flushBuf));
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Encodes AudioBuffer into OGG / Opus format using browser MediaRecorder
 */
export async function encodeOggBlob(audioBuffer: AudioBuffer): Promise<Blob> {
  // Use offline / realtime Web Audio pipeline connected to MediaRecorder
  return new Promise((resolve, reject) => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(dest);

      // Determine supported mime type for Ogg / Opus
      const mimeTypes = [
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/webm;codecs=opus',
        'audio/webm',
      ];
      let selectedMime = 'audio/ogg';
      for (const m of mimeTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(dest.stream, {
        mimeType: selectedMime,
        audioBitsPerSecond: 192000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: 'audio/ogg' });
        audioCtx.close();
        resolve(finalBlob);
      };

      recorder.onerror = (err) => {
        audioCtx.close();
        reject(err);
      };

      recorder.start();
      source.start();

      source.onended = () => {
        // Allow a small padding buffer for recorder completion
        setTimeout(() => {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }, 150);
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Decode Base64 Raw PCM (16-bit 24kHz or custom rate) into Float32Array
 */
export function pcmBase64ToFloat32(base64: string): Float32Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

/**
 * Create AudioBuffer from Float32Array PCM samples
 */
export function createAudioBufferFromFloat32(
  samples: Float32Array,
  sampleRate: number = 24000
): AudioBuffer {
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const buffer = audioCtx.createBuffer(1, samples.length, sampleRate);
  buffer.copyToChannel(samples, 0);
  return buffer;
}

/**
 * Master Export function for any format with options
 */
export async function exportAudioBlob(
  audioBuffer: AudioBuffer,
  format: AudioFormat,
  options: {
    mp3Bitrate?: 128 | 192 | 320;
    normalize?: boolean;
    fadeInOut?: boolean;
  } = {}
): Promise<{ blob: Blob; mimeType: string; extension: string }> {
  let channelData = audioBuffer.getChannelData(0);

  if (options.normalize) {
    channelData = normalizeAudioData(channelData);
  }
  if (options.fadeInOut) {
    channelData = applyFade(channelData, audioBuffer.sampleRate);
  }

  if (format === 'wav') {
    const blob = encodeWavBlob(channelData, audioBuffer.sampleRate);
    return { blob, mimeType: 'audio/wav', extension: 'wav' };
  }

  if (format === 'mp3') {
    const bitrate = options.mp3Bitrate || 192;
    const blob = encodeMp3Blob(channelData, audioBuffer.sampleRate, bitrate);
    return { blob, mimeType: 'audio/mp3', extension: 'mp3' };
  }

  if (format === 'ogg') {
    // Make processed audio buffer for ogg encoding
    const processedBuffer = createAudioBufferFromFloat32(channelData, audioBuffer.sampleRate);
    const blob = await encodeOggBlob(processedBuffer);
    return { blob, mimeType: 'audio/ogg', extension: 'ogg' };
  }

  throw new Error(`Unsupported format: ${format}`);
}

/**
 * Utility to trigger browser file download
 */
export function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}
