# Gate 6 — Library Grid v0 (Controller-Navigable)

**Status:** COMPLETE  
**Date:** 2026-06-19  
**Branch:** kiro/desktop-shipping-audit

## Deliverables

| File | Purpose |
|------|---------|
| `desktop/src/shells/ControllerGrid.jsx` | Main controller-navigable game grid |
| `desktop/src/shells/InfoOverlay.jsx` | Small info panel (players, ratings, parent notes) |
| `desktop/src/shells/TrailerOverlay.jsx` | Trailer URL display overlay |
| `desktop/src/App.jsx` (modified) | Added `mode === 'controller'` + Ctrl+G toggle |

## Features Implemented

### Grid Display
- Reads games from the IPC bridge via `useGames()` hook
- Filters to only show `approval === 'approved'` games
- Responsive CSS Grid layout (auto-fill, min 200×260px cards)
- Warm background using design tokens from `tokens.css`
- Couch-distance readable titles (gradient overlay at card bottom)

### Controller/Keyboard Navigation
- **Arrow keys**: 2D spatial grid navigation (left/right ±1, up/down ±cols)
- **Enter**: Shows "Launch requested: [game name]" toast (no real execution)
- **Tab**: Opens InfoOverlay with player count, ratings, parent notes
- **Space**: Opens TrailerOverlay showing URL or "Kein Trailer verfügbar"
- **Escape**: Closes overlays; at grid level, logs back action

### Focus System
- Uses `focus-ring` class from `controller.css` (4px amber outline with pulse)
- All interactions work via focus — no mouse-hover-only states
- Programmatic focus follows `focusIndex` state

### Shell Integration
- Available via `Ctrl+G` keyboard shortcut (toggles to/from launchpad)
- Does NOT replace existing shells (Launchpad.jsx, WindowsDesktop.jsx unchanged)
- Registered as `mode === 'controller'` in App.jsx state machine

## Non-Goals (confirmed absent)
- ✗ No detail page navigation
- ✗ No scroll monster
- ✗ No store section
- ✗ No buy button
- ✗ No community content
- ✗ No real launch execution
- ✗ Blocked games never shown

## Build Verification
- `npm run build` — ✓ passes (68 modules, <1s)
- `npm test` — ✓ 50/50 tests pass
