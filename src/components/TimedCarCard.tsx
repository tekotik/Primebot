import React, { useState, useRef } from 'react';
import {
  Bookmark,
  Clock,
  Wrench,
  FileText,
  MapPin,
  Gauge,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CarLot, Currency } from '../types/car';
import { formatPrice, formatRubDirect } from '../utils/currency';
import { TimedCountdownBadge } from './TimedCountdownBadge';
import { CAR_PLACEHOLDER_SVG } from '../services/carsApiService';

interface TimedCarCardProps {
  lot: CarLot;
  currency: Currency;
  isBookmarked: boolean;
  onToggleBookmark: (lot: CarLot) => void;
  onSelectLot: (lot: CarLot) => void;
}

export const TimedCarCard: React.FC<TimedCarCardProps> = ({
  lot,
  currency,
  isBookmarked,
  onToggleBookmark,
  onSelectLot
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const images = lot.images && lot.images.length > 0 ? lot.images : [CAR_PLACEHOLDER_SVG];
  const totalImages = images.length;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    const minSwipeDistance = 40;

    if (diff > minSwipeDistance) {
      // Swiped left -> next image
      setActiveImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
    } else if (diff < -minSwipeDistance) {
      // Swiped right -> prev image
      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
    }
    touchStartXRef.current = null;
  };

  return (
    <article
      onClick={() => onSelectLot(lot)}
      className="group bg-[#111520] hover:bg-[#151a28] rounded-2xl border border-slate-800/90 hover:border-[#068eff]/60 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer shadow-lg"
      data-timed={lot.isTimed ? '1' : '0'}
      data-timed-lot={lot.lotId}
      data-bid-close={lot.timedCloseDate || ''}
    >
      {/* Photo with Overlay Badges, Image Slider & Bookmark Button */}
      <div
        className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[activeImageIndex] || CAR_PLACEHOLDER_SVG}
          alt={`${lot.make} ${lot.model} (ракурс ${activeImageIndex + 1})`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = CAR_PLACEHOLDER_SVG;
          }}
        />

        {/* Sliding Navigation Arrows (appear on hover / mobile touch) */}
        {totalImages > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Предыдущее фото"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 backdrop-blur-sm border border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Следующее фото"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 backdrop-blur-sm border border-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Slider Dots / Counter Badge */}
            <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-200">
              <span>{activeImageIndex + 1}</span>
              <span className="text-slate-500">/</span>
              <span>{totalImages}</span>
            </div>
          </>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-white border border-white/10 font-mono">
            {lot.auction.toUpperCase()}
          </span>

          {lot.isTimed && (
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1 font-mono border bg-amber-950/85 text-amber-300 border-amber-500/40">
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>TIMED</span>
            </span>
          )}
        </div>

        {/* SOCIAL NETWORK STYLE BOOKMARK BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(lot);
          }}
          aria-label={isBookmarked ? 'Удалить из закладок' : 'Добавить в закладки'}
          title={isBookmarked ? 'В закладках' : 'Добавить в закладки'}
          className={`absolute top-2.5 right-2.5 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 backdrop-blur-md border shadow-md focus:outline-none ${
            isBookmarked
              ? 'bg-[#068eff] text-white border-[#068eff] scale-105 shadow-[#068eff]/50'
              : 'bg-black/60 text-slate-200 border-white/20 hover:bg-black/80 hover:text-white'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current stroke-current scale-110' : ''}`} />
        </button>

        {/* MICRO COUNTDOWN WITH FAST RUNNING MILLISECONDS */}
        {lot.isTimed && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <TimedCountdownBadge
              closeDate={lot.timedCloseDate}
              variant="card"
            />
          </div>
        )}
      </div>

      {/* Lot Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Lot & Location */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="font-mono text-slate-400">Лот #{lot.lotId}</span>
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-slate-500" />
              {lot.state}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-white font-['Exo_2',sans-serif] tracking-tight group-hover:text-[#068eff] transition-colors truncate">
            {lot.year} {lot.make} {lot.model}
          </h3>
          <p className="text-xs text-slate-400 mb-2.5 truncate font-medium">
            {lot.trim}
          </p>

          {/* Specs / Damage & Document Chips (Automotive Icons) */}
          <div className="flex flex-wrap gap-1.5 mb-3 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 font-mono flex items-center gap-1">
              <Gauge className="w-3 h-3 text-slate-500" />
              {lot.odometerMiles.toLocaleString('en-US')} миль
            </span>
            <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-900/30 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-red-400" />
              {lot.primaryDamage}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-900/30 capitalize flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-400" />
              {lot.document}
            </span>
            {lot.condition === 'run' ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                На ходу
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-red-950/50 text-red-300 border border-red-900/40 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                Не на ходу
              </span>
            )}
          </div>
        </div>

        {/* Pricing Block */}
        <div className="pt-2 border-t border-slate-800/80 flex items-end justify-between">
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
              Текущая ставка:
            </span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              {formatPrice(lot.currentBidUsd, currency)}
            </span>
          </div>

          <div className="text-right">
            <span className="block text-[10px] text-blue-400 font-medium uppercase tracking-wider">
              Под ключ в РФ:
            </span>
            <span className="text-base font-extrabold text-white font-mono tracking-tight">
              {formatRubDirect(lot.estTurnkeyRub, currency)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
