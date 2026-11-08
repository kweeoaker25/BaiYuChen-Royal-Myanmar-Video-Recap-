import React, { useState, useRef } from 'react';
import { RecapSlide, VoicePersona, BackgroundMusicTrack, RenderRequest } from '../types';
import { BACKGROUND_MUSIC_TRACKS } from '../data/voices';
import { ReelPreviewPlayer } from './ReelPreviewPlayer';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Type,
  Video as VideoIcon,
  Music,
  Download,
  Play,
  Sparkles,
  Crown,
  Settings,
  Film,
  CheckCircle2,
  Volume2,
  Wand2,
} from 'lucide-react';

interface RecapStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: RecapSlide[];
  onUpdateSlides: (slides: RecapSlide[]) => void;
  voice: VoicePersona;
  speed: number;
  volume: number;
  isVip: boolean;
  onOpenLicense: () => void;
  selectedDuration: number;
}

export const RecapStudioModal: React.FC<RecapStudioModalProps> = ({
  isOpen,
  onClose,
  slides,
  onUpdateSlides,
  voice,
  speed,
  volume,
  isVip,
  onOpenLicense,
  selectedDuration,
}) => {
  const [activeTab, setActiveTab] = useState<'custom_studio' | 'auto_montage'>('custom_studio');
  const [selectedSlideId, setSelectedSlideId] = useState<string>(slides[0]?.id || '');
  const [bgMusicId, setBgMusicId] = useState<string>('epic-cinematic');
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(0.3);
  const [voiceVolume, setVoiceVolume] = useState<number>(volume);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(true);

  // Video Rendering state
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<string>('');
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
  const [renderedDownloadUrl, setRenderedDownloadUrl] = useState<string | null>(null);

  // AI Script generation modal inside studio
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiPromptOpen, setAiPromptOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTargetSlideId, setUploadTargetSlideId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSlide = slides.find((s) => s.id === selectedSlideId) || slides[0];

  const handleUpdateCurrentSlide = (fields: Partial<RecapSlide>) => {
    onUpdateSlides(
      slides.map((s) => (s.id === selectedSlideId ? { ...s, ...fields } : s))
    );
  };

  const handleAddSlide = (type: 'photo' | 'text' | 'video') => {
    const newSlide: RecapSlide = {
      id: `slide-${Date.now()}`,
      type,
      title: type === 'photo' ? 'အခန်းသစ် အက်ရှင်' : type === 'text' ? 'အထူးတင်ဆက်မှု' : 'ဗီဒီယို အပိုင်း',
      burmeseText: 'စိတ်ဝင်စားဖွယ် မြန်မာ ဗီဒီယို Recap အခန်းသစ် စတင်ပါပြီ။',
      duration: 5,
      transition: 'fade',
      kenBurns: true,
      imageUrl: type === 'photo' ? 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80' : undefined,
    };
    onUpdateSlides([...slides, newSlide]);
    setSelectedSlideId(newSlide.id);
  };

  const handleDeleteSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) {
      alert('အနည်းဆုံး Slide တစ်ခုတော့ ရှိရပါမည်။');
      return;
    }
    const updated = slides.filter((s) => s.id !== id);
    onUpdateSlides(updated);
    if (selectedSlideId === id) {
      setSelectedSlideId(updated[0]?.id || '');
    }
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;
    onUpdateSlides(newSlides);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetSlideId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdateSlides(
        slides.map((s) =>
          s.id === uploadTargetSlideId ? { ...s, imageUrl: dataUrl } : s
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRenderExport = async () => {
    setIsRendering(true);
    setRenderProgress('FFmpeg ဗီဒီယို ပေါင်းစပ်မှု စတင်နေပါပြီ...');
    setRenderedVideoUrl(null);

    try {
      const payload: RenderRequest = {
        slides,
        selectedVoiceId: voice.id,
        speechSpeed: speed,
        speechVolume: voiceVolume,
        resolution,
        aspectRatio,
        bgMusicId,
        bgMusicVolume,
        subtitlesEnabled,
        totalDurationSeconds: selectedDuration,
      };

      setRenderProgress('မြန်မာအသံ၊ ဓါတ်ပုံများနှင့် စာတန်းထိုးများကို FFmpeg ဖြင့် Render လုပ်နေပါသည်...');
      const res = await fetch('/api/recap/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Rendering failed');
      }

      const data = await res.json();
      if (data.success && data.videoUrl) {
        setRenderedVideoUrl(data.videoUrl);
        setRenderedDownloadUrl(data.downloadUrl);
        setRenderProgress('ဗီဒီယို Render အောင်မြင်စွာ ပြီးဆုံးပါပြီ!');
      } else {
        throw new Error(data.error || 'Video URL not returned');
      }
    } catch (err: any) {
      console.error('Render error:', err);
      alert(`Render မအောင်မြင်ပါ: ${err.message}`);
    } finally {
      setIsRendering(false);
    }
  };

  const handleAiGenerateScript = async () => {
    if (!aiTopic.trim()) return;
    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/gemini/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          durationSeconds: selectedDuration,
          numSlides: 3,
          isVip,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.slides) {
        const generatedSlides: RecapSlide[] = json.data.slides.map((s: any, idx: number) => ({
          id: `ai-slide-${Date.now()}-${idx}`,
          type: s.type || 'photo',
          title: s.title || `အခန်း (${idx + 1})`,
          burmeseText: s.burmeseText || '',
          duration: s.duration || 5,
          transition: s.transition || 'fade',
          kenBurns: true,
          imageUrl:
            idx === 0
              ? 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        }));

        onUpdateSlides(generatedSlides);
        setSelectedSlideId(generatedSlides[0].id);
        setAiPromptOpen(false);
        setAiTopic('');
      } else {
        alert(json.error || 'AI Script ဖန်တီး၍ မရပါ');
      }
    } catch (e: any) {
      alert(`Gemini AI Error: ${e.message}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0d1224] border border-purple-800/40 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Hidden File Input for image upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Modal Header matching user screenshot f1ff1777.jpg */}
        <div className="px-5 py-4 border-b border-purple-900/30 flex items-start justify-between bg-gradient-to-r from-[#17153a] via-[#121630] to-[#0d1224]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 p-0.5 shadow-lg shadow-purple-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d1224] rounded-[14px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  ၃၀ ရက်တာ Video Recap Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-bold text-emerald-300">
                  VIP UNLIMITED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Photo (ဓါတ်ပုံ)၊ စာသား (Text)၊ Video (ဗီဒီယို) ကြိုက်ရာထည့်သွင်း၍ မြန်မာအသံဖြင့် Recap ဖန်တီးပါ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Tab bar */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#090d1c] border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('custom_studio')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition ${
              activeTab === 'custom_studio'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>စိတ်ကြိုက်ဖန်တီးမှု Studio (Photo, စာသား, Video)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-900 text-[10px] text-purple-200">
              {slides.length}
            </span>
          </button>

          <button
            onClick={() => {
              setAiPromptOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600/30 to-pink-600/30 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1.5 hover:border-amber-400 transition"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>AI စာညွှန်း အော်တိုဖန်တီး</span>
          </button>
        </div>

        {/* AI Quick Generator Prompt Dialog */}
        {aiPromptOpen && (
          <div className="mx-5 my-2 p-3.5 rounded-2xl bg-[#141a33] border border-amber-500/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Gemini AI ဖြင့် မြန်မာ Recap ဇာတ်ညွှန်း အော်တိုထုတ်လုပ်ရန် ခေါင်းစဉ်ရိုက်ထည့်ပါ
              </span>
              <button
                onClick={() => setAiPromptOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ပိတ်
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="ဥပမာ - နေတိုး နှင့် မြင့်မြတ် ပုဂံခေတ် စစ်ပွဲကြီး သမိုင်း"
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#090d1a] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                disabled={isAiGenerating || !aiTopic.trim()}
                onClick={handleAiGenerateScript}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {isAiGenerating ? 'ဖန်တီးနေသည်...' : 'Script ရေးထုတ်မည်'}
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5">
          {/* Top Live Preview Player */}
          <div className="w-full bg-[#0a0e1c] p-4 rounded-3xl border border-purple-900/40">
            <ReelPreviewPlayer
              slides={slides}
              voice={voice}
              speed={speed}
              volume={voiceVolume}
              bgMusicId={bgMusicId}
              bgMusicVolume={bgMusicVolume}
              aspectRatio={aspectRatio}
            />
          </div>

          {/* Slide list manager (Drag & Drop / Reorder) */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Film className="w-4 h-4 text-purple-400" />
                <span>Slide ကတ်ပြားများ စီစဉ်ခြင်း ({slides.length} ခု)</span>
              </h3>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddSlide('photo')}
                  className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/50 border border-purple-600/40 text-purple-300 text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Photo</span>
                </button>
                <button
                  onClick={() => handleAddSlide('text')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/50 border border-indigo-600/40 text-indigo-300 text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ စာသား</span>
                </button>
              </div>
            </div>

            {/* Horizontal or compact slide reel cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {slides.map((s, index) => {
                const isSelected = s.id === selectedSlideId;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSlideId(s.id)}
                    className={`p-3 rounded-2xl cursor-pointer border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-400 shadow-md ring-1 ring-purple-400'
                        : 'bg-[#12172d]/70 hover:bg-[#181f3b] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-[11px] font-bold uppercase text-slate-200">
                          {s.type} Slide
                        </span>
                      </div>

                      {/* Reorder & Delete controls */}
                      <div className="flex items-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={(e) => handleMoveSlide(index, 'up', e)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                          title="ရှေ့သို့ရွှေ့"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={index === slides.length - 1}
                          onClick={(e) => handleMoveSlide(index, 'down', e)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-30"
                          title="နောက်သို့ရွှေ့"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSlide(s.id, e)}
                          className="p-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400"
                          title="ဖျက်မည်"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Thumbnail preview */}
                    <div className="w-full h-20 rounded-xl overflow-hidden bg-black/60 relative mb-2 flex items-center justify-center">
                      {s.type === 'photo' && s.imageUrl ? (
                        <img
                          src={s.imageUrl}
                          alt={s.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-xs text-amber-300 font-semibold">
                          {s.title}
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-slate-300">
                        {s.duration}s
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white truncate">{s.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{s.burmeseText}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Slide Detail Editor */}
          {currentSlide && (
            <div className="p-4 rounded-2xl bg-[#0f1428] border border-purple-800/40 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs sm:text-sm font-bold text-purple-300 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Slide အချက်အလက် ပြင်ဆင်ရန်</span>
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Slide Type:</span>
                  {(['photo', 'text', 'video'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleUpdateCurrentSlide({ type: t })}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        currentSlide.type === t
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Burmese Narration Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Slide ခေါင်းစဉ် (Title):
                  </label>
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => handleUpdateCurrentSlide({ title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090d1a] border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Slide ကြာချိန်: {currentSlide.duration} စက္ကန့်
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="1"
                    value={currentSlide.duration}
                    onChange={(e) =>
                      handleUpdateCurrentSlide({ duration: parseInt(e.target.value) })
                    }
                    className="w-full accent-purple-500 cursor-pointer mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  မြန်မာအသံထွက် ဇာတ်ညွှန်း နှင့် Subtitle စာသား:
                </label>
                <textarea
                  rows={2}
                  value={currentSlide.burmeseText}
                  onChange={(e) => handleUpdateCurrentSlide({ burmeseText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090d1a] border border-slate-700 text-xs text-yellow-300 font-medium focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Photo Image selector / upload if type is photo */}
              {currentSlide.type === 'photo' && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setUploadTargetSlideId(currentSlide.id);
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-700/40 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-purple-300" />
                    <span>ဓါတ်ပုံ တင်မည် (Upload Photo)</span>
                  </button>

                  <span className="text-xs text-slate-400">သို့မဟုတ် နမူနာ ရွေးချယ်ပါ:</span>
                  {[
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&auto=format&fit=crop&q=80',
                  ].map((url, i) => (
                    <button
                      key={i}
                      onClick={() => handleUpdateCurrentSlide({ imageUrl: url })}
                      className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 hover:border-purple-400"
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}

                  <label className="flex items-center gap-1.5 ml-auto text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentSlide.kenBurns !== false}
                      onChange={(e) => handleUpdateCurrentSlide({ kenBurns: e.target.checked })}
                      className="accent-purple-500"
                    />
                    <span>Ken Burns Zoom Effect</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Background Music & Audio Mixing */}
          <div className="p-4 rounded-2xl bg-[#0f1428] border border-purple-800/40 flex flex-col gap-3">
            <h4 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-purple-400" />
              <span>နောက်ခံတေးဂီတ နှင့် အသံချိန်ညှိမှု (Background Music & Volume)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  နောက်ခံတေးဂီတ ရွေးချယ်ပါ:
                </label>
                <select
                  value={bgMusicId}
                  onChange={(e) => setBgMusicId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090d1a] border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {BACKGROUND_MUSIC_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.burmeseName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>တေးဂီတ အသံ: {Math.round(bgMusicVolume * 100)}%</span>
                  <span>မြန်မာအသံ: {Math.round(voiceVolume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={bgMusicVolume}
                    onChange={(e) => setBgMusicVolume(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                    title="BGM Volume"
                  />
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={voiceVolume}
                    onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                    title="Voice Volume"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Export Settings (720p / 1080p, 16:9 / 9:16) */}
          <div className="p-4 rounded-2xl bg-[#0f1428] border border-purple-800/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {/* Resolution */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="font-semibold">ကြည်လင်ပြတ်သားမှု:</span>
                {(['720p', '1080p'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      resolution === r
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Aspect Ratio */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="font-semibold">ဆိုဒ်:</span>
                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    aspectRatio === '16:9'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  16:9 (Landscape)
                </button>
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    aspectRatio === '9:16'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  9:16 (TikTok/Reel)
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={subtitlesEnabled}
                onChange={(e) => setSubtitlesEnabled(e.target.checked)}
                className="accent-purple-500"
              />
              <span>မြန်မာစာတန်းထိုး ထည့်မည် (Subtitles)</span>
            </label>
          </div>

          {/* Render Result Dialog if exported */}
          {renderedVideoUrl && (
            <div className="p-4 rounded-3xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col items-center gap-3 shadow-2xl">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>FFmpeg ဗီဒီယို အောင်မြင်စွာ Render ပြီးပါပြီ! (MP4)</span>
              </div>

              <div className="w-full max-w-md rounded-2xl overflow-hidden border border-emerald-500/30 bg-black">
                <video
                  src={renderedVideoUrl}
                  controls
                  autoPlay
                  className="w-full max-h-64 object-contain"
                />
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={renderedDownloadUrl || renderedVideoUrl}
                  download="BaiYuChen-Myanmar-Recap.mp4"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>MP4 ဗီဒီယို ဒေါင်းလုဒ်ရယူမည်</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions matching user screenshot */}
        <div className="px-5 py-4 border-t border-purple-900/30 bg-[#090d1c] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => {
              const textSummary = slides.map((s, i) => `${i + 1}။ ${s.title}: ${s.burmeseText}`).join('\n\n');
              navigator.clipboard?.writeText(textSummary);
              alert('Recap အချက်အလက်များကို Copy ကူးယူပြီးပါပြီ။');
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 transition"
          >
            <span>Recap အချက်အလက် ကူးမည်</span>
          </button>

          <button
            disabled={isRendering}
            onClick={handleRenderExport}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-purple-600/40 disabled:opacity-50 transition scale-105"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>
              {isRendering
                ? renderProgress || 'Render ပြုလုပ်နေပါသည်...'
                : `Recap ဗီဒီယို ထုတ်လုပ်မည် (${selectedDuration}s - FFmpeg MP4)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
