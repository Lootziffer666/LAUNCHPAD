# Gate 17 -- Weekly Store Watchlist Refresh

## Summary

Automatic background price refresh for the parent's watchlist. On every app
start, the scheduler checks whether 7+ days have elapsed since the last refresh.
If so, it calls `wishlist.refreshPrices()` (CheapShark API) and updates the
`watchlistLastRefresh` timestamp in electron-store.

## Files

| File | Change |
|------|--------|
| `electron/services/watchlistScheduler.js` | New service: `maybeRefreshWatchlist()`, `shouldRefresh()`, timestamp persistence |
| `electron/main.js` | Calls `maybeRefreshWatchlist()` after `registerIpc()` at startup |
| `electron/services/watchlistScheduler.test.js` | 4 unit tests covering schedule logic |

## Design Decisions

- **Non-blocking**: The refresh is fire-and-forget at startup. Errors are logged
  and swallowed so the app always starts cleanly.
- **7-day interval**: Balances freshness vs. API rate limits. CheapShark has no
  auth key but requests courtesy rate limiting.
- **Persistence**: `watchlistLastRefresh` stored as ISO date string in
  electron-store. Survives restarts, updates only on success.
- **No setInterval**: Weekly is long enough that a startup-only check suffices.
  A session rarely lasts 7 days without a restart.

## Verification

- `npm test` passes (all tests including 4 new scheduler tests)
- `npm run build` succeeds
