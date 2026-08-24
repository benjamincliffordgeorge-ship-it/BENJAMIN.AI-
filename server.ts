import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // TTS Synthesis endpoint
  app.post('/api/tts/synthesize', async (req: Request, res: Response) => {
    try {
      const { text, voice = 'Kore', tone = 'natural', speed = 1.0, pitch = 1.0, language = 'en' } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text prompt is required.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(400).json({
          error: 'GEMINI_API_KEY is not configured in Settings > Secrets. Using client-side fallback synthesis.',
          useFallback: true,
        });
      }

      const ai = getAiClient();

      // Voice mapping dictionary for Gemini TTS prebuilt voices and accent prompts
      const VOICE_MAPPINGS: Record<string, { baseVoice: string; accentPrompt: string }> = {
        // Indian Voices
        Aarav: {
          baseVoice: 'Puck',
          accentPrompt: 'with an articulate, modern Indian English accent, with authentic Indian intonation and fluent pacing',
        },
        Ananya: {
          baseVoice: 'Kore',
          accentPrompt: 'in a warm, melodious, and polite Indian English accent with natural conversational cadence',
        },
        Rohan: {
          baseVoice: 'Fenrir',
          accentPrompt: 'with a youthful, energetic, and charismatic Indian English accent',
        },
        Priya: {
          baseVoice: 'Aoede',
          accentPrompt: 'in a polished, crisp, and executive Indian English corporate accent with clear diction',
        },
        Vikram: {
          baseVoice: 'Charon',
          accentPrompt: 'in a deep, resonant, and authoritative Indian English baritone accent with commanding presence',
        },
        Isha: {
          baseVoice: 'Zephyr',
          accentPrompt: 'in a gentle, soothing, and caring Indian English accent with soft cadence',
        },
        Kabir: {
          baseVoice: 'Orpheus',
          accentPrompt: 'in a confident, expressive, and natural Indian English accent',
        },
        Diya: {
          baseVoice: 'Leda',
          accentPrompt: 'in a bright, cheerful, and vibrant Indian English accent',
        },

        // British Voices
        Arthur: {
          baseVoice: 'Orpheus',
          accentPrompt: 'in a distinguished, refined British English accent (Received Pronunciation)',
        },
        Eleanor: {
          baseVoice: 'Aoede',
          accentPrompt: 'in a crisp, sophisticated BBC-style British English accent',
        },

        // Australian Voices
        Liam: {
          baseVoice: 'Puck',
          accentPrompt: 'in a friendly, upbeat, and authentic Australian English accent',
        },
        Chloe: {
          baseVoice: 'Leda',
          accentPrompt: 'in a warm, sunny, and natural Australian English accent',
        },

        // Core / American Voices
        Kore: { baseVoice: 'Kore', accentPrompt: 'with a clear, balanced natural American accent' },
        Puck: { baseVoice: 'Puck', accentPrompt: 'with a charismatic, dynamic American accent' },
        Charon: { baseVoice: 'Charon', accentPrompt: 'in a deep, cinematic, and resonant American baritone' },
        Fenrir: { baseVoice: 'Fenrir', accentPrompt: 'with an articulate, confident executive American accent' },
        Zephyr: { baseVoice: 'Zephyr', accentPrompt: 'in a soft, soothing, and melodic studio tone' },
        Aoede: { baseVoice: 'Aoede', accentPrompt: 'in a bright, vibrant modern voice' },
        Leda: { baseVoice: 'Leda', accentPrompt: 'in a friendly, casual conversational tone' },
        Orpheus: { baseVoice: 'Orpheus', accentPrompt: 'in an eloquent theatrical tone with rich warmth' },
      };

      const selectedVoiceConfig = VOICE_MAPPINGS[voice] || {
        baseVoice: 'Kore',
        accentPrompt: 'clearly and expressively',
      };

      // Formulate expressive speech instruction prompt
      let toneDescription = 'natural flow and clear expression';
      switch (tone) {
        case 'enthusiastic':
          toneDescription = 'high energy, enthusiasm, and upbeat emotion';
          break;
        case 'professional':
          toneDescription = 'a clear, polished, authoritative corporate delivery';
          break;
        case 'storytelling':
          toneDescription = 'deep narrative expression, drama, and captivating storytelling cadence';
          break;
        case 'calm':
          toneDescription = 'a soothing, relaxed, warm, and gentle pacing';
          break;
        case 'newscaster':
          toneDescription = 'a crisp, dynamic broadcast journalism news anchor delivery';
          break;
        case 'whisper':
          toneDescription = 'a quiet, intimate, soft whisper style';
          break;
        case 'natural':
        default:
          toneDescription = 'natural, lifelike, and articulate conversational flow';
          break;
      }

      let speedNotes = '';
      if (speed < 0.85) speedNotes = ' Speak slowly and deliberately.';
      else if (speed > 1.25) speedNotes = ' Speak at a brisk, energetic tempo.';

      const fullPrompt = `Speak ${selectedVoiceConfig.accentPrompt}, delivering the text with ${toneDescription}.${speedNotes}\n\n"${text.trim()}"`;

      const selectedVoice = selectedVoiceConfig.baseVoice;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [
          {
            parts: [
              {
                text: fullPrompt,
              },
            ],
          },
        ],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: selectedVoice,
              },
            },
          },
        },
      });

      // Extract base64 audio data
      let base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      let mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/pcm;rate=24000';

      if (!base64Audio) {
        // Check if any parts have inlineData
        const candidateParts = response.candidates?.[0]?.content?.parts || [];
        for (const part of candidateParts) {
          if (part.inlineData?.data) {
            base64Audio = part.inlineData.data;
            if (part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
            break;
          }
        }
      }

      if (!base64Audio) {
        return res.status(500).json({
          error: 'No audio data returned by speech model. Using fallback generator.',
          useFallback: true,
        });
      }

      res.json({
        success: true,
        audioBase64: base64Audio,
        mimeType: mimeType,
        sampleRate: 24000,
        voice: selectedVoice,
        text: text,
      });
    } catch (err: unknown) {
      console.error('TTS Generation error:', err);
      const message = err instanceof Error ? err.message : 'Unknown server error during TTS synthesis';
      res.status(500).json({
        error: message,
        useFallback: true,
      });
    }
  });

  // Vite middleware for dev or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TTS Studio Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
