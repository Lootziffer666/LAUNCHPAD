# Gate 10 -- Launch Adapter with State Machine Overlay

**Status:** COMPLETE  
**Date:** 2026-06-19  
**Branch:** kiro/desktop-shipping-audit

## Deliverables

| File | Purpose |
|------|---------|
| `desktop/src/shells/LaunchOverlay.jsx` | State-machine overlay for game launch flow |
| `desktop/src/shells/ControllerGrid.jsx` (modified) | Wires Enter/click to LaunchOverlay instead of toast |
| `desktop/docs/gates/gate-08-report.md` | Info Overlay retrospective |
| `desktop/docs/gates/gate-09-report.md` | Trailer Overlay retrospective |
| `desktop/docs/gates/gate-10-report.md` | This report |

## Features Implemented

### LaunchOverlay State Machine

Four-phase flow triggered by Enter/A or card click:

1. **PREPARING** -- "Startklar machen..." (500ms UI feedback delay)
2. **LAUNCHING** -- "Wird geöffnet..." (awaiting `window.launchpad.launchGame(id)` IPC response)
3. **SUCCESS** -- "Gestartet!" (auto-closes after 1 second)
4. **ERROR** -- Contextual message based on `errorClass`:

| errorClass | Message | Action |
|---|---|---|
| `recoverable` | "Das hat gerade nicht geklappt. Nochmal?" | Retry button (Enter) |
| `blocked` | Server message or fallback | None (Escape to close) |
| `parent_required` | "Dieses Spiel braucht eine Freigabe von Mama oder Papa." | None |
| `fatal` | "Das hat leider nicht geklappt." | None |

### ControllerGrid Integration

- Enter key and card click now open the LaunchOverlay instead of showing a plain toast
- Navigation is blocked while the overlay is active (no accidental grid movement)
- Escape/B closes the overlay at any phase

### Launch Types Handled

- **steam** -- `shell.openExternal(steam://rungameid/...)` via IPC
- **uri** -- Allowed-scheme URI open (Minecraft, Epic, etc.)
- **exe** -- Windows-only spawn (returns fatal on non-Windows)
- **uwp** -- Windows-only via `explorer.exe shell:AppsFolder\...`
- **internal** -- Returns `{ ok: true, internal: true }` for in-app content
- **edge-xcloud** -- Backend opens Edge or stubs gracefully; overlay shows normal flow
- **local-stub** -- Backend returns `parent_required` error; overlay shows the appropriate message

## Design Decisions

1. **No polling** -- Single IPC call, single response. No WebSocket or long-poll needed.
2. **Overlay owns the lifecycle** -- ControllerGrid just sets `launchGame` state; the overlay handles everything from there.
3. **Escape always works** -- Users are never trapped in the overlay regardless of phase.
4. **Retry only for recoverable** -- The retry button only appears when the error is transient.
5. **500ms preparing phase** -- Provides visual feedback that the action registered, even if IPC resolves instantly.

## Testing

- `npm run build` succeeds
- `npm test` passes (all existing tests)
- No new runtime dependencies

## Architecture

```
Enter/A pressed
    |
    v
ControllerGrid: setLaunchGame(game)
    |
    v
LaunchOverlay mounts
    |
    v
Phase: PREPARING (500ms delay)
    |
    v
Phase: LAUNCHING (window.launchpad.launchGame(id))
    |
    v
IPC -> main process -> launcher.resolveLaunch(game) -> launchGame(game)
    |
    v
Response: { ok: true } or { ok: false, errorClass, message }
    |
    v
Phase: SUCCESS (auto-close 1s) or ERROR (show message)
```

## Next Steps

- Gate 11: Gamepad API integration (physical A/B button mapping)
- Gate 12: Launch history and "recently played" sorting
