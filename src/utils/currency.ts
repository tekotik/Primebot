import { Currency } from '../types/car';

export const USD_TO_RUB_RATE = 93.5;
export const USD_TO_EUR_RATE = 0.92;

export function formatPrice(amountUsd: number | null | undefined, currency: Currency): string {
  if (amountUsd === null || amountUsd === undefined || amountUsd <= 0) {
    return 'Нет ставок';
  }
  if (currency === 'USD') {
    return `$${Math.round(amountUsd).toLocaleString('ru-RU')}`;
  }
  if (currency === 'RUB') {
    const rub = Math.round(amountUsd * USD_TO_RUB_RATE);
    return `${rub.toLocaleString('ru-RU')} ₽`;
  }
  if (currency === 'EUR') {
    const eur = Math.round(amountUsd * USD_TO_EUR_RATE);
    return `€${eur.toLocaleString('ru-RU')}`;
  }
  return `$${amountUsd.toLocaleString('ru-RU')}`;
}

export function formatRubDirect(amountRub: number, currency: Currency): string {
  if (currency === 'RUB') {
    return `${Math.round(amountRub).toLocaleString('ru-RU')} ₽`;
  }
  if (currency === 'USD') {
    const usd = Math.round(amountRub / USD_TO_RUB_RATE);
    return `$${usd.toLocaleString('ru-RU')}`;
  }
  if (currency === 'EUR') {
    const eur = Math.round((amountRub / USD_TO_RUB_RATE) * USD_TO_EUR_RATE);
    return `€${eur.toLocaleString('ru-RU')}`;
  }
  return `${amountRub.toLocaleString('ru-RU')} ₽`;
}
