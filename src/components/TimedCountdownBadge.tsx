import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimedCountdownBadgeProps {
  closeDate: string | null | undefined;
  variant?: 'card' | 'compact' | 'modal' | 'inline';
  showIcon?: boolean;
  className?: string;
}

export const TimedCountdownBadge: React.FC<TimedCountdownBadgeProps> = ({
  closeDate,
  variant = 'compact',
  showIcon = true,
  className = ''
}) => {
  const [time, setTime] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    ms: number;
    isEnded: boolean;
  }>(() => calculateTime(closeDate));

  function calculateTime(dateStr: string | null | undefined) {
    if (!dateStr) {
      return { hours: 0, minutes: 0, seconds: 0, ms: 0, isEnded: true };
    }
    const target = new Date(dateStr).getTime();
    const now = Date.now();
    const diff = target - now;

    if (isNaN(target) || diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, ms: 0, isEnded: true };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    // Milliseconds (hundredths of a second, 00..99, running super fast)
    const ms = Math.floor((diff % 1000) / 10);

    return { hours, minutes, seconds, ms, isEnded: false };
  }

  useEffect(() => {
    let animFrameId: number;

    const tick = () => {
      const current = calculateTime(closeDate);
      setTime(current);
      if (!current.isEnded) {
        animFrameId = requestAnimationFrame(tick);
      }
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [closeDate]);

  if (time.isEnded) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-slate-400 font-mono text-[10px] select-none ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        <span>00:00:00.00</span>
      </span>
    );
  }

  const isUrgent = time.hours < 2; // < 2h urgent
  const isSoon = time.hours < 24;  // < 24h soon

  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const hoursStr = pad2(time.hours);
  const minutesStr = pad2(time.minutes);
  const secondsStr = pad2(time.seconds);
  const msStr = pad2(time.ms);

  // Micro style for compact (Bookmarks, lists)
  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono tabular-nums text-[10px] border shadow-sm transition-all select-none leading-none ${
          isUrgent
            ? 'bg-red-950/85 border-red-500/70 text-red-200 shadow-red-950/50'
            : isSoon
            ? 'bg-amber-950/75 border-amber-500/60 text-amber-200'
            : 'bg-blue-950/70 border-blue-500/50 text-blue-200'
        } ${className}`}
        title="IAAI Timed Auction"
      >
        {showIcon && (
          <Clock
            className={`w-2.5 h-2.5 shrink-0 ${
              isUrgent ? 'text-red-400 animate-pulse' : isSoon ? 'text-amber-400' : 'text-[#068eff]'
            }`}
          />
        )}
        <span className="font-bold text-white tracking-tight">{hoursStr}:{minutesStr}:{secondsStr}</span>
        <span
          className={`text-[9px] font-bold ${
            isUrgent ? 'text-red-300' : isSoon ? 'text-amber-300' : 'text-blue-300'
          }`}
        >
          .{msStr}
        </span>
      </span>
    );
  }

  // Micro floating badge on CarCard image (No bulky banner, no explanatory text!)
  if (variant === 'card') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono tabular-nums text-[11px] border backdrop-blur-md shadow-md transition-all select-none leading-none ${
          isUrgent
            ? 'bg-black/90 border-red-500/80 text-red-200 ring-1 ring-red-500/30'
            : isSoon
            ? 'bg-black/85 border-amber-500/70 text-amber-100 ring-1 ring-amber-500/20'
            : 'bg-black/85 border-slate-700/90 text-slate-100'
        } ${className}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isUrgent ? 'bg-red-400' : isSoon ? 'bg-amber-400' : 'bg-[#068eff]'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isUrgent ? 'bg-red-500' : isSoon ? 'bg-amber-400' : 'bg-[#068eff]'
            }`}
          />
        </span>

        <span className="font-extrabold text-white tracking-tight">
          {hoursStr}:{minutesStr}:{secondsStr}
        </span>
        <span
          className={`text-[10px] font-bold ${
            isUrgent ? 'text-red-400' : isSoon ? 'text-amber-400' : 'text-blue-400'
          }`}
        >
          .{msStr}
        </span>
      </div>
    );
  }

  // Micro badge for expanded LotDetailModal (Clean, small, no text!)
  if (variant === 'modal') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg font-mono tabular-nums text-xs border backdrop-blur-md shadow-md select-none leading-none ${
          isUrgent
            ? 'bg-red-950/80 border-red-500/70 text-red-200'
            : isSoon
            ? 'bg-amber-950/70 border-amber-500/60 text-amber-200'
            : 'bg-slate-900/90 border-slate-700 text-slate-100'
        } ${className}`}
      >
        <Clock
          className={`w-3.5 h-3.5 shrink-0 ${
            isUrgent ? 'text-red-400 animate-pulse' : isSoon ? 'text-amber-400' : 'text-[#068eff]'
          }`}
        />
        <span className="font-black text-white text-sm tracking-tight">
          {hoursStr}:{minutesStr}:{secondsStr}
        </span>
        <span
          className={`text-[11px] font-bold ${
            isUrgent ? 'text-red-400' : isSoon ? 'text-amber-400' : 'text-blue-400'
          }`}
        >
          .{msStr}
        </span>
      </div>
    );
  }

  // Default inline micro
  return (
    <span className={`inline-flex items-center font-mono tabular-nums text-[11px] font-bold text-white select-none ${className}`}>
      <span>{hoursStr}:{minutesStr}:{secondsStr}</span>
      <span className="text-[9px] text-amber-400">.{msStr}</span>
    </span>
  );
};
