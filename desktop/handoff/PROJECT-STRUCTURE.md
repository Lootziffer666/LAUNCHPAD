# Target project structure (Electron + React + Vite)

Mirrors the WinX360 reference (Electron + React + Vite) the customer pointed to.

```
launchpad/
├─ package.json                 # see electron/package.json in this handoff
├─ vite.config.js               # see electron/vite.config.js
├─ electron-builder.yml         # Windows packaging (nsis + msix targets)
├─ electron/
│  ├─ main.js                   # main process (window, IPC, game launching)  ← stub provided
│  ├─ preload.js                # contextBridge → window.launchpad           ← stub provided
│  └─ services/
│     ├─ gameRegistry.js        # load/persist games, resolve launch target
│     ├─ launcher.js            # steam:// / minecraft / .exe launching
│     ├─ parental.js            # PIN (hashed), screen-time, approvals
│     └─ store.js               # electron-store wrapper (typed getters)
├─ src/                         # RENDERER — port the prototype's js/ here
│  ├─ main.jsx                  # ReactDOM root (replaces in-browser Babel)
│  ├─ App.jsx                   # ← js/app.jsx (shell switch, gate, tweaks)
│  ├─ shells/
│  │  ├─ Launchpad.jsx          # ← js/desktop.jsx
│  │  └─ WindowsDesktop.jsx     # ← js/windows.jsx (+ StartMenu, PinGate)
│  ├─ play/
│  │  ├─ PlayLibrary.jsx        # ← js/launcher.jsx (PlayOverlay)
│  │  └─ GameDetail.jsx         # ← js/launcher.jsx (GameDetail)
│  ├─ apps/
│  │  ├─ AppShell.jsx           # ← js/apps.jsx
│  │  └─ Parental.jsx           # ← js/parental.jsx
│  ├─ games/
│  │  ├─ GameManager.jsx        # ← js/import.jsx (SteamGridDB import)
│  │  └─ useGames.js            # ← js/gamestore.jsx, but backed by IPC (not localStorage)
│  ├─ ui/
│  │  ├─ icons.jsx              # ← js/icons.jsx
│  │  └─ Tweaks.jsx             # ← js/tweaks-panel.jsx (optional in prod)
│  ├─ lib/
│  │  └─ sfx.js                 # ← js/sfx.js
│  └─ styles/                   # ← css/*  (import as CSS modules or global)
├─ assets/                      # app icon, installer art, wallpapers
└─ resources/                   # bundled covers, default profile avatars
```

## Porting rules
- **Drop in-browser Babel.** Vite compiles JSX. Convert each `window.X = X` global export to
  a proper ES `export` / `import`. (The prototype uses window globals only because it has no bundler.)
- **Rename style objects stay unique** — already done in the prototype; keep it.
- **Replace `localStorage` game state** (`gamestore.jsx`) with the IPC-backed `useGames` hook
  (reads `window.launchpad.listGames()`, mutations call `window.launchpad.*`). See IPC-CONTRACT.md.
- **Keep the component boundaries** in COMPONENT-MAP.md — they already match this tree 1:1.
