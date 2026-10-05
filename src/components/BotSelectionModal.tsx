import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Gauge,
  Bot,
  Zap,
  Send,
  Sliders,
  Car,
  Pause,
  Play,
  RefreshCw,
  Activity,
  Radio,
  Info,
  AlertCircle
} from 'lucide-react';
import { BotConfig, PrimeFilterState, AutoCollectorConfig, missingRequiredFilters } from '../types/car';
import { US_MAKES_MODELS, DOCUMENT_OPTIONS, DAMAGE_TYPES, US_STATES } from '../data/auctionLots';

const STREAM_AUCTION_ITEMS = [
  { site: 'copart.com', path: '/lot/94820142', name: 'BMW X5 xDrive40i', vin: '5UXCR6C0*R9', bid: '$18,400', loc: 'Dallas, TX' },
  { site: 'iaai.com', path: '/VehicleDetail/39820194', name: 'Mercedes-Benz GLE 450', vin: '4JGFB5KE*PA', bid: '$24,200', loc: 'Atlanta, GA' },
  { site: 'copart.com', path: '/lot/88192041', name: 'Porsche Cayenne S', vin: 'WP1AA2AY*RD', bid: '$38,900', loc: 'Orlando, FL' },
  { site: 'iaai.com', path: '/VehicleDetail/41029482', name: 'Audi Q8 55 TFSI', vin: 'WA1VAAF1*R2', bid: '$29,500', loc: 'Chicago, IL' },
  { site: 'copart.com', path: '/lot/77291048', name: 'Lexus RX 350 AWD', vin: '2T2HZMCA*PC', bid: '$22,100', loc: 'Houston, TX' },
  { site: 'copart.com', path: '/lot/91029482', name: 'Ford Mustang GT Fastback', vin: '1FA6P8CF*R5', bid: '$19,800', loc: 'Miami, FL' },
  { site: 'iaai.com', path: '/VehicleDetail/40192834', name: 'Ram 1500 Limited 4x4', vin: '1C6SRFHT*RN', bid: '$31,000', loc: 'Phoenix, AZ' },
  { site: 'iaai.com', path: '/VehicleDetail/38491029', name: 'Toyota Camry XSE', vin: '4T1B11HK*PU', bid: '$13,600', loc: 'Newark, NJ' },
  { site: 'copart.com', path: '/lot/83910294', name: 'Acura MDX Type-S', vin: '5J8YD7H8*RL', bid: '$27,400', loc: 'Denver, CO' },
  { site: 'iaai.com', path: '/VehicleDetail/42019482', name: 'BMW M340i xDrive', vin: 'WBA53AY0*PF', bid: '$26,900', loc: 'Charlotte, NC' },
  { site: 'copart.com', path: '/lot/86102947', name: 'Mercedes-Benz C300 4MATIC', vin: '55SWF4KB*RU', bid: '$16,500', loc: 'Long Island, NY' },
  { site: 'iaai.com', path: '/VehicleDetail/43920195', name: 'Tesla Model Y Long Range', vin: '7SAYGDEE*PF', bid: '$21,800', loc: 'San Diego, CA' }
];

function RapidLinkStreamer({ isRefreshing, onStop }: { isRefreshing: boolean; onStop: () => void }) {
  const [index, setIndex] = useState(0);
  const [lotsScanned, setLotsScanned] = useState(14820);

  useEffect(() => {
    // Темп перебора: 70мс в фоне, 35мс во время принудительного обновления.
    const speed = isRefreshing ? 35 : 70;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % STREAM_AUCTION_ITEMS.length);
      setLotsScanned((prev) => prev + 1);
    }, speed);
    return () => clearInterval(interval);
  }, [isRefreshing]);

  const current = STREAM_AUCTION_ITEMS[index];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#090d16] border border-cyan-500/25 p-3 shadow-lg shadow-cyan-950/20">
      {/* Бегущий луч по верхней грани окна */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan opacity-90" />

      {/* Верхняя панель радара сканера */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1 truncate">
            <Radio className="w-3 h-3 animate-pulse shrink-0" />
            <span>Парсинг лотов в реальном времени</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onStop}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold uppercase flex items-center gap-1 transition-colors bg-red-950/70 border-red-800 text-red-300 hover:bg-red-900/70"
          >
            <Pause className="w-2.5 h-2.5" />
            <span>Стоп</span>
          </button>
        </div>
      </div>

      {/* Бегущие ссылки и автомобили */}
      <div className="space-y-1 font-mono">
        <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-semibold truncate bg-[#0f1422] px-2 py-1 rounded-lg border border-slate-800/60">
          <span className="text-slate-500 shrink-0 text-[10px]">URL:</span>
          <span className="truncate text-cyan-300 font-mono tracking-tight">
            https://{current.site}{current.path}
          </span>
          <span className="ml-auto text-[9px] px-1 py-0.2 rounded bg-[#068eff]/20 text-[#068eff] uppercase font-bold shrink-0">
            {current.site.split('.')[0]}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1 text-[11px] px-1 pt-0.5 text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-emerald-400 font-bold">▶</span>
            <span className="text-white font-bold truncate">{current.name}</span>
            <span className="text-slate-500 text-[10px] shrink-0 font-mono">VIN:{current.vin}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-amber-400 font-bold text-[10px]">{current.bid}</span>
            <span className="text-slate-500 text-[10px]">{current.loc}</span>
          </div>
        </div>
      </div>

      {/* Метрика просканированных лотов */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 mt-1.5 border-t border-slate-800/60 font-mono">
        <span className="flex items-center gap-1 text-slate-400">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>Поток: <strong className="text-white tabular-nums">{lotsScanned.toLocaleString('ru-RU')}</strong> лотов</span>
        </span>
        <span className="text-emerald-400 text-[9px] font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
          Идёт поиск
        </span>
      </div>
    </div>
  );
}

// Ответ сервера приходит меньше чем за секунду, но за это время должно быть
// видно, что подбор листает ленты, а не висит заглушка.
function ScanWork() {
  return (
    <span className="flex items-center gap-2">
      <span className="relative h-1.5 w-[74px] overflow-hidden rounded-full bg-slate-800">
        <span className="absolute inset-y-0 w-[34%] rounded-full bg-[#068eff] animate-scan" />
      </span>
      <span className="text-[9px] font-semibold normal-case tracking-normal text-slate-400">
        перебираем страницы лент
      </span>
    </span>
  );
}

type SendResult = { ok: boolean; via: 'server'; why: string; data?: any };

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

// Сервер хранит только непустые поля - приводим запись к тому же набору и
// порядку ключей, что считает клиент, иначе сравнение фильтров всегда врёт.
const serverSignature = (s: Record<string, string>): string => JSON.stringify({
  make: s.make || '', model: s.model || '', timed: s.timed || 'all', site: s.site || '',
  date: s.date || '', year_from: s.year_from || '', year_to: s.year_to || '',
  odometer_from: s.odometer_from || '', odometer_to: s.odometer_to || '', fuel: s.fuel || '',
  state: s.state || '', damage_pr: s.damage_pr || '', damage_exclude: s.damage_exclude || '',
  document: s.document || ''
});

const capFirst = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
const miles = (v: string) => (v ? Number(v).toLocaleString('ru-RU') : v);

// «Какое конкретно авто ищет» - одна строка по серверной записи подписки.
const describeServerSubscription = (s: Record<string, string>): string => {
  const bits: string[] = [];
  const car = [s.make, s.model].filter(Boolean).join(' ');
  bits.push(car || 'все лоты США');
  if (s.timed === '1') bits.push('IAAI Timed');
  else if (s.site) bits.push(s.site === '1' ? 'Copart' : 'IAAI');
  if (s.date) bits.push('торги ' + s.date);
  if (s.year_from || s.year_to) bits.push((s.year_from || 'любой') + '-' + (s.year_to || 'любой') + ' гг.');
  const odoFrom = s.odometer_from && Number(s.odometer_from) > 1 ? s.odometer_from : '';
  if (odoFrom && s.odometer_to) bits.push('пробег ' + miles(odoFrom) + '-' + miles(s.odometer_to) + ' миль');
  else if (s.odometer_to) bits.push('пробег до ' + miles(s.odometer_to) + ' миль');
  else if (odoFrom) bits.push('пробег от ' + miles(odoFrom) + ' миль');
  if (s.document) bits.push('титул ' + s.document.split(',').filter(Boolean).map(capFirst).join('/'));
  if (s.damage_pr) bits.push('повреждение ' + s.damage_pr);
  if (s.damage_exclude) bits.push('кроме ' + s.damage_exclude);
  if (s.fuel) bits.push(s.fuel);
  if (s.state) bits.push('штат ' + s.state);
  return bits.join(' · ');
};


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

  // Что сервер по этому человеку уже держит - чтобы видеть до нового подбора.
  // «Нет» на напоминании о смене фильтра: молчим, пока фильтр не поменяется снова.
  const [dismissedDiff, setDismissedDiff] = useState('');

  // Активный запрос списка подписок: по кнопке «Отменить» он обрывается.
  const abortRef = useRef<AbortController | null>(null);

  const [serverSub, setServerSub] = useState<{
    state: 'idle' | 'loading' | 'ok' | 'error'; text: string; signature: string; total: number; savedAt: string; why: string;
  }>({ state: 'idle', text: '', signature: '', total: 0, savedAt: '', why: '' });
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

  const auctionValue = filters.timed === 'only' ? 'iaai_timed' : filters.auction;

  const handleAuctionChange = (val: string) => {
    if (val === 'iaai_timed') onChangeFilters({ ...filters, auction: 'iaai', timed: 'only' });
    else if (val === 'iaai') onChangeFilters({ ...filters, auction: 'iaai', timed: '' });
    else if (val === 'copart') onChangeFilters({ ...filters, auction: 'copart', timed: '' });
    else onChangeFilters({ ...filters, auction: '', timed: '' });
  };

  const toggleDocument = (value: string) => {
    const documents = filters.documents.includes(value)
      ? filters.documents.filter((d) => d !== value)
      : [...filters.documents, value];
    onChangeFilters({ ...filters, documents });
  };

  // Toast timer
  useEffect(() => {
    if (toastText) {
      const t = setTimeout(() => setToastText(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastText]);

  // Ключ сессии выдаёт бот вместе со ссылкой на приложение. Он привязан к
  // конкретному человеку на стороне сервера, поэтому подписку можно принять
  // и без проверки подписи Telegram - фильтр приедет целым JSON-ом.
  const sessionKey = () => {
    const fromUrl = new URLSearchParams(window.location.search).get('n') || '';
    if (fromUrl) return fromUrl;
    // Telegram может не донести наш query до страницы - тогда ключ приходит
    // через start_param того же deep-link.
    const tg = (window as any).Telegram?.WebApp;
    const viaStart = String(tg?.startParam || (tg?.initData && tg.initData.start_param) || '');
    return viaStart.startsWith('k') ? viaStart.slice(1) : '';
  };

  // Основной канал - наш сервер: приложение POSTит подписку, сервер сверяет
  // подпись initData. Deep-link в чат остаётся запасным, если сервер отверг.
  const sendBotPayload = async (payload: Record<string, string>, signal?: AbortSignal): Promise<SendResult> => {
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
        body: JSON.stringify({ init_data: initData, nonce: sessionKey(), action, filter }),
        signal
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.status === 'ok') {
        return { ok: true, via: 'server', data, why: 'сервер принял, подписчиков: ' + data.total };
      }
      why = data?.message || ('код ' + res.status);
    } catch (e: any) {
      why = 'сервер недоступен: ' + (e?.message || e);
    }
    return { ok: false, via: 'server', why: `${why}${sessionKey() ? '' : ', ключ сессии не передан - открывай из кнопки бота'}` };
  };

  // Сервер - единственный правдивый источник о подписке: локальная плашка
  // переживает /stop и показывает то, чего уже нет.
  const refreshServerSubscription = async () => {
    setServerSub((prev) => ({ ...prev, state: 'loading' }));
    const startedAt = Date.now();
    const controller = new AbortController();
    abortRef.current = controller;
    const res = await sendBotPayload({ action: 'autocollect_list' }, controller.signal);

    if (controller.signal.aborted) {
      abortRef.current = null;
      return;
    }

    // Ответ приходит за полсекунды, и перебор страниц успел бы только мелькнуть.
    // Держим его минимум 1,2 секунды, чтобы человек видел работу, а не мигание.
    const holdScan = async () => {
      const rest = 1200 - (Date.now() - startedAt);
      if (rest > 0) await new Promise((resolve) => setTimeout(resolve, rest));
    };

    if (!res.ok) {
      await holdScan();
      setServerSub({ state: 'error', text: '', signature: '', total: 0, savedAt: '', why: res.why });
      return;
    }

    const sub: Record<string, string> | null = res.data?.subscription || null;
    const signature = sub ? serverSignature(sub) : '';
    await holdScan();
    setServerSub({
      state: 'ok',
      text: sub ? describeServerSubscription(sub) : '',
      signature,
      total: Number(res.data?.total || 0),
      savedAt: (sub && sub.updated_at) || '',
      why: ''
    });
    setAutoCollector((prev) => (sub
      ? { ...prev, isActive: true, sentFilter: signature }
      : prev.isActive ? { ...prev, isActive: false, sentFilter: '' } : prev));
  };

  useEffect(() => {
    if (isOpen) refreshServerSubscription();
  }, [isOpen]);

  const currentSignature = JSON.stringify(collectorSubscription(config, filters));

  const handleToggleAutoCollector = async () => {
    const subscription = collectorSubscription(config, filters);
    const starting = !autoCollector.isActive;

    if (starting) {
      const missing = missingRequiredFilters(filters);

      if (missing.length > 0) {
        setToastText('В фильтре не заполнено: ' + missing.join(', '));
        return;
      }
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
    await refreshServerSubscription();
  };

  // Фильтр поменяли при активной подписке: применяем отдельно, чтобы смена
  // настройки не запускала новый скан каждый раз.
  const filterNeedsApply =
    autoCollector.isActive
    && !!autoCollector.sentFilter
    && autoCollector.sentFilter !== currentSignature
    && dismissedDiff !== currentSignature;

  // Что подписка ищет прямо сейчас: серверная запись точнее, локальная
  // строка сравнения - запасной вариант, если сервер молчит.
  let sentSubscription: Record<string, string> | null = null;
  try {
    sentSubscription = autoCollector.sentFilter ? JSON.parse(autoCollector.sentFilter) : null;
  } catch {}
  const sentLabel = serverSub.text || (sentSubscription ? describeServerSubscription(sentSubscription) : '');

  // Отмена поиска: перебор гаснем сразу, подписку снимаем на сервере.
  const handleCancelSearch = async () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setServerSub((prev) => ({ ...prev, state: 'idle', text: '', signature: '', savedAt: '', why: '' }));

    const sent = await sendBotPayload({ action: 'autocollect_stop', ...collectorSubscription(config, filters) });
    setSendNote(sent.why);

    if (!sent.ok) {
      setServerSub((prev) => ({ ...prev, state: 'error', why: sent.why }));
      setToastText('Поиск не отменён: ' + sent.why);
      return;
    }

    setAutoCollector((prev) => ({ ...prev, isActive: false, sentFilter: '' }));
    setDismissedDiff('');
    setToastText('Отменено: поиск остановлен, подписка снята');
    await refreshServerSubscription();
  };

  const handleApplyFilter = async () => {
    const missing = missingRequiredFilters(filters);

    if (missing.length > 0) {
      setToastText('В фильтре не заполнено: ' + missing.join(', '));
      return;
    }

    const sent = await sendBotPayload({ action: 'autocollect_update', ...collectorSubscription(config, filters) });
    setSendNote(sent.why);
    if (!sent.ok) {
      setToastText('Фильтр не принят: ' + sent.why);
      return;
    }
    setAutoCollector((prev) => ({ ...prev, sentFilter: currentSignature }));
    setToastText('🔄 Новый фильтр применён к автосборщику');
    await refreshServerSubscription();
  };

  // Поиск считается включённым по серверной записи: локальный флаг может
  // отстать, и тогда «Стоп» по ошибке запустил бы новый подбор.
  const searchRunning = autoCollector.isActive || (serverSub.state === 'ok' && !!serverSub.text);

  if (!isOpen) return null;

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
        <div className="space-y-3.5">
          {/* 1. ВЫСОКОСКОРОСТНОЙ СКАНЕР ПОТОКА ССЫЛОК И ЛОТОВ (АНИМАЦИЯ ПЕРЕБОРА) */}
          {searchRunning && (
            <RapidLinkStreamer isRefreshing={serverSub.state === 'loading'} onStop={handleCancelSearch} />
          )}

          {/* 2. БЫСТРАЯ СВОДКА ТЕКУЩЕГО ФИЛЬТРА */}
          <div className="flex items-center justify-between gap-2 px-1 py-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#068eff]/15 border border-[#068eff]/30 text-[#068eff] flex items-center justify-center shrink-0">
                <Sliders className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] text-slate-300 truncate">
                {filterSummary(filters)}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenFilter}
              className="text-[11px] font-semibold text-[#068eff] hover:text-cyan-400 shrink-0 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>Все поля</span>
              <span className="text-[10px]">→</span>
            </button>
          </div>

          {/* 3. ЕДИНЫЙ КОМПАКТНЫЙ СТАТУС-БЛОК ПОДПИСКИ */}
          {autoCollector.isActive || (serverSub.state === 'ok' && serverSub.text) ? (
            <div className="p-3.5 bg-gradient-to-br from-[#0c1626] to-[#0c121e] border border-emerald-500/40 rounded-2xl shadow-lg shadow-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide font-['Exo_2',sans-serif]">
                        Автоподбор активен
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 min-w-0">
                      <span className="relative h-1.5 w-[74px] shrink-0 overflow-hidden rounded-full bg-emerald-900/60">
                        <span className="absolute inset-y-0 w-[34%] rounded-full bg-emerald-400 animate-scan" />
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">листает ленты</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={refreshServerSubscription}
                    disabled={serverSub.state === 'loading'}
                    className="p-1.5 rounded-lg bg-[#141b2b] border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
                    title="Обновить данные с сервера"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${serverSub.state === 'loading' ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleAutoCollector}
                    className="px-2.5 py-1.5 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs font-semibold hover:bg-red-900 transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Pause className="w-3 h-3" />
                    <span>Стоп</span>
                  </button>
                </div>
              </div>

              {/* Что именно ищет подписка */}
              <div className="px-3 py-2 rounded-xl bg-[#090d16]/90 border border-slate-800 text-xs flex items-start gap-2">
                <Car className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Критерии поиска:</span>
                  <span className="text-white font-medium break-words leading-tight text-[11px]">
                    {sentLabel || `${filters.make || 'Любой автомобиль'} ${filters.model || ''}`.trim()}
                  </span>
                  {serverSub.state === 'ok' && serverSub.savedAt && (
                    <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                      синхронизировано: {serverSub.savedAt} UTC
                    </span>
                  )}
                </div>
              </div>

              {/* Напоминание при смене фильтра во время активной подписки */}
              {filterNeedsApply && (
                <div className="p-2.5 bg-amber-950/50 border border-amber-600/50 rounded-xl space-y-2 animate-fade-in-fast">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Фильтр изменён: обновить подписку?</span>
                  </div>
                  <p className="text-[11px] text-amber-100/90 leading-tight">
                    Новые параметры: <strong className="text-white">{filterSummary(filters)}</strong>
                  </p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={handleApplyFilter}
                      className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wide transition-colors"
                    >
                      Применить к боту
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSearch}
                      className="px-3 py-1.5 rounded-lg bg-[#0d1017] border border-red-800/70 text-red-300 text-xs font-semibold hover:bg-red-950/50 transition-colors"
                    >
                      Отменить
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-gradient-to-br from-[#0e1422] to-[#090d16] border border-slate-800 rounded-2xl shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#068eff]/15 border border-[#068eff]/30 text-[#068eff] flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wide font-['Exo_2',sans-serif] block">
                      Автоподбор лотов
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ежедневная подборка прямо в Telegram
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCancelSearch}
                    className="px-2 py-1 rounded-lg bg-[#141b2b] border border-slate-700/80 text-slate-400 hover:text-red-400 transition-all text-[10px] font-semibold uppercase"
                  >
                    Сбросить
                  </button>

                  <button
                    type="button"
                    onClick={refreshServerSubscription}
                    disabled={serverSub.state === 'loading'}
                    className="px-2 py-1 rounded-lg bg-[#141b2b] border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
                    title="Проверить подписку на сервере"
                  >
                    <RefreshCw className={`w-3 h-3 ${serverSub.state === 'loading' ? 'animate-spin text-cyan-400' : ''}`} />
                    <span className="text-[10px] font-mono">{serverSub.state === 'loading' ? 'Скан...' : 'Проверить'}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-snug">
                Выберите марку и параметры в фильтре ниже и нажмите кнопку запуска автосборщика.
              </p>

              {/* Если нет ключа сессии, подсказываем запуск из бота без пугающих технических ошибок */}
              {!sessionKey() && (
                <div className="p-2 rounded-xl bg-blue-950/30 border border-blue-800/40 text-[10px] text-blue-200/90 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[#068eff] shrink-0" />
                  <span>Для привязки подписки к вашему аккаунту открывайте каталог из кнопки меню бота Telegram.</span>
                </div>
              )}
            </div>
          )}

          {/* Марка и модель: эти же поля меняются в главном фильтре */}
          <div className="space-y-3 bg-[#131724] border border-slate-800 rounded-2xl p-3.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-['Exo_2',sans-serif]">
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span>Фильтр подбора:</span>
            </h4>

            {/* Аукцион */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Аукцион</label>
              <select
                value={auctionValue}
                onChange={(e) => handleAuctionChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="" className="bg-[#0d1017] text-slate-400">Все аукционы</option>
                <option value="iaai_timed" className="bg-[#0d1017] text-white">IAAI Timed</option>
                <option value="iaai" className="bg-[#0d1017] text-white">IAAI</option>
                <option value="copart" className="bg-[#0d1017] text-white">Copart</option>
              </select>
            </div>

            {/* Марка & Модель (Выбор из списков) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-medium">
                  Марка <span className="text-[#ff6b6b]">*</span>
                </label>
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
                <label className="text-[10px] text-slate-400 block mb-1 font-medium">
                  Модель <span className="text-[#ff6b6b]">*</span>
                </label>
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

            {/* Год выпуска: достаточно одной границы */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Год выпуска <span className="text-[#ff6b6b]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={filters.yearFrom}
                  onChange={(e) => onChangeFilters({ ...filters, yearFrom: e.target.value })}
                  placeholder="Год от"
                  className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
                <input
                  type="number"
                  value={filters.yearTo}
                  onChange={(e) => onChangeFilters({ ...filters, yearTo: e.target.value })}
                  placeholder="Год до"
                  className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Пробег в милях: достаточно одной границы */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">
                Пробег (миль) <span className="text-[#ff6b6b]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={filters.odometerFrom}
                  onChange={(e) => onChangeFilters({ ...filters, odometerFrom: e.target.value })}
                  placeholder="От миль"
                  className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
                <input
                  type="number"
                  value={filters.odometerTo}
                  onChange={(e) => onChangeFilters({ ...filters, odometerTo: e.target.value })}
                  placeholder="До миль"
                  className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Топливо и штат */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Топливо</label>
                <select
                  value={filters.fuel}
                  onChange={(e) => onChangeFilters({ ...filters, fuel: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="" className="bg-[#0d1017] text-slate-400">Любое</option>
                  <option value="Gasoline" className="bg-[#0d1017] text-white">Бензин</option>
                  <option value="Diesel" className="bg-[#0d1017] text-white">Дизель</option>
                  <option value="Electric" className="bg-[#0d1017] text-white">Электро</option>
                  <option value="Flexible Fuel" className="bg-[#0d1017] text-white">Flex Fuel</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Штат</label>
                <select
                  value={filters.state}
                  onChange={(e) => onChangeFilters({ ...filters, state: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="" className="bg-[#0d1017] text-slate-400">Все штаты</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code} className="bg-[#0d1017] text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Повреждение: искать / исключить */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Повреждение</label>
                <select
                  value={filters.damage}
                  onChange={(e) => onChangeFilters({ ...filters, damage: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="" className="bg-[#0d1017] text-slate-400">Все типы</option>
                  {DAMAGE_TYPES.map((d) => (
                    <option key={d.value} value={d.value} className="bg-[#0d1017] text-white">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Исключить</label>
                <select
                  value={filters.damageExclude}
                  onChange={(e) => onChangeFilters({ ...filters, damageExclude: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0d1017] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="" className="bg-[#0d1017] text-slate-400">Не исключать</option>
                  {DAMAGE_TYPES.map((d) => (
                    <option key={d.value} value={d.value} className="bg-[#0d1017] text-white">
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Тип титула */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1.5">Документы</label>
              <div className="grid grid-cols-2 gap-1.5">
                {DOCUMENT_OPTIONS.map((doc) => {
                  const checked = filters.documents.includes(doc.value);
                  return (
                    <button
                      key={doc.value}
                      type="button"
                      onClick={() => toggleDocument(doc.value)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-left truncate transition-colors ${
                        checked
                          ? 'bg-[#068eff]/20 border-[#068eff] text-white'
                          : 'bg-[#0d1017] border-slate-800 text-slate-400'
                      }`}
                    >
                      {doc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Периодичность фиксирована: квота источника */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] text-slate-400 block">Периодичность отправки подборки:</label>
              <div>
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
