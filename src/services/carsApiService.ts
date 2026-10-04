/**
 * CarsApiService for PrimeAvtoExport
 * Uses the official bot-feed.php endpoint:
 * https://primeavtoexport.com/staging/api/bot-feed.php?key=5f17153da0663379d06efa746e2fe65a
 *
 * Rules:
 * - 5-minute cache per unique query to avoid excessive polling.
 * - For timed lots (is_timed: true): strictly display countdown.text_hours.
 *   DO NOT display auction_date for timed lots (it is live auction date, not timed close).
 * - For normal lots (is_timed: false): countdown.text_days.
 * - Calculator URL format: {site_base}/ru/calculator/?lot={lot_id}
 * - Direct lot link from API 'link' field.
 */

import { CarLot, PrimeFilterState } from '../types/car';
import { AUCTION_LOTS } from '../data/auctionLots';

export const SITE_BASE_URL =
  import.meta.env.VITE_SITE_BASE_URL ||
  (import.meta.env.PROD && !window.location.hostname.includes('staging')
    ? 'https://primeavtoexport.com'
    : 'https://primeavtoexport.com/staging');

// Server-side secure endpoint (proxy on Vercel / dev server, no key leaked to browser)
export const BOT_FEED_PROXY_URL = '/api/feed';
export const BOT_FEED_DIRECT_URL = `${SITE_BASE_URL}/api/bot-feed.php`;

/**
 * Clean SVG placeholder for cars awaiting auction imagery (NO fake Unsplash cars)
 */
export const CAR_PLACEHOLDER_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" fill="%230f1422"><rect width="800" height="500" fill="%230d111c"/><path d="M160 310 L220 220 L320 180 L520 180 L620 230 L660 310 Z" fill="%231a2235" stroke="%232d3b55" stroke-width="4"/><circle cx="270" cy="330" r="45" fill="%230a0d16" stroke="%233b82f6" stroke-width="4"/><circle cx="550" cy="330" r="45" fill="%230a0d16" stroke="%233b82f6" stroke-width="4"/><text x="400" y="380" font-family="sans-serif" font-size="18" font-weight="600" fill="%2364748b" text-anchor="middle">ФОТО С АУКЦИОНА</text></svg>';

/**
 * Builds array of real auction photos for sliding:
 * IAAI resizer provides sequential ~I1~, ~I2~ ... ~I8~ keys for front, sides, rear, interior, engine.
 */
export function buildAuctionImages(photoUrl: string | undefined): string[] {
  if (!photoUrl || photoUrl.includes('unsplash')) {
    return [CAR_PLACEHOLDER_SVG];
  }

  const images: string[] = [photoUrl];

  // IAAI sequence: e.g. ~I1~ -> ~I2~, ~I3~, ~I4~, ~I5~, ~I6~, ~I7~, ~I8~
  if (photoUrl.includes('~I1~') || photoUrl.includes('~I01~')) {
    for (let i = 2; i <= 8; i++) {
      const nextKey = `~I${i}~`;
      images.push(photoUrl.replace(/~I\d+~/, nextKey));
    }
  } else if (photoUrl.includes('_1X.JPG') || photoUrl.includes('_1X.jpg')) {
    for (let i = 2; i <= 8; i++) {
      images.push(photoUrl.replace(/_1X\.(jpg|JPG)/i, `_${i}X.JPG`));
    }
  }

  return images;
}

export interface BotFeedCountdown {
  ended: boolean;
  total_hours: number;
  minutes: number;
  days: number;
  hours: number;
  close_utc: string;
  text_hours: string; // e.g. "22ч 49м"
  text_days: string;  // e.g. "3д 4ч"
}

export interface BotFeedRawLot {
  lot_id: number | string;
  site: number; // 1 = Copart US, 2 = IAAI US
  platform: string; // "copart" | "iaai" | "IAAI"
  auction_type: string;
  is_timed: boolean;
  year: number;
  make: string;
  model: string;
  series?: string;
  title?: string;
  vin: string;
  odometer_mi: number;
  status: string;
  document: string; // "clean", "salvage", "other"
  document_old?: string; // "Clear (New Jersey)", "NY - CERT OF TITLE SLVVG REBUILDABLE"
  damage_primary: string;
  damage_secondary?: string;
  fuel: string;
  engine_size?: number | string;
  location: string;
  state: string;
  current_bid?: number | null;
  buy_now?: number | null;
  reserve_price?: number;
  auction_date?: string;
  bid_close_date?: string;
  link: string;
  photo?: string;
  photos?: string[];
  countdown?: BotFeedCountdown;
}

export interface BotFeedResponse {
  status: 'ok' | 'error';
  mode: 'timed' | 'day';
  count: number;
  scanned: number;
  server_time_utc: string;
  cached?: boolean;
  stale?: boolean;
  lots: BotFeedRawLot[];
  message?: string;
}

interface CacheEntry {
  lots: CarLot[];
  timestamp: number;
  serverTimeUtc?: string;
  isStale?: boolean;
}

export class CarsApiService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache
  private lastServerTimeUtc: string | null = null;
  private lastIsStale: boolean = false;
  private lastIsCached: boolean = false;

  public getLastServerTimeFormatted(): string | null {
    if (!this.lastServerTimeUtc) return null;
    try {
      const d = new Date(this.lastServerTimeUtc);
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${mm} UTC`;
    } catch {
      return null;
    }
  }

  public getFeedStatus(): { cached: boolean; stale: boolean; serverTimeFormatted: string | null } {
    return {
      cached: this.lastIsCached,
      stale: this.lastIsStale,
      serverTimeFormatted: this.getLastServerTimeFormatted()
    };
  }

  /**
   * Calculate turnkey cost estimation for Russia / CIS in RUB
   */
  public estimateTurnkeyRub(bidUsd: number, engineSize: number = 2.0, year: number = 2022): number {
    const usd = bidUsd || 10000;
    const usdRate = 93.5;
    const freight = 3200 * usdRate; // sea + ground USA
    const carRub = usd * usdRate;
    const currentYear = 2026;
    const age = currentYear - year;
    const cc = (Number(engineSize) || 2.0) * 1000;

    let dutyRub = 0;
    if (age >= 3 && age <= 5) {
      dutyRub = cc * 2.5 * 101.5;
    } else {
      dutyRub = carRub * 0.48;
    }
    const utilFee = 5200;
    const broker = 115000;
    return Math.round(carRub + freight + dutyRub + utilFee + broker);
  }

  /**
   * Transform raw API lot into frontend CarLot model
   */
  public transformBotLot(raw: BotFeedRawLot): CarLot {
    const isTimed = Boolean(raw.is_timed);
    const lotIdStr = String(raw.lot_id);

    // Prefer official photos array from backend API (commit a355e2d, up to 12 verified resizer angles)
    let images: string[] = [];
    if (raw.photos && Array.isArray(raw.photos) && raw.photos.length > 0) {
      images = raw.photos;
    } else if (raw.photo) {
      images = [raw.photo];
    } else {
      images = [CAR_PLACEHOLDER_SVG];
    }

    const calcUrl = `${SITE_BASE_URL}/ru/calculator/?lot=${lotIdStr}`;
    const engineNum = typeof raw.engine_size === 'number' ? raw.engine_size : parseFloat(String(raw.engine_size || '2.0')) || 2.0;

    // Time fields rule:
    // For timed-lots: NEVER use auction_date (it's inaccurate live auction date).
    // Use countdown.close_utc or bid_close_date.
    const timedClose = raw.countdown?.close_utc || raw.bid_close_date || '';
    const saleDate = isTimed ? '' : (raw.auction_date || '');

    const currentBidNum =
      raw.current_bid !== null && raw.current_bid !== undefined && raw.current_bid > 0
        ? raw.current_bid
        : null;

    return {
      id: `lot-${lotIdStr}`,
      lotId: lotIdStr,
      siteId: raw.site,
      vin: raw.vin || 'VIN не указан',
      year: raw.year || 2022,
      make: raw.make || 'Автомобиль',
      model: raw.model || '',
      trim: raw.series || raw.title || '',
      series: raw.series,
      auction: raw.site === 2 ? 'iaai' : 'copart',
      isTimed,
      timedCloseDate: timedClose,
      saleDate,
      currentBidUsd: currentBidNum,
      buyNowUsd: raw.buy_now && raw.buy_now > 0 ? raw.buy_now : undefined,
      estTurnkeyRub: this.estimateTurnkeyRub(currentBidNum || 10000, engineNum, raw.year),
      odometerMiles: raw.odometer_mi || 0,
      engineDisplacementL: engineNum,
      fuel: (raw.fuel === 'Electric' ? 'Electric' : raw.fuel === 'Diesel' ? 'Diesel' : 'Gasoline') as any,
      transmission: 'automatic',
      drive: 'All Wheel Drive',
      primaryDamage: raw.damage_primary || 'Чистый',
      secondaryDamage: raw.damage_secondary,
      condition: String(raw.status || '').toLowerCase().includes('run') ? 'run' : 'stationary',
      document: String(raw.document || 'clean').toLowerCase(),
      documentOld: String(raw.document_old || '').trim(),
      state: raw.state || 'US',
      location: raw.location || 'США',
      images,
      keysAvailable: true,
      externalLink: raw.link,
      calculatorUrl: calcUrl,
      countdownTextHours: raw.countdown?.text_hours,
      countdownTextDays: raw.countdown?.text_days,
      closeUtc: raw.countdown?.close_utc
    };
  }

  /**
   * Build query parameters for bot-feed.php / /api/feed
   */
  public buildFeedParams(
    filters: PrimeFilterState,
    options?: {
      timed?: number | string;
      date?: string;
      limit?: number;
      pages?: number;
      detailLimit?: number;
    }
  ): URLSearchParams {
    const p = new URLSearchParams();

    // Timed mode: 1 (timed only), 0 (auction_date only), 'all' (mixed fast feed)
    let timedVal: string = 'all';
    if (options?.timed !== undefined) {
      timedVal = String(options.timed);
    } else if (filters.timed === 'only') {
      timedVal = '1';
    } else {
      timedVal = 'all';
    }
    p.set('timed', timedVal);

    if (timedVal === '0' && options?.date) {
      p.set('date', options.date);
    }

    // Site: 1 = Copart, 2 = IAAI, omitted = both
    if (filters.auction === 'iaai') {
      p.set('site', '2');
    } else if (filters.auction === 'copart') {
      p.set('site', '1');
    }

    if (filters.make) p.set('make', filters.make.trim());
    if (filters.model) p.set('model', filters.model.trim());
    if (filters.yearFrom) p.set('year_from', filters.yearFrom);
    if (filters.yearTo) p.set('year_to', filters.yearTo);
    if (filters.damage) p.set('damage_pr', filters.damage);
    if (filters.damageExclude) p.set('damage_exclude', filters.damageExclude);

    if (filters.documents && filters.documents.length > 0) {
      p.set('document', filters.documents.join(','));
    }

    if (filters.fuel) p.set('fuel', filters.fuel);
    if (filters.state) p.set('state', filters.state);
    if (filters.odometerFrom) p.set('odometer_from', filters.odometerFrom);
    if (filters.odometerTo) p.set('odometer_to', filters.odometerTo);

    p.set('limit', String(options?.limit || 24));
    if (options?.detailLimit) {
      p.set('detail_limit', String(options.detailLimit));
    }

    return p;
  }

  /**
   * Main query method to /api/feed (or fallback to bot-feed.php) with 5-minute caching
   */
  public async fetchBotFeed(
    filters: PrimeFilterState,
    options?: {
      timed?: number | string;
      date?: string;
      limit?: number;
      pages?: number;
      detailLimit?: number;
      forceRefresh?: boolean;
    }
  ): Promise<CarLot[]> {
    // If specifically requested Copart + Timed, return empty array (Copart has no timed auctions)
    if (filters.auction === 'copart' && (options?.timed === 1 || options?.timed === '1' || filters.timed === 'only')) {
      return [];
    }

    const params = this.buildFeedParams(filters, options);
    const cacheKey = params.toString();

    // Check 5-minute cache
    if (!options?.forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.lots;
      }
    }

    try {
      // Primary: secure serverless endpoint /api/feed
      const url = `${BOT_FEED_PROXY_URL}?${params.toString()}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      });

      if (response.ok) {
        const json: BotFeedResponse = await response.json();
        if (json.server_time_utc) {
          this.lastServerTimeUtc = json.server_time_utc;
        }
        this.lastIsCached = Boolean(json.cached);
        this.lastIsStale = Boolean(json.stale);

        if (json.status === 'ok' && Array.isArray(json.lots)) {
          const lots = json.lots.map((raw) => this.transformBotLot(raw));
          this.cache.set(cacheKey, {
            lots,
            timestamp: Date.now(),
            serverTimeUtc: json.server_time_utc,
            isStale: json.stale
          });
          return lots;
        }
      }
    } catch (err) {
      console.warn('Bot feed API proxy error, falling back to local catalog:', err);
    }

    // Fallback to local lots matching filters
    return this.getLocalFallbackLots(filters);
  }

  /**
   * Perform timed search (IAAI & Copart timed)
   */
  public async performTimedSearch(
    filters: PrimeFilterState,
    onProgress?: (msg: string) => void
  ): Promise<CarLot[]> {
    if (onProgress) onProgress('Запрос к ленте timed-аукционов...');
    return await this.fetchBotFeed(filters, { timed: 1, detailLimit: 12, limit: 24 });
  }

  /**
   * Search cars (general search, uses mixed mode 'timed=all')
   */
  public async searchCars(
    filters: PrimeFilterState,
    options?: { page?: number; size?: number }
  ): Promise<CarLot[]> {
    if (filters.auction === 'copart' && filters.timed === 'only') {
      return [];
    }

    const isTimedMode = filters.timed === 'only' ? 1 : 'all';
    return await this.fetchBotFeed(filters, {
      timed: isTimedMode,
      limit: options?.size || 24,
      detailLimit: 12,
    });
  }

  /**
   * Local curated fallback lots
   */
  private getLocalFallbackLots(filters: PrimeFilterState): CarLot[] {
    return AUCTION_LOTS.filter((l) => {
      if (filters.timed === 'only' && !l.isTimed) return false;
      if (filters.auction && l.auction !== filters.auction) return false;
      if (filters.make && !l.make.toLowerCase().includes(filters.make.toLowerCase())) return false;
      if (filters.model && !l.model.toLowerCase().includes(filters.model.toLowerCase())) return false;
      return true;
    });
  }

  /**
   * Get dynamic remaining countdown:
   * Rule: calculate from current time so text is never stale upon rerender.
   */
  public getTimedCountdown(closeDateStr: string, fallbackHoursText?: string): string {
    if (!closeDateStr) {
      return fallbackHoursText || 'время уточняется';
    }

    const target = new Date(closeDateStr).getTime();
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) return 'Торги завершены';

    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${totalHours}ч ${minutes.toString().padStart(2, '0')}м`;
  }

  /**
   * Visual badge color urgency class
   */
  public getCountdownClass(closeDateStr: string): 'is-urgent' | 'is-soon' | 'is-normal' | 'is-ended' {
    if (!closeDateStr) return 'is-normal';

    const target = new Date(closeDateStr).getTime();
    const diff = target - Date.now();

    if (diff <= 0) return 'is-ended';

    const hours = diff / (1000 * 60 * 60);
    if (hours < 2) return 'is-urgent';
    if (hours < 24) return 'is-soon';
    return 'is-normal';
  }
}

export const carsApiService = new CarsApiService();
