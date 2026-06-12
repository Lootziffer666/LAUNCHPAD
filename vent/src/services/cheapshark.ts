/**
 * CheapShark API integration
 * Source: https://github.com/The-HopelessGamer/steamwishlistcalculator (pattern),
 *         https://github.com/batteryshark/steam-wishlist-tracker (monitoring concept),
 *         https://github.com/527088995/steam-deal-alert (deal browsing concept)
 *
 * CheapShark is a free, stable, no-auth-required API for PC game prices.
 * storeID=1 = Steam
 */

const BASE_URL = 'https://www.cheapshark.com/api/1.0';
const STEAM_STORE_ID = '1';

export interface CheapSharkDeal {
  gameID: string;
  steamAppID: string;
  title: string;
  storeID: string;
  dealID: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  metacriticScore: string;
  steamRatingText: string;
  steamRatingPercent: string;
  steamRatingCount: string;
  releaseDate: number;
  lastChange: number;
  dealRating: string;
  thumb: string;
}

export interface CheapSharkGameInfo {
  info: {
    title: string;
    steamAppID: string;
    thumb: string;
  };
  cheapestPriceEver: {
    price: string;
    date: number;
  };
  deals: CheapSharkDeal[];
}

export interface ProcessedDeal {
  steamAppId: string;
  title: string;
  salePrice: string;
  normalPrice: string;
  savingsPercent: number;
  metacriticScore: string;
  steamRatingPercent: string;
  thumb: string;
  isOnSale: boolean;
}

/** Fetch top Steam deals from CheapShark */
export async function fetchTopSteamDeals(
  pageSize: number = 20,
  minSavings: number = 30
): Promise<ProcessedDeal[]> {
  try {
    const url =
      `${BASE_URL}/deals?storeID=${STEAM_STORE_ID}&pageSize=${pageSize}` +
      `&lowerPrice=0.01&sortBy=Savings&desc=1&onSale=1&minSavings=${minSavings}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const deals: CheapSharkDeal[] = await response.json();

    return deals.map((d) => ({
      steamAppId: d.steamAppID || '',
      title: d.title,
      salePrice: d.salePrice,
      normalPrice: d.normalPrice,
      savingsPercent: parseFloat(d.savings),
      metacriticScore: d.metacriticScore,
      steamRatingPercent: d.steamRatingPercent,
      thumb: d.thumb,
      isOnSale: parseFloat(d.savings) > 0,
    }));
  } catch (error) {
    console.warn('[CheapShark] fetchTopSteamDeals failed:', error);
    return [];
  }
}

/** Fetch price info for a specific game by its CheapShark game ID */
export async function fetchGameInfo(cheapSharkGameId: string): Promise<CheapSharkGameInfo | null> {
  try {
    const url = `${BASE_URL}/games?id=${cheapSharkGameId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('[CheapShark] fetchGameInfo failed:', error);
    return null;
  }
}

/**
 * Lookup a game by its Steam App ID.
 * CheapShark supports `steamAppID` as a query parameter.
 */
export async function fetchDealsBySteamAppId(steamAppId: string): Promise<ProcessedDeal[]> {
  try {
    const url = `${BASE_URL}/deals?storeID=${STEAM_STORE_ID}&steamAppID=${steamAppId}&pageSize=5`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const deals: CheapSharkDeal[] = await response.json();
    if (!deals || deals.length === 0) return [];

    return deals.map((d) => ({
      steamAppId: d.steamAppID || steamAppId,
      title: d.title,
      salePrice: d.salePrice,
      normalPrice: d.normalPrice,
      savingsPercent: parseFloat(d.savings),
      metacriticScore: d.metacriticScore,
      steamRatingPercent: d.steamRatingPercent,
      thumb: d.thumb,
      isOnSale: parseFloat(d.savings) > 0,
    }));
  } catch (error) {
    console.warn(`[CheapShark] fetchDealsBySteamAppId(${steamAppId}) failed:`, error);
    return [];
  }
}

/** Format a CheapShark price (e.g. "29.99") into a user-friendly EUR string */
export function formatPrice(usdPriceStr: string): string {
  const num = parseFloat(usdPriceStr);
  if (isNaN(num) || num === 0) return 'Kostenlos';
  // CheapShark returns USD; we display as-is with $ sign for transparency
  return `$${num.toFixed(2)}`;
}

/** Convert savings percentage to a discount badge string */
export function formatDiscount(savingsPercent: number): string | null {
  if (savingsPercent < 1) return null;
  return `-${Math.round(savingsPercent)}%`;
}

/** Determine price state from current vs target price */
export function getPriceState(
  currentUsd: string,
  targetEurStr?: string
): 'under' | 'near' | 'above' | undefined {
  if (!targetEurStr) return undefined;
  // Parse target price (e.g. "25,00€" or "$25.00")
  const target = parseFloat(targetEurStr.replace(',', '.').replace(/[^0-9.]/g, ''));
  const current = parseFloat(currentUsd);
  if (isNaN(target) || isNaN(current)) return undefined;
  if (current <= target) return 'under';
  if (current <= target * 1.15) return 'near'; // within 15%
  return 'above';
}
