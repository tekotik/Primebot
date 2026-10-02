import React from 'react';
import { X, Scale, Trash2, ArrowRight } from 'lucide-react';
import { Car, Currency } from '../types/car';
import { formatPrice, formatRubDirect } from '../utils/currency';
import { COUNTRY_NAMES } from '../data/carsData';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: Car[];
  onRemoveFromCompare: (carId: string) => void;
  onSelectCar: (car: Car) => void;
  currency: Currency;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  cars,
  onRemoveFromCompare,
  onSelectCar,
  currency
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      <div className="min-h-screen px-4 text-center flex items-center justify-center py-6 sm:py-10">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative inline-block w-full max-w-6xl bg-[#0f131d] border border-slate-800 rounded-2xl text-left overflow-hidden shadow-2xl transition-all"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#121622]">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">
                Сравнение автомобилей ({cars.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-x-auto max-h-[80vh]">
            {cars.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>Нет добавленных автомобилей для сравнения.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Добавьте автомобили в закладки, чтобы сравнить их характеристики.
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-slate-400 font-medium w-44 bg-[#141824] border-b border-slate-800 sticky left-0">
                      Параметр
                    </th>
                    {cars.map((car) => (
                      <th
                        key={car.id}
                        className="p-3 text-left min-w-[240px] max-w-[280px] bg-[#141824] border-b border-slate-800"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-900">
                            <img
                              src={car.images[0]}
                              alt={car.model}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => onRemoveFromCompare(car.id)}
                              className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded text-slate-300 hover:text-red-400"
                              title="Удалить из сравнения"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div>
                            <span className="font-bold text-sm text-white block">
                              {car.year} {car.make} {car.model}
                            </span>
                            <span className="text-slate-400 text-[11px] block truncate">
                              {car.trim}
                            </span>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {/* Row: Turnkey price */}
                  <tr>
                    <td className="p-3 font-semibold text-slate-300 bg-[#121622] sticky left-0">
                      Под ключ в РФ / СНГ
                    </td>
                    {cars.map((car) => (
                      <td key={car.id} className="p-3 font-bold text-blue-400 font-mono text-sm">
                        {formatRubDirect(car.estTurnkeyRub, currency)}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Auction price */}
                  <tr>
                    <td className="p-3 text-slate-400 bg-[#121622] sticky left-0">
                      Цена на аукционе
                    </td>
                    {cars.map((car) => (
                      <td key={car.id} className="p-3 text-slate-200 font-mono">
                        {formatPrice(car.priceUsd, currency)}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Origin & Platform */}
                  <tr>
                    <td className="p-3 text-slate-400 bg-[#121622] sticky left-0">
                      Площадка / Страна
                    </td>
                    {cars.map((car) => {
                      const cInfo = COUNTRY_NAMES[car.originCountry];
                      return (
                        <td key={car.id} className="p-3 text-slate-300">
                          {cInfo?.flag} {car.auctionPlatform}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Row: Mileage */}
                  <tr>
                    <td className="p-3 text-slate-400 bg-[#121622] sticky left-0">
                      Пробег
                    </td>
                    {cars.map((car) => (
                      <td key={car.id} className="p-3 text-slate-300 font-mono">
                        {car.mileageKm.toLocaleString('ru-RU')} км
                      </td>
                    ))}
                  </tr>

                  {/* Row: Engine & Power */}
                  <tr>
                    <td className="p-3 text-slate-400 bg-[#121622] sticky left-0">
                      Двигатель и мощность
                    </td>
                    {cars.map((car) => (
                      <td key={car.id} className="p-3 text-slate-300">
                        {car.engineDisplacementL > 0
                          ? `${car.engineDisplacementL} л · ${car.enginePowerHp} л.с.`
                          : `${car.enginePowerHp} л.с.`}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Fuel */}
                  <tr>
                    <td className="p-3 text-slate-400 bg-[#121622] sticky left-0">
                      Топливо
                    </td>
                    {cars.map((car) => (
                      <td key={car.id} className="p-3 text-slate-300 capitalize">
                        {car.fuelType === 'gasoline'
                          ? 'Бензин'
                          : car.fuelType === 'diesel'
                          ? 'Дизель'
                          : car.fuelType === 'hybrid'
                          ? 'Гибрид'
                          : 'Электро'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Drive */}
                  <tr>
                    <td className="p-3 text-slate-400 bg-[#121622] sticky left-0">
                      Привод
                    </td>
                    {cars.map((car) => (
                      <td key={car.id} className="p-3 text-slate-300">
                        {car.drive === 'awd'
                          ? 'Полный 4WD'
                          : car.drive === 'rwd'
                          ? 'Задний'
                          : 'Передний'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Transmission */}
                  <tr>
                    <td className="p-3 text-slate-400 bg-[#121622] sticky left-0">
                      Трансмиссия
                    </td>
                    {cars.map((car) => (
                      <td key={car.id} className="p-3 text-slate-300">
                        {car.transmission === 'automatic'
                          ? 'Автомат'
                          : car.transmission === 'robot'
                          ? 'Робот'
                          : 'Вариатор'}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Inspection Score */}
                  <tr>
                    <td className="p-3 text-slate-400 bg-[#121622] sticky left-0">
                      Оценка состояния
                    </td>
                    {cars.map((car) => (
                      <td key={car.id} className="p-3 text-emerald-400 font-semibold">
                        {car.conditionScore}
                      </td>
                    ))}
                  </tr>

                  {/* Row: Action */}
                  <tr>
                    <td className="p-3 bg-[#121622] sticky left-0"></td>
                    {cars.map((car) => (
                      <td key={car.id} className="p-3">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCar(car);
                            onClose();
                          }}
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <span>Смотреть лот</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
