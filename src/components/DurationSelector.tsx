import React from 'react';

interface DurationSelectorProps {
  selectedDuration: number;
  onSelectDuration: (duration: number) => void;
  isVip: boolean;
}

const DURATIONS = [8, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export const DurationSelector: React.FC<DurationSelectorProps> = ({
  selectedDuration,
  onSelectDuration,
  isVip,
}) => {
  return (
    <div className="w-full rounded-2xl bg-[#0e1426]/80 border border-purple-900/30 p-3.5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-slate-300">
          Recap ကြာချိန် ရွေးချယ်ပါ (ဗီဒီယို စက္ကန့်)
        </span>
        <span className="text-[11px] text-purple-400 font-bold">
          {selectedDuration} စက္ကန့် ({selectedDuration}s)
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {DURATIONS.map((dur) => {
          const isSelected = selectedDuration === dur;
          const isProOnly = dur > 30 && !isVip;

          return (
            <button
              key={dur}
              onClick={() => onSelectDuration(dur)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 relative ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/40 ring-1 ring-purple-400 scale-105'
                  : 'bg-[#151b30] hover:bg-[#1e2642] text-slate-300 border border-slate-800'
              }`}
            >
              <span>{dur}s</span>
              {dur > 30 && (
                <span className="ml-1 text-[9px] text-amber-400 font-normal">
                  Pro
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
