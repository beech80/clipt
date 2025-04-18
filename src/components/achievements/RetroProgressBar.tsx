import React from 'react';

interface RetroProgressBarProps {
  value: number; // percent 0-100
  label?: string;
  height?: number;
  color?: string;
  showText?: boolean;
}

const RetroProgressBar: React.FC<RetroProgressBarProps> = ({
  value,
  label,
  height = 16,
  color = '#ff6600',
  showText = true,
}) => {
  const pct = Math.max(0, Math.min(value, 100));
  return (
    <div className="w-full flex flex-col gap-1">
      {label && <div className="text-xs font-retro text-orange-300 mb-1">{label}</div>}
      <div
        className="relative bg-[#2a1400] rounded-full border-2 border-[#ff6600] shadow-orange-glow overflow-hidden"
        style={{ height }}
      >
        <div
          className="absolute top-0 left-0 h-full rounded-full retro-bar-glow"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, #ff6600 60%, #ffb347 100%)`, transition: 'width 0.5s cubic-bezier(.4,2,.6,1)' }}
        />
        {showText && (
          <div className="absolute w-full h-full flex items-center justify-center z-10 font-retro text-xs text-white drop-shadow-orange-glow">
            {pct}%
          </div>
        )}
      </div>
    </div>
  );
};

export default RetroProgressBar;
