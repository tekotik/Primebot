import React from 'react';

interface ClockDialAnimationProps {
  size?: number;
  label?: string;
  sublabel?: string;
  isSearching?: boolean;
}

export const ClockDialAnimation: React.FC<ClockDialAnimationProps> = ({
  size = 72,
  label = 'Поиск timed-лотов...',
  sublabel = 'Синхронизация с аукционами',
  isSearching = true
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center select-none">
      {/* Precision Automotive Clock Dial */}
      <div
        className="relative flex items-center justify-center rounded-full bg-[#0b0e14] border-2 border-slate-800 shadow-xl shadow-[#068eff]/10"
        style={{ width: size, height: size }}
      >
        {/* Outer Bezel Ticks */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circular Track */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="#1e293b"
            strokeWidth="2"
            strokeDasharray="2 3"
          />

          {/* 12 Hour Marks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="8"
              x2="50"
              y2={deg % 90 === 0 ? "14" : "11"}
              stroke={deg % 90 === 0 ? "#068eff" : "#475569"}
              strokeWidth={deg % 90 === 0 ? "2" : "1"}
              transform={`rotate(${deg} 50 50)`}
            />
          ))}

          {/* Subtle Radar Sweep Sector */}
          {isSearching && (
            <g className="animate-spin origin-center" style={{ animationDuration: '3s' }}>
              <path
                d="M50 50 L50 10 A40 40 0 0 1 85 50 Z"
                fill="url(#radarGradient)"
                opacity="0.3"
              />
              <defs>
                <radialGradient id="radarGradient" cx="50" cy="50" r="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#068eff" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#068eff" stopOpacity="0" />
                </radialGradient>
              </defs>
            </g>
          )}

          {/* Rotating Second Hand */}
          <g
            className={`${isSearching ? 'animate-spin origin-center' : ''}`}
            style={{ animationDuration: '2s', animationTimingFunction: 'linear' }}
          >
            {/* Counterbalance tail */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="60"
              stroke="#068eff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Main sweeping hand */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="14"
              stroke="#068eff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Arrow Tip */}
            <circle cx="50" cy="14" r="2" fill="#38bdf8" />
          </g>

          {/* Center Hub */}
          <circle cx="50" cy="50" r="4" fill="#068eff" />
          <circle cx="50" cy="50" r="2" fill="#ffffff" />
        </svg>

        {/* Outer Pulsing Glow Ring */}
        {isSearching && (
          <div className="absolute inset-0 rounded-full border border-[#068eff]/40 animate-ping opacity-25" />
        )}
      </div>

      {label && (
        <span className="mt-3 text-xs font-bold text-white font-['Exo_2',sans-serif] uppercase tracking-wider">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[11px] text-slate-400 font-mono mt-0.5">
          {sublabel}
        </span>
      )}
    </div>
  );
};
