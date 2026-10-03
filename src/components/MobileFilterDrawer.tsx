import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Check,
  Filter,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Gauge,
  Wrench,
  Fuel,
  CarFront,
  ShieldCheck,
  Compass,
  MapPin
} from 'lucide-react';
import { PrimeFilterState } from '../types/car';
import {
  US_MAKES_MODELS,
  DAMAGE_TYPES,
  US_STATES,
  DOCUMENT_OPTIONS,
  ENGINE_OPTIONS
} from '../data/auctionLots';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PrimeFilterState;
  onChange: (f: PrimeFilterState) => void;
  onReset: () => void;
  matchedCount: number;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
  matchedCount
}) => {
  if (!isOpen) return null;

  // Documents are HIDDEN BY DEFAULT as requested by user
  const [showDocuments, setShowDocuments] = useState(false);

  const availableModels = filters.make && US_MAKES_MODELS[filters.make]
    ? US_MAKES_MODELS[filters.make]
    : [];

  const handleMakeChange = (make: string) => {
    onChange({
      ...filters,
      make,
      model: ''
    });
  };

  const toggleDocument = (docVal: string) => {
    const docs = filters.documents.includes(docVal)
      ? filters.documents.filter((d) => d !== docVal)
      : [...filters.documents, docVal];
    onChange({ ...filters, documents: docs });
  };

  // Combined Auction & Timed value (Timed exists ONLY on IAAI)
  const getAuctionValue = () => {
    if (filters.timed === 'only') return 'iaai_timed';
    if (filters.auction === 'iaai') return 'iaai';
    if (filters.auction === 'copart') return 'copart';
    return '';
  };

  const handleAuctionSelectChange = (val: string) => {
    if (val === 'iaai_timed') {
      onChange({ ...filters, auction: 'iaai', timed: 'only' });
    } else if (val === 'iaai') {
      onChange({ ...filters, auction: 'iaai', timed: '' });
    } else if (val === 'copart') {
      onChange({ ...filters, auction: 'copart', timed: '' });
    } else {
      onChange({ ...filters, auction: '', timed: '' });
    }
  };

  const handleSetTimedOnly = () => {
    // Timed is strictly on IAAI
    onChange({ ...filters, auction: 'iaai', timed: 'only' });
  };

  const handleSetAllAuctions = () => {
    onChange({ ...filters, timed: '' });
  };

  return (
    // z-[60]: главный фильтр открывается и поверх окна автоподбора (z-50)
    <div className="fixed inset-0 z-[60] overflow-hidden flex flex-col justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in-fast"
      />

      {/* Slide-up Bottom Sheet (Mobile First) with rapid upward slide animation */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md mx-auto max-h-[92vh] bg-[#0f131c] border-t border-slate-800 rounded-t-3xl shadow-2xl flex flex-col z-10 animate-slide-up-fast"
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2.5 shrink-0" />

        {/* Drawer Header */}
        <div className="px-5 py-3 border-b border-slate-800/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#068eff]" />
            <h2 className="text-base font-bold text-white font-['Exo_2',sans-serif] uppercase tracking-wide">
              Фильтры поиска
            </h2>
            {filters.timed === 'only' && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                TIMED
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 py-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сбросить</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Form Fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* 1. ПОЛЕ АУКЦИОНЫ */}
          <div className="p-3 bg-[#131724] border border-slate-800/90 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-['Exo_2',sans-serif]">
                <Compass className="w-3.5 h-3.5 text-[#068eff]" />
                <span>Аукцион</span>
              </label>

              {filters.timed === 'only' && (
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  IAAI Timed
                </span>
              )}
            </div>

            {/* Main Select without asterisks, dashes or explanations */}
            <select
              value={getAuctionValue()}
              onChange={(e) => handleAuctionSelectChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0b0e14] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
            >
              <option value="">Все аукционы</option>
              <option value="iaai_timed">IAAI Timed</option>
              <option value="iaai">IAAI</option>
              <option value="copart">Copart</option>
            </select>

            {/* Quick Segmented Toggle directly in Auction box */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0b0e14] rounded-lg border border-slate-800 text-[11px] font-['Exo_2',sans-serif]">
              <button
                type="button"
                onClick={handleSetAllAuctions}
                className={`py-1.5 rounded-md font-semibold transition-colors ${
                  filters.timed !== 'only'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Все торги
              </button>
              <button
                type="button"
                onClick={handleSetTimedOnly}
                className={`py-1.5 rounded-md font-bold transition-colors flex items-center justify-center ${
                  filters.timed === 'only'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                IAAI Timed
              </button>
            </div>
          </div>

          {/* 2. Марка */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CarFront className="w-3.5 h-3.5 text-[#068eff]" />
              Марка
            </label>
            <select
              value={filters.make}
              onChange={(e) => handleMakeChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
            >
              <option value="">Все марки</option>
              {Object.keys(US_MAKES_MODELS).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Модель (зависимая) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Модель
            </label>
            <select
              value={filters.model}
              disabled={!filters.make}
              onChange={(e) => onChange({ ...filters, model: e.target.value })}
              className={`w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff] ${
                !filters.make ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              <option value="">{filters.make ? 'Все модели' : 'Сначала выберите марку'}</option>
              {availableModels.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Год выпуска (От / До) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Год выпуска
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="От (например 2020)"
                min={2000}
                max={2026}
                value={filters.yearFrom}
                onChange={(e) => onChange({ ...filters, yearFrom: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff] font-mono"
              />
              <input
                type="number"
                placeholder="До (например 2024)"
                min={2000}
                max={2026}
                value={filters.yearTo}
                onChange={(e) => onChange({ ...filters, yearTo: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff] font-mono"
              />
            </div>
          </div>

          {/* 5. Пробег (миль) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Пробег (миль)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="От миль"
                value={filters.odometerFrom}
                onChange={(e) => onChange({ ...filters, odometerFrom: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff] font-mono"
              />
              <input
                type="number"
                placeholder="До миль"
                value={filters.odometerTo}
                onChange={(e) => onChange({ ...filters, odometerTo: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff] font-mono"
              />
            </div>
          </div>

          {/* 6. Тип топлива */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-[#068eff]" />
              Тип топлива
            </label>
            <select
              value={filters.fuel}
              onChange={(e) => onChange({ ...filters, fuel: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
            >
              <option value="">Все типы</option>
              <option value="Gasoline">Бензин</option>
              <option value="Diesel">Дизель</option>
              <option value="Electric">Электро</option>
              <option value="Flexible Fuel">Flex Fuel</option>
            </select>
          </div>

          {/* 7. Объём двигателя (л) (От / До) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Объём двигателя (л)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filters.engineFrom}
                onChange={(e) => onChange({ ...filters, engineFrom: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
              >
                <option value="">От (любой)</option>
                {ENGINE_OPTIONS.map((e) => (
                  <option key={e} value={e}>
                    {e} л
                  </option>
                ))}
              </select>
              <select
                value={filters.engineTo}
                onChange={(e) => onChange({ ...filters, engineTo: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
              >
                <option value="">До (любой)</option>
                {ENGINE_OPTIONS.map((e) => (
                  <option key={e} value={e}>
                    {e} л
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 8. КПП & Привод */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                КПП
              </label>
              <select
                value={filters.transmission}
                onChange={(e) => onChange({ ...filters, transmission: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
              >
                <option value="">Все типы</option>
                <option value="automatic">Автомат</option>
                <option value="manual">Механика</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Привод
              </label>
              <select
                value={filters.drive}
                onChange={(e) => onChange({ ...filters, drive: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
              >
                <option value="">Все типы</option>
                <option value="Front Wheel Drive">Передний (FWD)</option>
                <option value="Rear Wheel Drive">Задний (RWD)</option>
                <option value="All Wheel Drive">Полный (AWD/4WD)</option>
              </select>
            </div>
          </div>

          {/* 9. Тип повреждения */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#068eff]" />
              Тип повреждения
            </label>
            <select
              value={filters.damage}
              onChange={(e) => onChange({ ...filters, damage: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
            >
              <option value="">Все типы</option>
              {DAMAGE_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* 10. Исключить повреждение */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Исключить повреждение
            </label>
            <select
              value={filters.damageExclude}
              onChange={(e) => onChange({ ...filters, damageExclude: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
            >
              <option value="">Не исключать</option>
              {DAMAGE_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* 11. Состояние */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Состояние
            </label>
            <select
              value={filters.condition}
              onChange={(e) => onChange({ ...filters, condition: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
            >
              <option value="">Все</option>
              <option value="run">На ходу (Run & Drive)</option>
              <option value="enhanced">Улучшенное состояние</option>
              <option value="stationary">Не на ходу</option>
            </select>
          </div>

          {/* 12. ДОКУМЕНТЫ — ВОЗМОЖНОСТЬ СКРЫТИЯ (ПО УМОЛЧАНИЮ СКРЫТЫ, как требовалось) */}
          <div className="border border-slate-800 rounded-2xl bg-[#131724] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDocuments(!showDocuments)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#068eff]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white font-['Exo_2',sans-serif]">
                  Тип документов
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {filters.documents.length > 0
                    ? `Выбрано: ${filters.documents.length}`
                    : 'Скрыты'}
                </span>
              </div>

              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[11px]">
                  {showDocuments ? 'Свернуть' : 'Выбрать'}
                </span>
                {showDocuments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Collapsible Checkbox Content (Collapsed by default) */}
            {showDocuments && (
              <div className="p-3 pt-0 border-t border-slate-800/70 grid grid-cols-2 gap-2 animate-in fade-in duration-200">
                {DOCUMENT_OPTIONS.map((doc) => {
                  const checked = filters.documents.includes(doc.value);
                  return (
                    <button
                      key={doc.value}
                      type="button"
                      onClick={() => toggleDocument(doc.value)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border text-left transition-colors ${
                        checked
                          ? 'bg-[#068eff]/20 border-[#068eff] text-white'
                          : 'bg-[#0b0e14] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                          checked
                            ? 'bg-[#068eff] border-[#068eff] text-white'
                            : 'border-slate-600 bg-transparent'
                        }`}
                      >
                        {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{doc.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 13. Штат */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#068eff]" />
              Штат
            </label>
            <select
              value={filters.state}
              onChange={(e) => onChange({ ...filters, state: e.target.value })}
              className="w-full px-3 py-2.5 bg-[#141824] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#068eff]"
            >
              <option value="">Все штаты</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sticky Apply Button */}
        <div className="p-4 border-t border-slate-800/90 bg-[#0c1018] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[#068eff] hover:bg-[#007be5] active:bg-[#006cc8] text-white font-['Exo_2',sans-serif] font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#068eff]/25 flex items-center justify-center gap-2"
          >
            <span>Показать лоты ({matchedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
