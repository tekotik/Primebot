import { FuelType } from '../types/car';

export interface CustomsCalculationResult {
  carPriceUsd: number;
  carPriceRub: number;
  freightCostUsd: number;
  freightCostRub: number;
  customsDutyRub: number;
  customsDutyUsd: number;
  utilizationFeeRub: number; // Утильсбор
  brokerAndDocsRub: number; // Брокер, СБКТС, ЭПТС
  totalTurnkeyRub: number;
  totalTurnkeyUsd: number;
  dutyRateExplanation: string;
}

export function calculateTurnkeyCost(
  carPriceUsd: number,
  displacementL: number,
  year: number,
  fuelType: FuelType,
  originCountry: string = 'korea'
): CustomsCalculationResult {
  const currentYear = 2026;
  const age = currentYear - year;
  const volumeCc = Math.round(displacementL * 1000);
  const usdToRub = 93.5;
  const eurToRub = 101.5;

  // Logistics & Freight estimate based on origin
  let freightCostUsd = 2200; // Korea default (Ro-Ro / Container to Vladivostok)
  if (originCountry === 'usa') {
    freightCostUsd = 3400; // Ocean freight USA to CIS
  } else if (originCountry === 'germany') {
    freightCostUsd = 2800; // Auto-carrier Europe
  } else if (originCountry === 'japan') {
    freightCostUsd = 2100;
  } else if (originCountry === 'uae') {
    freightCostUsd = 2900;
  }

  const freightCostRub = Math.round(freightCostUsd * usdToRub);
  const carPriceRub = Math.round(carPriceUsd * usdToRub);

  // Customs duty calculation
  let customsDutyRub = 0;
  let dutyExplanation = '';

  if (fuelType === 'electric') {
    // 15% customs duty for EVs + 20% VAT
    const baseDuty = carPriceRub * 0.15;
    const vat = (carPriceRub + baseDuty) * 0.20;
    customsDutyRub = Math.round(baseDuty + vat);
    dutyExplanation = 'Пошлина на электромобили 15% + НДС 20%';
  } else if (age >= 3 && age <= 5) {
    // The most advantageous age bracket: 3-5 years (льготные ставки за см³)
    let rateEurPerCc = 1.5;
    if (volumeCc <= 1000) rateEurPerCc = 1.5;
    else if (volumeCc <= 1500) rateEurPerCc = 1.7;
    else if (volumeCc <= 1800) rateEurPerCc = 2.5;
    else if (volumeCc <= 2300) rateEurPerCc = 2.7;
    else if (volumeCc <= 3000) rateEurPerCc = 3.0;
    else rateEurPerCc = 3.6;

    const dutyEur = volumeCc * rateEurPerCc;
    customsDutyRub = Math.round(dutyEur * eurToRub);
    dutyExplanation = `Льготная ставка 3-5 лет: €${rateEurPerCc} за см³ (${volumeCc} см³)`;
  } else if (age < 3) {
    // Under 3 years: 48% of vehicle value or euro rate per cm3, whichever is higher
    const percentDuty = carPriceRub * 0.48;
    let rateEurPerCc = 2.5;
    if (volumeCc <= 1500) rateEurPerCc = 2.5;
    else if (volumeCc <= 2500) rateEurPerCc = 3.5;
    else rateEurPerCc = 5.5;

    const volumeDuty = volumeCc * rateEurPerCc * eurToRub;
    customsDutyRub = Math.round(Math.max(percentDuty, volumeDuty));
    dutyExplanation = `До 3-х лет: 48% от таможенной стоимости автомобиля`;
  } else {
    // Over 5 years
    let rateEurPerCc = 3.0;
    if (volumeCc <= 1000) rateEurPerCc = 3.0;
    else if (volumeCc <= 1500) rateEurPerCc = 3.2;
    else if (volumeCc <= 1800) rateEurPerCc = 3.5;
    else if (volumeCc <= 2300) rateEurPerCc = 4.8;
    else if (volumeCc <= 3000) rateEurPerCc = 5.0;
    else rateEurPerCc = 5.7;

    customsDutyRub = Math.round(volumeCc * rateEurPerCc * eurToRub);
    dutyExplanation = `Старше 5 лет: €${rateEurPerCc} за см³`;
  }

  // Utilization fee (Утилизационный сбор для физлиц для личного пользования)
  // Для физлиц на авто 3-5 лет до 3.0 л = 5 200 руб (льготный)
  // Для авто свыше 3.0 л или коммерческий утиль рассчитывается по шкале
  let utilizationFeeRub = 5200;
  if (volumeCc > 3000) {
    utilizationFeeRub = 970000; // Повышенный утильсбор для моторов 3.0л+
  } else if (age < 3) {
    utilizationFeeRub = 3400;
  }

  // Broker, certification, SBKTS, lab inspection, EPTS, customs warehouse
  const brokerAndDocsRub = 115000;

  const totalTurnkeyRub =
    carPriceRub +
    freightCostRub +
    customsDutyRub +
    utilizationFeeRub +
    brokerAndDocsRub;

  const totalTurnkeyUsd = Math.round(totalTurnkeyRub / usdToRub);
  const customsDutyUsd = Math.round(customsDutyRub / usdToRub);

  return {
    carPriceUsd,
    carPriceRub,
    freightCostUsd,
    freightCostRub,
    customsDutyRub,
    customsDutyUsd,
    utilizationFeeRub,
    brokerAndDocsRub,
    totalTurnkeyRub,
    totalTurnkeyUsd,
    dutyRateExplanation: dutyExplanation
  };
}
