# LAUNCHPAD Desktop

A kid-safe desktop shell for Windows — a calm child home (**LAUNCHPAD**) that boots first, with a
**PIN-gated** parent desktop one tap away. Built as **Electron + React + Vite**. Lives in the
LAUNCHPAD repo under `desktop/`, kept fully separate from the Android app.

> Boundary contract: **`handoff/SCOPE-GUARD.md`** (read first). Full spec: **`handoff/`**.

## Two things live here

| Path | What it is |
|---|---|
| `prototype.html` + `css/` + `js/` | The clickable **design prototype** (no build step — open `prototype.html`). The design source of truth. |
| `index.html` + `src/` + `electron/` | The **real app**, built from it milestone by milestone. |

## Run

```bash
cd desktop
npm install
npm run dev      # Vite renderer + Electron, hot reload
npm run build    # production renderer bundle → dist/
```

`npm run dev` serves the renderer on `http://localhost:5173` and opens the Electron window against it.
In a packaged build the main process loads `dist/index.html` from disk instead.

## How it's wired

```
electron/main.js        one locked-down BrowserWindow; registers the allow-listed lp:* IPC handlers
electron/preload.js     the ONLY bridge → window.launchpad (contextIsolation + sandbox on)
electron/services/      gameRegistry (catalogue + edits)  parental (PIN/age/limit/usage)  launcher (resolve+run)
src/                    React renderer: shells/ (Launchpad, WindowsDesktop) · play/ · apps/ · games/
```

The renderer never touches Node or the filesystem; every privileged action goes through a named
`lp:*` channel, and every game id is resolved against the registry **in main** — renderer paths are
never trusted. See `handoff/IPC-CONTRACT.md`.

## Status

| Milestone | State |
|---|---|
| **M0** scaffold — locked-down window + secure bridge | ✅ |
| **M1** port renderer — both shells, Play, Game Detail | ✅ |
| **M2** data over IPC — edits persist via electron-store | ✅ |
| **M3** launch games — resolve target, enforce gate, run | ✅ logic; real OS spawn needs a Windows smoke-test |
| **M4** shell hardening — hashed PIN, age filter, time limit, kiosk | ✅ |
| **M5** launch-target editor (+ covers via URL/drag) | ✅ |
| **M6** Windows installer (electron-builder) | ⏳ needs Windows — see below |
| auto cover search (SteamGridDB) | ⏳ needs a SteamGridDB API key |

## Configure & deploy

**Add / configure games** — in the child Play view tap **“+ Spiele”** to open the manager. Per game set:
- **Start** (how it launches): `Steam` (enter the AppID), `Minecraft`, `Windows-Programm` (`.exe` path),
  `Web-/App-Link` (e.g. `roblox://…` — schemes are allow-listed in main), or `In LAUNCHPAD` (in-app).
- **Cover**: paste a SteamGridDB image URL, or drag an image onto the tile.

**Parental controls** — open **Eltern & Sicherheit** (PIN-gated). Default PIN is **`1234`** (seeded
hashed) — change it under **Eltern-PIN** before deploying. Set age rating (6/9/12, filters which games
the child sees), daily screen-time limit, bedtime, and per-app approvals. When the daily limit is
reached the shell drops back to a calm LAUNCHPAD screen.

**Kiosk / lockdown** — soft cage (maximized single window) is the default. For a hard cage set
`LP_KIOSK=1`. In a packaged (prod) build the app also drops the application menu and swallows
reload / devtools / close / fullscreen accelerators. For a true locked-down child PC, pair this with
Windows **Assigned Access** (single-app kiosk) — out of scope for the app itself.

### Package for Windows (M6)

Run on a Windows machine. Add [`electron-builder`](https://www.electron.build/):

```bash
npm i -D electron-builder
```

`package.json` — add a build script and config:

```jsonc
"scripts": { "dist": "npm run build && electron-builder --win" },
"build": {
  "appId": "com.inkandironglow.launchpad",
  "productName": "LAUNCHPAD",
  "files": ["dist/**", "electron/**"],
  "win": { "target": "nsis" }
}
```

```bash
npm run dist     # → an installer under dist/ (or dist_electron/)
```

Then smoke-test the Windows-only paths that can't be checked on Linux:
real `steam://` / `.exe` / UWP launches, the installer, and kiosk behaviour.

## Environment flags

| Flag | Effect |
|---|---|
| `LP_KIOSK=1` | hard cage (kiosk window) |
| `LP_DEV_URL` | override the dev renderer URL (default `http://localhost:5173`) |
| `LP_USAGE_TICK_MS` / `LP_USAGE_TICK_MIN` | usage-ticker cadence / minutes per tick (CI exercises the time limit fast) |
| `LP_LAUNCH_DRYRUN=1` | resolve a launch to its plan without touching the OS (verification) |
| `LP_SHOT` / `LP_DRIVE` | headless screenshot path / renderer JS to run first (verification) |

## Note on verification

Everything above is built and **runtime-verified on Linux** (headless via `xvfb`): the renderer and
Electron main build and boot; PIN hashing/verify survives restarts with no hash leak; the age filter,
time-limit lock, and launch gate all behave; launch targets resolve to the right `steam://` /
`.exe` / link. **Windows-only paths are never claimed working from here** — real `steam://` / `uwp` /
`.exe` launches, `electron-builder --win`, and OS kiosk / Assigned Access need a Windows box and are
marked ⏳ above.
