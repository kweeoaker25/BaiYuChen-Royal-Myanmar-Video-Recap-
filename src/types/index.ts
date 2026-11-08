/**
 * Types for BaiYuChen Myanmar Video Recap Application
 * Version 0.2 – Royal Professional Edition
 */

export type SlideType = 'photo' | 'text' | 'video';

export interface RecapSlide {
  id: string;
  type: SlideType;
  title: string;
  burmeseText: string;
  duration: number; // in seconds (e.g., 5s, 8s, 10s)
  imageUrl?: string;
  videoUrl?: string;
  transition: 'fade' | 'slide' | 'zoom' | 'wipe' | 'none';
  kenBurns?: boolean;
  bgGradient?: string;
  badge?: string;
}

export interface VoicePersona {
  id: string;
  name: string;
  burmeseName: string;
  gender: 'male' | 'female';
  isPro: boolean;
  category: string;
  description: string;
  sampleText: string;
  pitch: number;
  rate: number;
  avatarEmoji: string;
  geminiVoiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
}

export interface SubtitleCue {
  id: string;
  slideId: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
}

export type LicenseTier = 'free_trial' | 'premium_vip';

export interface LicenseInfo {
  key: string;
  tier: LicenseTier;
  status: 'active' | 'expired' | 'revoked';
  expiresAt: string;
  daysRemaining: number;
  assignedEmail?: string;
  note?: string;
  usageCount: number;
  maxUsage: number;
  createdAt: string;
}

export interface UserSession {
  userId: string;
  email: string;
  isOwner: boolean;
  license: LicenseInfo;
  hasCustomGeminiKey: boolean;
  dailyGeminiUsage: number;
  maxDailyGeminiUsage: number;
  trophiesCount: number;
  timelineCount: number;
}

export interface BackgroundMusicTrack {
  id: string;
  name: string;
  burmeseName: string;
  category: string;
  duration: number;
  mood: string;
}

export interface RenderRequest {
  slides: RecapSlide[];
  selectedVoiceId: string;
  speechSpeed: number; // 0.75, 1.0, 1.25, etc.
  speechVolume: number; // 0.0 - 1.0
  resolution: '720p' | '1080p';
  aspectRatio: '16:9' | '9:16';
  bgMusicId: string;
  bgMusicVolume: number;
  subtitlesEnabled: boolean;
  totalDurationSeconds: number;
  userEmail?: string;
  licenseKey?: string;
}

export interface RenderResponse {
  success: boolean;
  jobId: string;
  videoUrl?: string;
  downloadUrl?: string;
  duration?: number;
  error?: string;
}
