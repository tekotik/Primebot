import React from 'react';
import {
  X,
  Bookmark,
  Trash2,
  ArrowRight,
  Calculator,
  Scale,
  CarFront,
  Sparkles,
  Share2
} from 'lucide-react';
import { Car, Currency } from '../types/car';
import { formatPrice, formatRubDirect } from '../utils/currency';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarkedCars: Car[];
  onRemoveBookmark: (carId: string) => void;
  onClearAll: () => void;
  onSelectCar: (car: Car) => void;
  onOpenCompare: () => void;
  onOpenConsultation: () => void;
  currency: Currency;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  bookmarkedCars,
  onRemoveBookmark,
  onClearAll,
  onSelectCar,
  onOpenCompare,
  onOpenConsultation,
  currency
}) => {
  if (!isOpen) return null;

  const totalAuctionUsd = bookmarkedCars.reduce((acc, car) => acc + car.priceUsd, 0);
  const totalTurnkeyRub = bookmarkedCars.reduce((acc, car) => acc + car.estTurnkeyRub, 0);

  const handleShareList = () => {
    if (navigator.clipboard) {
      const summary = bookmarkedCars
        .map(
          (c, idx) =>
            `${idx + 1}. ${c.year} ${c.make} ${c.model} (${c.trim}) — Лот: ${c.lotNumber} — $${c.priceUsd.toLocaleString()}`
        )
        .join('\n');
      navigator.clipboard.writeText(`Мои избранные автомобили PRIME AUTO EXPORT:\n\n${summary}`);
      alert('Список избранных автомобилей скопирован в буфер обмена!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-md bg-[#0f131c] border-l border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-800/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Bookmark className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Мои закладки</h2>
                <p className="text-xs text-slate-400">
                  {bookmarkedCars.length}{' '}
                  {bookmarkedCars.length === 1
                    ? 'автомобиль'
                    : bookmarkedCars.length > 1 && bookmarkedCars.length < 5
                    ? 'автомобиля'
                    : 'автомобилей'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {bookmarkedCars.length > 0 && (
                <button
                  type="button"
                  onClick={handleShareList}
                  title="Поделиться списком"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body: Saved Car List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {bookmarkedCars.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Bookmark className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-200 mb-1">
                  Закладок пока нет
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
                  Нажмите на значок закладки в правом верхнем углу карточки любого авто, чтобы сохранить его в избранное для сравнения и расчета.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <CarFront className="w-4 h-4" />
                  <span>Перейти к каталогу</span>
                </button>
              </div>
            ) : (
              bookmarkedCars.map((car) => (
                <div
                  key={car.id}
                  className="group relative bg-[#141824] rounded-xl border border-slate-800 hover:border-slate-700 p-3 flex gap-3 transition-colors cursor-pointer"
                  onClick={() => {
                    onSelectCar(car);
                    onClose();
                  }}
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-20 bg-slate-900 rounded-lg overflow-hidden shrink-0 relative">
                    <img
                      src={car.images[0]}
                      alt={car.model}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[10px] font-mono bg-black/80 text-white">
                      {car.year}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                          {car.make} {car.model}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveBookmark(car.id);
                          }}
                          title="Удалить из закладок"
                          className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {car.trim}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        {car.mileageKm.toLocaleString('ru-RU')} км · {car.auctionPlatform}
                      </p>
                    </div>

                    <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400">
                        {formatPrice(car.priceUsd, currency)}
                      </span>
                      <span className="text-xs font-bold text-blue-400 font-mono">
                        {formatRubDirect(car.estTurnkeyRub, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Summary & Actions */}
          {bookmarkedCars.length > 0 && (
            <div className="p-6 border-t border-slate-800/90 bg-[#0d1018] space-y-3">
              {/* Turnkey Total */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Итого лотов:</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {formatPrice(totalAuctionUsd, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-semibold text-white">
                <span>Примерно под ключ:</span>
                <span className="text-base font-bold text-blue-400 font-mono">
                  {formatRubDirect(totalTurnkeyRub, currency)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenCompare();
                    onClose();
                  }}
                  className="px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Scale className="w-3.5 h-3.5 text-blue-400" />
                  <span>Сравнить авто</span>
                </button>

                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                >
                  Очистить список
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenConsultation();
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Заказать подбор по закладкам</span>
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
