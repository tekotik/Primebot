import React from 'react';
import { Bookmark, Calculator, Car as CarIcon, Sparkles } from 'lucide-react';
import { Currency } from '../types/car';

interface HeaderProps {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  onOpenCalculator: () => void;
  onOpenConsultation: () => void;
  onSelectNavTab: (tab: string) => void;
  activeNavTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  currency,
  onCurrencyChange,
  favoritesCount,
  onOpenFavorites,
  onOpenCalculator,
  onOpenConsultation,
  onSelectNavTab,
  activeNavTab
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0c0f17]/95 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onSelectNavTab('catalog');
            }}
            className="flex items-center gap-2 group text-white focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
              <CarIcon className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              PRIME<span className="text-blue-500">AUTO</span>EXPORT
            </span>
          </a>
        </div>

        {/* Zone 2: 4-5 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectNavTab('catalog')}
            className={`hover:text-white transition-colors relative py-1 focus:outline-none ${
              activeNavTab === 'catalog' ? 'text-white font-semibold' : 'text-slate-400'
            }`}
          >
            Аукционы и Каталог
            {activeNavTab === 'catalog' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectNavTab('korea')}
            className={`hover:text-white transition-colors relative py-1 focus:outline-none ${
              activeNavTab === 'korea' ? 'text-white font-semibold' : 'text-slate-400'
            }`}
          >
            Корея (Encar)
            {activeNavTab === 'korea' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => onSelectNavTab('usa')}
            className={`hover:text-white transition-colors relative py-1 focus:outline-none ${
              activeNavTab === 'usa' ? 'text-white font-semibold' : 'text-slate-400'
            }`}
          >
            США (Manheim / Copart)
            {activeNavTab === 'usa' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          <button
            onClick={onOpenCalculator}
            className="hover:text-white transition-colors flex items-center gap-1.5 py-1 text-slate-400 focus:outline-none"
          >
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>Калькулятор под ключ</span>
          </button>

          <button
            onClick={() => onSelectNavTab('guarantees')}
            className={`hover:text-white transition-colors relative py-1 focus:outline-none ${
              activeNavTab === 'guarantees' ? 'text-white font-semibold' : 'text-slate-400'
            }`}
          >
            Гарантии и Доставка
            {activeNavTab === 'guarantees' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Social Bookmark Button, Order CTA) */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Social Network Style Bookmarks / Favorites Button */}
          <button
            onClick={onOpenFavorites}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
              favoritesCount > 0
                ? 'bg-blue-950/60 border-blue-500/50 text-blue-300 hover:bg-blue-900/60'
                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Закладки и подборки авто"
            aria-label="Закладки"
          >
            <div className="relative">
              <Bookmark
                className={`w-4 h-4 transition-transform duration-200 ${
                  favoritesCount > 0 ? 'fill-[#068eff] text-[#068eff] scale-110' : 'text-slate-400'
                }`}
              />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#068eff] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#068eff]"></span>
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Закладки</span>
            <span
              className={`px-1.5 py-0.2 rounded font-mono text-xs tabular-nums ${
                favoritesCount > 0
                  ? 'bg-[#068eff] text-white font-semibold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {favoritesCount}
            </span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenConsultation}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-[#068eff] hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-[#068eff]/30 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Заказать</span> подбор
          </button>
        </div>
      </div>
    </header>
  );
};
