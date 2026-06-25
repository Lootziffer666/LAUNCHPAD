// electron/services/watchlistScheduler.js — Weekly automatic watchlist price refresh.
//
// Once per week (or on app start if >7 days since last check), calls
// wishlist.refreshPrices() to update cached deal info for all wishlist entries.
// The lastRefreshDate is persisted in electron-store so the schedule survives
// restarts. Exported maybeRefreshWatchlist() is called from main.js at startup.

const { getStore } = require('./store');
const wishlist = require('./wishlist');

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getLastRefresh() {
  return getStore().get('watchlistLastRefresh') || null;
}

function setLastRefresh(isoDate) {
  getStore().set('watchlistLastRefresh', isoDate);
}

function shouldRefresh() {
  const last = getLastRefresh();
  if (!last) return true;
  const elapsed = Date.now() - new Date(last).getTime();
  return elapsed >= SEVEN_DAYS_MS;
}

/**
 * Called once at app startup. Triggers a background price refresh if more than
 * 7 days have passed since the last one. Never blocks startup; errors are
 * logged and swallowed.
 */
async function maybeRefreshWatchlist() {
  if (!shouldRefresh()) return { refreshed: false, reason: 'recent' };
  try {
    const result = await wishlist.refreshPrices();
    setLastRefresh(new Date().toISOString());
    console.log('[watchlistScheduler] Weekly price refresh completed:', result.ok ? 'ok' : 'partial');
    return { refreshed: true, ok: result.ok };
  } catch (e) {
    console.error('[watchlistScheduler] Price refresh failed:', e);
    return { refreshed: false, reason: 'error', message: String(e && e.message || e) };
  }
}

module.exports = { maybeRefreshWatchlist, shouldRefresh, getLastRefresh, setLastRefresh };
