# Gate 13 -- Import Installed Games Stub UI

**Status:** COMPLETE
**Date:** 2026-06-19
**Branch:** kiro/desktop-shipping-audit

## Deliverables

| File | Purpose |
|------|--------|
| `desktop/src/curator/ImportGames.jsx` | Scan stub UI component |
| `desktop/src/curator/CuratorApp.jsx` (modified) | Integrates ImportGames into LibraryTab |
| `desktop/docs/gates/gate-13-report.md` | This report |

## Implementation

A new `ImportGames` component in the Curator's Library tab provides a "Scan starten" button.
When clicked, it displays a placeholder message explaining what a real scan would do:

- Steam: parse `libraryfolders.vdf` + `appmanifest_*.acf`
- Epic Games: read `LauncherInstalled.dat`
- GOG Galaxy: query `galaxy-2.0.db`

No actual filesystem scanning is performed yet -- this is a UI stub that demonstrates
the interaction point and prepares the surface for the real import (Gate 14+).

## Design Decisions

1. **Separate component** -- `ImportGames.jsx` is its own module so the scan logic (IPC calls)
   can be wired independently without touching the main curator layout.
2. **Inline in LibraryTab** -- placed between the CoverKeyField and the game cards, so it is
   visible but not disruptive to the existing curation workflow.
3. **No modal** -- a simple expand-in-place pattern keeps the flow lightweight.

## Testing

- `npm run build` succeeds
- `npm test` passes (50/50)
