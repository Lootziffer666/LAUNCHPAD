# Gate 16 -- Edge Session Lifecycle (Spawn + Kill)

**Status:** COMPLETE
**Date:** 2026-06-19
**Branch:** kiro/desktop-shipping-audit

## Deliverables

| File | Change |
|------|--------|
| `desktop/electron/services/launcher.js` | Added `edge-xcloud` launch type, session tracking, `killActiveSession()`, `getActiveSession()`, `resolveEdgeBinary()` |
| `desktop/electron/main.js` | Registered `lp:session:kill` IPC channel (child-only) |
| `desktop/electron/preload.js` | Exposed `killSession()` on the child bridge |
| `desktop/docs/gates/gate-16-report.md` | This report |

## Implementation Details

### Launch Resolution (`resolveLaunch`)

A new `edge-xcloud` kind is recognized via:
- `game.launch.kind === 'edge-xcloud'` (explicit)
- `game.launchType === 'edge-xcloud'` (shorthand used by import/registry)
- `game.source === 'xcloud'` (inferred from source)

The resolved plan:
```js
{
  kind: 'edge-xcloud',
  cmd: '<edge-binary-path>',
  args: ['--kiosk', '<url>', '--edge-kiosk-type=fullscreen'],
  url: '<xcloud-url>'
}
```

### Edge Binary Resolution

`resolveEdgeBinary()` returns the platform-appropriate Edge path:
- **Windows:** Checks `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe` and `C:\Program Files\...`, falls back to `msedge` in PATH
- **macOS:** `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`
- **Linux:** `microsoft-edge`

### Session Tracking

`activeSession` stores `{ pid, proc, gameId, startedAt }` for the currently running
edge-xcloud process. Only one session is tracked at a time (a child plays one game).

The session auto-clears on:
- Process `exit` event
- Process `error` event (spawn failure)
- Manual `killActiveSession()` call

### Kill Logic

`killActiveSession()`:
- **Windows:** `taskkill /PID <pid> /T /F` (kills the process tree)
- **Linux/macOS:** `SIGTERM`, then `SIGKILL` after 5 seconds
- Returns `{ ok: true, pid, gameId }` on success
- Returns `{ ok: false, reason: 'no_session' }` if no active session

### IPC

| Channel | Window | Purpose |
|---------|--------|---------|
| `lp:session:kill` | child-only | "Spiel beenden" button in the child shell |

Exposed as `window.launchpad.killSession()` in the child preload.

## Error Handling

- Spawn errors (e.g. Edge not installed) are caught and logged; the session is cleared
- Kill on an already-exited process is handled gracefully (try/catch)
- Missing URL returns a `parent_required` error class (curation problem)

## Testing

- All 57 existing tests pass (no regressions)
- Manual verification: `resolveLaunch()` correctly produces edge-xcloud plans
- `killActiveSession()` returns `{ ok: false, reason: 'no_session' }` when no session is active
- Build succeeds
