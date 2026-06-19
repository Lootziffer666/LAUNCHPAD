# Gate 7 -- Glyph Profiles (Xbox / PlayStation / Nintendo)

**Status:** COMPLETE  
**Date:** 2026-06-19  
**Branch:** kiro/desktop-shipping-audit

## Deliverables

| File | Purpose |
|------|---------|
| `desktop/src/lib/glyphs.js` | Pure module: profile storage + glyph resolution |
| `desktop/src/shells/ControllerGrid.jsx` (modified) | Action hint bar + profile switching |
| `desktop/docs/gates/gate-07-report.md` | This report |

## Features Implemented

### Glyph Module (`src/lib/glyphs.js`)

- Three profiles: `xbox`, `playstation`, `nintendo`
- Four internal actions: `confirm`, `back`, `info`, `trailer`
- Mapping:

| Action | Xbox | PlayStation | Nintendo |
|---|---|---|---|
| confirm | A | Cross | B |
| back | B | Circle | A |
| info | X | Square | Y |
| trailer | Y | Triangle | X |

- `getProfile()` reads active profile from localStorage (default: xbox)
- `setProfile(name)` persists the chosen profile to localStorage
- `glyph(action)` returns the display symbol for the active profile
- `profileName()` returns the human-readable profile name
- `allGlyphs()` returns all four action glyphs at once

### Action Hint Bar

- Fixed bar at the bottom of the ControllerGrid showing:
  `[A/Cross/B] Starten  [B/Circle/A] Zurueck  [X/Square/Y] Info  [Y/Triangle/X] Trailer`
- Displays correct glyphs for the currently active profile
- Shows the profile name on the right side

### Profile Switching

- `Ctrl+1` switches to Xbox profile
- `Ctrl+2` switches to PlayStation profile
- `Ctrl+3` switches to Nintendo profile
- A toast notification briefly confirms the switch

## Design Decisions

1. **Display only** -- Glyphs do NOT change keyboard behaviour. Enter/Escape/Tab/Space continue to work identically regardless of active profile.
2. **localStorage persistence** -- The chosen profile survives app restarts without any IPC or file I/O.
3. **Fallback** -- If localStorage is unavailable or holds invalid data, defaults to Xbox.
4. **Minimal coupling** -- The glyph module is a pure ES module with no React dependency. The ControllerGrid consumes it via simple function calls.

## Testing

- Existing desktop tests pass without modification
- `npm run build` succeeds
- No new runtime dependencies added

## Next Steps

- Gate 8: Auto-detect connected controller type via Gamepad API and set glyph profile automatically
- Gate 9: Animated glyph transitions on profile switch
