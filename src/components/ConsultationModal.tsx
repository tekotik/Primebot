import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Compass, Send, CarFront } from 'lucide-react';
import { CarLot } from '../types/car';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCar?: CarLot | null;
  bookmarkedCarsCount?: number;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  selectedCar,
  bookmarkedCarsCount = 0
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setName('');
    setPhone('');
    setCity('');
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col justify-end sm:justify-center items-center">
      <div
        onClick={handleResetAndClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fade-in-fast"
      />

      <div className="relative w-full max-w-md mx-auto z-10 py-0 sm:py-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full bg-[#0f131d] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl text-left overflow-hidden shadow-2xl animate-slide-up-fast"
        >
          {/* Mobile Drag Handle */}
          <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#121622]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#068eff]" />
              <h3 className="text-sm font-bold text-white font-['Exo_2',sans-serif] uppercase tracking-wide">
                {selectedCar ? 'Бронирование лота на аукционе' : 'Заказ автоподбора'}
              </h3>
            </div>
            <button
              onClick={handleResetAndClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5">
            {isSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white font-['Exo_2',sans-serif] uppercase">
                  Заявка принята
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Менеджер PRIME AVTO EXPORT свяжется с вами по номеру{' '}
                  <span className="text-[#068eff] font-mono font-semibold">{phone}</span> в течение 10 минут.
                </p>
                <div className="p-3 bg-[#121622] rounded-xl border border-slate-800 text-xs text-slate-400 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Официальный агентский договор</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Оплата инвойса напрямую в банк аукциона Copart / IAAI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2 bg-[#068eff] hover:bg-[#007be5] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors font-['Exo_2',sans-serif]"
                >
                  Вернуться в каталог
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {selectedCar && (
                  <div className="p-3 bg-[#141824] rounded-xl border border-slate-800 flex items-center gap-3">
                    <img
                      src={selectedCar.images[0]}
                      alt={selectedCar.model}
                      referrerPolicy="no-referrer"
                      className="w-14 h-11 object-cover rounded-lg shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-white truncate font-['Exo_2',sans-serif]">
                        {selectedCar.year} {selectedCar.make} {selectedCar.model}
                      </span>
                      <span className="block text-[11px] text-slate-400 truncate font-mono">
                        Лот: #{selectedCar.lotId} · {selectedCar.auction.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ваше имя
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Константин"
                    className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 focus:border-[#068eff] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Телефон (WhatsApp / Telegram) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 focus:border-[#068eff] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Город доставки
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Москва, Краснодар, Минск..."
                    className="w-full px-3 py-2 bg-[#0a0d14] border border-slate-800 focus:border-[#068eff] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Комментарий (необязательно)
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Максимальная ставка, вопросы по лоту..."
                    className="w-full px-3 py-1.5 bg-[#0a0d14] border border-slate-800 focus:border-[#068eff] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#068eff] hover:bg-[#007be5] text-white font-['Exo_2',sans-serif] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#068eff]/25 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Отправить запрос эксперту</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
