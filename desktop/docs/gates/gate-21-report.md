# Gate 21 -- Habitat Rooms v0

## Summary

Replaced the flat ControllerGrid with a room-based spatial navigation system.
The data layer (IPC, gameRegistry) remains unchanged; only the presentation
becomes spatial.

## What was built

### `desktop/src/habitat/rooms.js`

Room definitions module exporting a `ROOMS` array. Each room has:

| Room         | Emoji | Filter logic                                         |
|--------------|-------|------------------------------------------------------|
| Wohnzimmer   | 🛋️    | localCoop or max > 1                                |
| Kinderzimmer | 🧸    | max === 1 (default when no players data)            |
| Werkstatt    | 🔧    | cat in Logik/Lernspiel/Puzzle/Aufbau or LAUNCHPAD   |
| Spielplatz   | 🎢    | cat in Rennen/Abenteuer or competitive              |
| Schatzkiste  | 🎁    | surfacing === 'featured'                            |

Games can appear in multiple rooms. Missing `players` data (all seed games)
results in the game defaulting to Kinderzimmer.

### `desktop/src/habitat/HabitatShell.jsx`

The new spatial navigation shell:

- Active room displayed with emoji + name + description
- Game grid below (only games matching the current room filter)
- Left/Right arrows at grid edge switch rooms (wraps around)
- Room switch shows a brief announcement (800ms, animated)
- Bottom room indicator with emoji strip (active highlighted)
- Empty rooms show "Hier ist es noch ruhig."
- All existing features preserved:
  - Launch Overlay (Enter)
  - Info Overlay (Tab)
  - Trailer Overlay (Space)
  - Parent Gate (Ctrl+P)
  - Glyph profile switching (Ctrl+1/2/3)
  - Time remaining badge
  - Boot screen (via BootScreen wrapper in App.jsx)

### `desktop/src/App.jsx`

- Imported HabitatShell
- Replaced `<ControllerGrid>` with `<HabitatShell>` for mode === 'controller'

## Design decisions

- **Graceful fallback for missing players data**: Since seed games do not have a
  `players` object, the Kinderzimmer filter defaults to `true` when players is
  absent. This ensures every game appears in at least one room.
- **Room switching at grid edges**: Left arrow at column 0 or Right arrow at the
  last position switches rooms, making it feel like walking between rooms.
- **ControllerGrid.jsx preserved**: Not deleted, available as fallback if needed.

## Verification

- `npm run build`: passes (0 warnings)
- `npm test`: all 62 tests pass
