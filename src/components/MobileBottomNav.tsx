import React from 'react';
import { SlidersHorizontal, Gauge, Bookmark, Radio } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenFilter: () => void;
  onOpenBot: () => void;
  onOpenBookmarks: () => void;
  activeFilterCount: number;
  bookmarksCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenFilter,
  onOpenBot,
  onOpenBookmarks,
  activeFilterCount,
  bookmarksCount
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0c1018]/95 backdrop-blur-md border-t border-slate-800/90 py-2 px-4 flex items-center justify-around shadow-2xl max-w-md mx-auto">
      {/* 1. Filter Trigger Button (Core mobile usability) */}
      <button
        type="button"
        onClick={onOpenFilter}
        className="relative flex flex-col items-center justify-center p-2 min-w-[90px] rounded-xl hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors focus:outline-none"
      >
        <div className="relative">
          <SlidersHorizontal className="w-5 h-5 text-[#068eff]" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#068eff] text-white font-mono">
              {activeFilterCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold mt-1 font-['Exo_2',sans-serif] uppercase tracking-wider">
          Фильтры
        </span>
      </button>

      {/* 2. Automotive Bot Auto-Podbor Trigger */}
      <button
        type="button"
        onClick={onOpenBot}
        className="relative flex flex-col items-center justify-center p-2 min-w-[90px] rounded-xl hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors focus:outline-none"
      >
        <div className="relative">
          <Gauge className="w-5 h-5 text-blue-400 stroke-[2.2]" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
        </div>
        <span className="text-[10px] font-semibold mt-1 font-['Exo_2',sans-serif] uppercase tracking-wider">
          Автоподбор
        </span>
      </button>

      {/* 3. Bookmarks / Favorites Trigger (as in social networks) */}
      <button
        type="button"
        onClick={onOpenBookmarks}
        className="relative flex flex-col items-center justify-center p-2 min-w-[90px] rounded-xl hover:bg-slate-800/80 text-slate-300 hover:text-white transition-colors focus:outline-none"
      >
        <div className="relative">
          <Bookmark
            className={`w-5 h-5 transition-transform ${
              bookmarksCount > 0 ? 'fill-[#068eff] text-[#068eff] scale-110' : 'text-slate-400'
            }`}
          />
          {bookmarksCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#068eff] text-white font-mono">
              {bookmarksCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold mt-1 font-['Exo_2',sans-serif] uppercase tracking-wider">
          Закладки
        </span>
      </button>
    </nav>
  );
};
