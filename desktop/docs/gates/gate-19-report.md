# Gate 19 -- Time Remaining Indicator in Controller Grid

## Summary

A small, non-intrusive time-remaining badge in the top-right corner of the
ControllerGrid shows the child how many minutes of play time remain. The display
is friendly and informational, never stressful.

## Files

| File | Change |
|------|--------|
| `src/shells/ControllerGrid.jsx` | Added time badge with 60s polling, color states, gentle pulse animation |

## Behavior

- **Reads** `window.launchpad.shellStatus()` which returns `{ timeLeftMin }`.
- **Updates** every 60 seconds (no aggressive countdown).
- **Display**: Shows as a pill badge top-right, e.g. "&#9201; 45 Min".
- **< 15 min**: Warm amber color (`#d4943a`).
- **< 5 min**: Gentle pulse animation (2s ease-in-out, 60% opacity at trough).
  The pulsing is soft and slow, designed to be noticed without causing stress.
- **Hidden** if `shellStatus` is unavailable or `timeLeftMin` is null (unlimited
  mode).

## Design Decisions

- No countdown timer or seconds display. Just minutes, updated once per minute.
- Pulse animation is CSS-only (`@keyframes gentlePulse`), 2s cycle, subtle
  enough to avoid anxiety.
- Badge uses `pointerEvents: none` so it never interferes with game card focus.
- The badge is purely informational. Actual enforcement happens via the lock
  overlay (bedtime/timeup) driven by the main process ticker.

## Verification

- `npm run build` succeeds
- `npm test` passes (no regressions)
