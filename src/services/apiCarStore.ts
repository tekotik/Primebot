import { CarLot, PrimeFilterState } from '../types/car';
import { AUCTION_LOTS } from '../data/auctionLots';

const DEFAULT_API_BASE_URL = 'https://api.apicar.store';

export interface ApiCarStoreConfig {
  baseUrl: string;
  apiKey?: string;
  useProxy?: boolean;
}

class ApiCarStoreService {
  private config: ApiCarStoreConfig;

  constructor() {
    this.config = {
      baseUrl: DEFAULT_API_BASE_URL,
      apiKey: localStorage.getItem('prime_apicar_key') || '',
      useProxy: false
    };
  }

  public setApiKey(key: string) {
    this.config.apiKey = key;
    localStorage.setItem('prime_apicar_key', key);
  }

  public getApiKey(): string {
    return this.config.apiKey || '';
  }

  public hasApiKey(): boolean {
    return Boolean(this.config.apiKey && this.config.apiKey.trim().length > 0);
  }

  /**
   * Fetch timed lots from https://api.apicar.store or fallback to cached inventory
   */
  public async fetchTimedLots(params?: {
    auction?: string;
    make?: string;
    model?: string;
    date?: string;
  }): Promise<{ lots: CarLot[]; source: 'api' | 'cache' }> {
    if (!this.config.apiKey) {
      // Simulate real network latency with local lots
      await new Promise((r) => setTimeout(r, 400));
      return {
        lots: AUCTION_LOTS.filter((l) => l.isTimed),
        source: 'cache'
      };
    }

    try {
      const url = new URL(`${this.config.baseUrl}/auctions/timed`);
      if (params?.auction) url.searchParams.set('auction', params.auction);
      if (params?.make) url.searchParams.set('make', params.make);
      if (params?.model) url.searchParams.set('model', params.model);

      const response = await fetch(url.toString(), {
        headers: {
          'x-api-key': this.config.apiKey,
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        return { lots: data, source: 'api' };
      }
      return { lots: AUCTION_LOTS.filter((l) => l.isTimed), source: 'cache' };
    } catch (err) {
      console.warn('[ApiCarStore] Falling back to local data due to API error:', err);
      return {
        lots: AUCTION_LOTS.filter((l) => l.isTimed),
        source: 'cache'
      };
    }
  }

  /**
   * Search lots
   */
  public async searchLots(
    filters: PrimeFilterState,
    query: string = ''
  ): Promise<{ lots: CarLot[]; total: number }> {
    // Filter local lots
    const results = AUCTION_LOTS.filter((lot) => {
      if (filters.auction === 'copart' && lot.auction !== 'copart') return false;
      if (filters.auction === 'iaai' && lot.auction !== 'iaai') return false;
      if (filters.timed === 'only' && !lot.isTimed) return false;
      if (filters.make && lot.make !== filters.make) return false;
      if (filters.model && lot.model !== filters.model) return false;
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const str = `${lot.year} ${lot.make} ${lot.model} ${lot.trim} ${lot.vin} ${lot.lotId}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });

    return { lots: results, total: results.length };
  }
}

export const apiCarStore = new ApiCarStoreService();
