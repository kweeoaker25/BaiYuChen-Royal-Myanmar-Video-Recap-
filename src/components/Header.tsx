import React from 'react';
import { UserSession } from '../types';
import { PlaySquare, Trophy, Key, Film, CheckCircle2, Crown, Sparkles } from 'lucide-react';

interface HeaderProps {
  session: UserSession;
  onOpenLicense: () => void;
  onOpenGeminiKey: () => void;
  onOpenStudio: () => void;
  onLoginClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onOpenLicense,
  onOpenGeminiKey,
  onOpenStudio,
  onLoginClick,
}) => {
  const isVip = session.license?.tier === 'premium_vip' && session.license?.status === 'active';

  return (
    <header className="w-full bg-[#0d1224]/90 backdrop-blur-md border-b border-purple-900/30 sticky top-0 z-40 px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        {/* Top Logo and Version row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-pink-500 p-0.5 shadow-lg shadow-purple-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d1224] rounded-[14px] flex items-center justify-center">
                <PlaySquare className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-1.5">
                BaiYuChen Myanmar Video Recap
              </h1>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-purple-400 font-medium">Version 0.2</span>
                <span className="text-slate-400">•</span>
                <span className="text-amber-400 text-[11px] font-semibold tracking-wider uppercase">Royal Professional Edition</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVip ? (
              <button
                onClick={onOpenLicense}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 hover:border-emerald-400 transition"
              >
                <Crown className="w-3.5 h-3.5 text-emerald-400" />
                <span>VIP ACTIVE</span>
              </button>
            ) : (
              <button
                onClick={onOpenLicense}
                className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-amber-500/20 hover:border-amber-400 transition"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>VIP ဝယ်ယူရန်</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary user action status bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onLoginClick}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 flex items-center gap-1.5 transition text-[11px] whitespace-nowrap"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{session.email || 'Gmail ဖြင့်ဝင်ရန်'}</span>
            </button>

            <button
              onClick={onOpenLicense}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition text-[11px] whitespace-nowrap font-medium ${
                isVip
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}
            >
              <Key className="w-3 h-3" />
              <span>{isVip ? 'VIP Active' : 'မထည့်ရသေး !'}</span>
            </button>

            <button
              onClick={onOpenGeminiKey}
              className="px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 text-purple-200 flex items-center gap-1.5 transition text-[11px] whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Gemini Key</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 flex items-center gap-1 text-[11px]">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-amber-400">{session.trophiesCount}</span>
            </div>

            <button
              onClick={onOpenStudio}
              className="px-2.5 py-1 rounded-lg bg-purple-800/40 hover:bg-purple-700/50 border border-purple-600/40 text-purple-300 flex items-center gap-1 text-[11px] transition"
              title="Studio Slides"
            >
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold text-purple-300">{session.timelineCount}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
