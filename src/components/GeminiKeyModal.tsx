import React, { useState } from 'react';
import { X, Sparkles, Key, ShieldCheck, CheckCircle2, Lock, ExternalLink } from 'lucide-react';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasCustomKey: boolean;
  onSaveCustomKey: (key: string) => void;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({
  isOpen,
  onClose,
  hasCustomKey,
  onSaveCustomKey,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKeyInput.trim()) {
      onSaveCustomKey(apiKeyInput.trim());
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0d1224] border border-purple-800/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between bg-gradient-to-r from-purple-950/40 to-[#0d1224]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Gemini API Key စီမံခန့်ခွဲမှု
              </h2>
              <p className="text-[11px] text-purple-300 font-medium">
                AI စာသားနှင့် ဇာတ်ညွှန်းထုတ်လုပ်ခြင်းအတွက် လုံခြုံစွာထားရှိခြင်း
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

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Official clarification rule */}
          <div className="p-3.5 rounded-2xl bg-[#141a33] border border-purple-800/40 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Gemini API Key နှင့် Premium License Key ကွာခြားချက်:</span>
            </div>
            <div className="space-y-1.5 text-slate-300 leading-relaxed text-[11px]">
              <div className="flex items-start gap-2">
                <span className="font-bold text-purple-400">၁။ Gemini API Key:</span>
                <span>AI ဝန်ဆောင်မှုအတွက် (ဇာတ်ညွှန်း၊ Recap script နှင့် အသံထွက် ချိန်ညှိမှု)။</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-emerald-400">၂။ Premium License Key:</span>
                <span>Application အသုံးပြုခွင့်အတွက် (Unlimited video render, 20 voices, 100s duration)။</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-amber-400">၃။ Backend Server:</span>
                <span>နှစ်ခုလုံးကို Browser တွင် ပေါ်လွင်ခြင်းမရှိစေဘဲ Server ပေါ်တွင်သာ လုံခြုံစွာ စီမံခန့်ခွဲပါသည်။</span>
              </div>
            </div>
          </div>

          {/* User Custom Key input */}
          <div className="flex flex-col gap-2">
            <label className="font-bold text-slate-200 flex items-center justify-between">
              <span>ကိုယ်ပိုင် Gemini API Key (ရွေးချယ်နိုင်သည်):</span>
              {hasCustomKey && (
                <span className="text-emerald-400 font-normal text-[10px]">✓ Key တပ်ဆင်ထားသည်</span>
              )}
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... (ဆာဗာ backend မှတစ်ဆင့်သာ ခေါ်ဆိုသည်)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d1a] border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-purple-500 placeholder-slate-600"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              * Server တွင် မူလ Gemini API Key ချိတ်ဆက်ထားပြီး ဖြစ်ပါသည်။ User များ ကိုယ်ပိုင် Quota သီးသန့်သုံးလိုပါက ဤနေရာတွင် ထည့်နိုင်ပါသည်။
            </p>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Gemini API Key ကို လုံခြုံစွာ သိမ်းဆည်းပြီးပါပြီ။</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:text-purple-300 text-[11px] flex items-center gap-1 hover:underline"
            >
              <span>Google AI Studio တွင် Key ရယူရန်</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={handleSave}
              disabled={!apiKeyInput.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs disabled:opacity-40 transition"
            >
              သိမ်းဆည်းမည်
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
