import React from 'react';
import { Info, Key, Lock, Send, Sparkles } from 'lucide-react';

interface NoticeCardProps {
  onOpenGeminiKey: () => void;
  onOpenLicense: () => void;
}

export const NoticeCard: React.FC<NoticeCardProps> = ({
  onOpenGeminiKey,
  onOpenLicense,
}) => {
  return (
    <div className="w-full flex flex-col gap-3">
      {/* Main Glass Card */}
      <div className="rounded-2xl bg-gradient-to-b from-[#151a30]/90 to-[#0d1224]/90 border border-purple-800/30 p-4 shadow-xl shadow-purple-950/20 backdrop-blur-md">
        {/* Header alert */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-indigo-300">
            <div className="p-1.5 rounded-full bg-indigo-500/20 text-indigo-400">
              <Info className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-100">
              Gemini API key နှင့် License Key သည် မတူညီပါ (တစ်မျိုးစီဖြစ်သည်)
            </h3>
          </div>
        </div>

        {/* Gemini Key Action Button */}
        <div className="mb-4">
          <button
            onClick={onOpenGeminiKey}
            className="px-3.5 py-1.5 rounded-xl bg-purple-700/40 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center gap-2 transition shadow-sm"
          >
            <Key className="w-3.5 h-3.5 text-purple-300" />
            <span>Gemini Key ထည့်ရန်</span>
          </button>
        </div>

        {/* 1. Gemini API Key Description Box */}
        <div className="rounded-xl bg-[#090d1a]/80 border border-purple-900/40 p-3.5 mb-3">
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs sm:text-sm mb-1">
            <Key className="w-3.5 h-3.5" />
            <span>၁။ Gemini API Key</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            ကိုယ့်ဖုန်းထဲ video Recap သိမ်းနိုင်ရန် ဖြစ်ပါသည်။ User များ စစချင်း ကိုယ်ပိုင် Gemini API key ထည့်ပြီးမှသာ ဗီဒီယို ပြုလုပ်နိုင်ပါသည်။
          </p>
        </div>

        {/* 2. License Key Description Box */}
        <div className="rounded-xl bg-[#090d1a]/80 border border-emerald-900/30 p-3.5">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>၂။ License Key</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Application အသုံးပြုရန်အတွက် ဖြစ်ပါသည်။ Free ၃၀ ရက် စမ်းသပ်ခွင့် နှင့် Premium ဝယ်ယူရန် နှစ်မျိုးရှိပါသည်။
          </p>
        </div>
      </div>

      {/* Telegram Purchase Box */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#0d1224] border border-emerald-500/30 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <Send className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="text-slate-300">LICENSE KEY ဝယ်ယူရန် နှင့် ဆက်သွယ်ရန်: </span>
            <a
              href="https://t.me/baiyuchen10"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 font-bold hover:underline"
            >
              Telegram @baiyuchen10
            </a>
          </div>
        </div>

        <button
          onClick={onOpenLicense}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-medium text-xs flex items-center justify-center gap-1.5 transition"
        >
          <span>License Key ထည့်ရန်</span>
          <span>→</span>
        </button>
      </div>

      {/* Feature banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-700/30 px-4 py-2.5 flex items-center justify-center gap-2 text-xs text-purple-300">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span>မြန်မာအသံ ၃၀ မျိုး (Free ၁၀ + Premium ၂၀) • Unlimited ဗီဒီယို ထုတ်လုပ်မှု</span>
      </div>
    </div>
  );
};
