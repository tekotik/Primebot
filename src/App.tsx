import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  RotateCcw,
  SlidersHorizontal,
  Bookmark,
  Clock,
  Gauge,
  Radio,
  CarFront,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PrimeLogo } from './components/PrimeLogo';
import { MobileFilterDrawer } from './components/MobileFilterDrawer';
import { BotSelectionModal } from './components/BotSelectionModal';
import { MobileBookmarksDrawer } from './components/MobileBookmarksDrawer';
import { TimedCarCard } from './components/TimedCarCard';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ClockDialAnimation } from './components/ClockDialAnimation';
import { SaveToFolderModal } from './components/SaveToFolderModal';
import { UserSettingsModal } from './components/UserSettingsModal';
import { AUCTION_LOTS } from './data/auctionLots';
import { CarLot, PrimeFilterState, BotConfig, Currency, ClientFolder, DEFAULT_CLIENT_FOLDERS, sanitizeFolders, AppTheme } from './types/car';
import { carsApiService } from './services/carsApiService';

// Площадки ведут торги по своему времени, и на лентах оно нью-йоркское:
// отсюда живые часы на стартовом экране.
const NY_CLOCK = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

const NY_HM = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

function HeaderNyTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1 shrink-0" title="Время торгов - по Нью-Йорку">
      <Clock className="w-3 h-3 text-[#068eff]" />
      <span className="font-mono tabular-nums text-[11px] leading-none font-bold text-white">
        {NY_HM.format(now)}
      </span>
      <span className="font-mono text-[8px] leading-none font-bold uppercase text-[#068eff]">NYC</span>
    </div>
  );
}

function NyTimePlate() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pt-0.5 pb-3 text-center">
      <div className="flex items-baseline justify-center gap-1">
        <span className="font-mono tabular-nums text-[34px] leading-none font-black text-white tracking-tighter">
          {NY_CLOCK.format(now)}
        </span>
        <span className="font-mono text-[12px] leading-none font-bold uppercase text-[#068eff]">NYC</span>
      </div>
      <p className="mt-1.5 text-[10px] leading-tight text-slate-400">
        Время торгов указано по часовому поясу Нью-Йорка
      </p>
    </div>
  );
}

const DEFAULT_FILTERS: PrimeFilterState = {
  auction: '',
  timed: '', // По умолчанию лента показывает все аукционы, не только Timed
  make: '',
  model: '',
  yearFrom: '',
  yearTo: '',
  odometerFrom: '',
  odometerTo: '',
  fuel: '',
  engineFrom: '',
  engineTo: '',
  transmission: '',
  drive: '',
  damage: '',
  damageExclude: '',
  condition: '',
  documents: [],
  state: ''
};

export default function App() {
  const [filters, setFilters] = useState<PrimeFilterState>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isSearchingAnimation, setIsSearchingAnimation] = useState(false);
  const [liveLots, setLiveLots] = useState<CarLot[]>(() => AUCTION_LOTS);
  const [apiConnectionStatus, setApiConnectionStatus] = useState<'connected' | 'cache'>('cache');
  const [feedMeta, setFeedMeta] = useState<{
    cached: boolean;
    stale: boolean;
    serverTimeFormatted: string | null;
  }>({
    cached: false,
    stale: false,
    serverTimeFormatted: null
  });

  // Bookmarks (social network style)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('prime_bookmarks_ids');
      return saved ? JSON.parse(saved) : ['lot-45650660', 'lot-46095109'];
    } catch {
      return ['lot-45650660', 'lot-46095109'];
    }
  });

  // Client folders persisted in localStorage
  const [folders, setFolders] = useState<ClientFolder[]>(() => {
    try {
      const saved = localStorage.getItem('prime_client_folders');
      return saved ? sanitizeFolders(JSON.parse(saved)) : DEFAULT_CLIENT_FOLDERS;
    } catch {
      return DEFAULT_CLIENT_FOLDERS;
    }
  });

  // Save folders to localStorage
  useEffect(() => {
    localStorage.setItem('prime_client_folders', JSON.stringify(folders));
  }, [folders]);

  // Folder assignment modal state (shown immediately upon saving)
  const [saveToFolderLot, setSaveToFolderLot] = useState<CarLot | null>(null);

  // Modals & Drawers
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  // При каждом открытии Mini App спрашиваем, куда идти: смотреть лоты или
  // настраивать автосборщик. Без этого человек попадает в ленту молча.
  const [entryChoice, setEntryChoice] = useState<'ask' | 'browse' | 'bot'>('ask');
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  // Bot Auto-Podbor state
  const [botConfig, setBotConfig] = useState<BotConfig>({
    datePreset: 'tomorrow',
    dateExact: '',
    timedMode: 'only'
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // App theme state: 'light' (CarCheckBot Light) — единственная открытая тема.
  // 'dark' (Carbon Dark) отдаётся только после служебного пароля и живёт до сброса ключа.
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const unlocked = localStorage.getItem('prime_dark_unlocked') === '1';
      const saved = localStorage.getItem('prime_app_theme') as AppTheme;
      return unlocked && saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync theme with HTML root and body
  useEffect(() => {
    try {
      localStorage.setItem('prime_app_theme', theme);
    } catch {}
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
    }
  }, [theme]);

  // Initial load via cars-proxy.php / apicar API
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const lots = await carsApiService.searchCars(filters);
        if (isMounted && lots && lots.length > 0) {
          setLiveLots(lots);
          setApiConnectionStatus('connected');
        }
        if (isMounted) {
          setFeedMeta(carsApiService.getFeedStatus());
        }
      } catch (e) {
        if (isMounted) setApiConnectionStatus('cache');
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save bookmarks
  useEffect(() => {
    localStorage.setItem('prime_bookmarks_ids', JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // When bookmarking, immediately prompt which folder to send or create new folder
  const handleToggleBookmark = (lot: CarLot) => {
    const isBookmarked = bookmarkedIds.includes(lot.id);
    if (!isBookmarked) {
      setBookmarkedIds((prev) => [...prev, lot.id]);
      setToastMessage(`Добавлено в закладки: ${lot.year} ${lot.make} ${lot.model}`);
    }
    // Always open folder assignment sheet immediately
    setSaveToFolderLot(lot);
  };

  const handleAssignFolder = (lotId: string, folderId: string | 'unassigned') => {
    setFolders((prev) =>
      prev.map((f) => {
        if (folderId === 'unassigned') {
          return { ...f, lotIds: f.lotIds.filter((id) => id !== lotId) };
        }
        if (f.id === folderId) {
          const updated = Array.from(new Set([...f.lotIds, lotId]));
          return { ...f, lotIds: updated };
        }
        return { ...f, lotIds: f.lotIds.filter((id) => id !== lotId) };
      })
    );

    if (folderId === 'unassigned') {
      setToastMessage('📁 Сохранено в общий список закладок');
    } else {
      const target = folders.find((f) => f.id === folderId);
      setToastMessage(`📁 Лот отправлен в папку «${target?.name || 'Выбранную папку'}»`);
    }
  };

  const handleCreateFolderAndAssign = (folderName: string, lotId: string) => {
    const newFolder: ClientFolder = {
      id: `folder-${Date.now()}`,
      name: folderName,
      createdAt: Date.now(),
      lotIds: [lotId],
      notificationsEnabled: false
    };

    setFolders((prev) => [
      ...prev.map((f) => ({ ...f, lotIds: f.lotIds.filter((id) => id !== lotId) })),
      newFolder
    ]);
    setToastMessage(`📁 Создана папка «${folderName}» и лот сохранён туда!`);
  };

  const handleRemoveFromBookmarks = (lotId: string) => {
    setBookmarkedIds((prev) => prev.filter((id) => id !== lotId));
    setFolders((prev) =>
      prev.map((f) => ({ ...f, lotIds: f.lotIds.filter((id) => id !== lotId) }))
    );
    setToastMessage('Удалено из закладок');
    if (saveToFolderLot?.id === lotId) {
      setSaveToFolderLot(null);
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
    loadFilteredLots(DEFAULT_FILTERS);
  };

  const loadFilteredLots = async (f: PrimeFilterState) => {
    setIsSearchingAnimation(true);
    try {
      const results = await carsApiService.searchCars(f);
      setLiveLots(results);
      setFeedMeta(carsApiService.getFeedStatus());
    } catch (e) {
      // Local fallback
    } finally {
      setTimeout(() => setIsSearchingAnimation(false), 450);
    }
  };

  // Trigger search when filter changes
  const handleFilterUpdate = (newFilters: PrimeFilterState) => {
    setFilters(newFilters);
    loadFilteredLots(newFilters);
  };

  // Filtered Lots applying client search query and damage exclusions
  const displayLots = useMemo(() => {
    return liveLots.filter((lot) => {
      // Search by keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const str = `${lot.year} ${lot.make} ${lot.model} ${lot.trim} ${lot.vin} ${lot.lotId}`.toLowerCase();
        if (!str.includes(q)) return false;
      }

      // Damage exclusion
      if (filters.damageExclude && lot.primaryDamage === filters.damageExclude) return false;

      // Condition
      if (filters.condition && lot.condition !== filters.condition) return false;

      // Documents multi-select
      // Как на сервере: разряд (clean/salvage/other) или точная строка титула
      // (clear/original/rebuilt/parts only и т.п.)
      if (filters.documents.length > 0) {
        const old = (lot.documentOld || '').toLowerCase();
        const hit = filters.documents.some((d) => d === lot.document || old.includes(d === 'rebuilt' ? 'rebuild' : d));
        if (!hit) return false;
      }

      return true;
    });
  }, [liveLots, searchQuery, filters.damageExclude, filters.condition, filters.documents]);

  // Bookmarked lots array
  const bookmarkedLots = useMemo(() => {
    const all = [...liveLots, ...AUCTION_LOTS];
    const map = new Map<string, CarLot>();
    all.forEach((l) => map.set(l.id, l));
    return bookmarkedIds.map((id) => map.get(id)).filter(Boolean) as CarLot[];
  }, [bookmarkedIds, liveLots]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.auction) count++;
    if (filters.timed === 'only') count++;
    if (filters.make) count++;
    if (filters.model) count++;
    if (filters.yearFrom || filters.yearTo) count++;
    if (filters.odometerFrom || filters.odometerTo) count++;
    if (filters.fuel) count++;
    if (filters.engineFrom || filters.engineTo) count++;
    if (filters.transmission) count++;
    if (filters.drive) count++;
    if (filters.damage) count++;
    if (filters.damageExclude) count++;
    if (filters.condition) count++;
    if (filters.documents.length > 0) count++;
    if (filters.state) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-[#090c12] text-slate-100 flex flex-col font-sans pb-24 selection:bg-[#068eff] selection:text-white">
      {/* 1. Mobile Top Header with PrimeAvtoExport Logo and Serious Typography */}
      <header className="sticky top-0 z-30 w-full bg-[#0c1018]/95 backdrop-blur-md border-b border-slate-800/90 px-4 py-3 flex items-center justify-between">
        <PrimeLogo size={28} showText={true} theme={theme} />

        <div className="flex items-center gap-2 shrink-0">
          <HeaderNyTime />
          {/* Quick Bookmarks Indicator */}
          {bookmarkedLots.length > 0 && (
            <button
              type="button"
              onClick={() => setIsBookmarksOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#068eff]/15 border border-[#068eff]/30 text-[#068eff] text-xs font-semibold hover:bg-[#068eff]/25 transition-colors"
              title="Закладки"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono text-[11px]">{bookmarkedLots.length}</span>
            </button>
          )}
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 inset-x-4 z-50 flex items-center gap-2 p-3 bg-[#131929] border border-[#068eff]/60 rounded-xl shadow-xl text-xs text-white animate-in fade-in slide-in-from-top-2">
          <Bookmark className="w-4 h-4 text-[#068eff] fill-current shrink-0" />
          <span className="flex-1 truncate">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setIsBookmarksOpen(true)}
            className="text-[#068eff] font-bold text-[11px] underline"
          >
            Открыть
          </button>
        </div>
      )}

      {/* Main Container (Strictly Mobile First) */}
      <main className="w-full max-w-md mx-auto px-4 pt-3 flex-1 flex flex-col">
        {/* Search Bar by Make, Model, VIN or Lot # */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Марка, модель, VIN или лот ID..."
            className="w-full pl-9 pr-9 py-2.5 bg-[#121622] border border-slate-800 focus:border-[#068eff] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Current Filter Bar (Timed is integrated in Auction field, not separate button) */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
          <div className="flex items-center gap-1.5 font-['Exo_2',sans-serif] uppercase tracking-wider font-semibold text-slate-200">
            {filters.timed === 'only' ? (
              <span className="flex items-center gap-1 text-amber-400 font-mono">
                IAAI Timed
              </span>
            ) : (
              <span>Все аукционы</span>
            )}
            <span className="text-slate-600">·</span>
            <span className="text-white font-mono">{displayLots.length}</span> лотов
            {feedMeta.serverTimeFormatted && (
              <>
                <span className="text-slate-600">·</span>
                <span
                  className={`text-[10px] font-mono normal-case tracking-normal inline-flex items-center gap-1 ${
                    feedMeta.stale ? 'text-amber-400 font-semibold' : 'text-slate-400'
                  }`}
                  title={feedMeta.stale ? 'Данные из кэша сервера' : 'Актуальные данные'}
                >
                  {feedMeta.stale && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  данные от {feedMeta.serverTimeFormatted}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            aria-label={"Параметры фильтра: " + activeFiltersCount}
            className="relative flex items-center justify-center w-8 h-8 shrink-0 rounded-lg text-[#068eff] hover:text-blue-400 hover:bg-[#068eff]/10"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-[3px] rounded-full bg-[#068eff] text-[#0b0e14] text-[9px] font-bold leading-[15px] text-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Clock Dial Animation during search / filter update */}
        {isSearchingAnimation ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <ClockDialAnimation
              size={84}
              label="Синхронизация timed-лотов"
              sublabel="Обновление данных API..."
              isSearching={true}
            />
          </div>
        ) : displayLots.length === 0 ? (
          <div className="py-16 text-center bg-[#111520] border border-slate-800 rounded-2xl p-6">
            <Clock className="w-10 h-10 text-amber-500/80 mx-auto mb-3" />
            {filters.auction === 'copart' && filters.timed === 'only' ? (
              <>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Exo_2',sans-serif]">
                  На Copart timed-аукционов нет
                </h3>
                <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto mb-4 leading-relaxed">
                  Почасовые timed-торги проводятся на площадке <strong className="text-amber-400">IAAI</strong>. На Copart проводятся регулярные онлайн-аукционы.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFilterUpdate({ ...filters, auction: 'iaai', timed: 'only' })}
                    className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                  >
                    ⚡ Искать Timed на IAAI
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterUpdate({ ...filters, auction: 'copart', timed: '' })}
                    className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                  >
                    🏛 Все торги Copart
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Exo_2',sans-serif]">
                  Лоты не найдены
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto mb-4">
                  Попробуйте выбрать «Все торги» в поле Аукцион или сбросить фильтры.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-[#068eff] text-white text-xs font-bold uppercase tracking-wider rounded-xl inline-flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сбросить фильтры</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayLots.map((lot) => (
              <TimedCarCard
                key={lot.id}
                lot={lot}
                currency={currency}
                isBookmarked={bookmarkedIds.includes(lot.id)}
                onToggleBookmark={handleToggleBookmark}
                theme={theme}
              />
            ))}
          </div>
        )}
      </main>

      {/* 1.5. Выбор раздела при входе: просмотр авто или автоподбор */}
      {entryChoice === 'ask' && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#05070d]">
          {/* Картинка сверху во всю ширину: шторка прижата к её нижнему краю, зазора нет */}
          <img
            src="/carcheckbot-entry.webp"
            alt="CarCheckBot"
            draggable={false}
            onClick={() => setEntryChoice('browse')}
            className="w-full h-auto max-h-[72vh] object-cover object-top shrink-0 -mb-[22vh] select-none animate-fade-in-fast"
          />
          <div className="relative min-h-0 flex-1 w-full max-w-md mx-auto bg-[#0f131c]/95 backdrop-blur-md border-t border-slate-800 rounded-t-3xl shadow-2xl px-5 pt-2.5 pb-4 animate-slide-up-fast overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3 shrink-0" />
            <NyTimePlate />

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setEntryChoice('browse');
                  setIsFilterOpen(true);
                }}
                className="w-full p-3.5 bg-[#131724] border border-slate-800 hover:border-[#068eff]/60 rounded-2xl flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#068eff]/15 border border-[#068eff]/30 text-[#068eff] flex items-center justify-center shrink-0">
                  <CarFront className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-white uppercase tracking-wider font-['Exo_2',sans-serif]">
                    Просмотр авто
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Живая лента лотов Copart и IAAI
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEntryChoice('bot');
                  setIsBotOpen(true);
                }}
                className="w-full p-3.5 bg-[#131724] border border-slate-800 hover:border-emerald-500/60 rounded-2xl flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Gauge className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-bold text-white uppercase tracking-wider font-['Exo_2',sans-serif]">
                    Автоподбор
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Автосборщик: подборка машин 1 раз в день
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Mobile Bottom Navigation: [Фильтры], [Автоподбор], [Закладки], [Настройки] */}
      <MobileBottomNav
        onOpenFilter={() => setIsFilterOpen(true)}
        onOpenBot={() => setIsBotOpen(true)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeFilterCount={activeFiltersCount}
        bookmarksCount={bookmarkedIds.length}
        theme={theme}
      />

      {/* 3. Mobile Filter Drawer (Timed inside Auction field, Documents hidden by default) */}
      <MobileFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onChange={handleFilterUpdate}
        onReset={handleResetFilters}
        matchedCount={displayLots.length}
      />

      {/* 4. Bot Auto-Podbor Modal (Автосборщик) */}
      <BotSelectionModal
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
        config={botConfig}
        onChangeConfig={setBotConfig}
        filters={filters}
        onChangeFilters={handleFilterUpdate}
        onOpenFilter={() => setIsFilterOpen(true)}
      />

      {/* 5. Mobile Bookmarks Drawer */}
      <MobileBookmarksDrawer
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        lots={bookmarkedLots}
        folders={folders}
        onUpdateFolders={setFolders}
        onRemove={handleRemoveFromBookmarks}
        onClear={() => {
          setBookmarkedIds([]);
          setFolders((prev) => prev.map((f) => ({ ...f, lotIds: [] })));
        }}
        currency={currency}
      />

      {/* 6. Save To Client Folder Modal (triggered immediately upon bookmarking) */}
      <SaveToFolderModal
        isOpen={!!saveToFolderLot}
        lot={saveToFolderLot}
        folders={folders}
        currency={currency}
        onClose={() => setSaveToFolderLot(null)}
        onAssignFolder={handleAssignFolder}
        onCreateFolderAndAssign={handleCreateFolderAndAssign}
        onRemoveFromBookmarks={handleRemoveFromBookmarks}
        onOpenBookmarks={() => {
          setSaveToFolderLot(null);
          setIsBookmarksOpen(true);
        }}
      />

      {/* 7. User Settings Modal (Тема в стиле CarCheckBot, Валюта, Сброс) */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onChangeTheme={setTheme}
        currency={currency}
        onChangeCurrency={setCurrency}
        onResetFilters={handleResetFilters}
        onClearBookmarks={() => {
          setBookmarkedIds([]);
          setFolders((prev) => prev.map((f) => ({ ...f, lotIds: [] })));
        }}
        bookmarksCount={bookmarkedIds.length}
      />

    </div>
  );
}
