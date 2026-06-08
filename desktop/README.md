# LAUNCHPAD Desktop

A kid-safe desktop shell for Windows — a calm child home (**LAUNCHPAD**) that boots first, with a
**PIN-gated** parent desktop one tap away. Built as **Electron + React + Vite**. Lives in the
LAUNCHPAD repo under `desktop/`, kept fully separate from the Android app.

> Boundary contract: **`handoff/SCOPE-GUARD.md`** (read first). Full spec: **`handoff/`**.

## Two things live here

| Path | What it is |
|---|---|
| `prototype.html` + `css/` + `js/` | The clickable **design prototype** (no build step — open `prototype.html`). The design source of truth. |
| `index.html` + `src/` + `electron/` | The **real app** being built from it, milestone by milestone. |

## Run the real app

```bash
cd desktop
npm install
npm run dev      # Vite renderer + Electron, hot reload
npm run build    # production renderer bundle → dist/
```

## Status

- **M0 — Scaffold ✅** Vite + React + Electron boot a single locked-down window
  (`contextIsolation` + `sandbox` on, no new windows, no off-app navigation). The renderer shows a
  boot screen that confirms the secure `window.launchpad` bridge reached it.
- **M1 — Port the renderer** (next): move `js/*` → `src/*`, `css/*` → `src/styles/*`, drop in-browser
  Babel, render both shells + Play + Detail on seed data.
- M2 data-over-IPC · M3 game launching · M4 shell hardening + parental · M5 covers · M6 packaging.

See `handoff/ROADMAP.md` for the full plan.

## Note on verification

This builds on Linux. The renderer and Electron main **build and boot** here (verified headless via
`xvfb`), but Windows-only paths — real `steam://` / `uwp` / `.exe` launches, `electron-builder --win`
installers, OS kiosk / Assigned Access — need a Windows box and are marked as such, never claimed
working from here.
