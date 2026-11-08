import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { generateBackgroundMusicWav, generateBurmeseSpeechWav } from './audioGenerator.js';
import { RecapSlide, RenderRequest } from '../src/types/index.js';

const execAsync = promisify(exec);

const EXPORT_DIR = path.resolve(process.cwd(), 'public', 'exports');
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

/**
 * Format seconds into SRT timestamp (00:00:01,200)
 */
function formatSrtTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Creates a stylish gradient image with Burmese title text for text slides
 */
function createGradientSvg(title: string, content: string, width: number, height: number, color1 = '#1e1b4b', color2 = '#0f172a'): string {
  // Escape XML entities
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeContent = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="50%" stop-color="#2e1065"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <circle cx="${width * 0.8}" cy="${height * 0.2}" r="${width * 0.25}" fill="#8b5cf6" opacity="0.15" filter="url(#glow)"/>
    <circle cx="${width * 0.2}" cy="${height * 0.8}" r="${width * 0.3}" fill="#06b6d4" opacity="0.12" filter="url(#glow)"/>
    
    <text x="${width / 2}" y="${height * 0.42}" font-family="Noto Sans Myanmar, sans-serif" font-weight="bold" font-size="${Math.round(width * 0.045)}" fill="#facc15" text-anchor="middle" filter="url(#glow)">${safeTitle}</text>
    <text x="${width / 2}" y="${height * 0.55}" font-family="Noto Sans Myanmar, sans-serif" font-size="${Math.round(width * 0.026)}" fill="#f1f5f9" text-anchor="middle" opacity="0.95">${safeContent.slice(0, 70)}</text>
    ${safeContent.length > 70 ? `<text x="${width / 2}" y="${height * 0.62}" font-family="Noto Sans Myanmar, sans-serif" font-size="${Math.round(width * 0.026)}" fill="#f1f5f9" text-anchor="middle" opacity="0.95">${safeContent.slice(70, 140)}</text>` : ''}
    
    <rect x="${width * 0.1}" y="${height * 0.85}" width="${width * 0.8}" height="2" fill="#8b5cf6" opacity="0.4"/>
    <text x="${width / 2}" y="${height * 0.92}" font-family="Noto Sans Myanmar, sans-serif" font-size="${Math.round(width * 0.02)}" fill="#a78bfa" text-anchor="middle">BaiYuChen Myanmar Video Recap • 30 ရက်တာ Studio</text>
  </svg>`;
}

export async function renderRecapVideo(req: RenderRequest): Promise<{ videoUrl: string; downloadUrl: string; duration: number }> {
  const jobId = randomUUID();
  const workDir = path.resolve('/tmp', `recap-${jobId}`);
  fs.mkdirSync(workDir, { recursive: true });

  const is16by9 = req.aspectRatio === '16:9';
  const is1080p = req.resolution === '1080p';

  const width = is16by9 ? (is1080p ? 1920 : 1280) : (is1080p ? 1080 : 720);
  const height = is16by9 ? (is1080p ? 1080 : 720) : (is1080p ? 1920 : 1280);

  const slides: RecapSlide[] = req.slides && req.slides.length > 0 ? req.slides : [
    {
      id: 'default-1',
      type: 'photo',
      title: 'ပုဂံခေတ် စစ်သည်တော်တို့၏ သမိုင်းဝင် တိုက်ပွဲကြီး',
      burmeseText: 'နေတိုး နှင့် မြင့်မြတ် တို့၏ ပြင်းထန်သော အက်ရှင် တိုက်ခိုက်ခန်း ၃၀ ရက်တာ Recap စတင်ပါပြီ။',
      duration: 5,
      transition: 'fade',
      kenBurns: true,
    }
  ];

  // Calculate slide durations & generate SRT subtitles
  let currentTime = 0;
  let srtContent = '';
  const slideImageFiles: { filePath: string; duration: number; kenBurns?: boolean }[] = [];

  for (let idx = 0; idx < slides.length; idx++) {
    const slide = slides[idx];
    const duration = Math.max(3, Number(slide.duration) || 4);
    const startSrt = formatSrtTime(currentTime);
    const endSrt = formatSrtTime(currentTime + duration);
    currentTime += duration;

    // Subtitle cue
    srtContent += `${idx + 1}\n${startSrt} --> ${endSrt}\n${slide.title}\n${slide.burmeseText}\n\n`;

    // Prepare slide image
    const imagePath = path.join(workDir, `slide_${idx}.png`);

    if (slide.imageUrl && slide.imageUrl.startsWith('data:image')) {
      const base64Data = slide.imageUrl.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
    } else if (slide.imageUrl && slide.imageUrl.startsWith('http')) {
      try {
        const response = await fetch(slide.imageUrl);
        const arrayBuf = await response.arrayBuffer();
        fs.writeFileSync(imagePath, Buffer.from(arrayBuf));
      } catch (err) {
        // Fallback to svg
        const svg = createGradientSvg(slide.title, slide.burmeseText, width, height);
        fs.writeFileSync(path.join(workDir, `slide_${idx}.svg`), svg);
        await execAsync(`ffmpeg -y -i "${path.join(workDir, `slide_${idx}.svg`)}" "${imagePath}"`);
      }
    } else {
      // Create SVG and convert via ffmpeg to PNG
      const svg = createGradientSvg(slide.title, slide.burmeseText, width, height);
      fs.writeFileSync(path.join(workDir, `slide_${idx}.svg`), svg);
      await execAsync(`ffmpeg -y -i "${path.join(workDir, `slide_${idx}.svg`)}" "${imagePath}"`);
    }

    slideImageFiles.push({
      filePath: imagePath,
      duration,
      kenBurns: slide.kenBurns ?? true,
    });
  }

  const totalDuration = currentTime;

  // Write SRT file
  const srtPath = path.join(workDir, 'subtitles.srt');
  fs.writeFileSync(srtPath, srtContent, 'utf-8');

  // Generate Narration Audio
  const combinedText = slides.map(s => `${s.title}။ ${s.burmeseText}`).join(' ');
  const isFemale = req.selectedVoiceId.includes('female') || ['clear-articulate', 'sweet-female', 'polite-female', 'romance-pro', 'royal-palace-pro', 'drama-pro'].includes(req.selectedVoiceId);
  const speechVolume = typeof req.speechVolume === 'number' ? req.speechVolume : 1.0;
  const speechSpeed = typeof req.speechSpeed === 'number' ? req.speechSpeed : 1.0;

  const { wavBuffer: narrationWav } = generateBurmeseSpeechWav(
    combinedText,
    speechSpeed,
    speechVolume,
    isFemale ? 1.15 : 0.95,
    isFemale ? 'female' : 'male',
    totalDuration
  );
  const narrationAudioPath = path.join(workDir, 'narration.wav');
  fs.writeFileSync(narrationAudioPath, narrationWav);

  // Generate Background Music
  const bgMusicVolume = typeof req.bgMusicVolume === 'number' ? req.bgMusicVolume : 0.35;
  const bgMusicWav = generateBackgroundMusicWav(req.bgMusicId || 'epic-cinematic', totalDuration + 2);
  const bgMusicAudioPath = path.join(workDir, 'bgm.wav');
  fs.writeFileSync(bgMusicAudioPath, bgMusicWav);

  // Build FFmpeg command to assemble video
  // 1. Create slideshow concat script or complex filter
  const outputFileName = `recap-${jobId}.mp4`;
  const outputPath = path.join(EXPORT_DIR, outputFileName);

  // Generate concat demuxer file
  const concatListPath = path.join(workDir, 'slides.txt');
  let concatText = '';
  slideImageFiles.forEach((item) => {
    concatText += `file '${item.filePath}'\nduration ${item.duration}\n`;
  });
  // FFmpeg concat demuxer requires repeating the last file
  if (slideImageFiles.length > 0) {
    concatText += `file '${slideImageFiles[slideImageFiles.length - 1].filePath}'\n`;
  }
  fs.writeFileSync(concatListPath, concatText);

  // Prepare subtitle styling filter with Noto Sans Myanmar font
  const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
  const subtitleFilter = req.subtitlesEnabled !== false
    ? `,subtitles='${escapedSrtPath}':force_style='FontName=Noto Sans Myanmar,FontSize=${Math.round(height * 0.038)},PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=4,MarginV=${Math.round(height * 0.08)}'`
    : '';

  // Audio mix filter: narration + bgm with custom volumes
  const audioMixFilter = `[1:a]volume=${speechVolume}[a1];[2:a]volume=${bgMusicVolume}[a2];[a1][a2]amix=inputs=2:duration=first[aout]`;

  // Visual filter: scale and fit target canvas, apply subtle zoom
  const visualFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black${subtitleFilter}`;

  const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -i "${narrationAudioPath}" -i "${bgMusicAudioPath}" -filter_complex "${audioMixFilter};[0:v]${visualFilter}[vout]" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${totalDuration} "${outputPath}"`;

  console.log(`[FFmpeg] Rendering job ${jobId}...`);
  try {
    await execAsync(ffmpegCmd);
    console.log(`[FFmpeg] Successfully exported: ${outputPath}`);
  } catch (renderError: any) {
    console.warn(`[FFmpeg] Full complex render failed, attempting simplified render:`, renderError.message);
    // Simplified fallback render without complex subtitle font if font issue occurred
    const fallbackCmd = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -i "${narrationAudioPath}" -i "${bgMusicAudioPath}" -filter_complex "${audioMixFilter};[0:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black[vout]" -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 192k -t ${totalDuration} "${outputPath}"`;
    await execAsync(fallbackCmd);
  }

  // Cleanup work directory asynchronously
  setTimeout(() => {
    try {
      fs.rmSync(workDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  }, 10000);

  return {
    videoUrl: `/exports/${outputFileName}`,
    downloadUrl: `/api/recap/download/${outputFileName}`,
    duration: totalDuration,
  };
}
