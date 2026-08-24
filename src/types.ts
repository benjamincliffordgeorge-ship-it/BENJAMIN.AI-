export type AudioFormat = 'mp3' | 'wav' | 'ogg';

export type VoiceId =
  // Indian Accent Voices
  | 'Aarav'
  | 'Ananya'
  | 'Rohan'
  | 'Priya'
  | 'Vikram'
  | 'Isha'
  | 'Kabir'
  | 'Diya'
  // British Accent Voices
  | 'Arthur'
  | 'Eleanor'
  // Australian Accent Voices
  | 'Liam'
  | 'Chloe'
  // Core / American Voices
  | 'Kore'
  | 'Puck'
  | 'Charon'
  | 'Fenrir'
  | 'Zephyr'
  | 'Aoede'
  | 'Leda'
  | 'Orpheus';

export type ToneStyle = 
  | 'natural'
  | 'professional'
  | 'enthusiastic'
  | 'storytelling'
  | 'calm'
  | 'newscaster'
  | 'whisper';

export type AccentRegion = 'Indian' | 'American' | 'British' | 'Australian' | 'Global';

export interface VoiceOption {
  id: VoiceId;
  name: string;
  gender: 'Female' | 'Male' | 'Neutral';
  description: string;
  accent: string;
  accentRegion: AccentRegion;
  recommendedFor: string;
  geminiBaseVoice?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | 'Aoede' | 'Leda' | 'Orpheus';
  featuredTag?: string;
}

export interface TTSRequestPayload {
  text: string;
  voice: VoiceId;
  tone: ToneStyle;
  speed: number;
  pitch: number;
  language?: string;
}

export interface GeneratedClip {
  id: string;
  text: string;
  voice: VoiceId;
  voiceName: string;
  tone: ToneStyle;
  speed: number;
  pitch: number;
  createdAt: number;
  durationSeconds: number;
  sampleRate: number;
  audioBuffer: AudioBuffer | null;
  base64Pcm?: string; // Stored raw PCM for re-encoding
  cachedUrls?: Partial<Record<AudioFormat, string>>;
}

export interface ExportSettings {
  format: AudioFormat;
  mp3Bitrate: 128 | 192 | 320;
  sampleRate: number;
  normalizeGain: boolean;
  fadeInOut: boolean;
  fileName: string;
}
