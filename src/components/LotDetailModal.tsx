import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bookmark,
  Clock,
  Wrench,
  FileText,
  MapPin,
  Gauge,
  Fuel,
  ShieldCheck,
  Phone,
  Compass,
  ArrowRight,
  ExternalLink,
  Calculator,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { CarLot, Currency } from '../types/car';
import { formatPrice, formatRubDirect } from '../utils/currency';
import { TimedCountdownBadge } from './TimedCountdownBadge';
import { CAR_PLACEHOLDER_SVG } from '../services/carsApiService';

interface LotDetailModalProps {
  lot: CarLot | null;
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  isBookmarked: boolean;
  onToggleBookmark: (lot: CarLot) => void;
  onOpenConsultation: (lot: CarLot) => void;
}

export const LotDetailModal: React.FC<LotDetailModalProps> = ({
  lot,
  isOpen,
  onClose,
  currency,
  isBookmarked,
  onToggleBookmark,
  onOpenConsultation
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  // Reset to first image when lot changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [lot?.id]);

  if (!isOpen || !lot) return null;

  const images = lot.images && lot.images.length > 0 ? lot.images : [CAR_PLACEHOLDER_SVG];
  const totalImages = images.length;

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
      // Swipe left -> next image
      setActiveImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
    } else if (diff < -minSwipeDistance) {
      // Swipe right -> prev image
      setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
    }
    touchStartXRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col justify-end sm:justify-center items-center">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in-fast"
      />

      <div className="relative w-full max-w-md mx-auto z-10 py-0 sm:py-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full bg-[#0f131c] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl text-left overflow-hidden shadow-2xl animate-slide-up-fast"
        >
          {/* Top Drag Handle for mobile */}
          <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

          {/* Top Bar */}
          <div className="px-4 py-3 bg-[#131724] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                {lot.auction.toUpperCase()}
              </span>
              <span className="font-mono text-xs text-slate-400">#{lot.lotId}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleBookmark(lot)}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 ${
                  isBookmarked
                    ? 'bg-[#068eff] text-white border-[#068eff]'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>{isBookmarked ? 'В закладках' : 'В закладки'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Interactive Image Slider */}
            <div className="space-y-2">
              <div
                className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 select-none"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={images[activeImageIndex] || CAR_PLACEHOLDER_SVG}
                  alt={`${lot.model} (ракурс ${activeImageIndex + 1})`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-opacity duration-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = CAR_PLACEHOLDER_SVG;
                  }}
                />

                {/* Left / Right Chevron Controls */}
                {totalImages > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Предыдущее фото"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Следующее фото"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all backdrop-blur-sm border border-white/10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Active Slide Counter */}
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-mono text-white">
                      <span>{activeImageIndex + 1}</span>
                      <span className="text-slate-400">/</span>
                      <span>{totalImages}</span>
                    </div>
                  </>
                )}

                <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-black/80 backdrop-blur-md text-white border border-white/10 font-mono">
                    {lot.auction.toUpperCase()}
                  </span>
                  {lot.isTimed && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-500/40 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                      TIMED
                    </span>
                  )}
                </div>

                {/* MICRO COUNTDOWN ON IMAGE WITHOUT EXPLANATORY TEXT */}
                {lot.isTimed && (
                  <div className="absolute bottom-2.5 right-2.5 z-10">
                    <TimedCountdownBadge
                      closeDate={lot.timedCloseDate}
                      variant="modal"
                    />
                  </div>
                )}
              </div>

              {/* Thumbnails Gallery Strip */}
              {totalImages > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-11 shrink-0 rounded-lg overflow-hidden border transition-all ${
                        activeImageIndex === idx
                          ? 'border-[#068eff] ring-2 ring-[#068eff]/40 scale-105'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Ракурс ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = CAR_PLACEHOLDER_SVG;
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Trim */}
            <div>
              <h2 className="text-lg font-bold text-white font-['Exo_2',sans-serif]">
                {lot.year} {lot.make} {lot.model}
              </h2>
              <p className="text-xs text-slate-400 font-medium">{lot.trim}</p>
            </div>

            {/* Price Box */}
            <div className="p-3 bg-[#131929] border border-blue-900/40 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Текущая ставка:
                </span>
                <span className="text-base font-bold text-white font-mono">
                  {formatPrice(lot.currentBidUsd, currency)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-400 uppercase tracking-wider block font-medium">
                  Под ключ в РФ:
                </span>
                <span className="text-lg font-extrabold text-blue-400 font-mono">
                  {formatRubDirect(lot.estTurnkeyRub, currency)}
                </span>
              </div>
            </div>

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#141824] rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Пробег:</span>
                <span className="font-mono font-semibold text-white">
                  {lot.odometerMiles.toLocaleString('en-US')} миль
                </span>
              </div>
              <div className="p-2.5 bg-[#141824] rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Состояние:</span>
                <span className={`font-semibold ${lot.condition === 'run' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {lot.condition === 'run' ? 'На ходу (Run & Drive)' : 'Не на ходу'}
                </span>
              </div>
              <div className="p-2.5 bg-[#141824] rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Повреждение:</span>
                <span className="font-semibold text-red-300">{lot.primaryDamage}</span>
              </div>
              <div className="p-2.5 bg-[#141824] rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Документы:</span>
                <span className="font-semibold text-blue-300 capitalize">{lot.documentOld || lot.document}</span>
              </div>
              <div className="p-2.5 bg-[#141824] rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">VIN-код:</span>
                <span className="font-mono text-white text-[11px] truncate block">
                  {lot.vin}
                </span>
              </div>
              <div className="p-2.5 bg-[#141824] rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Локация / Штат:</span>
                <span className="font-semibold text-white">{lot.location}</span>
              </div>
            </div>

            {/* External Links: Auction Page & Official Turnkey Calculator */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={lot.externalLink || (lot.auction === 'iaai' ? `https://www.iaai.com/VehicleDetail/${lot.lotId}` : `https://www.copart.com/lot/${lot.lotId}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#131929] hover:bg-[#1a233a] border border-blue-900/40 text-blue-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Лот на аукционе</span>
              </a>

              <a
                href={lot.calculatorUrl || `https://primeavtoexport.com/ru/calculator/?lot=${lot.lotId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Расчёт под ключ</span>
              </a>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => {
                onOpenConsultation(lot);
                onClose();
              }}
              className="w-full py-3 bg-[#068eff] hover:bg-[#007be5] text-white font-['Exo_2',sans-serif] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#068eff]/25 flex items-center justify-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>Запросить инспекцию и расчет лота</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
