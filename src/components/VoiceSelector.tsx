import React, { useState } from 'react';
import { VoicePersona } from '../types';
import { MYANMAR_VOICE_PERSONAS } from '../data/voices';
import { Mic, Volume2, Gauge, Play, Square, Crown, Sparkles } from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoiceId: string;
  onSelectVoice: (voice: VoicePersona) => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  volume: number;
  onChangeVolume: (volume: number) => void;
  isVip: boolean;
  onOpenLicense: () => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  onSelectVoice,
  speed,
  onChangeSpeed,
  volume,
  onChangeVolume,
  isVip,
  onOpenLicense,
}) => {
  const [filterGender, setFilterGender] = useState<'all' | 'male' | 'female'>('all');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const selectedVoice =
    MYANMAR_VOICE_PERSONAS.find((v) => v.id === selectedVoiceId) ||
    MYANMAR_VOICE_PERSONAS[0];

  const filteredVoices = MYANMAR_VOICE_PERSONAS.filter((v) => {
    if (filterGender === 'male') return v.gender === 'male';
    if (filterGender === 'female') return v.gender === 'female';
    return true;
  });

  const handlePlayPreview = async (voice: VoicePersona, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingVoiceId === voice.id) {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setPlayingVoiceId(null);
      return;
    }

    try {
      if (audioElement) {
        audioElement.pause();
      }

      setPlayingVoiceId(voice.id);
      // Fetch synthetic voice sample from backend
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleText,
          voiceId: voice.id,
          speed,
          volume,
        }),
      });

      if (!res.ok) throw new Error('Audio preview failed');
      const data = await res.json();

      if (data.audioDataUrl) {
        const audio = new Audio(data.audioDataUrl);
        audio.playbackRate = speed;
        audio.volume = volume;
        audio.onended = () => setPlayingVoiceId(null);
        audio.onerror = () => setPlayingVoiceId(null);
        audio.play();
        setAudioElement(audio);
      }
    } catch (err) {
      console.warn('Audio preview error, using browser speech synthesis:', err);
      // Fallback to Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(voice.sampleText);
        utterance.rate = speed;
        utterance.volume = volume;
        utterance.pitch = voice.pitch;
        utterance.onend = () => setPlayingVoiceId(null);
        utterance.onerror = () => setPlayingVoiceId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayingVoiceId(null);
      }
    }
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#11172a]/90 to-[#0b0f1c]/90 border border-purple-800/30 p-4 backdrop-blur-md shadow-xl">
      {/* Title & Current voice indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-900/30">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>Recap နောက်ခံ မြန်မာအသံ ရွေးချယ်ရန် (အမျိုးအစား ၂၀)</span>
            </h3>
            <p className="text-[11px] text-purple-300 font-medium">
              လက်ရှိ: <span className="text-white font-bold">{selectedVoice.burmeseName}</span>{' '}
              <span className="text-slate-400">({selectedVoice.category})</span>
            </p>
          </div>
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex items-center gap-1 bg-[#090d1a] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilterGender('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              filterGender === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            အားလုံး (၂၀+)
          </button>
          <button
            onClick={() => setFilterGender('male')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              filterGender === 'male'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ကျားအသံ
          </button>
          <button
            onClick={() => setFilterGender('female')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
              filterGender === 'female'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            မ-အသံ
          </button>
        </div>
      </div>

      {/* Grid of Voices matching screenshots */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 my-3 max-h-64 overflow-y-auto pr-1">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPlaying = playingVoiceId === voice.id;
          const locked = voice.isPro && !isVip;

          return (
            <div
              key={voice.id}
              onClick={() => {
                if (locked) {
                  onOpenLicense();
                } else {
                  onSelectVoice(voice);
                }
              }}
              className={`p-2.5 rounded-xl cursor-pointer border transition-all duration-200 flex flex-col justify-between relative group ${
                isSelected
                  ? 'bg-purple-900/40 border-purple-400 shadow-md shadow-purple-600/20 ring-1 ring-purple-400'
                  : 'bg-[#141a2e]/70 hover:bg-[#1a233d] border-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{voice.avatarEmoji}</span>
                  <span className="text-xs font-bold text-white tracking-wide truncate max-w-[80px]">
                    {voice.burmeseName}
                  </span>
                </div>

                {voice.isPro ? (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-[9px] font-bold text-amber-300 flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" />
                    Pro
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-400 font-semibold">Free</span>
                )}
              </div>

              <div className="text-[10px] text-slate-400 truncate mb-2">
                {voice.category}
              </div>

              {/* Preview play button */}
              <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-800/60">
                <span className="text-[9px] text-slate-400">
                  {voice.gender === 'female' ? 'မ' : 'ကျား'}
                </span>
                <button
                  type="button"
                  onClick={(e) => handlePlayPreview(voice, e)}
                  className={`p-1 rounded-md text-[10px] flex items-center gap-1 transition ${
                    isPlaying
                      ? 'bg-pink-500/30 text-pink-300 ring-1 ring-pink-400 animate-pulse'
                      : 'bg-purple-700/30 hover:bg-purple-600/40 text-purple-300'
                  }`}
                  title="အသံနားထောင်ကြည့်မည်"
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-2.5 h-2.5 fill-pink-400" />
                      <span>ရပ်</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5 fill-purple-300" />
                      <span>စမ်း</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Speed & Volume Control Panel */}
      <div className="mt-3 pt-3 border-t border-purple-900/30 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0a0e1c]/70 p-3 rounded-xl border border-slate-800">
        {/* Speed */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-slate-300 text-xs">
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span>စကားပြောနှုန်း (Speed):</span>
            <span className="font-bold text-purple-300">{speed}x</span>
          </div>
          <div className="flex items-center gap-1">
            {[0.75, 1.0, 1.25, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  speed === s
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-slate-300 text-xs">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>အသံအတိုးအကျယ် (Volume):</span>
            <span className="font-bold text-emerald-300">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="w-28 accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Selected Voice Sample Preview text */}
      <div className="mt-3 p-2.5 rounded-xl bg-purple-950/20 border border-purple-800/30 flex items-start gap-2 text-xs">
        <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 text-[11px] leading-relaxed">
          <span className="text-purple-300 font-semibold">{selectedVoice.burmeseName} နမူနာအသံထွက်: </span>
          <span className="italic">"{selectedVoice.sampleText}"</span>
        </div>
      </div>
    </div>
  );
};
