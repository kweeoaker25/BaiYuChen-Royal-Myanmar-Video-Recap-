import React, { useState, useEffect } from 'react';
import { UserSession, LicenseInfo } from '../types';
import {
  X,
  CheckCircle2,
  Crown,
  Key,
  Shield,
  Copy,
  Trash2,
  Send,
  Sparkles,
  Users,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  onActivateSuccess: (license: LicenseInfo) => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  session,
  onActivateSuccess,
}) => {
  const [inputKey, setInputKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Owner admin dashboard state
  const [adminLicenses, setAdminLicenses] = useState<any[]>([]);
  const [genTier, setGenTier] = useState<'premium_vip' | 'free_trial'>('premium_vip');
  const [genNote, setGenNote] = useState('');
  const [genDays, setGenDays] = useState(365);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isOwner = session.isOwner || session.email === 'fighterking2567@gmail.com';

  useEffect(() => {
    if (isOpen && isOwner) {
      fetchAdminLicenses();
    }
  }, [isOpen, isOwner]);

  const fetchAdminLicenses = async () => {
    try {
      const res = await fetch('/api/license/admin/all');
      const data = await res.json();
      if (data.licenses) {
        setAdminLicenses(data.licenses);
      }
    } catch (err) {
      console.error('Failed to load admin licenses', err);
    }
  };

  if (!isOpen) return null;

  const handleActivate = async () => {
    if (!inputKey.trim()) {
      setMessage({ text: 'License Key ကို ရိုက်ထည့်ပေးပါ', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: inputKey.trim(),
          email: session.email,
        }),
      });

      const data = await res.json();
      if (data.success && data.license) {
        setMessage({ text: data.message, type: 'success' });
        onActivateSuccess(data.license);
      } else {
        setMessage({ text: data.message || 'Key အတည်ပြုခြင်း မအောင်မြင်ပါ', type: 'error' });
      }
    } catch (e: any) {
      setMessage({ text: `ချိတ်ဆက်မှု မအောင်မြင်ပါ: ${e.message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateKey = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/license/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: genTier,
          note: genNote || undefined,
          days: genDays,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGenNote('');
        fetchAdminLicenses();
        setMessage({ text: data.message, type: 'success' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (key: string) => {
    if (!confirm(`သေချာပါသလား? Key (${key}) ကို ပယ်ဖျက်ပါမည်။`)) return;

    try {
      const res = await fetch('/api/license/admin/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminLicenses();
      }
    } catch (e) {
      // ignore
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard?.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0d1224] border border-purple-800/40 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header matching screenshot 9c5e21e5.jpg */}
        <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-[#121630] to-[#0d1224]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Royal License Management
              </h2>
              <p className="text-[11px] text-emerald-400 font-medium">
                Telegram: @baiyuchen10 • Owner: fighterking2567@gmail.com
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

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* Key Validation Input Box */}
          <div className="p-4 rounded-2xl bg-[#12182e] border border-emerald-500/40 shadow-lg flex flex-col gap-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>License Key ထည့်သွင်းရန် (VIP သို့မဟုတ် ၃၀ ရက် Trial Key)</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                placeholder="ဥပမာ - ROYAL-VIP-9999-7777"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#090d1a] border border-slate-700 text-sm text-emerald-300 font-mono tracking-wider focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <button
                disabled={isSubmitting}
                onClick={handleActivate}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition"
              >
                {isSubmitting ? 'စစ်ဆေးနေသည်...' : 'အတည်ပြုမည်'}
              </button>
            </div>

            {/* Quick pre-filled trial activation button */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 text-[11px]">စမ်းသပ်ရန် Demo Key များ:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInputKey('ROYAL-VIP-9999-7777')}
                  className="text-[11px] text-amber-300 hover:underline font-mono"
                >
                  VIP Key ထည့်မည်
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => setInputKey('TRIAL-30D-FREE-2026')}
                  className="text-[11px] text-emerald-300 hover:underline font-mono"
                >
                  Trial Key ထည့်မည်
                </button>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/60 border border-red-500/40 text-red-300'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}
          </div>

          {/* Premium License Benefits List matching screenshot 9c5e21e5.jpg */}
          <div className="rounded-2xl bg-gradient-to-b from-[#151a30]/80 to-[#0d1224]/80 border border-purple-800/30 p-4 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
              <Crown className="w-4 h-4" />
              <span>Premium LICENSE KEY ဝယ်ယူရခြင်း၏ အကျိုးကျေးဇူးများ:</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Feature 1 */}
              <div className="p-3 rounded-xl bg-[#090d1a]/80 border border-purple-900/30 flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                    ဗီဒီယို ထုတ်လုပ်မှု Unlimited (အကန့်အသတ်မရှိ) နှင့် ကြာချိန် ၁၀၀s အထိ
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    ဗီဒီယို အရေအတွက် ကန့်သတ်ချက်မရှိဘဲ ၈s မှ ၁၀၀s အထိ အက်ရှင်ဇာတ်ကားနှင့် Recap များ ဖန်တီးနိုင်သည်
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-3 rounded-xl bg-[#090d1a]/80 border border-purple-900/30 flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                    မြန်မာအသံ အမျိုးအစား ၃၀ (ကျား/မ) Unlimited သုံးနိုင်ခြင်း
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Free အသံ ၁၀ မျိုး နှင့် Premium အသံ ၂၀ မျိုး စုစုပေါင်း ၃၀ မျိုးလုံးကို အကန့်အသတ်မဲ့ အမြဲသုံးနိုင်သည်
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-3 rounded-xl bg-[#090d1a]/80 border border-purple-900/30 flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                    Video Recap တွင် Photo, စာသား, Video စိတ်ကြိုက်ထည့်သွင်းနိုင်ခြင်း
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    မိမိစိတ်ကြိုက် ဓါတ်ပုံ၊ စာသား၊ ဗီဒီယို ကလစ်များကို ပေါင်းစပ်ပြီး မြန်မာအသံဖြင့် Recap ဖန်တီးနိုင်သည်
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-3 rounded-xl bg-[#090d1a]/80 border border-purple-900/30 flex items-start gap-3">
                <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                    အခမဲ့ ၃၀ ရက် ပြည့်ပြီးနောက်လည်း သော့မခတ်ဘဲ ဆက်သုံးနိုင်ခြင်း
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Free ရက် ၃၀ ပြည့်သွားသော်လည်း 🔒 သော့ခတ်ခံရခြင်း မရှိဘဲ တစ်သက်တာ အမြဲ အသုံးပြုနိုင်သည်
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Dashboard section matching screenshot 9c5e21e5.jpg */}
          <div className="rounded-2xl bg-gradient-to-b from-[#181528] to-[#0e0d1c] border border-amber-500/40 p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-amber-900/40 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold text-amber-300">
                  Owner Dashboard (ပိုင်ရှင် သီးသန့် ကဏ္ဍ)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase border border-amber-400/40">
                OWNER
              </span>
            </div>

            <div className="text-xs text-slate-300 mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span>Logged in as: </span>
                <span className="text-amber-300 font-bold">fighterking2567@gmail.com</span>
              </div>
              <div>
                <span>Telegram: </span>
                <a
                  href="https://t.me/baiyuchen10"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 font-bold hover:underline"
                >
                  @baiyuchen10
                </a>
              </div>
            </div>

            {/* License Key Generator Form */}
            <div className="p-3 rounded-xl bg-[#090a14] border border-slate-800 flex flex-col gap-2.5 mb-3">
              <span className="text-[11px] font-bold text-slate-200">
                License Key အသစ် ထုတ်လုပ်ရန် (Generate Key):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={genTier}
                  onChange={(e) => setGenTier(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#14172a] border border-slate-700 text-xs text-white"
                >
                  <option value="premium_vip">👑 VIP Unlimited</option>
                  <option value="free_trial">⏳ 30-Day Free Trial</option>
                </select>

                <input
                  type="text"
                  value={genNote}
                  onChange={(e) => setGenNote(e.target.value)}
                  placeholder="မှတ်ချက် (ဥပမာ - Ko Aung Telegram)"
                  className="px-2.5 py-1.5 rounded-lg bg-[#14172a] border border-slate-700 text-xs text-white placeholder-slate-500"
                />

                <button
                  disabled={isGenerating}
                  onClick={handleGenerateKey}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs disabled:opacity-50 transition"
                >
                  {isGenerating ? 'ထုတ်လုပ်နေသည်...' : '+ Key ထုတ်မည်'}
                </button>
              </div>
            </div>

            {/* List of active licenses */}
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              <span className="text-[11px] font-semibold text-slate-400">
                ထုတ်လုပ်ထားသော Key စာရင်း ({adminLicenses.length} ခု):
              </span>
              {adminLicenses.map((lic) => (
                <div
                  key={lic.key}
                  className="p-2 rounded-xl bg-[#0f1224] border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        lic.tier === 'premium_vip'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      }`}
                    >
                      {lic.tier === 'premium_vip' ? 'VIP' : 'Trial'}
                    </span>
                    <span className="font-mono text-white text-[11px] truncate">
                      {lic.key}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                      ({lic.daysRemaining} ရက်ကျန်)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyKey(lic.key)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Key Copy ကူးမည်"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {lic.status === 'active' && (
                      <button
                        onClick={() => handleRevoke(lic.key)}
                        className="px-2 py-0.5 rounded bg-red-950/50 hover:bg-red-900/60 text-red-400 text-[10px]"
                        title="Key ပယ်ဖျက်မည်"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
