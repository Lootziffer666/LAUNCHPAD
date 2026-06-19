# Gate 12 -- Curation Workflow Verification + Unreviewed Badge

**Status:** COMPLETE
**Date:** 2026-06-19
**Branch:** kiro/desktop-shipping-audit

## Curation Workflow -- End-to-End Verification

The curation pipeline was verified top to bottom:

1. **Backend (curation.js):** CURATION_STATES = [new, viewed, undecided, approved, forLater, hidden].
   `withCurationDefaults(g)` applies to every game. `childVisible(g)` returns true only for `approved`.
2. **Registry (gameRegistry.js):** `listChildGames()` calls `listGames().filter(childVisible).sort(childOrder)`.
   The child shell never sees non-approved games.
3. **Main IPC (main.js):** `lp:games:list` returns `registry.listChildGames().filter(parental.ageAllows)`.
   Curator's `lp:games:list-all` returns the full registry. `lp:games:upsert` calls `emitGamesChanged()`
   which notifies both windows via `lp:event:games-changed`.
4. **CuratorApp.jsx:** The filter chips expose all states. CurationBar allows state transitions.
   After a curator approves a game, `emitGamesChanged()` fires, the child shell re-fetches,
   and the newly approved game appears in the grid.
5. **ControllerGrid.jsx (child shell):** Subscribes to `onGamesChanged`, calls `listGames()` on update.
   Only approved + age-allowed games render.

**Conclusion:** The workflow is fully wired. A game added via "Spiel hinzufuegen" starts as `curation: 'new'`,
stays invisible to the child, and appears only after a parent sets it to `approved` in the CurationBar.

## Unreviewed Badge

Added a `cur-unreviewed-badge` element in the CuratorApp header. It:

- Counts all games with `curation === 'new'`, `'viewed'`, or `'undecided'`
- Renders "{count} ungeprüft" next to the brand area
- Only shows when `count > 0`
- Clicking it navigates to the Library tab

The badge provides immediate visibility into how many games await a parent decision,
without requiring the parent to manually check each filter.

## Files Changed

| File | Change |
|------|--------|
| `desktop/src/curator/CuratorApp.jsx` | Added unreviewed badge in header |
| `desktop/docs/gates/gate-12-report.md` | This report |

## Testing

- `npm run build` succeeds
- `npm test` passes (50/50)
