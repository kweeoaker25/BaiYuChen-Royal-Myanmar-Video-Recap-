import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  activateLicenseKey,
  generateNewLicense,
  getAllLicensesList,
  revokeLicenseKey,
  verifyOrGetLicense,
  checkAndIncrementUsage,
  OWNER_EMAIL,
  OWNER_TELEGRAM,
} from './server/licenseStore.js';
import { generateBackgroundMusicWav, generateBurmeseSpeechWav } from './server/audioGenerator.js';
import { renderRecapVideo } from './server/videoRenderer.js';
import { RenderRequest } from './src/types/index.js';

dotenv.config();

const app = express();
const PORT = 3000;

// High payload limit for image data URLs in slide presentations
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Ensure public exports folder exists
const EXPORTS_DIR = path.resolve(process.cwd(), 'public', 'exports');
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

// Serve exported videos statically
app.use('/exports', express.static(EXPORTS_DIR));

// Initialize server-side GoogleGenAI client
const geminiApiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -----------------------------------------------------------------
// 1. GEMINI SCRIPT & SUBTITLE GENERATOR (Server-Side)
// -----------------------------------------------------------------
app.post('/api/gemini/generate-script', async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic, durationSeconds = 30, numSlides = 4, customPrompt, userId = 'guest-user', isVip = false } = req.body;

    // Check usage limits
    const limitCheck = checkAndIncrementUsage(userId, isVip);
    if (!limitCheck.allowed) {
      res.status(429).json({
        success: false,
        error: `ယနေ့အတွက် အခမဲ့ Gemini API အသုံးပြုမှု ကန့်သတ်ချက် ပြည့်သွားပါပြီ (${limitCheck.dailyUsage}/${limitCheck.maxUsage})။ VIP License သို့ အဆင့်မြှင့်တင်ပါ သို့မဟုတ် Telegram @baiyuchen10 သို့ ဆက်သွယ်ပါ။`,
      });
      return;
    }

    if (!aiClient) {
      // Fallback pre-calculated Myanmar script if server has no GEMINI_API_KEY configured
      const sampleTopic = topic || '၃၀ ရက်တာ အက်ရှင်မြန်မာဇာတ်ကား Recap';
      res.json({
        success: true,
        data: {
          title: sampleTopic,
          summary: `${sampleTopic} ၏ စိတ်ဝင်စားဖွယ် ဇာတ်ကွက်များနှင့် အက်ရှင်တိုက်ခိုက်ခန်းများ`,
          slides: [
            {
              id: 's-1',
              title: `${sampleTopic} - အခန်း (၁)`,
              burmeseText: 'နေတိုး နှင့် မြင့်မြတ် တို့၏ ပြင်းထန်သော အက်ရှင် တိုက်ခိုက်ခန်း ၃၀ ရက်တာ Recap စတင်ပါပြီ။',
              duration: Math.round(durationSeconds / 3),
              type: 'photo',
              transition: 'fade',
              kenBurns: true,
            },
            {
              id: 's-2',
              title: 'ပုဂံခေတ် စစ်သည်တော်တို့၏ သမိုင်းဝင် တိုက်ပွဲကြီး',
              burmeseText: 'ပုဂံရှေးဟောင်း စစ်သည်တော်တို့၏ သမိုင်းဝင် တိုက်ပွဲကြီးတွင် မားမားမတ်မတ် ရပ်တည်၍ အောင်ပွဲခံခဲ့ကြသည်။',
              duration: Math.round(durationSeconds / 3),
              type: 'text',
              transition: 'zoom',
            },
            {
              id: 's-3',
              title: 'နောင်တရသွားစေမည့် စိန်ခေါ်သံ',
              burmeseText: 'မင်းငါ့ကို လာစိန်ခေါ်တာ နောင်တရသွားစေရမယ်! သစ္စာတရားနှင့် ညီအစ်ကိုစိတ်ဓာတ်ဖြင့် ရင်ဆိုင်ကြမည်။',
              duration: Math.round(durationSeconds / 3),
              type: 'photo',
              transition: 'slide',
              kenBurns: true,
            },
          ],
        },
      });
      return;
    }

    const prompt = `You are a professional Myanmar Movie & Video Recap creator for BaiYuChen Myanmar Video Recap Studio.
Generate an engaging Myanmar language Video Recap script about: "${topic || 'Action movie recap'}".
Target duration: ${durationSeconds} seconds.
Number of slides: ${numSlides || 3}.
Additional direction: ${customPrompt || 'Energetic, dramatic, natural spoken Burmese (နေတိုး and မြင့်မြတ် style action dialog)'}.

Return pure JSON matching this exact structure:
{
  "title": "Main title in Burmese",
  "summary": "1-sentence summary in Burmese",
  "slides": [
    {
      "title": "Short slide headline in Burmese",
      "burmeseText": "Natural spoken Burmese narration for this slide (1-2 sentences)",
      "duration": number (seconds for this slide, e.g. 5, 8, 10),
      "type": "photo" or "text",
      "transition": "fade" or "zoom" or "slide"
    }
  ]
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert Burmese scriptwriter and video recap director. Write natural, rhythmic Burmese unicode text with proper punctuation (။ and ၊). Never write markdown backticks or commentary outside JSON.',
        responseMimeType: 'application/json',
      },
    });

    const textOutput = response.text || '{}';
    const parsed = JSON.parse(textOutput);

    res.json({
      success: true,
      data: parsed,
      dailyUsage: limitCheck.dailyUsage,
      maxUsage: limitCheck.maxUsage,
    });
  } catch (error: any) {
    console.error('Gemini generate script error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gemini script generation failed',
    });
  }
});

// -----------------------------------------------------------------
// 2. MYANMAR VOICE ENGINE AUDIO SYNTHESIS & PREVIEW
// -----------------------------------------------------------------
app.post('/api/voice/synthesize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, voiceId = 'nay-toe', speed = 1.0, volume = 1.0 } = req.body;
    if (!text) {
      res.status(400).json({ error: 'Text is required for audio synthesis' });
      return;
    }

    const isFemale = voiceId.includes('female') || ['clear-articulate', 'sweet-female', 'polite-female', 'romance-pro', 'royal-palace-pro', 'drama-pro', 'cartoon-pro'].includes(voiceId);
    const pitch = isFemale ? 1.15 : 0.95;

    const { wavBuffer, duration } = generateBurmeseSpeechWav(
      text,
      speed,
      volume,
      pitch,
      isFemale ? 'female' : 'male'
    );

    const base64Audio = wavBuffer.toString('base64');
    res.json({
      success: true,
      audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
      duration,
      voiceId,
      subtitles: [
        {
          startTime: 0,
          endTime: duration,
          text,
        },
      ],
    });
  } catch (error: any) {
    console.error('Audio synthesize error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/voice/preview/:voiceId', (req: Request, res: Response): void => {
  const { voiceId } = req.params;
  const sampleText = 'မင်္ဂလာပါ BaiYuChen Myanmar Video Recap မှ ကြိုဆိုပါတယ်။';
  const isFemale = voiceId.includes('female') || ['clear-articulate', 'sweet-female', 'polite-female', 'romance-pro', 'royal-palace-pro', 'drama-pro'].includes(voiceId);

  const { wavBuffer } = generateBurmeseSpeechWav(sampleText, 1.0, 1.0, isFemale ? 1.15 : 0.95, isFemale ? 'female' : 'male', 3.5);
  res.setHeader('Content-Type', 'audio/wav');
  res.send(wavBuffer);
});

// -----------------------------------------------------------------
// 3. BACKGROUND MUSIC ENDPOINTS
// -----------------------------------------------------------------
app.get('/api/audio/bgm/:trackId', (req: Request, res: Response): void => {
  const { trackId } = req.params;
  const wavBuffer = generateBackgroundMusicWav(trackId, 30);
  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(wavBuffer);
});

// -----------------------------------------------------------------
// 4. ROYAL LICENSE MANAGEMENT & OWNER DASHBOARD
// -----------------------------------------------------------------
app.get('/api/license/status', (req: Request, res: Response): void => {
  const key = (req.query.key as string) || 'TRIAL-30D-FREE-2026';
  const license = verifyOrGetLicense(key);

  if (!license) {
    res.json({
      active: false,
      tier: 'none',
      status: 'invalid',
      message: 'License Key မတွေ့ရှိပါ',
    });
    return;
  }

  res.json({
    active: license.status === 'active',
    tier: license.tier,
    status: license.status,
    daysRemaining: license.daysRemaining,
    expiresAt: license.expiresAt,
    key: license.key,
    note: license.note,
    ownerEmail: OWNER_EMAIL,
    ownerTelegram: OWNER_TELEGRAM,
  });
});

app.post('/api/license/activate', (req: Request, res: Response): void => {
  const { key, email } = req.body;
  if (!key) {
    res.status(400).json({ success: false, message: 'License key ထည့်သွင်းပေးပါ' });
    return;
  }

  const result = activateLicenseKey(key, email);
  res.json(result);
});

// Admin endpoints for Owner (@baiyuchen10 / fighterking2567@gmail.com)
app.get('/api/license/admin/all', (req: Request, res: Response): void => {
  const list = getAllLicensesList();
  res.json({
    success: true,
    owner: {
      email: OWNER_EMAIL,
      telegram: OWNER_TELEGRAM,
    },
    licenses: list,
  });
});

app.post('/api/license/admin/generate', (req: Request, res: Response): void => {
  const { tier = 'premium_vip', note, email, days = 365 } = req.body;
  const newLic = generateNewLicense(tier, note, email, days);
  res.json({
    success: true,
    license: newLic,
    message: `License key အသစ် ထုတ်လုပ်ပြီးပါပြီ: ${newLic.key}`,
  });
});

app.post('/api/license/admin/revoke', (req: Request, res: Response): void => {
  const { key } = req.body;
  if (!key) {
    res.status(400).json({ success: false, message: 'Key required' });
    return;
  }
  const revoked = revokeLicenseKey(key);
  res.json({
    success: revoked,
    message: revoked ? 'License Key ကို ပယ်ဖျက်လိုက်ပါပြီ' : 'Key မတွေ့ပါ',
  });
});

// -----------------------------------------------------------------
// 5. FFmpeg VIDEO RENDERING EXPORT
// -----------------------------------------------------------------
app.post('/api/recap/render', async (req: Request, res: Response): Promise<void> => {
  try {
    const renderReq = req.body as RenderRequest;

    if (!renderReq.slides || renderReq.slides.length === 0) {
      res.status(400).json({ success: false, error: 'Slides are required for recap rendering' });
      return;
    }

    console.log(`[Recap Studio] Starting video render with ${renderReq.slides.length} slides (${renderReq.resolution}, ${renderReq.aspectRatio})...`);
    const result = await renderRecapVideo(renderReq);

    res.json({
      success: true,
      jobId: path.basename(result.videoUrl, '.mp4'),
      videoUrl: result.videoUrl,
      downloadUrl: result.downloadUrl,
      duration: result.duration,
    });
  } catch (error: any) {
    console.error('Video render failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Video rendering failed',
    });
  }
});

// Download endpoint
app.get('/api/recap/download/:filename', (req: Request, res: Response): void => {
  const { filename } = req.params;
  const safeName = path.basename(filename);
  const filePath = path.join(EXPORTS_DIR, safeName);

  if (fs.existsSync(filePath)) {
    res.download(filePath, safeName);
  } else {
    res.status(404).send('Video file not found');
  }
});

// -----------------------------------------------------------------
// 6. VITE SERVER INTEGRATION (DEV / PROD)
// -----------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BaiYuChen Myanmar Video Recap server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
