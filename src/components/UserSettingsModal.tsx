import React from 'react';
import {
  X,
  Sliders,
  Moon,
  Sun,
  Check,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  RotateCcw,
  Trash2,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';
import { AppTheme, Currency } from '../types/car';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  currency: Currency;
  onChangeCurrency: (curr: Currency) => void;
  onResetFilters: () => void;
  onClearBookmarks: () => void;
  bookmarksCount: number;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  currency,
  onChangeCurrency,
  onResetFilters,
  onClearBookmarks,
  bookmarksCount
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  const currencies: { id: Currency; symbol: string; label: string }[] = [
    { id: 'USD', symbol: '$', label: 'USD ($)' },
    { id: 'EUR', symbol: '€', label: 'EUR (€)' },
    { id: 'RUB', symbol: '₽', label: 'RUB (₽)' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in-fast"
      />

      {/* Slide-up Bottom Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md mx-auto max-h-[92vh] overflow-y-auto border-t rounded-t-3xl shadow-2xl p-5 z-10 animate-slide-up-fast transition-colors duration-200 ${
          isLight
            ? 'bg-[#FFFFFF] border-slate-200 text-slate-800'
            : 'bg-[#0f131c] border-slate-800 text-slate-100'
        }`}
      >
        {/* Drag Handle */}
        <div
          className={`w-12 h-1.5 rounded-full mx-auto mb-3 shrink-0 ${
            isLight ? 'bg-slate-300' : 'bg-slate-700/80'
          }`}
        />

        {/* Modal Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b mb-4 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                isLight
                  ? 'bg-[#FFF1EE] border-[#FFDDD6] text-[#D94625]'
                  : 'bg-[#068eff]/15 border-[#068eff]/30 text-[#068eff]'
              }`}
            >
              <Sliders className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3
                className={`text-base font-bold font-['Exo_2',sans-serif] uppercase tracking-wide leading-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Настройки пользователя
              </h3>
              <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Оформление и параметры каталога
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isLight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* SECTION 1: ТЕМА ОФОРМЛЕНИЯ */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                className={`text-xs font-bold uppercase tracking-wider font-['Exo_2',sans-serif] flex items-center gap-1.5 ${
                  isLight ? 'text-slate-900' : 'text-slate-200'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isLight ? 'text-[#D94625]' : 'text-[#068eff]'}`} />
                <span>Тема оформления</span>
              </label>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isLight
                    ? 'bg-[#FFF1EE] text-[#D94625] border border-[#FFDDD6]'
                    : 'bg-[#068eff]/15 text-[#068eff] border border-[#068eff]/30'
                }`}
              >
                {isLight ? 'CarCheckBot Light' : 'Carbon Dark'}
              </span>
            </div>

            {/* Две карточки тем: Тёмная и Светлая */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. ТЁМНАЯ ТЕМА */}
              <button
                type="button"
                onClick={() => onChangeTheme('dark')}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between ${
                  !isLight
                    ? 'bg-[#141826] border-[#068eff] ring-2 ring-[#068eff]/30 shadow-lg'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Visual miniature preview */}
                <div className="w-full h-16 rounded-xl bg-[#090c12] border border-slate-800 p-2 mb-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#068eff]" />
                      <div className="w-8 h-1.5 rounded-full bg-slate-700" />
                    </div>
                    <div className="w-4 h-1.5 rounded-full bg-[#068eff]/60" />
                  </div>
                  <div className="p-1 rounded bg-[#111520] border border-slate-800/80 flex items-center justify-between">
                    <div className="w-10 h-1.5 rounded bg-slate-600" />
                    <div className="w-4 h-1.5 rounded bg-emerald-500/80" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-[#068eff]" />
                    <span
                      className={`text-xs font-bold font-['Exo_2',sans-serif] ${
                        !isLight ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      Тёмная
                    </span>
                  </div>
                  {!isLight && (
                    <div className="w-5 h-5 rounded-full bg-[#068eff] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5">Carbon & Neon Blue</span>
              </button>

              {/* 2. СВЕТЛАЯ ТЕМА (CARCHECKBOT STYLE) */}
              <button
                type="button"
                onClick={() => onChangeTheme('light')}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between ${
                  isLight
                    ? 'bg-[#FFF8F6] border-[#D94625] ring-2 ring-[#D94625]/30 shadow-lg'
                    : 'bg-[#141824] border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Visual miniature preview (CarCheckBot porcelain + white + terracotta) */}
                <div className="w-full h-16 rounded-xl bg-[#F6F7F9] border border-slate-200 p-2 mb-2 flex flex-col justify-between shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#D94625]" />
                      <div className="w-8 h-1.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="w-4 h-1.5 rounded-full bg-[#D94625]/60" />
                  </div>
                  <div className="p-1 rounded bg-[#FFFFFF] border border-slate-200 flex items-center justify-between shadow-sm">
                    <div className="w-10 h-1.5 rounded bg-slate-800" />
                    <div className="w-4 h-1.5 rounded bg-[#D94625]" />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-[#D94625]" />
                    <span
                      className={`text-xs font-bold font-['Exo_2',sans-serif] ${
                        isLight ? 'text-slate-900 font-extrabold' : 'text-slate-200'
                      }`}
                    >
                      Светлая
                    </span>
                  </div>
                  {isLight && (
                    <div className="w-5 h-5 rounded-full bg-[#D94625] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#D94625] font-semibold mt-0.5">
                  Стиль carcheckbot.com
                </span>
              </button>
            </div>

            <p
              className={`text-[11px] leading-relaxed px-1 ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Светлая тема переключает каталог в стиль сервиса <b>CarCheckBot</b>: фарфоровый светлый фон, белые карточки с мягкими тенями и тёплые терракотовые кнопки.
            </p>
          </div>

          {/* SECTION 3: CARCHECKBOT ИНТЕГРАЦИЯ (КАК В СКРИНШОТЕ) */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2.5 transition-colors ${
              isLight
                ? 'bg-[#FAF6F0] border-[#F0E4D5]'
                : 'bg-[#141b2a] border-blue-900/30'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isLight
                    ? 'bg-[#FEECE8] border-[#FFDDD6] text-[#D94625]'
                    : 'bg-[#068eff]/20 border-[#068eff]/40 text-[#068eff]'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider font-['Exo_2',sans-serif] ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    CarCheckBot
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#D94625] text-white font-bold">
                    PRO
                  </span>
                </div>
                <p className={`text-[11px] leading-snug mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Подробный отчёт по VIN: реальный продавец, резерв аукциона, страховая история и Window Sticker.
                </p>
              </div>
            </div>

            <a
              href="https://carcheckbot.com/ru"
              target="_blank"
              rel="noreferrer"
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                isLight
                  ? 'bg-[#D94625] hover:bg-[#C23E1D] text-white shadow-sm'
                  : 'bg-[#068eff] hover:bg-[#007be5] text-white shadow-md'
              }`}
            >
              <span>Открыть сайт carcheckbot.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* SECTION 4: БЫСТРЫЕ ДЕЙСТВИЯ */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onResetFilters();
                onClose();
              }}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-[#131724] border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Сбросить все фильтры поиска</span>
            </button>

            {bookmarksCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Очистить все закладки?')) {
                    onClearBookmarks();
                  }
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${
                  isLight
                    ? 'bg-red-50/60 border-red-200 text-red-600 hover:bg-red-50'
                    : 'bg-red-950/30 border-red-900/40 text-red-400 hover:bg-red-900/30'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Очистить закладки ({bookmarksCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
