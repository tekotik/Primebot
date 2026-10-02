import React, { useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, ShieldCheck, Clock, Zap, ArrowRight, Gauge, Fuel, CarFront } from 'lucide-react';
import { Car, Currency } from '../types/car';
import { COUNTRY_NAMES } from '../data/carsData';
import { formatPrice, formatRubDirect } from '../utils/currency';

interface CarCardProps {
  car: Car;
  currency: Currency;
  isBookmarked: boolean;
  onToggleBookmark: (car: Car) => void;
  onSelectCar: (car: Car) => void;
  onOpenCalculator: (car: Car) => void;
}

export const CarCard: React.FC<CarCardProps> = ({
  car,
  currency,
  isBookmarked,
  onToggleBookmark,
  onSelectCar,
  onOpenCalculator
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const countryInfo = COUNTRY_NAMES[car.originCountry] || { label: car.originCountry, flag: '🌐' };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (car.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (car.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark(car);
  };

  return (
    <article
      onClick={() => onSelectCar(car)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-[#131722] rounded-xl border border-slate-800/90 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-950/30 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Visual Asset Container (65-70% visual focus) */}
      <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden select-none">
        {/* Main Vehicle Image or Fallback */}
        {!imageError ? (
          <img
            src={car.images[currentImageIndex] || car.images[0]}
            alt={`${car.make} ${car.model} ${car.trim}`}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 text-center text-slate-400">
            <CarFront className="w-12 h-12 text-slate-600 mb-2" />
            <span className="text-sm font-semibold text-slate-300">{car.make} {car.model}</span>
            <span className="text-xs text-slate-500 mt-1">{car.trim}</span>
          </div>
        )}

        {/* Contrast Scrim for overlay controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131722]/80 via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges / Metadata */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-black/70 backdrop-blur-md text-white border border-white/10 shadow-sm">
            <span>{countryInfo.flag}</span>
            <span>{car.auctionPlatform}</span>
          </span>
          {car.buyNowAvailable && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 shadow-sm">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Купить сейчас</span>
            </span>
          )}
        </div>

        {/* SOCIAL NETWORK STYLE BOOKMARK BUTTON (Upper Right Corner) */}
        <button
          type="button"
          onClick={handleBookmarkClick}
          aria-label={isBookmarked ? 'Удалить из закладок' : 'Добавить в закладки'}
          title={isBookmarked ? 'В закладках' : 'Добавить в закладки'}
          className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md border shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            isBookmarked
              ? 'bg-blue-600 text-white border-blue-400 shadow-blue-600/50 scale-105 active:scale-95'
              : 'bg-black/60 text-slate-200 border-white/20 hover:bg-black/80 hover:text-white active:scale-90'
          }`}
        >
          <Bookmark
            className={`w-4 h-4 transition-all duration-150 ${
              isBookmarked ? 'fill-current stroke-current scale-110' : 'hover:scale-110'
            }`}
          />
        </button>

        {/* Image Carousel Controls on hover */}
        {car.images.length > 1 && isHovered && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 z-10">
            <button
              onClick={handlePrevImage}
              aria-label="Предыдущее фото"
              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 flex items-center justify-center transition-colors shadow-md focus:outline-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextImage}
              aria-label="Следующее фото"
              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/90 flex items-center justify-center transition-colors shadow-md focus:outline-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Image Indicators */}
        {car.images.length > 1 && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center items-center gap-1.5 z-10 pointer-events-none">
            {car.images.map((_: string, idx: number) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentImageIndex ? 'w-4 bg-blue-500' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Auction Lot and Status Line */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-mono text-slate-400">Лот: {car.lotNumber}</span>
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {car.daysLeft && car.daysLeft > 0
                  ? `${car.daysLeft} дн. ${car.hoursLeft || 0} ч.`
                  : 'Торги скоро'}
              </span>
            </div>
          </div>

          {/* Vehicle Title */}
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug group-hover:text-blue-400 transition-colors line-clamp-1">
            {car.year} {car.make} {car.model}
          </h3>
          <p className="text-xs text-slate-400 mb-3 truncate font-medium">
            {car.trim}
          </p>

          {/* Clean Unboxed Metadata with Typographic Separators */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300 py-2 border-y border-slate-800/80 mb-3">
            <span className="font-semibold text-slate-200">{car.year} г.</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="tabular-nums font-mono">{car.mileageKm.toLocaleString('ru-RU')} км</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>
              {car.engineDisplacementL > 0
                ? `${car.engineDisplacementL} л (${car.enginePowerHp} л.с.)`
                : `${car.enginePowerHp} л.с.`}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-300">
              {car.drive === 'awd' ? 'Полный 4WD' : car.drive === 'rwd' ? 'Задний' : 'Передний'}
            </span>
          </div>

          {/* Inspection / Condition Note */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{car.conditionScore}</span>
          </div>
        </div>

        {/* Pricing Block & CTAs */}
        <div className="pt-2 border-t border-slate-800/60">
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="block text-[11px] text-slate-400">Стоимость лота на аукционе:</span>
              <span className="text-sm font-semibold text-slate-300 tabular-nums">
                {formatPrice(car.priceUsd, currency)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[11px] font-medium text-blue-400">Под ключ в РФ / СНГ:</span>
              <span className="text-base sm:text-lg font-bold text-white tabular-nums tracking-tight">
                {formatRubDirect(car.estTurnkeyRub, currency)}
              </span>
            </div>
          </div>

          {/* Card Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCalculator(car);
              }}
              className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-700/60 flex items-center justify-center gap-1 focus:outline-none"
            >
              <span>Расчет таможни</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCar(car);
              }}
              className="px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center justify-center gap-1 focus:outline-none shadow-sm shadow-blue-600/30"
            >
              <span>Подробнее</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
