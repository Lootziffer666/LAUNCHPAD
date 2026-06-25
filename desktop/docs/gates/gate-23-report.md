# Gate 23 -- Rituals (Kleine wiederkehrende Momente)

## Summary

Added small recurring moments ("Rituale") that create a sense of belonging
without resorting to toxic gamification patterns. Rituals are Stanley-driven:
no new UI components, just new comment pools and a detection layer that fires
on session start.

## What was built

### `desktop/src/habitat/stanley.js` (extended)

New comment pools for ritual moments:

| Function              | Trigger                          | Pool size |
|-----------------------|----------------------------------|-----------|
| `dailyGreeting(hour)` | First launch of the day          | 5 per slot|
| `treasureDay()`       | Saturday (Schatzkistentag)       | 5         |
| `forgottenGame(title)`| Game with low playtime/surfacing | 5         |
| `weekendVibe()`       | Friday/Saturday/Sunday (30%)     | 5         |

All comments are in German, warm, never pushy. The `forgottenGame` function
uses `{title}` template substitution to mention the game by name.

### `desktop/src/habitat/rituals.js` (new)

Pure detection module with clear priority order:

1. **dailyGreeting** -- if `isFirstLaunchToday` is true
2. **treasureDay** -- if today is Saturday (dayOfWeek === 6)
3. **weekendVibe** -- if Friday/Saturday/Sunday, with 30% probability
4. **forgottenGame** -- if a game with low playtime or `surfacing === 'low'` exists

Helper functions:
- `todayString(now)` -- formats a date as YYYY-MM-DD for localStorage comparison
- `checkFirstLaunchToday(storage, now)` -- reads/writes `launchpad.lastLaunchDay`
- `findForgottenGame(games)` -- selects a candidate from low-playtime games
- `detectRitual(context)` -- main entry point, returns `{ type, comment }` or null

The `detectRitual` function accepts a `random` parameter for deterministic testing.

### `desktop/src/habitat/HabitatShell.jsx` (modified)

Integration:
- Imports `detectRitual` and `checkFirstLaunchToday` from rituals.js
- On mount (once per session, guarded by `ritualFired` ref):
  - Calls `checkFirstLaunchToday()` against localStorage
  - Calls `detectRitual()` with current hour, day, and game list
  - If a ritual is detected, shows it as Stanley's first comment (before room greetings)
- The ritual comment flows through the existing `showStanley` / `StanleyBubble` system

### `desktop/electron/services/rituals.test.js` (new)

12 unit tests covering:
- `todayString` formatting and padding
- Priority ordering (dailyGreeting > treasureDay > weekendVibe > forgottenGame)
- Weekend vibe 30% probability gate (deterministic via injected random)
- Forgotten game filtering (low playtime, surfacing=low, dash-playtime exclusion)
- Null result when no ritual applies

## Design decisions

- **No Gamification**: Rituals create no pressure, no FOMO, no streaks. They are
  like a calendar page, not a progress bar. A child who misses a ritual loses
  nothing. A child who sees one gets a warm moment.
- **Single ritual per session**: Only one ritual fires on mount. If multiple
  apply, priority order determines which one wins. This prevents comment overload.
- **30% weekend vibe**: The weekend comment only fires 30% of the time on
  non-Saturday weekend days. This keeps it surprising rather than predictable.
- **localStorage for first-launch detection**: Simple, persistent, no IPC needed.
  The key `launchpad.lastLaunchDay` stores a date string.
- **Template substitution for forgotten games**: Using `{title}` in the pool
  keeps strings readable and avoids concatenation complexity.
- **Testability**: `detectRitual` accepts a `random` parameter to make the 30%
  check deterministic in tests. `checkFirstLaunchToday` accepts a storage object.

## Verification

- `npm run build`: passes (78 modules, 0 warnings)
- `npm test`: 73/74 pass (1 pre-existing failure in parental recovery test, unrelated)
- All 12 new ritual tests pass
