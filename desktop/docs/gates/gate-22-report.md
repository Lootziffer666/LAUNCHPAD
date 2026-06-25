# Gate 22 -- Stanley Voice v0 (Contextual Commentary Layer)

## Summary

Added Stanley, the friendly "Hausgeist" (house spirit), as a minimal atmospheric
commentary layer. He observes what happens and delivers short, warm, never
pushy comments via a floating text bubble.

## What was built

### `desktop/src/habitat/stanley.js`

Pure data module with comment pools keyed to system states:

| Function            | Trigger                          | Pool size |
|---------------------|----------------------------------|-----------|
| `roomEntered(id)`   | Entering a room                  | 5 per room|
| `idle()`            | 30s without keypress             | 7         |
| `timeOfDay(hour)`   | Morning/afternoon/evening        | 3 each    |
| `preLaunch(game)`   | Game about to launch             | 5         |
| `returnedFromGame()`| Returning from a game            | 5         |
| `emptyRoom()`       | Room has no games                | 4         |
| `lowTime(minutes)`  | Few minutes remaining            | 5         |

Each function picks a random string from its pool. No AI, no logic, no network
calls. All comments are in German, warm, slightly absurd, always child-safe.

### `desktop/src/habitat/StanleyBubble.jsx`

Non-interactive UI component:

- Positioned top-left as a small translucent text bubble
- Fades in over 300ms, stays 4.5 seconds, fades out over 300ms
- Uses design tokens (`--color-muted`, `--font-body`, `--radius-md`)
- Has `aria-live="polite"` for screen reader accessibility
- `pointer-events: none` -- purely atmospheric, never clickable

### `desktop/src/habitat/HabitatShell.jsx` (modified)

Integration points:

- Imports `stanley.js` and `StanleyBubble`
- Room switch triggers `stanley.roomEntered(roomId)` after the announcement fades
- Enter (launch) triggers `stanley.preLaunch(game)`
- 30-second idle timer (reset on any keypress) triggers `stanley.idle()`
- `StanleyBubble` rendered in the shell with the current comment state

## Stanley's Rules

- NEVER creates pressure
- NEVER negotiates rules
- NEVER is unclear
- NEVER frightens
- May be witty, must always be understandable
- Child first. Atmosphere second.

## Design decisions

- **No AI in v0**: All comments are pre-written pools. This keeps the module
  pure, testable, and offline-capable. AI can be layered in a future gate.
- **Invisible key variation**: To re-trigger the bubble even when the same text
  is selected twice in a row, a zero-width space sequence is appended. This is
  invisible to the user but gives React a new prop value.
- **Delayed room comment**: Stanley's comment appears after the room announcement
  has faded (800ms + 200ms delay) so it does not compete visually.
- **Single bubble**: Only one comment at a time. New comments replace old ones.

## Verification

- `npm run build`: passes (77 modules, 0 warnings)
- `npm test`: all 62 tests pass (no regressions)
