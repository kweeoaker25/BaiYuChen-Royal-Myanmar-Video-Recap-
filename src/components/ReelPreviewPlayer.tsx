import React, { useState, useEffect, useRef } from 'react';
import { RecapSlide, VoicePersona } from '../types';
import { Play, Pause, ChevronLeft, ChevronRight, Volume2, Sparkles, Film } from 'lucide-react';

interface ReelPreviewPlayerProps {
  slides: RecapSlide[];
  voice: VoicePersona;
  speed: number;
  volume: number;
  bgMusicId: string;
  bgMusicVolume: number;
  aspectRatio: '16:9' | '9:16';
}

export const ReelPreviewPlayer: React.FC<ReelPreviewPlayerProps> = ({
  slides,
  voice,
  speed,
  volume,
  bgMusicId,
  bgMusicVolume,
  aspectRatio,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0); // 0 to 100%

  const speechAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  const activeSlide = slides[currentSlideIndex] || slides[0];
  const slideDuration = Math.max(3, activeSlide?.duration || 4);

  // Play narration audio for current slide
  const playSlideNarration = async (slide: RecapSlide) => {
    try {
      if (speechAudioRef.current) {
        speechAudioRef.current.pause();
      }

      const textToSpeak = `${slide.title}။ ${slide.burmeseText}`;
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voiceId: voice.id,
          speed,
          volume,
        }),
      });

      if (!res.ok) throw new Error('Speech synthesis failed');
      const data = await res.json();

      if (data.audioDataUrl) {
        const audio = new Audio(data.audioDataUrl);
        audio.playbackRate = speed;
        audio.volume = volume;
        audio.play().catch(() => {});
        speechAudioRef.current = audio;
      }
    } catch (e) {
      // Fallback to browser Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const textToSpeak = `${slide.title}။ ${slide.burmeseText}`;
        const utt = new SpeechSynthesisUtterance(textToSpeak);
        utt.rate = speed;
        utt.volume = volume;
        utt.pitch = voice.pitch;
        window.speechSynthesis.speak(utt);
      }
    }
  };

  // Start background music loop
  const startBgm = () => {
    try {
      if (!bgmAudioRef.current) {
        const bgm = new Audio(`/api/audio/bgm/${bgMusicId}`);
        bgm.loop = true;
        bgm.volume = bgMusicVolume;
        bgm.play().catch(() => {});
        bgmAudioRef.current = bgm;
      } else {
        bgmAudioRef.current.volume = bgMusicVolume;
        bgmAudioRef.current.play().catch(() => {});
      }
    } catch (e) {
      // ignore
    }
  };

  const stopAllAudio = () => {
    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
    }
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    if (isPlaying) {
      startBgm();
      playSlideNarration(activeSlide);

      const startTime = Date.now();
      const durationMs = slideDuration * 1000;

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / durationMs) * 100);
        setSlideProgress(pct);

        if (elapsed >= durationMs) {
          clearInterval(timerRef.current);
          setSlideProgress(0);
          if (currentSlideIndex < slides.length - 1) {
            setCurrentSlideIndex((prev) => prev + 1);
          } else {
            // Loop back or stop
            setIsPlaying(false);
            stopAllAudio();
            setCurrentSlideIndex(0);
          }
        }
      }, 50);
    } else {
      clearInterval(timerRef.current);
      setSlideProgress(0);
      stopAllAudio();
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSlideIndex]);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const handlePrev = () => {
    stopAllAudio();
    setSlideProgress(0);
    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const handleNext = () => {
    stopAllAudio();
    setSlideProgress(0);
    setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const isPortrait = aspectRatio === '9:16';

  return (
    <div className="w-full flex flex-col items-center">
      {/* Player Frame */}
      <div
        className={`w-full relative overflow-hidden rounded-2xl bg-black border border-purple-500/40 shadow-2xl flex flex-col justify-between ${
          isPortrait ? 'max-w-xs aspect-[9/16]' : 'max-w-xl aspect-[16/9]'
        }`}
      >
        {/* Visual Background (Ken Burns animation) */}
        {activeSlide.type === 'photo' && activeSlide.imageUrl ? (
          <div
            className={`absolute inset-0 bg-cover bg-center transition-all duration-[4000ms] ease-out ${
              isPlaying && activeSlide.kenBurns !== false ? 'scale-110 translate-y-1' : 'scale-100'
            }`}
            style={{ backgroundImage: `url(${activeSlide.imageUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#0f172a] flex items-center justify-center">
            <div className="w-full h-full absolute inset-0 opacity-20 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>
        )}

        {/* Top bar info */}
        <div className="relative z-10 p-3 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-900/70 border border-purple-500/40 text-[10px] font-bold text-purple-200">
              Slide {currentSlideIndex + 1} / {slides.length}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-amber-300 font-semibold uppercase">
              {activeSlide.type}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-purple-300">
            <Volume2 className="w-3 h-3 text-purple-400" />
            <span>{voice.burmeseName}</span>
          </div>
        </div>

        {/* Center Title overlay */}
        <div className="relative z-10 px-4 text-center my-auto">
          <div className="inline-block px-3 py-1 rounded-full bg-black/50 border border-amber-500/30 text-[11px] text-amber-400 font-bold mb-2 shadow-lg">
            ပုဂံ ရှေးဟောင်း စစ်သည်တော် တိုက်ပွဲကြီး
          </div>
          <h2 className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] leading-snug">
            {activeSlide.title}
          </h2>
        </div>

        {/* Bottom Subtitles & Scrubber */}
        <div className="relative z-10 p-3 flex flex-col gap-2">
          {/* Synchronized Burmese Subtitle */}
          <div className="px-3 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-purple-500/30 text-center shadow-lg">
            <p className="text-xs sm:text-sm text-yellow-300 font-medium leading-relaxed drop-shadow-md">
              {activeSlide.burmeseText}
            </p>
          </div>

          {/* Timeline progress line */}
          <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 h-full transition-all duration-75"
              style={{ width: `${slideProgress}%` }}
            />
          </div>

          {/* Controls: Prev, Play/Pause, Next */}
          <div className="flex items-center justify-between text-white">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-slate-300 transition"
              title="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/40 transition scale-105"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span>ခေတ္တရပ်</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Reel အစအဆုံး ကြည့်မည်</span>
                </>
              )}
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-slate-300 transition"
              title="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
