import React, { useState, useEffect } from 'react';
import {
  X,
  Gauge,
  Clock,
  Calendar,
  CheckCircle2,
  Radio,
  Compass,
  Bot,
  Zap,
  Bell,
  Send,
  Sliders,
  Car,
  Check,
  Pause,
  Play
} from 'lucide-react';
import { BotConfig, PrimeFilterState, AutoCollectorConfig } from '../types/car';
import { US_MAKES_MODELS } from '../data/auctionLots';
import { ClockDialAnimation } from './ClockDialAnimation';

interface BotSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  onChangeConfig: (cfg: BotConfig) => void;
  filters: PrimeFilterState;
  onRunBotScan: (cfg: BotConfig) => Promise<void>;
  isScanning: boolean;
  botStatusText: string;
}

const DEFAULT_AUTO_COLLECTOR: AutoCollectorConfig = {
  isActive: false,
  make: '',
  model: '',
  yearFrom: '2020',
  yearTo: '2024',
  intervalHours: 24, // 1 раз в день
  notifyChannel: 'telegram'
};

export const BotSelectionModal: React.FC<BotSelectionModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  filters,
  onRunBotScan,
  isScanning,
  botStatusText
}) => {
  // Tab: 'searchBot' (Поиск бот) or 'autoCollector' (Автосборщик конкретной модели)
  const [activeTab, setActiveTab] = useState<'searchBot' | 'autoCollector'>('searchBot');

  // AutoCollector state persisted in localStorage
  const [autoCollector, setAutoCollector] = useState<AutoCollectorConfig>(() => {
    try {
      const saved = localStorage.getItem('prime_autocollector_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      ...DEFAULT_AUTO_COLLECTOR,
      make: filters.make || '',
      model: filters.model || ''
    };
  });

  const [toastText, setToastText] = useState<string | null>(null);

  // Sync initial make/model from active filters if empty
  useEffect(() => {
    if (!autoCollector.make && filters.make) {
      setAutoCollector((prev) => ({ ...prev, make: filters.make }));
    }
    if (!autoCollector.model && filters.model) {
      setAutoCollector((prev) => ({ ...prev, model: filters.model }));
    }
  }, [filters.make, filters.model]);

  // Persist autoCollector
  useEffect(() => {
    localStorage.setItem('prime_autocollector_config', JSON.stringify(autoCollector));
  }, [autoCollector]);

  // Dropdown options for AutoCollector
  const availableMakes = Object.keys(US_MAKES_MODELS).sort();
  const availableModels = autoCollector.make && US_MAKES_MODELS[autoCollector.make]
    ? US_MAKES_MODELS[autoCollector.make]
    : [];

  const handleCollectorMakeChange = (make: string) => {
    setAutoCollector((prev) => ({
      ...prev,
      make,
      model: '' // Reset model when make changes
    }));
  };

  // Toast timer
  useEffect(() => {
    if (toastText) {
      const t = setTimeout(() => setToastText(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastText]);

  if (!isOpen) return null;

  const handleStartScan = async () => {
    await onRunBotScan(config);
  };

  // Toggle AutoCollector. Каждое нажатие уходит боту, иначе память приложения
  // и реальная подписка разъезжаются и кнопка ничего не запускает.
  const handleToggleAutoCollector = () => {
    const targetModel = autoCollector.model || filters.model || '';
    const targetMake = autoCollector.make || filters.make || '';
    const starting = !autoCollector.isActive;

    if (starting && !targetMake) {
      setToastText('Сначала выбери марку');
      return;
    }

    setAutoCollector((prev) => ({
      ...prev,
      isActive: starting,
      lastRun: starting ? Date.now() : prev.lastRun
    }));
    setToastText(starting
      ? `⚡ Автосборщик запущен! Ищем ${targetMake} ${targetModel}`
      : 'Автосборщик остановлен');

    const tg = (window as any).Telegram?.WebApp;

    if (typeof tg?.sendData === 'function') {
      try {
        tg.sendData(JSON.stringify({
          action: starting ? 'autocollect' : 'autocollect_stop',
          make: targetMake,
          model: targetModel
        }));
      } catch (e) {
        console.error('Telegram sendData error', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in-fast"
      />

      {/* Slide-up Bottom Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md mx-auto max-h-[92vh] overflow-y-auto bg-[#0f131c] border-t border-slate-800 rounded-t-3xl shadow-2xl p-5 z-10 animate-slide-up-fast"
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#068eff]/15 border border-[#068eff]/30 text-[#068eff] flex items-center justify-center">
              <Gauge className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Exo_2',sans-serif] uppercase tracking-wide">
                Автоподбор и роботы
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Copart & IAAI Timed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEGMENTED SWITCHER: ДВА БОТА В АВТОПОДБОРЕ */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#131724] border border-slate-800/90 rounded-2xl mb-4">
          {/* Bot 1: Поиск бот */}
          <button
            type="button"
            onClick={() => setActiveTab('searchBot')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'searchBot'
                ? 'bg-[#068eff] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Поиск бот</span>
          </button>

          {/* Bot 2: Автосборщик */}
          <button
            type="button"
            onClick={() => setActiveTab('autoCollector')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'autoCollector'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Автосборщик</span>
            {autoCollector.isActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-2 right-2" />
            )}
          </button>
        </div>

        {/* Toast inside modal */}
        {toastText && (
          <div className="p-3 bg-[#131f34] border border-[#068eff]/60 rounded-xl mb-4 text-xs text-white flex items-center gap-2 shadow-lg animate-fade-in-fast">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastText}</span>
          </div>
        )}

        {/* ===================== TAB 1: ПОИСК БОТ ===================== */}
        {activeTab === 'searchBot' && (
          <div>
            {/* Hint Box: Пояснялка */}
            <div className="p-3 bg-[#131929] border border-blue-900/40 rounded-xl text-xs text-slate-200 leading-relaxed mb-4 flex items-center gap-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#068eff]/20 border border-[#068eff]/40 text-[#068eff] flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="font-semibold text-white block">
                  Буду искать лоты и отправлять вам
                </span>
                <span className="text-[11px] text-slate-400">
                  Мгновенный подбор по аукционам Copart и IAAI Timed
                </span>
              </div>
            </div>

            {/* Active Filters Context */}
            {(filters.make || filters.model || filters.auction || filters.yearFrom) && (
              <div className="p-2.5 bg-[#141824] rounded-lg border border-slate-800 text-[11px] text-slate-400 mb-4 flex flex-wrap gap-1.5 items-center">
                <span className="text-slate-500 font-medium">Фильтр:</span>
                {filters.make && <span className="text-white font-semibold">{filters.make}</span>}
                {filters.model && <span className="text-white font-semibold">{filters.model}</span>}
                {filters.auction && <span className="text-blue-400 uppercase font-mono">{filters.auction}</span>}
                {filters.yearFrom && <span>от {filters.yearFrom} г.</span>}
              </div>
            )}

            {/* Animated Clock Dial during Search / Scan */}
            {isScanning ? (
              <div className="py-4 my-2 bg-[#121624] rounded-2xl border border-[#068eff]/30 flex flex-col items-center justify-center">
                <ClockDialAnimation
                  size={80}
                  label="Сканирование аукционов..."
                  sublabel={botStatusText || "Анализ Timed-торгов Copart & IAAI"}
                  isSearching={true}
                />
              </div>
            ) : (
              /* Bot Controls */
              <div className="space-y-3.5 mb-5">
                {/* День торгов */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#068eff]" />
                    День торгов
                  </label>
                  <select
                    value={config.datePreset}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        datePreset: e.target.value as any
                      })
                    }
                    className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
                  >
                    <option value="today">Сегодня</option>
                    <option value="tomorrow">Завтра</option>
                    <option value="exact">Конкретная дата</option>
                    <option value="any">Все ближайшие торги</option>
                  </select>
                </div>

                {/* Конкретная дата (if selected) */}
                {config.datePreset === 'exact' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Дата торгов
                    </label>
                    <input
                      type="date"
                      value={config.dateExact}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          dateExact: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
                    />
                  </div>
                )}

                {/* Timed-аукционы режим */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Аукцион
                  </label>
                  <select
                    value={config.timedMode}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        timedMode: e.target.value as any
                      })
                    }
                    className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
                  >
                    <option value="only">IAAI Timed</option>
                    <option value="all">Все аукционы</option>
                  </select>
                </div>
              </div>
            )}

            {/* Status text when done */}
            {!isScanning && botStatusText && (
              <div className="p-3 bg-[#111624] border border-emerald-500/40 rounded-xl mb-4 text-xs flex items-center gap-2.5 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono">{botStatusText}</span>
              </div>
            )}

            {/* Action Button: 'Поиск бот' */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isScanning}
                onClick={handleStartScan}
                className="w-full py-3 bg-[#068eff] hover:bg-[#007be5] active:bg-[#006cc8] disabled:opacity-50 text-white font-['Exo_2',sans-serif] font-bold text-sm tracking-wide rounded-xl transition-all shadow-lg shadow-[#068eff]/25 flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>{isScanning ? 'Идет поиск...' : 'Поиск бот'}</span>
              </button>
              <p className="text-[11px] text-center text-slate-400">
                Буду искать лоты и отправлять вам
              </p>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: АВТОСБОРЩИК (ПОДБОРКА МАШИН 1 РАЗ В ДЕНЬ) ===================== */}
        {activeTab === 'autoCollector' && (
          <div className="space-y-4">
            {/* Active status banner if running */}
            {autoCollector.isActive ? (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                        Автосборщик активен
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Ищет {autoCollector.make || 'авто'} {autoCollector.model || ''} и отправляет подборку 1 раз в день
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAutoCollector}
                  className="px-2.5 py-1.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs font-semibold hover:bg-red-900/60 transition-colors flex items-center gap-1"
                >
                  <Pause className="w-3 h-3" />
                  <span>Стоп</span>
                </button>
              </div>
            ) : (
              <div className="p-3 bg-[#131929] border border-blue-900/40 rounded-xl text-xs text-slate-200 leading-relaxed flex items-center gap-2.5 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-white block">
                    Автоматическая подборка 1 раз в день
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Бот будет отправлять подборку машин 1 раз в день прямо в Telegram
                  </span>
                </div>
              </div>
            )}

            {/* Model Target Configuration Form */}
            <div className="space-y-3 bg-[#131724] border border-slate-800 rounded-2xl p-3.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-['Exo_2',sans-serif]">
                <Car className="w-3.5 h-3.5 text-emerald-400" />
                <span>Какую модель искать:</span>
              </h4>

              {/* Марка & Модель (Выбор из списков) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-medium">Марка</label>
                  <select
                    value={autoCollector.make}
                    onChange={(e) => handleCollectorMakeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="" className="bg-[#0d1017] text-slate-400">Выберите марку</option>
                    {availableMakes.map((m) => (
                      <option key={m} value={m} className="bg-[#0d1017] text-white">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-medium">Модель</label>
                  <select
                    value={autoCollector.model}
                    onChange={(e) =>
                      setAutoCollector((prev) => ({ ...prev, model: e.target.value }))
                    }
                    disabled={!autoCollector.make}
                    className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="" className="bg-[#0d1017] text-slate-400">
                      {autoCollector.make ? 'Все модели марки' : 'Сначала выберите марку'}
                    </option>
                    {availableModels.map((mod) => (
                      <option key={mod} value={mod} className="bg-[#0d1017] text-white">
                        {mod}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Год выпуска диапазон */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Год от</label>
                  <input
                    type="number"
                    value={autoCollector.yearFrom}
                    onChange={(e) =>
                      setAutoCollector((prev) => ({ ...prev, yearFrom: e.target.value }))
                    }
                    placeholder="2020"
                    className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Год до</label>
                  <input
                    type="number"
                    value={autoCollector.yearTo}
                    onChange={(e) =>
                      setAutoCollector((prev) => ({ ...prev, yearTo: e.target.value }))
                    }
                    placeholder="2024"
                    className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Периодичность проверки (1 раз в день) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] text-slate-400 block">Периодичность отправки подборки:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAutoCollector((prev) => ({ ...prev, intervalHours: 24 }))}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      autoCollector.intervalHours === 24
                        ? 'bg-emerald-600/25 border-emerald-500 text-white font-bold'
                        : 'bg-[#0d1017] border-slate-800 text-slate-400'
                    }`}
                  >
                    1 раз в день
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoCollector((prev) => ({ ...prev, intervalHours: 12 }))}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      autoCollector.intervalHours === 12
                        ? 'bg-emerald-600/25 border-emerald-500 text-white font-bold'
                        : 'bg-[#0d1017] border-slate-800 text-slate-400'
                    }`}
                  >
                    2 раза в день
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoCollector((prev) => ({ ...prev, intervalHours: 1 }))}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      autoCollector.intervalHours === 1
                        ? 'bg-emerald-600/25 border-emerald-500 text-white font-bold'
                        : 'bg-[#0d1017] border-slate-800 text-slate-400'
                    }`}
                  >
                    Каждый час
                  </button>
                </div>
              </div>

              {/* Куда слать */}
              <div className="p-2.5 bg-[#0e121d] rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Куда высылать подборку:</span>
                </div>
                <span className="font-semibold text-emerald-400 font-mono text-[11px]">
                  Telegram бот
                </span>
              </div>
            </div>

            {/* Launch / Stop Action Button */}
            <button
              type="button"
              onClick={handleToggleAutoCollector}
              className={`w-full py-3 text-white font-['Exo_2',sans-serif] font-bold text-sm tracking-wide rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                autoCollector.isActive
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-950/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
              }`}
            >
              {autoCollector.isActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Остановить автосборщик</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Запустить автосборщик (1 раз в день)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400">
              Бот будет отправлять подборку машин 1 раз в день
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
