import React, { useState, useEffect } from 'react';
import { UserSession, RecapSlide, VoicePersona, LicenseInfo } from './types';
import { MYANMAR_VOICE_PERSONAS, DEFAULT_PRESET_SLIDES } from './data/voices';
import { Header } from './components/Header';
import { NoticeCard } from './components/NoticeCard';
import { DurationSelector } from './components/DurationSelector';
import { VoiceSelector } from './components/VoiceSelector';
import { RecapStudioModal } from './components/RecapStudioModal';
import { LicenseModal } from './components/LicenseModal';
import { GeminiKeyModal } from './components/GeminiKeyModal';
import {
  Trophy,
  Film,
  Sparkles,
  Send,
  Lock,
  PlaySquare,
  Mic,
  Crown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  // User Session
  const [session, setSession] = useState<UserSession>({
    userId: 'user-01',
    email: 'fighterking2567@gmail.com', // Owner email
    isOwner: true,
    license: {
      key: 'ROYAL-VIP-9999-7777',
      tier: 'premium_vip',
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 365,
      usageCount: 0,
      maxUsage: 999999,
      createdAt: new Date().toISOString(),
    },
    hasCustomGeminiKey: false,
    dailyGeminiUsage: 0,
    maxDailyGeminiUsage: 999999,
    trophiesCount: 0,
    timelineCount: 0,
  });

  // Main Recap State
  const [selectedDuration, setSelectedDuration] = useState<number>(8);
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>(MYANMAR_VOICE_PERSONAS[0]);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [speechVolume, setSpeechVolume] = useState<number>(1.0);

  // Slides configuration
  const [slides, setSlides] = useState<RecapSlide[]>(
    DEFAULT_PRESET_SLIDES[0].slides.map((s, idx) => ({
      ...s,
      id: `slide-preset-${idx}`,
    }))
  );

  // Modals
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isGeminiKeyOpen, setIsGeminiKeyOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginEmailInput, setLoginEmailInput] = useState('');

  // Fetch initial license status
  useEffect(() => {
    fetch('/api/license/status?key=ROYAL-VIP-9999-7777')
      .then((res) => res.json())
      .then((data) => {
        if (data.active) {
          setSession((prev) => ({
            ...prev,
            license: {
              ...prev.license,
              key: data.key,
              tier: data.tier,
              status: data.status,
              daysRemaining: data.daysRemaining,
              expiresAt: data.expiresAt,
            },
          }));
        }
      })
      .catch((e) => console.warn('License status fetch error:', e));
  }, []);

  const isVip = session.license?.tier === 'premium_vip' && session.license?.status === 'active';

  const handleActivateSuccess = (license: LicenseInfo) => {
    setSession((prev) => ({
      ...prev,
      license,
    }));
  };

  const handleSaveCustomGeminiKey = (key: string) => {
    setSession((prev) => ({
      ...prev,
      hasCustomGeminiKey: true,
    }));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmailInput.trim()) {
      setSession((prev) => ({
        ...prev,
        email: loginEmailInput.trim(),
        isOwner: loginEmailInput.trim() === 'fighterking2567@gmail.com',
      }));
      setLoginPromptOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b13] text-slate-100 flex flex-col items-center">
      {/* Top Application Header */}
      <Header
        session={session}
        onOpenLicense={() => setIsLicenseOpen(true)}
        onOpenGeminiKey={() => setIsGeminiKeyOpen(true)}
        onOpenStudio={() => setIsStudioOpen(true)}
        onLoginClick={() => setLoginPromptOpen(true)}
      />

      {/* Main Container matching mobile and desktop preview */}
      <main className="w-full max-w-2xl px-4 py-5 flex flex-col gap-4">
        {/* Notice Card: Gemini Key vs License Key + Telegram Contact */}
        <NoticeCard
          onOpenGeminiKey={() => setIsGeminiKeyOpen(true)}
          onOpenLicense={() => setIsLicenseOpen(true)}
        />

        {/* Big Start Production Button matching screenshot ccc13482.jpg */}
        <div className="w-full">
          <button
            onClick={() => setIsStudioOpen(true)}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-purple-600/30 flex flex-col items-center justify-center gap-1 transition-all duration-200 transform active:scale-[0.99] border border-purple-400/40"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>
                ဗီဒီယို စတင်ထုတ်လုပ်မည် ({selectedDuration} စက္ကန့် • {selectedVoice.burmeseName} (
                {selectedVoice.gender === 'female' ? 'မ-အသံ' : 'ကျားအသံ'}))
              </span>
            </div>
            <span className="text-[11px] text-purple-200 font-normal opacity-90">
              Photo, စာသား, Video ပေါင်းစပ်၍ မြန်မာအသံဖြင့် MP4 ဗီဒီယို ဖန်တီးမည်
            </span>
          </button>
        </div>

        {/* Feature Cards matching screenshot ccc13482.jpg */}
        <div className="flex flex-col gap-2.5">
          {/* Card 1: ၃၀ ရက်တာ Video Recap Studio */}
          <div
            onClick={() => setIsStudioOpen(true)}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-[#0e1428] border border-purple-800/40 hover:border-purple-600/60 transition cursor-pointer flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>၃၀ ရက်တာ Video Recap Studio</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Photo၊ စာသား၊ Video ပေါင်းစပ်ဖန်တီးနိုင်
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-purple-400 text-xs font-semibold">
              <span>ဖွင့်ရန်</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 2: Premium License Key */}
          <div
            onClick={() => setIsLicenseOpen(true)}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-[#0e1428] border border-emerald-800/40 hover:border-emerald-600/60 transition cursor-pointer flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Premium License Key</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Telegram: @baiyuchen10
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <span>ဝယ်ယူရန်</span>
              <span>→</span>
            </div>
          </div>

          {/* Card 3: မြန်မာအသံ ၃၀ မျိုး (ကျား/မ) */}
          <div
            onClick={() => {
              const el = document.getElementById('voice-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-[#0e1428] border border-indigo-800/40 hover:border-indigo-600/60 transition cursor-pointer flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>မြန်မာအသံ ၃၀ မျိုး (ကျား/မ)</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Free ၁၀ မျိုး + Pro ၂၀ မျိုး (Unlimited)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-indigo-400 text-xs font-semibold">
              <span>ရွေးချယ်ရန်</span>
              <span>↓</span>
            </div>
          </div>
        </div>

        {/* Duration Selector (8s to 100s) */}
        <DurationSelector
          selectedDuration={selectedDuration}
          onSelectDuration={(dur) => setSelectedDuration(dur)}
          isVip={isVip}
        />

        {/* Voice Selector Section */}
        <div id="voice-section">
          <VoiceSelector
            selectedVoiceId={selectedVoice.id}
            onSelectVoice={(voice) => setSelectedVoice(voice)}
            speed={speechSpeed}
            onChangeSpeed={(spd) => setSpeechSpeed(spd)}
            volume={speechVolume}
            onChangeVolume={(vol) => setSpeechVolume(vol)}
            isVip={isVip}
            onOpenLicense={() => setIsLicenseOpen(true)}
          />
        </div>

        {/* Footer info matching screenshot */}
        <footer className="mt-6 pt-5 pb-8 border-t border-slate-800/80 text-center flex flex-col gap-1.5 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-center gap-2 text-slate-300">
            <span>BaiYuChen Myanmar Video Recap (Version 0.2)</span>
            <span>•</span>
            <a
              href="https://t.me/baiyuchen10"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline font-bold"
            >
              Telegram: @baiyuchen10
            </a>
            <span>•</span>
            <span className="text-amber-400 font-semibold">Owner: fighterking2567@gmail.com</span>
          </div>
          <p className="text-[11px] text-slate-500">
            ဗီဒီယိုမှတ်တမ်းများကို ၃၀ ရက်အထိ သိမ်းဆည်းပေးထားပါသည်
          </p>
        </footer>
      </main>

      {/* Recap Studio Modal */}
      <RecapStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        slides={slides}
        onUpdateSlides={(newSlides) => {
          setSlides(newSlides);
          setSession((prev) => ({ ...prev, timelineCount: newSlides.length }));
        }}
        voice={selectedVoice}
        speed={speechSpeed}
        volume={speechVolume}
        isVip={isVip}
        onOpenLicense={() => {
          setIsStudioOpen(false);
          setIsLicenseOpen(true);
        }}
        selectedDuration={selectedDuration}
      />

      {/* Royal License Management Modal */}
      <LicenseModal
        isOpen={isLicenseOpen}
        onClose={() => setIsLicenseOpen(false)}
        session={session}
        onActivateSuccess={handleActivateSuccess}
      />

      {/* Gemini Key Config Modal */}
      <GeminiKeyModal
        isOpen={isGeminiKeyOpen}
        onClose={() => setIsGeminiKeyOpen(false)}
        hasCustomKey={session.hasCustomGeminiKey}
        onSaveCustomKey={handleSaveCustomGeminiKey}
      />

      {/* Quick Gmail Login/Switch Modal */}
      {loginPromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0d1224] border border-purple-800/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Gmail အကောင့် ချိတ်ဆက်ခြင်း</h3>
              <button
                onClick={() => setLoginPromptOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300">
              * လုံခြုံရေးအရ Password သိမ်းဆည်းခြင်းမပြုပါ။ အသုံးပြုသူ အီးမေးလ်ဖြင့်သာ Session မှတ်သားပါသည်။
            </p>
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={loginEmailInput}
                onChange={(e) => setLoginEmailInput(e.target.value)}
                placeholder="your.email@gmail.com"
                className="px-3.5 py-2.5 rounded-xl bg-[#090d1a] border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
              >
                အကောင့်ပြောင်းမည်
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
