export type AuctionSite = 'copart' | 'iaai';
export type AppTheme = 'dark' | 'light';

export interface CarLot {
  id: string;
  lotId: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  auction: AuctionSite;
  isTimed: boolean;
  timedCloseDate: string; // ISO string or timestamp
  saleDate: string;
  currentBidUsd: number | null;
  buyNowUsd?: number;
  estTurnkeyRub: number;
  odometerMiles: number;
  engineDisplacementL: number;
  fuel: 'Gasoline' | 'Diesel' | 'Electric' | 'Flexible Fuel';
  transmission: 'automatic' | 'manual';
  drive: 'Front Wheel Drive' | 'Rear Wheel Drive' | 'All Wheel Drive';
  primaryDamage: string;
  secondaryDamage?: string;
  condition: 'run' | 'enhanced' | 'stationary';
  document: string; // разряд титула: 'clean', 'salvage', 'other'
  documentOld?: string; // точная строка документа: 'Clear (New Jersey)', 'Original (Maine)'
  state: string; // e.g. 'CA', 'TX', 'FL', 'NY', 'GA'
  location: string;
  images: string[];
  keysAvailable: boolean;
  siteId?: number; // 1 = Copart, 2 = IAAI
  series?: string;
  externalLink?: string;
  calculatorUrl?: string;
  countdownTextHours?: string;
  countdownTextDays?: string;
  closeUtc?: string;
}

export interface PrimeFilterState {
  auction: '' | 'copart' | 'iaai';
  timed: '' | 'only';
  make: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  odometerFrom: string;
  odometerTo: string;
  fuel: string;
  engineFrom: string;
  engineTo: string;
  transmission: string;
  drive: string;
  damage: string;
  damageExclude: string;
  condition: string;
  documents: string[]; // multi-select checkboxes
  state: string;
}

// Обязательные поля главного фильтра: без них подписка автосборщика
// бессмысленна, а выдача ленты слишком широкая. Год и пробег считаются
// заполненными, если указана хотя бы одна граница.
export function missingRequiredFilters(f: PrimeFilterState): string[] {
  const missing: string[] = [];

  if (!f.make) missing.push('марка');
  if (!f.model) missing.push('модель');
  if (!f.yearFrom && !f.yearTo) missing.push('год');
  if (!f.odometerFrom && !f.odometerTo) missing.push('пробег');

  return missing;
}

export interface BotConfig {
  datePreset: 'today' | 'tomorrow' | 'exact' | 'any';
  dateExact: string;
  timedMode: 'all' | 'only';
}

// Марка, модель и годы автосборщик берёт из главного фильтра ленты
// (PrimeFilterState) - здесь только само расписание и подпись фильтра,
// отправленного боту в последний раз.
export interface AutoCollectorConfig {
  isActive: boolean;
  intervalHours: number; // e.g. 1 for "каждый час"
  notifyChannel: 'telegram' | 'browser';
  lastRun?: number;
  sentFilter?: string;
}

export interface ClientFolder {
  id: string;
  name: string;
  clientPhone?: string;
  createdAt: number;
  lotIds: string[];
  notificationsEnabled?: boolean;
}

export const DEFAULT_CLIENT_FOLDERS: ClientFolder[] = [
  {
    id: 'folder-sergey',
    name: 'Сергей',
    createdAt: 1727700000000,
    lotIds: ['lot-892104'],
    notificationsEnabled: false
  },
  {
    id: 'folder-alex',
    name: 'Алексей',
    createdAt: 1727703600000,
    lotIds: [],
    notificationsEnabled: false
  }
];

export type Currency = 'USD' | 'RUB' | 'EUR';

// Backwards compatibility types
export type CountryOrigin = 'korea' | 'usa' | 'germany' | 'japan' | 'uae';
export type BodyType = 'suv' | 'sedan' | 'coupe' | 'wagon' | 'hatchback' | 'minivan' | 'pickup';
export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'plugin_hybrid';
export type TransmissionType = 'automatic' | 'robot' | 'variator' | 'manual';
export type DriveType = 'awd' | 'rwd' | 'fwd';
export type AuctionPlatform = string;

export interface Car {
  id: string;
  make: string;
  model: string;
  generation?: string;
  trim: string;
  year: number;
  mileageKm: number;
  engineDisplacementL: number;
  enginePowerHp: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  drive: DriveType;
  bodyType: BodyType;
  color: string;
  colorHex: string;
  vin: string;
  lotNumber: string;
  auctionPlatform: AuctionPlatform;
  originCountry: CountryOrigin;
  auctionDate: string;
  daysLeft?: number;
  hoursLeft?: number;
  buyNowAvailable: boolean;
  priceUsd: number;
  estTurnkeyRub: number;
  images: string[];
  features: string[];
  conditionScore: string;
  damageStatus: 'clean' | 'minor' | 'normal';
  description: string;
  location: string;
  inspectionDetails: {
    engineStatus: 'Идеально' | 'Хорошо';
    transmissionStatus: 'Идеально' | 'Хорошо';
    bodyStatus: 'Заводской окрас' | '1 косметический окрас' | 'Чистый карфакс';
    interiorStatus: 'Как новый' | 'Отличное состояние';
    keysCount: number;
    tiresCondition: string;
  };
}

export interface FilterState {
  searchQuery: string;
  make: string;
  model: string;
  originCountry: CountryOrigin | 'all';
  bodyType: BodyType | 'all';
  fuelType: FuelType | 'all';
  transmission: TransmissionType | 'all';
  drive: DriveType | 'all';
  yearFrom: number;
  yearTo: number;
  priceFromUsd: number;
  priceToUsd: number;
  mileageToKm: number;
  engineVolFrom: number;
  engineVolTo: number;
  condition: 'all' | 'clean' | 'minor';
  buyNowOnly: boolean;
  preset: string;
}

export type SortOption =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'year_desc'
  | 'mileage_asc'
  | 'ending_soon';
