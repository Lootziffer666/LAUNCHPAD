# Architecture

## Process model (Electron) — two windows since the two-app split

```
┌────────────────────────────────────────────────────────────────┐
│ MAIN PROCESS (Node)                                            │
│  • app lifecycle; CHILD window (locked down, kiosk-able) +     │
│    CURATOR window (normal desktop window, opened via PIN)      │
│  • owns the parental PIN, curation states, game registry       │
│  • the ONLY place allowed to launch games / open URLs / exe    │
│  • IPC handlers (ipcMain.handle) — see IPC-CONTRACT.md;        │
│    curator-only channels verified against the SENDER           │
└───────▲───────────────────────────────▲───────────────────────┘
        │ preload.js (child bridge)     │ preload-curator.js (full bridge)
┌───────┴────────────────────┐  ┌───────┴────────────────────────┐
│ CHILD RENDERER (index.html)│  │ CURATOR RENDERER (curator.html)│
│ LAUNCHPAD shell + Windows  │  │ Familienzentrale: library +    │
│ desktop shell · play only  │  │ curation + safety settings     │
└────────────────────────────┘  └────────────────────────────────┘
```

### Security posture (non-negotiable for a kids' product)
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — both windows.
- Each renderer reaches the OS **only** through its allow-listed `window.launchpad` bridge.
  The child bridge has no parent methods at all; main additionally answers parent channels
  only for the curator window's sender.
- Validate every IPC argument in the main process (e.g. game ids must exist in the registry;
  never `spawn` an arbitrary path the renderer sent without checking it against the registry).
- Block new windows / external navigation (`webContents.setWindowOpenHandler` → deny;
  `will-navigate` → prevent) — both windows. The shell must not become a browser escape hatch.
- The curator window opens ONLY via `lp:curator:open` with a PIN that main re-verifies.

---

## Shell switching (the core behavior)

State lives in the renderer (`app.jsx` already models it):

```
mode: 'launchpad' | 'windows'             // default 'launchpad'
gate: null | { target: 'windows' | 'curator' }   // PIN overlay + where it leads
```

Flow:
1. Boot → `mode = 'launchpad'` (the child's home).
2. Child taps **Windows-Desktop** tile → `gate = {target:'windows'}` (PIN overlay).
3. Correct PIN → main verifies (`launchpad.verifyPin`) → `gate=null; mode='windows'`.
4. **"Zurück zu LAUNCHPAD"** (taskbar / start menu / power) → `mode='launchpad'`, **no PIN**.
5. **Elternbereich** tile → `gate = {target:'curator'}` → correct PIN →
   `launchpad.openCurator(pin)` → main re-verifies and opens the separate curator window.

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
