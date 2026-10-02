import React from 'react';
import { ShieldCheck, Truck, Clock, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0a0d14] border-t border-slate-800/80 text-slate-400 text-xs py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges Strip (Adjacent claim to proof) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-0.5">100% Прозрачность</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Покупка напрямую с аукционов без посреднических наценок с официальным инвойсом.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-0.5">Выездная инспекция</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Замер ЛКП толщиномером, диагностика мотора и коробки, подробный видеоотчет до торгов.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-0.5">Доставка под ключ</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Морской фрахт Ro-Ro, таможенное оформление, лаборатория СБКТС и действующий ЭПТС.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-0.5">Точные сроки</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Корея: 20-30 дней. Китай/ОАЭ: 25-35 дней. США: 50-70 дней с онлайн трекингом судна.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright & information */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500">
          <div>
            <span className="font-bold text-slate-300 text-sm tracking-tight">
              PRIME<span className="text-blue-500">AUTO</span>EXPORT
            </span>
            <span className="mx-2">·</span>
            <span>Импорт и логистика автомобилей с мировых аукционов</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>Encar · Manheim · Copart · BCA · USS</span>
            <span aria-hidden="true">·</span>
            <span>Договор и ЭПТС</span>
            <span aria-hidden="true">·</span>
            <span>© 2026 PRIME AUTO EXPORT. Все права защищены.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
