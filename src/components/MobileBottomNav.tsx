import React from 'react';
import { SlidersHorizontal, Gauge, Bookmark, Menu } from 'lucide-react';
import { AppTheme } from '../types/car';

interface MobileBottomNavProps {
  onOpenFilter: () => void;
  onOpenBot: () => void;
  onOpenBookmarks: () => void;
  onOpenSettings: () => void;
  activeFilterCount: number;
  bookmarksCount: number;
  theme?: AppTheme;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenFilter,
  onOpenBot,
  onOpenBookmarks,
  onOpenSettings,
  activeFilterCount,
  bookmarksCount,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';

  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-40 backdrop-blur-md py-1.5 px-2 flex items-center justify-around shadow-2xl max-w-md mx-auto transition-colors duration-200 ${
        isLight
          ? 'bg-white/95 border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]'
          : 'bg-[#0c1018]/95 border-t border-slate-800/90'
      }`}
    >
      {/* 1. Filter Trigger Button (Core mobile usability) */}
      <button
        type="button"
        onClick={onOpenFilter}
        className={`relative flex flex-col items-center justify-center p-1.5 min-w-[70px] sm:min-w-[80px] flex-1 rounded-xl transition-colors focus:outline-none ${
          isLight
            ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
        }`}
      >
        <div className="relative">
          <SlidersHorizontal className={`w-5 h-5 ${isLight ? 'text-[#D94625]' : 'text-[#068eff]'}`} />
          {activeFilterCount > 0 && (
            <span
              className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white font-mono ${
                isLight ? 'bg-[#D94625]' : 'bg-[#068eff]'
              }`}
            >
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
        className={`relative flex flex-col items-center justify-center p-1.5 min-w-[70px] sm:min-w-[80px] flex-1 rounded-xl transition-colors focus:outline-none ${
          isLight
            ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
        }`}
      >
        <div className="relative">
          <Gauge className={`w-5 h-5 stroke-[2.2] ${isLight ? 'text-amber-600' : 'text-blue-400'}`} />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLight ? 'bg-amber-500' : 'bg-blue-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isLight ? 'bg-amber-600' : 'bg-blue-500'
              }`}
            ></span>
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
        className={`relative flex flex-col items-center justify-center p-1.5 min-w-[70px] sm:min-w-[80px] flex-1 rounded-xl transition-colors focus:outline-none ${
          isLight
            ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
        }`}
      >
        <div className="relative">
          <Bookmark
            className={`w-5 h-5 transition-transform ${
              bookmarksCount > 0
                ? isLight
                  ? 'fill-[#D94625] text-[#D94625] scale-110'
                  : 'fill-[#068eff] text-[#068eff] scale-110'
                : isLight
                ? 'text-slate-400'
                : 'text-slate-400'
            }`}
          />
          {bookmarksCount > 0 && (
            <span
              className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white font-mono ${
                isLight ? 'bg-[#D94625]' : 'bg-[#068eff]'
              }`}
            >
              {bookmarksCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-semibold mt-1 font-['Exo_2',sans-serif] uppercase tracking-wider">
          Закладки
        </span>
      </button>

      {/* 4. User Settings / Menu Burger Trigger */}
      <button
        type="button"
        onClick={onOpenSettings}
        className={`relative flex flex-col items-center justify-center p-1.5 min-w-[70px] sm:min-w-[80px] flex-1 rounded-xl transition-colors focus:outline-none ${
          isLight
            ? 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
        }`}
        title="Настройки пользователя"
      >
        <div className="relative">
          <Menu className={`w-5 h-5 transition-transform hover:scale-105 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
          {/* Subtle badge indicating theme is active */}
          <span
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
              isLight ? 'bg-[#D94625]' : 'bg-[#068eff]'
            }`}
          />
        </div>
        <span className="text-[10px] font-semibold mt-1 font-['Exo_2',sans-serif] uppercase tracking-wider">
          Настройки
        </span>
      </button>
    </nav>
  );
};
