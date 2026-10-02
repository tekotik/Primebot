import React, { useState } from 'react';
import {
  X,
  Bookmark,
  ShieldCheck,
  Clock,
  Zap,
  CheckCircle2,
  FileText,
  Calculator,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Sparkles,
  Award,
  AlertCircle
} from 'lucide-react';
import { Car, Currency } from '../types/car';
import { COUNTRY_NAMES } from '../data/carsData';
import { formatPrice, formatRubDirect } from '../utils/currency';
import { calculateTurnkeyCost } from '../utils/customs';

interface CarModalProps {
  car: Car | null;
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  isBookmarked: boolean;
  onToggleBookmark: (car: Car) => void;
  onOpenConsultationWithCar: (car: Car) => void;
}

export const CarModal: React.FC<CarModalProps> = ({
  car,
  isOpen,
  onClose,
  currency,
  isBookmarked,
  onToggleBookmark,
  onOpenConsultationWithCar
}) => {
  if (!isOpen || !car) return null;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'inspection' | 'customs'>('specs');

  const countryInfo = COUNTRY_NAMES[car.originCountry] || { label: car.originCountry, flag: '🌐' };

  // Calculate detailed turnkey breakdown
  const turnkeyDetails = calculateTurnkeyCost(
    car.priceUsd,
    car.engineDisplacementL,
    car.year,
    car.fuelType,
    car.originCountry
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      <div className="min-h-screen px-4 text-center flex items-center justify-center py-6 sm:py-10">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative inline-block w-full max-w-5xl bg-[#0f131d] border border-slate-800 rounded-2xl text-left overflow-hidden shadow-2xl transition-all"
        >
          {/* Top Modal Bar */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#121622]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">
                {countryInfo.flag} {car.auctionPlatform}
              </span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-xs text-blue-400">Лот: #{car.lotNumber}</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-xs text-slate-400">VIN: {car.vin}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Bookmark Button in Modal */}
              <button
                type="button"
                onClick={() => onToggleBookmark(car)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isBookmarked
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>{isBookmarked ? 'В закладках' : 'В закладки'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 max-h-[85vh] overflow-y-auto">
            {/* Gallery + Purchase Card Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              {/* Left Column: Gallery (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                {/* Main Large Image */}
                <div className="relative aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 group">
                  <img
                    src={car.images[activePhotoIndex] || car.images[0]}
                    alt={`${car.make} ${car.model}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />

                  {/* Scrim with origin info */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                    <span className="px-2.5 py-1 rounded text-xs font-medium bg-black/70 backdrop-blur-md text-white border border-white/10">
                      {car.location}
                    </span>
                    {car.buyNowAvailable && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        Купить сейчас
                      </span>
                    )}
                  </div>

                  {/* Navigation Arrows */}
                  {car.images.length > 1 && (
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
                      <button
                        onClick={() =>
                          setActivePhotoIndex(
                            (prev) => (prev - 1 + car.images.length) % car.images.length
                          )
                        }
                        className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setActivePhotoIndex((prev) => (prev + 1) % car.images.length)
                        }
                        className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnails Row */}
                {car.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {car.images.map((img: string, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActivePhotoIndex(i)}
                        className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                          i === activePhotoIndex
                            ? 'border-blue-500 scale-95 ring-2 ring-blue-500/30'
                            : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Фото ${i + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Key Details & Pricing Box (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1">
                    {car.year} {car.make} {car.model}
                  </h1>
                  <p className="text-sm text-slate-400 mb-4">{car.trim}</p>

                  {/* Auction Timer & Inspection Tag */}
                  <div className="p-3 bg-[#141824] rounded-xl border border-slate-800 space-y-2 mb-4 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Торги на аукционе:
                      </span>
                      <span className="font-semibold text-white">
                        {car.daysLeft && car.daysLeft > 0
                          ? `Осталось ${car.daysLeft} дн. ${car.hoursLeft || 0} ч.`
                          : 'Ожидает старта'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Award className="w-4 h-4 text-blue-400" />
                        Оценка эксперта:
                      </span>
                      <span className="font-semibold text-emerald-400">{car.conditionScore}</span>
                    </div>
                  </div>

                  {/* Price Box */}
                  <div className="p-4 bg-gradient-to-br from-blue-950/40 via-[#131929] to-[#0f1422] rounded-xl border border-blue-900/50 mb-5">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs text-slate-400">Цена лота на аукционе:</span>
                      <span className="text-base font-bold text-slate-200 tabular-nums font-mono">
                        {formatPrice(car.priceUsd, currency)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
                      <div>
                        <span className="block text-xs font-semibold text-blue-400">
                          ИТОГО «ПОД КЛЮЧ»:
                        </span>
                        <span className="text-[10px] text-slate-400">
                          С таможней, фрахтом, утилем и ЭПТС
                        </span>
                      </div>
                      <span className="text-xl sm:text-2xl font-extrabold text-white tabular-nums tracking-tight font-mono">
                        {formatRubDirect(car.estTurnkeyRub, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Fast Specs Glance */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-5">
                    <div className="p-2.5 bg-[#121622] rounded-lg border border-slate-800/80">
                      <span className="block text-slate-500 text-[10px]">Пробег:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {car.mileageKm.toLocaleString('ru-RU')} км
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#121622] rounded-lg border border-slate-800/80">
                      <span className="block text-slate-500 text-[10px]">Двигатель:</span>
                      <span className="font-bold text-slate-200">
                        {car.engineDisplacementL > 0
                          ? `${car.engineDisplacementL} л · ${car.enginePowerHp} л.с.`
                          : `${car.enginePowerHp} л.с. (Электро)`}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#121622] rounded-lg border border-slate-800/80">
                      <span className="block text-slate-500 text-[10px]">Привод:</span>
                      <span className="font-bold text-slate-200">
                        {car.drive === 'awd' ? 'Полный 4WD' : car.drive === 'rwd' ? 'Задний' : 'Передний'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#121622] rounded-lg border border-slate-800/80">
                      <span className="block text-slate-500 text-[10px]">КПП:</span>
                      <span className="font-bold text-slate-200">
                        {car.transmission === 'automatic'
                          ? 'Автомат (АКПП)'
                          : car.transmission === 'robot'
                          ? 'Робот (РКПП)'
                          : 'Вариатор'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Booking & Selection Actions */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenConsultationWithCar(car);
                      onClose();
                    }}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Забронировать лот на аукционе</span>
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    Официальный договор, фиксированная смета, гарантия чистоты сделки
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs for Technical Specs, Inspection, and Customs Breakdown */}
            <div className="border-b border-slate-800 mb-6">
              <div className="flex gap-4 sm:gap-6 text-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`pb-3 font-semibold transition-colors relative ${
                    activeTab === 'specs' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Комплектация и Опции
                  {activeTab === 'specs' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('inspection')}
                  className={`pb-3 font-semibold transition-colors relative ${
                    activeTab === 'inspection' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Инспекция и Состояние
                  {activeTab === 'inspection' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('customs')}
                  className={`pb-3 font-semibold transition-colors relative ${
                    activeTab === 'customs' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Детализация таможни «под ключ»
                  {activeTab === 'customs' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab 1: Equipment & Features */}
            {activeTab === 'specs' && (
              <div>
                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  {car.description}
                </p>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Оснащение и пакеты опций
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {car.features.map((feat: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#141824] border border-slate-800 text-xs text-slate-200 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Inspection Report (120 points verification) */}
            {activeTab === 'inspection' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#141824] border border-slate-800 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      Официальный аукционный лист и диагностика
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Автомобиль прошел физическую инструментальную проверку экспертом площадки.
                      Толщиномером замерены все элементы кузова, проведено компьютерное сканирование блоков ЭБУ на ошибки и оригинальность пробега.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#121622] rounded-xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">Кузов и геометрия:</span>
                    <span className="font-semibold text-emerald-400">
                      {car.inspectionDetails.bodyStatus}
                    </span>
                  </div>
                  <div className="p-3 bg-[#121622] rounded-xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">Двигатель:</span>
                    <span className="font-semibold text-emerald-400">
                      {car.inspectionDetails.engineStatus} (без подтёков и стуков)
                    </span>
                  </div>
                  <div className="p-3 bg-[#121622] rounded-xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">Трансмиссия:</span>
                    <span className="font-semibold text-emerald-400">
                      {car.inspectionDetails.transmissionStatus}
                    </span>
                  </div>
                  <div className="p-3 bg-[#121622] rounded-xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">Состояние салона:</span>
                    <span className="font-semibold text-slate-200">
                      {car.inspectionDetails.interiorStatus}
                    </span>
                  </div>
                  <div className="p-3 bg-[#121622] rounded-xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">Комплект ключей:</span>
                    <span className="font-semibold text-slate-200">
                      {car.inspectionDetails.keysCount} оригинальных смарт-ключа
                    </span>
                  </div>
                  <div className="p-3 bg-[#121622] rounded-xl border border-slate-800">
                    <span className="text-slate-500 block mb-1">Состояние шин:</span>
                    <span className="font-semibold text-slate-200">
                      {car.inspectionDetails.tiresCondition}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Detailed Turnkey Customs Calculation */}
            {activeTab === 'customs' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-xl text-xs text-slate-300">
                  <span className="font-bold text-blue-400 block mb-1">
                    Прозрачный расчет «Под ключ»
                  </span>
                  Ставка таможенной очистки: {turnkeyDetails.dutyRateExplanation}. Все платежи проводятся строго официально через казначейство таможни с получением действующего электронного ПТС со статусом «Действующий».
                </div>

                <div className="bg-[#121622] rounded-xl border border-slate-800 overflow-hidden text-xs">
                  <div className="divide-y divide-slate-800">
                    <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-slate-400">1. Стоимость автомобиля на аукционе:</span>
                      <span className="font-mono font-semibold text-slate-200">
                        ${turnkeyDetails.carPriceUsd.toLocaleString()} ({turnkeyDetails.carPriceRub.toLocaleString('ru-RU')} ₽)
                      </span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-slate-400">2. Международный фрахт и логистика до Владивостока / РФ:</span>
                      <span className="font-mono font-semibold text-slate-200">
                        ${turnkeyDetails.freightCostUsd.toLocaleString()} ({turnkeyDetails.freightCostRub.toLocaleString('ru-RU')} ₽)
                      </span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-slate-400">3. Таможенная пошлина ФТС:</span>
                      <span className="font-mono font-semibold text-amber-300">
                        {turnkeyDetails.customsDutyRub.toLocaleString('ru-RU')} ₽ (~${turnkeyDetails.customsDutyUsd.toLocaleString()})
                      </span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-slate-400">4. Утилизационный сбор:</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {turnkeyDetails.utilizationFeeRub.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div className="px-4 py-3 flex justify-between items-center">
                      <span className="text-slate-400">5. СВХ, брокерские услуги, лаборатория СБКТС и ЭПТС:</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {turnkeyDetails.brokerAndDocsRub.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div className="px-4 py-3.5 bg-blue-950/40 flex justify-between items-center font-bold text-sm text-white">
                      <span className="text-blue-300">ИТОГО ПОД КЛЮЧ:</span>
                      <span className="text-base text-blue-400 font-mono">
                        {turnkeyDetails.totalTurnkeyRub.toLocaleString('ru-RU')} ₽ (~${turnkeyDetails.totalTurnkeyUsd.toLocaleString()})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
