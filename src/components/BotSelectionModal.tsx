import React, { useState, useEffect } from 'react';
import {
  X,
  Gauge,
  Bot,
  Zap,
  Send,
  Sliders,
  Car,
  Pause,
  Play
} from 'lucide-react';
import { BotConfig, PrimeFilterState, AutoCollectorConfig } from '../types/car';
import { US_MAKES_MODELS } from '../data/auctionLots';

type SendResult = { ok: boolean; via: 'server'; why: string };

interface BotSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  onChangeConfig: (cfg: BotConfig) => void;
  filters: PrimeFilterState;
  onChangeFilters: (f: PrimeFilterState) => void;
  onOpenFilter: () => void;
}

// Дата в формате ГГГГ-ММ-ДД для подписки: пустая строка - все ближайшие торги.
const collectorDateParam = (cfg: BotConfig): string => {
  if (cfg.datePreset === 'exact') return cfg.dateExact || '';

  const offset = cfg.datePreset === 'today' ? 0 : cfg.datePreset === 'tomorrow' ? 1 : null;
  if (offset === null) return '';

  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const DEFAULT_AUTO_COLLECTOR: AutoCollectorConfig = {
  isActive: false,
  intervalHours: 24, // 1 раз в день
  notifyChannel: 'telegram'
};

// Короткая строка о том, что сейчас стоит в главном фильтре.
const filterSummary = (f: PrimeFilterState): string => {
  const parts: string[] = [];
  if (f.make) parts.push([f.make, f.model].filter(Boolean).join(' '));
  if (f.timed === 'only') parts.push('IAAI Timed');
  else if (f.auction) parts.push(f.auction === 'copart' ? 'Copart' : 'IAAI');
  if (f.yearFrom || f.yearTo) parts.push(`${f.yearFrom || 'любой'}–${f.yearTo || 'любой'} гг.`);
  if (f.damageExclude) parts.push(`без ${f.damageExclude}`);
  if (f.documents && f.documents.length) parts.push(f.documents.join('/'));
  if (f.state) parts.push(f.state);
  return parts.length ? parts.join(' · ') : 'Без фильтра - все торги США';
};

// Подписка автосборщика = главный фильтр ленты целиком. Поля, которых сервер
// не понимает (двигатель, КПП, привод, состояние), не отправляем.
const collectorSubscription = (cfg: BotConfig, f: PrimeFilterState) => ({
  make: f.make || '',
  model: f.model || '',
  timed: f.timed === 'only' ? '1' : 'all',
  site: f.auction === 'copart' ? '1' : f.auction === 'iaai' ? '2' : '',
  date: collectorDateParam(cfg),
  year_from: f.yearFrom || '',
  year_to: f.yearTo || '',
  odometer_from: f.odometerFrom || '',
  odometer_to: f.odometerTo || '',
  fuel: f.fuel || '',
  state: f.state || '',
  damage_pr: f.damage || '',
  damage_exclude: f.damageExclude || '',
  document: (f.documents || []).join(',')
});


export const BotSelectionModal: React.FC<BotSelectionModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  filters,
  onChangeFilters,
  onOpenFilter
}) => {
  // AutoCollector state persisted in localStorage
  const [autoCollector, setAutoCollector] = useState<AutoCollectorConfig>(() => {
    try {
      const saved = localStorage.getItem('prime_autocollector_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_AUTO_COLLECTOR, ...parsed };
      }
    } catch {}
    return { ...DEFAULT_AUTO_COLLECTOR };
  });

  const [toastText, setToastText] = useState<string | null>(null);

  // Что о нас знает Telegram: видно только изнутри самого WebView.
  const [tgInfo, setTgInfo] = useState('Telegram не определён - открывай раздел из чата бота');
  const [sendNote, setSendNote] = useState('');
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;
    try { tg.ready(); tg.expand?.(); } catch {}
    setTgInfo([
      tg.platform || 'платформа неизвестна',
      tg.version ? `v${tg.version}` : '',
      tg.botPermissions
        ? (tg.botPermissions.can_write_to_pm ? 'писать боту можно' : 'писать боту нельзя')
        : 'право писать не подтверждено',
      tg.initData ? `вход есть` : 'входа нет'
    ].filter(Boolean).join(' · '));
  }, []);

  // Persist autoCollector
  useEffect(() => {
    localStorage.setItem('prime_autocollector_config', JSON.stringify(autoCollector));
  }, [autoCollector]);

  // Dropdown options for AutoCollector: марка и модель живут в главном фильтре
  const availableMakes = Object.keys(US_MAKES_MODELS).sort();
  const availableModels = filters.make && US_MAKES_MODELS[filters.make]
    ? US_MAKES_MODELS[filters.make]
    : [];

  const handleCollectorMakeChange = (make: string) => {
    onChangeFilters({ ...filters, make, model: '' });
  };

  // Toast timer
  useEffect(() => {
    if (toastText) {
      const t = setTimeout(() => setToastText(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastText]);

  if (!isOpen) return null;

  // Ключ сессии выдаёт бот вместе со ссылкой на приложение. Он привязан к
  // конкретному человеку на стороне сервера, поэтому подписку можно принять
  // и без проверки подписи Telegram - фильтр приедет целым JSON-ом.
  const sessionKey = () => new URLSearchParams(window.location.search).get('n') || '';

  // Основной канал - наш сервер: приложение POSTит подписку, сервер сверяет
  // подпись initData. Deep-link в чат остаётся запасным, если сервер отверг.
  const sendBotPayload = async (payload: Record<string, string>): Promise<SendResult> => {
    const { action, ...filter } = payload;
    const tgApp = (window as any).Telegram?.WebApp;
    // Сервер сверяет подпись по сырой строке initData: в свежем SDK
    // initData - уже объект, поэтому берём initDataRaw.
    const initData = typeof tgApp?.initDataRaw === 'string' && tgApp.initDataRaw
      ? tgApp.initDataRaw
      : (typeof tgApp?.initData === 'string' ? tgApp.initData : '');
    let why = 'сервер не ответил';
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ init_data: initData, nonce: sessionKey(), action, filter })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.status === 'ok') {
        return { ok: true, via: 'server', why: `сервер принял, подписчиков: ${data.total}` };
      }
      why = data?.message || ('код ' + res.status);
    } catch (e: any) {
      why = 'сервер недоступен: ' + (e?.message || e);
    }
    return { ok: false, via: 'server', why: `${why}${sessionKey() ? '' : ', ключ сессии не передан - открывай из кнопки бота'}` };
  };

  const currentSignature = JSON.stringify(collectorSubscription(config, filters));

  const handleToggleAutoCollector = async () => {
    const subscription = collectorSubscription(config, filters);
    const starting = !autoCollector.isActive;

    if (starting && !subscription.make) {
      setToastText('Сначала выбери марку в фильтре');
      return;
    }

    const sent = await sendBotPayload({
      action: starting ? 'autocollect' : 'autocollect_stop',
      ...subscription
    });

    setSendNote(sent.why);

    if (!sent.ok) {
      setToastText('Подписка не ушла: ' + sent.why);
      return;
    }

    setAutoCollector((prev) => ({
      ...prev,
      isActive: starting,
      lastRun: starting ? Date.now() : prev.lastRun,
      sentFilter: starting ? currentSignature : ''
    }));

    setToastText(starting
      ? `⚡ Автосборщик запущен! Ищем ${subscription.make} ${subscription.model}`
      : 'Автосборщик остановлен');
  };

  // Фильтр поменяли при активной подписке: применяем отдельно, чтобы смена
  // настройки не запускала новый скан каждый раз.
  const filterNeedsApply =
    autoCollector.isActive && !!autoCollector.sentFilter && autoCollector.sentFilter !== currentSignature;

  const handleApplyFilter = async () => {
    const sent = await sendBotPayload({ action: 'autocollect_update', ...collectorSubscription(config, filters) });
    setSendNote(sent.why);
    if (!sent.ok) {
      setToastText('Фильтр не принят: ' + sent.why);
      return;
    }
    setAutoCollector((prev) => ({ ...prev, sentFilter: currentSignature }));
    setToastText('🔄 Новый фильтр применён к автосборщику');
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
                Автоподбор
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Подборка машин 1 раз в день
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

        {/* Toast inside modal */}
        {toastText && (
          <div className="p-3 bg-[#131f34] border border-[#068eff]/60 rounded-xl mb-4 text-xs text-white flex items-center gap-2 shadow-lg animate-fade-in-fast">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastText}</span>
          </div>
        )}

        {/* ===================== АВТОСБОРЩИК: ПОДБОРКА МАШИН 1 РАЗ В ДЕНЬ ===================== */}
        <div className="space-y-4">
          {/* Кнопка главного фильтра: открывается поверх этого окна */}
          <button
            type="button"
            onClick={onOpenFilter}
            className="w-full p-3 bg-[#131724] border border-slate-800 hover:border-[#068eff]/60 rounded-2xl flex items-center gap-2.5 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-[#068eff]/15 border border-[#068eff]/30 text-[#068eff] flex items-center justify-center shrink-0">
              <Sliders className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-white uppercase tracking-wider font-['Exo_2',sans-serif]">
                Фильтр
              </span>
              <span className="block text-[11px] text-slate-400 truncate">
                {filterSummary(filters)}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#068eff] shrink-0">Изменить</span>
          </button>

          <p className="text-[10px] text-slate-500 px-1">{[tgInfo, sendNote].filter(Boolean).join(' · ')}</p>

          {filterNeedsApply && (
            <div className="p-2.5 bg-amber-950/40 border border-amber-600/50 rounded-xl flex items-center justify-between gap-2">
              <span className="text-[11px] text-amber-200">Фильтр изменён, подписка ещё со старым</span>
              <button
                type="button"
                onClick={handleApplyFilter}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-black text-[11px] font-bold uppercase tracking-wide hover:bg-amber-400 transition-colors shrink-0"
              >
                Применить
              </button>
            </div>
          )}

          {/* Активная статус-плашка, если уже запущен */}
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
                    Ищет {filters.make || 'авто'} {filters.model || ''} и отправляет подборку
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

          {/* Марка и модель: эти же поля меняются в главном фильтре */}
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
                  value={filters.make}
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
                  value={filters.model}
                  onChange={(e) => onChangeFilters({ ...filters, model: e.target.value })}
                  disabled={!filters.make}
                  className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-[#0d1017] text-slate-400">
                    {filters.make ? 'Все модели марки' : 'Сначала выберите марку'}
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
                  value={filters.yearFrom}
                  onChange={(e) => onChangeFilters({ ...filters, yearFrom: e.target.value })}
                  placeholder="2020"
                  className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Год до</label>
                <input
                  type="number"
                  value={filters.yearTo}
                  onChange={(e) => onChangeFilters({ ...filters, yearTo: e.target.value })}
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

          {/* День торгов: чего нет в главном фильтре */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 block font-medium">
              День торгов
            </label>
            <select
              value={config.datePreset}
              onChange={(e) => onChangeConfig({ ...config, datePreset: e.target.value as any })}
              className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="any">Все ближайшие торги</option>
              <option value="today">Сегодня</option>
              <option value="tomorrow">Завтра</option>
              <option value="exact">Конкретная дата</option>
            </select>
            {config.datePreset === 'exact' && (
              <input
                type="date"
                value={config.dateExact}
                onChange={(e) => onChangeConfig({ ...config, dateExact: e.target.value })}
                className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            )}
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
      </div>
    </div>
  );
};
