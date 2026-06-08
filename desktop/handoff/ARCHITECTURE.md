# Architecture

## Process model (Electron)

```
┌─────────────────────────────────────────────────────────────┐
│ MAIN PROCESS (Node)                                            │
│  • app lifecycle, single BrowserWindow (kiosk/fullscreen)      │
│  • owns the parental PIN, profiles, game registry (persisted)  │
│  • the ONLY place allowed to launch games / open URLs / exe    │
│  • IPC handlers (ipcMain.handle) — see IPC-CONTRACT.md          │
└───────────────▲───────────────────────────────────────────────┘
                │ contextBridge (preload.js) — no nodeIntegration
┌───────────────┴───────────────────────────────────────────────┐
│ RENDERER (the React app — this prototype, ported to Vite)      │
│  • LAUNCHPAD shell + Windows desktop shell                     │
│  • calls window.launchpad.* (never touches Node directly)      │
└────────────────────────────────────────────────────────────────┘
```

### Security posture (non-negotiable for a kids' product)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Renderer reaches the OS **only** through the allow-listed `window.launchpad` API in `preload.js`.
- Validate every IPC argument in the main process (e.g. game ids must exist in the registry;
  never `spawn` an arbitrary path the renderer sent without checking it against the registry).
- Block new windows / external navigation (`webContents.setWindowOpenHandler` → deny;
  `will-navigate` → prevent). The shell must not become a browser escape hatch.

---

## Shell switching (the core behavior)

State lives in the renderer (`app.jsx` already models it):

```
mode: 'launchpad' | 'windows'      // default 'launchpad'
gate: boolean                       // PIN overlay before entering 'windows'
```

Flow:
1. Boot → `mode = 'launchpad'` (the child's home).
2. Child taps **Windows-Desktop** tile → `gate = true` (PIN overlay).
3. Correct PIN → main verifies (`launchpad.verifyPin`) → `gate=false; mode='windows'`.
4. **"Zurück zu LAUNCHPAD"** (taskbar / start menu / power) → `mode='launchpad'`, **no PIN**.

### Kiosk strategy — pick per deployment (see ROADMAP M4)
- **Soft cage (default):** single maximized BrowserWindow; LAUNCHPAD is the app's home view.
  Good for "an app the parent opens." The Windows desktop *inside* LAUNCHPAD is our own UI,
  not the real OS desktop.
- **Hard cage (kiosk):** `kiosk: true` + set the app as the Windows **shell** for the child's
  account (registry `Shell` value) or use Assigned Access. Then LAUNCHPAD literally replaces
  Explorer for that login. The "Windows Desktop" view remains our own controlled surface.

> Decide soft vs hard with the customer. The renderer code is identical; only main-process
> window flags + OS provisioning differ.

---

## Why the "Windows desktop" is our own UI, not the real OS desktop
Showing the *actual* Windows Explorer desktop would defeat the cage (file system, settings,
other apps all become reachable). LAUNCHPAD's "Windows desktop" is a **curated, original
desktop surface** the parent uses after PIN — it exposes only what we wire up (Files view,
Play, Eltern, pinned launchers). Real game launches still go through the vetted registry.
