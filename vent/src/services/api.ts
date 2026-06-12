import { ALL_GAMES, FAMILY_MEMBERS, ACTIVITY_LOG, Game, FamilyMember, DecisionState } from '../data/mockData';
import {
  fetchDealsBySteamAppId,
  fetchTopSteamDeals,
  ProcessedDeal,
  formatDiscount,
  getPriceState,
} from './cheapshark';
import {
  loadDecisionStates,
  saveDecisionState,
  loadTargetPrices,
  saveTargetPrice,
  loadCustomTags,
  loadHiddenGames,
} from './storage';

/**
 * VENT API Service
 *
 * Merges:
 * - Local mock data (base catalog)
 * - CheapShark API (real Steam deal prices) – synergy from cheapshark repos
 * - AsyncStorage (persisted decision states, target prices, custom tags)
 */
class VentApiService {
  private games: Game[] = [...ALL_GAMES];
  private members: FamilyMember[] = [...FAMILY_MEMBERS];
  private activities = [...ACTIVITY_LOG];

  /**
   * Enriches game data with:
   * 1. Persisted decision states from AsyncStorage
   * 2. Persisted target prices from AsyncStorage
   * 3. Persisted custom tags from AsyncStorage
   * 4. CheapShark real price data (optional, graceful fallback)
   */
  private async enrichGames(games: Game[]): Promise<Game[]> {
    // Load all persisted user data in parallel
    const [decisionStates, targetPrices, customTags, hiddenGames] = await Promise.all([
      loadDecisionStates(),
      loadTargetPrices(),
      loadCustomTags(),
      loadHiddenGames(),
    ]);

    // Enrich each game with persisted user data
    return games
      .filter((g) => !hiddenGames.includes(g.id))
      .map((g) => {
        const enriched = { ...g };

        // Apply persisted decision state (overrides default)
        if (decisionStates[g.id] !== undefined) {
          enriched.decisionState = decisionStates[g.id];
        }

        // Apply persisted target price (overrides default)
        if (targetPrices[g.id]) {
          enriched.targetPrice = targetPrices[g.id];
        }

        // Apply persisted custom tags (merge with existing)
        if (customTags[g.id]) {
          const mergedTags = Array.from(new Set([...enriched.tags, ...customTags[g.id]]));
          enriched.tags = mergedTags;
        }

        return enriched;
      });
  }

  async getGames(): Promise<Game[]> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const enriched = await this.enrichGames([...this.games]);
        resolve(enriched);
      }, 300);
    });
  }

  async getFamilyMembers(): Promise<FamilyMember[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.members]), 200);
    });
  }

  async getActivities(): Promise<typeof this.activities> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...this.activities]), 200);
    });
  }

  /**
   * Fetch current Steam deals from CheapShark.
   * Falls back to wishlist games that are on sale if network fails.
   */
  async getTopSteamDeals(minSavings: number = 40): Promise<ProcessedDeal[]> {
    return fetchTopSteamDeals(20, minSavings);
  }

  /**
   * Enrich a single game with live CheapShark price data.
   * Called on demand (e.g., when opening GameDetailScreen).
   */
  async getLivePriceForGame(game: Game): Promise<Game> {
    const deals = await fetchDealsBySteamAppId(game.id);
    if (deals.length === 0) return game;

    const best = deals[0];
    const discount = formatDiscount(best.savingsPercent);
    const statusState = getPriceState(best.salePrice, game.targetPrice);

    return {
      ...game,
      price: `$${parseFloat(best.salePrice).toFixed(2)}`,
      originalPrice: best.savingsPercent > 0 ? `$${parseFloat(best.normalPrice).toFixed(2)}` : undefined,
      discount: discount ?? undefined,
      statusState: statusState ?? game.statusState,
      isOnSale: best.isOnSale,
      cheapestPrice: `$${parseFloat(best.salePrice).toFixed(2)}`,
      reason:
        statusState === 'under'
          ? '🎯 Zielpreis erreicht!'
          : statusState === 'near'
          ? 'Knapp über Zielpreis'
          : game.reason,
    };
  }

  // ─── Mutations ──────────────────────────────────────────────────────────────

  async updateGame(id: string, updates: Partial<Game>): Promise<Game> {
    return new Promise((resolve, reject) => {
      const index = this.games.findIndex((g) => g.id === id);
      if (index === -1) return reject('Game not found');
      this.games[index] = { ...this.games[index], ...updates };
      resolve(this.games[index]);
    });
  }

  async setDecisionState(gameId: string, state: DecisionState): Promise<void> {
    await saveDecisionState(gameId, state);
    const index = this.games.findIndex((g) => g.id === gameId);
    if (index >= 0) {
      this.games[index] = { ...this.games[index], decisionState: state };
    }
  }

  async setTargetPrice(gameId: string, price: string): Promise<void> {
    await saveTargetPrice(gameId, price);
    const index = this.games.findIndex((g) => g.id === gameId);
    if (index >= 0) {
      this.games[index] = { ...this.games[index], targetPrice: price };
    }
  }

  async bulkUpdateTags(ids: string[], newTag: string, mode: 'add' | 'replace' | 'remove' = 'add'): Promise<Game[]> {
    return new Promise((resolve) => {
      const updated: Game[] = [];
      this.games = this.games.map((g) => {
        if (ids.includes(g.id)) {
          let nextTags = [...g.tags];
          if (mode === 'add' && !nextTags.includes(newTag)) nextTags.push(newTag);
          if (mode === 'replace') nextTags = ['Wishlist', newTag]; // Always keep Wishlist
          if (mode === 'remove') nextTags = nextTags.filter((t) => t !== newTag);

          const newGame = { ...g, tags: nextTags };
          updated.push(newGame);
          return newGame;
        }
        return g;
      });
      resolve(updated);
    });
  }

  async addActivity(activity: any) {
    this.activities = [activity, ...this.activities];
    return this.activities;
  }

  async removeFromWishlist(gameId: string): Promise<void> {
    const index = this.games.findIndex((g) => g.id === gameId);
    if (index >= 0) {
      const newTags = this.games[index].tags.filter((t) => t !== 'Wishlist');
      this.games[index] = { ...this.games[index], tags: newTags };
    }
  }
}

export const api = new VentApiService();
export type { ProcessedDeal };
