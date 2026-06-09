# LAUNCHPAD — Developer Handoff

A kid-safe desktop shell for Windows, built as an **Electron + React + Vite** app.
This repository starts as a **clickable HTML/React prototype** (the design source of truth)
and this `handoff/` folder contains everything a coding agent needs to turn it into a
real, installable Windows application.

---

## 1. What LAUNCHPAD is

Two shells, one app — modeled on the classic **Metro ↔ Desktop** duality:

| Shell | Who | Default | Description |
|---|---|---|---|
| **LAUNCHPAD** (Metro) | the child (Jake, 10) | ✅ boots here | Calm, big-tile home: Spielen, Lernen, Kreativ, Web, direct game tiles, Elternbereich. Houses the **Play** game library and **Game Detail** start screens. |
| **Windows Desktop** | the parent / admin | behind a **PIN gate** | The original "grown-up" desktop: taskbar, start menu, icons, system tray. Reachable from the *Windows-Desktop* tile, always returns home via **"Zurück zu LAUNCHPAD"**. |

The child lives in LAUNCHPAD. The full desktop is one tap away but **gated by a parent PIN**
(demo PIN: `1234`). From the desktop, returning to LAUNCHPAD is instant and ungated.

> ⚠️ **Design note:** the "Windows desktop" is an **original** desktop UI (taskbar, start
> menu, tray) — it intentionally does *not* clone Microsoft's branded visuals or logos.

---

## 2. The prototype (this repo, today)

Pure front-end. Open `index.html` — no build step, no backend.

```
index.html              # script/style loader + mount point
css/                    # base, desktop, launcher (Play+Detail), apps, parental, import, windows
js/
  app.jsx               # root: stage scaling, shell-switch state, PIN gate, tweaks
  desktop.jsx           # LAUNCHPAD Metro home
  launcher.jsx          # Play library + Game Detail + launch splash
  windows.jsx           # Windows desktop + Start menu + PIN gate
  apps.jsx              # Lernen / Kreativ / Web sub-screens
  parental.jsx          # Eltern & Sicherheit panel
  import.jsx            # Game manager (SteamGridDB cover import)
  gamestore.jsx         # game state + localStorage persistence (the data layer)
  data.jsx              # seed content (games, hubs, bookmarks, sources)
  icons.jsx             # line-icon set
  sfx.js                # WebAudio sound effects
  tweaks-panel.jsx      # in-design tweak controls
  image-slot.js         # drag-drop image placeholder web component
```

**Everything game-state lives in `gamestore.jsx`** and persists to `localStorage`
under key `comet.games.v2`. This is the seam the real app replaces with IPC + a real store.

---

## 3. Where to go next — read these in order

1. **`ARCHITECTURE.md`** — Electron process model, shell switching, kiosk/security.
2. **`PROJECT-STRUCTURE.md`** — the target Vite + Electron folder layout.
3. **`IPC-CONTRACT.md`** — the exact `window.launchpad` API the renderer calls.
4. **`DATA-MODEL.md`** — JSON schemas for games, profiles, parental settings.
5. **`GAME-LAUNCHING.md`** — how to actually start Steam / Minecraft / `.exe` games.
6. **`COMPONENT-MAP.md`** — which prototype file becomes which app module.
7. **`ROADMAP.md`** — milestones, ordered.
8. **`electron/`** — runnable `main.js` + `preload.js` stubs, `package.json`, `vite.config.js`.

---

## 4. Quick start (target app)

```bash
npm install
npm run dev        # Vite renderer + Electron main, hot reload
npm run build      # production bundle
npm run dist       # electron-builder → Windows installer (.exe / MSIX)
```

(See `electron/package.json` for the script definitions to copy in.)
