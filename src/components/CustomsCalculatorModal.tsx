import React, { useState } from 'react';
import { X, Calculator, HelpCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { FuelType, CountryOrigin, Currency } from '../types/car';
import { calculateTurnkeyCost } from '../utils/customs';
import { COUNTRY_NAMES } from '../data/carsData';
import { formatPrice, formatRubDirect } from '../utils/currency';

interface CustomsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  initialPriceUsd?: number;
  initialDisplacementL?: number;
  initialYear?: number;
  initialOrigin?: CountryOrigin;
  onApplyBudgetFilter?: (maxBudgetUsd: number) => void;
}

export const CustomsCalculatorModal: React.FC<CustomsCalculatorModalProps> = ({
  isOpen,
  onClose,
  currency,
  initialPriceUsd = 30000,
  initialDisplacementL = 2.0,
  initialYear = 2022,
  initialOrigin = 'korea',
  onApplyBudgetFilter
}) => {
  if (!isOpen) return null;

  const [priceUsd, setPriceUsd] = useState(initialPriceUsd);
  const [displacementL, setDisplacementL] = useState(initialDisplacementL);
  const [year, setYear] = useState(initialYear);
  const [originCountry, setOriginCountry] = useState<CountryOrigin>(initialOrigin);
  const [fuelType, setFuelType] = useState<FuelType>('gasoline');

  const result = calculateTurnkeyCost(
    priceUsd,
    displacementL,
    year,
    fuelType,
    originCountry
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      <div className="min-h-screen px-4 text-center flex items-center justify-center py-6 sm:py-10">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative inline-block w-full max-w-2xl bg-[#0f131d] border border-slate-800 rounded-2xl text-left overflow-hidden shadow-2xl transition-all"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#121622]">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">
                Таможенный калькулятор «Под ключ»
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Country */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Страна вывоза / Аукцион
                </label>
                <select
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value as CountryOrigin)}
                  className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="korea">🇰🇷 Южная Корея (Encar)</option>
                  <option value="usa">🇺🇸 США (Copart / Manheim)</option>
                  <option value="germany">🇩🇪 Европа / Германия</option>
                  <option value="japan">🇯🇵 Япония (USS)</option>
                  <option value="uae">🇦🇪 ОАЭ (Дубай)</option>
                </select>
              </div>

              {/* Auction Price */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Стоимость лота ($ USD)
                </label>
                <input
                  type="number"
                  step={500}
                  min={1000}
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Год выпуска автомобиля
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => (
                    <option key={y} value={y}>
                      {y} год {y >= 2021 && y <= 2023 ? '⭐ (проходной 3-5 лет)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Engine Displacement */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Объем двигателя (литры)
                </label>
                <select
                  value={displacementL}
                  onChange={(e) => setDisplacementL(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value={1.5}>1.5 л (1498 см³)</option>
                  <option value={1.6}>1.6 л (1598 см³)</option>
                  <option value={2.0}>2.0 л (1998 см³ - самая популярная)</option>
                  <option value={2.2}>2.2 л (2199 см³ - корейские дизели)</option>
                  <option value={2.5}>2.5 л (2497 см³)</option>
                  <option value={3.0}>3.0 л (2998 см³)</option>
                  <option value={3.5}>3.5 л (3470 см³)</option>
                  <option value={0.0}>0.0 л (Электромобиль)</option>
                </select>
              </div>
            </div>

            {/* Hint Notice */}
            <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl text-xs text-slate-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">
                  {result.dutyRateExplanation}
                </span>
                <span>
                  Для физических лиц при ввозе автомобиля для личного пользования действует льготный утильсбор.
                </span>
              </div>
            </div>

            {/* Itemized Calculation Summary */}
            <div className="bg-[#121622] rounded-xl border border-slate-800 overflow-hidden text-xs">
              <div className="divide-y divide-slate-800">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Стоимость авто:</span>
                  <span className="font-mono text-slate-200">
                    ${result.carPriceUsd.toLocaleString()} ({result.carPriceRub.toLocaleString('ru-RU')} ₽)
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Доставка морем/автовозом:</span>
                  <span className="font-mono text-slate-200">
                    ${result.freightCostUsd.toLocaleString()} ({result.freightCostRub.toLocaleString('ru-RU')} ₽)
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Таможенная пошлина:</span>
                  <span className="font-mono text-amber-300">
                    {result.customsDutyRub.toLocaleString('ru-RU')} ₽ (~${result.customsDutyUsd.toLocaleString()})
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Утилизационный сбор:</span>
                  <span className="font-mono text-slate-200">
                    {result.utilizationFeeRub.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-slate-400">Брокер, лаборатория, СБКТС, ЭПТС:</span>
                  <span className="font-mono text-slate-200">
                    {result.brokerAndDocsRub.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="px-4 py-3 bg-blue-950/40 flex justify-between items-center text-sm font-bold">
                  <span className="text-blue-300">ИТОГО ПОД КЛЮЧ:</span>
                  <span className="text-base text-blue-400 font-mono">
                    {result.totalTurnkeyRub.toLocaleString('ru-RU')} ₽ (~${result.totalTurnkeyUsd.toLocaleString()})
                  </span>
                </div>
              </div>
            </div>

            {/* Apply button */}
            {onApplyBudgetFilter && (
              <button
                type="button"
                onClick={() => {
                  onApplyBudgetFilter(priceUsd);
                  onClose();
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <span>Показать автомобили до ${priceUsd.toLocaleString()}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
