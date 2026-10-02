import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  X,
  LayoutGrid,
  List,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { FilterState, Currency, SortOption, CountryOrigin, BodyType, FuelType, DriveType, TransmissionType } from '../types/car';
import {
  BRAND_MODELS_MAP,
  COUNTRY_NAMES,
  BODY_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  DRIVE_LABELS,
  TRANSMISSION_LABELS
} from '../data/carsData';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  onResetFilters: () => void;
  resultsCount: number;
  totalCarsCount: number;
  currency: Currency;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const PRESET_OPTIONS = [
  { id: 'all', label: 'Все автомобили' },
  { id: 'korea', label: '🇰🇷 Южная Корея (Encar)' },
  { id: 'usa', label: '🇺🇸 США (Manheim / Copart)' },
  { id: 'duty3to5', label: '⭐ Проходные 3–5 лет (льготная таможня)' },
  { id: 'suv4wd', label: '🚙 Внедорожники 4WD' },
  { id: 'eco', label: '⚡ Электро и Гибриды' },
  { id: 'under35k', label: '💰 До $35,000' }
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  onResetFilters,
  resultsCount,
  totalCarsCount,
  currency,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Available models based on selected make
  const availableModels = filter.make && BRAND_MODELS_MAP[filter.make]
    ? BRAND_MODELS_MAP[filter.make]
    : [];

  const handleMakeChange = (make: string) => {
    onFilterChange({
      ...filter,
      make,
      model: '' // reset model when make changes
    });
  };

  const handlePresetSelect = (presetId: string) => {
    if (presetId === 'all') {
      onResetFilters();
      return;
    }

    if (presetId === 'korea') {
      onFilterChange({
        ...filter,
        originCountry: 'korea',
        preset: 'korea'
      });
    } else if (presetId === 'usa') {
      onFilterChange({
        ...filter,
        originCountry: 'usa',
        preset: 'usa'
      });
    } else if (presetId === 'duty3to5') {
      onFilterChange({
        ...filter,
        yearFrom: 2021,
        yearTo: 2023,
        preset: 'duty3to5'
      });
    } else if (presetId === 'suv4wd') {
      onFilterChange({
        ...filter,
        bodyType: 'suv',
        drive: 'awd',
        preset: 'suv4wd'
      });
    } else if (presetId === 'eco') {
      onFilterChange({
        ...filter,
        fuelType: 'electric',
        preset: 'eco'
      });
    } else if (presetId === 'under35k') {
      onFilterChange({
        ...filter,
        priceToUsd: 35000,
        preset: 'under35k'
      });
    }
  };

  // Count active filters (ignoring defaults)
  const activeFiltersCount = [
    filter.searchQuery ? 1 : 0,
    filter.make ? 1 : 0,
    filter.model ? 1 : 0,
    filter.originCountry !== 'all' ? 1 : 0,
    filter.bodyType !== 'all' ? 1 : 0,
    filter.fuelType !== 'all' ? 1 : 0,
    filter.transmission !== 'all' ? 1 : 0,
    filter.drive !== 'all' ? 1 : 0,
    filter.yearFrom > 2018 ? 1 : 0,
    filter.yearTo < 2025 ? 1 : 0,
    filter.priceToUsd < 120000 ? 1 : 0,
    filter.priceFromUsd > 10000 ? 1 : 0,
    filter.mileageToKm < 150000 ? 1 : 0,
    filter.condition !== 'all' ? 1 : 0,
    filter.buyNowOnly ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-[#11141e] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl mb-8">
      {/* 1. Quick Presets Strip (Buttons/Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none text-xs">
        <span className="text-slate-400 font-medium whitespace-nowrap shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Быстрый подбор:
        </span>
        {PRESET_OPTIONS.map((p) => {
          const isActive = filter.preset === p.id || (p.id === 'all' && activeFiltersCount === 0);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetSelect(p.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium focus:outline-none ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* 2. Main Search Bar */}
      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={filter.searchQuery}
          onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
          placeholder="Поиск по марке, модели, VIN-номеру или номеру лота (например: BMW X5, Palisade, WBA...)"
          className="w-full pl-10 pr-10 py-3 bg-[#0a0d14] border border-slate-800 focus:border-blue-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        {filter.searchQuery && (
          <button
            type="button"
            onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3. Primary Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {/* Country / Auction Platform */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Площадка / Страна
          </label>
          <select
            value={filter.originCountry}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                originCountry: e.target.value as CountryOrigin | 'all'
              })
            }
            className="w-full px-3 py-2.5 bg-[#0a0d14] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            {Object.entries(COUNTRY_NAMES).map(([key, val]) => (
              <option key={key} value={key} className="bg-slate-900 text-slate-100">
                {val.flag} {val.label}
              </option>
            ))}
          </select>
        </div>

        {/* Make (Марка) */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Марка автомобиля
          </label>
          <select
            value={filter.make}
            onChange={(e) => handleMakeChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#0a0d14] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-100">
              Все марки ({Object.keys(BRAND_MODELS_MAP).length})
            </option>
            {Object.keys(BRAND_MODELS_MAP).map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-slate-100">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Model (Модель - dynamically filtered) */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Модель
          </label>
          <select
            value={filter.model}
            disabled={!filter.make}
            onChange={(e) => onFilterChange({ ...filter, model: e.target.value })}
            className={`w-full px-3 py-2.5 bg-[#0a0d14] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer ${
              !filter.make ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="" className="bg-slate-900 text-slate-100">
              {filter.make ? 'Все модели марки' : 'Сначала выберите марку'}
            </option>
            {availableModels.map((mod) => (
              <option key={mod} value={mod} className="bg-slate-900 text-slate-100">
                {mod}
              </option>
            ))}
          </select>
        </div>

        {/* Body Type (Кузов) */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Тип кузова
          </label>
          <select
            value={filter.bodyType}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                bodyType: e.target.value as BodyType | 'all'
              })
            }
            className="w-full px-3 py-2.5 bg-[#0a0d14] border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            {Object.entries(BODY_TYPE_LABELS).map(([k, label]) => (
              <option key={k} value={k} className="bg-slate-900 text-slate-100">
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Secondary Row: Year and Price Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        {/* Year Range */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
            <span>Год выпуска</span>
            <span className="text-blue-400 font-mono">
              {filter.yearFrom} — {filter.yearTo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter.yearFrom}
              onChange={(e) =>
                onFilterChange({ ...filter, yearFrom: Number(e.target.value) })
              }
              className="w-1/2 px-2.5 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {[2018, 2019, 2020, 2021, 2022, 2023, 2024].map((y) => (
                <option key={y} value={y} className="bg-slate-900">
                  от {y}
                </option>
              ))}
            </select>
            <span className="text-slate-600">—</span>
            <select
              value={filter.yearTo}
              onChange={(e) =>
                onFilterChange({ ...filter, yearTo: Number(e.target.value) })
              }
              className="w-1/2 px-2.5 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {[2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
                <option key={y} value={y} className="bg-slate-900">
                  до {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Range (USD) */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
            <span>Цена лота ($ USD)</span>
            <span className="text-blue-400 font-mono">
              ${filter.priceFromUsd.toLocaleString()} — ${filter.priceToUsd.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={filter.priceFromUsd}
              step={1000}
              min={0}
              onChange={(e) =>
                onFilterChange({ ...filter, priceFromUsd: Number(e.target.value) })
              }
              className="w-1/2 px-2.5 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 tabular-nums font-mono"
              placeholder="от $"
            />
            <span className="text-slate-600">—</span>
            <input
              type="number"
              value={filter.priceToUsd}
              step={2000}
              max={150000}
              onChange={(e) =>
                onFilterChange({ ...filter, priceToUsd: Number(e.target.value) })
              }
              className="w-1/2 px-2.5 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 tabular-nums font-mono"
              placeholder="до $"
            />
          </div>
        </div>

        {/* Mileage (Пробег до) */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1.5">
            <span>Максимальный пробег</span>
            <span className="text-blue-400 font-mono">
              до {filter.mileageToKm.toLocaleString('ru-RU')} км
            </span>
          </div>
          <select
            value={filter.mileageToKm}
            onChange={(e) =>
              onFilterChange({ ...filter, mileageToKm: Number(e.target.value) })
            }
            className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value={30000} className="bg-slate-900">До 30 000 км (минимальный пробег)</option>
            <option value={50000} className="bg-slate-900">До 50 000 км</option>
            <option value={80000} className="bg-slate-900">До 80 000 км</option>
            <option value={120000} className="bg-slate-900">До 120 000 км</option>
            <option value={200000} className="bg-slate-900">Любой пробег</option>
          </select>
        </div>
      </div>

      {/* 5. Collapsible Advanced Filters Section */}
      {isExpanded && (
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Fuel Type */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Тип топлива
            </label>
            <select
              value={filter.fuelType}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  fuelType: e.target.value as FuelType | 'all'
                })
              }
              className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {Object.entries(FUEL_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k} className="bg-slate-900">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Drive Type */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Привод
            </label>
            <select
              value={filter.drive}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  drive: e.target.value as DriveType | 'all'
                })
              }
              className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {Object.entries(DRIVE_LABELS).map(([k, label]) => (
                <option key={k} value={k} className="bg-slate-900">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Transmission */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Коробка передач
            </label>
            <select
              value={filter.transmission}
              onChange={(e) =>
                onFilterChange({
                  ...filter,
                  transmission: e.target.value as TransmissionType | 'all'
                })
              }
              className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {Object.entries(TRANSMISSION_LABELS).map(([k, label]) => (
                <option key={k} value={k} className="bg-slate-900">
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Condition & Buy Now Checkbox */}
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filter.condition === 'clean'}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    condition: e.target.checked ? 'clean' : 'all'
                  })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
              />
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Только без ДТП (Clean Title / Encar 1.0)
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filter.buyNowOnly}
                onChange={(e) =>
                  onFilterChange({
                    ...filter,
                    buyNowOnly: e.target.checked
                  })
                }
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
              />
              <span>Только лоты с опцией «Купить сейчас»</span>
            </label>
          </div>
        </div>
      )}

      {/* 6. Filter Controls Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Скрыть параметры' : 'Все параметры фильтрации'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors focus:outline-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* View Mode & Sort Controls */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Results Badge */}
          <span className="text-xs text-slate-400">
            Найдено:{' '}
            <strong className="text-white font-mono">{resultsCount}</strong> из{' '}
            <span className="text-slate-400">{totalCarsCount}</span> авто
          </span>

          {/* Sort Selector */}
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="px-2.5 py-1.5 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="relevance" className="bg-slate-900">По релевантности</option>
            <option value="price_asc" className="bg-slate-900">Сначала дешевле ($)</option>
            <option value="price_desc" className="bg-slate-900">Сначала дороже ($)</option>
            <option value="year_desc" className="bg-slate-900">Сначала свежие года</option>
            <option value="mileage_asc" className="bg-slate-900">Минимальный пробег</option>
            <option value="ending_soon" className="bg-slate-900">Скоро завершение торгов</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-[#0a0d14] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Сетка"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="Список"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
