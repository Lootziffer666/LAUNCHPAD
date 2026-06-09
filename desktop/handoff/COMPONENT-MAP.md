# Component map — prototype → app

Each prototype file already isolates one concern, so porting is 1:1.

| Prototype file | Exports | Target module | Notes for the port |
|---|---|---|---|
| `js/app.jsx` | `App` | `src/App.jsx` | Root. Keeps `mode` (launchpad/windows) + `gate`. Replace `useTweaks` localStorage with `getProfile`/`setProfile` IPC (or keep tweaks dev-only). Stage scaling can stay or be dropped if window is full-size. |
| `js/desktop.jsx` | `Desktop` | `src/shells/Launchpad.jsx` | Metro home. `onOpenWindows` triggers the PIN gate. Tiles already call into Play/apps/parental. |
| `js/windows.jsx` | `WindowsDesktop`, `PinGate` | `src/shells/WindowsDesktop.jsx` (+ `StartMenu`, `PinGate`) | `PARENT_PIN` constant → `window.launchpad.verifyPin`. Taskbar clock can read `getSystemInfo`. "Files" window is decorative — wire to a real folder view only if scoped. |
| `js/launcher.jsx` | `PlayOverlay`, `GameDetail` | `src/play/PlayLibrary.jsx`, `src/play/GameDetail.jsx` | Tabs (bibliothek/favoriten/installiert), hero, cover grid, Detail. `Starten`→`launchGame`, `Installieren`→`installGame`, favorite→`setFavorite`. |
| `js/apps.jsx` | `AppShell` | `src/apps/AppShell.jsx` | Lernen / Kreativ / Web sub-screens (semantic-zoom modal). Web = embedded safe webview in prod. |
| `js/parental.jsx` | `ParentalPanel` | `src/apps/Parental.jsx` | Bind controls to `getParentalSettings`/`setParentalSettings`/`getUsageToday`. |
| `js/import.jsx` | `ImportManager` | `src/games/GameManager.jsx` | Cover import. Add `searchCovers` (SteamGridDB via main) + a file/exe path picker. URL & drag-drop already work. |
| `js/gamestore.jsx` | `GameStore`, `useGames`, `gameCover` | `src/games/useGames.js` | **The data seam.** Re-back on IPC (see IPC-CONTRACT.md). Public surface stays identical so no other file changes. |
| `js/data.jsx` | `CometData` | `electron/services/gameRegistry.js` (seed) + `src/lib/content.js` (hubs/bookmarks) | Game seeds move to main; static UI content (Lernen/Kreativ/Web items) can stay in renderer. |
| `js/icons.jsx` | `Icon` | `src/ui/icons.jsx` | No change. |
| `js/sfx.js` | `SFX` | `src/lib/sfx.js` | No change. Gate on profile.sound. |
| `js/tweaks-panel.jsx` | tweak controls | `src/ui/Tweaks.jsx` | Optional in prod (dev/QA tool). |
| `js/image-slot.js` | `<image-slot>` | `src/ui/image-slot.js` | Used for avatars/photos. Replace persistence with profile store if needed. |
| `css/*` | — | `src/styles/*` | Import globally or as CSS modules. `--comet-cyan`/theme vars already drive everything. |

## State ownership after the port
- **Renderer-only:** `mode`, `gate`, transient UI (open overlay, selected tab, launch splash).
- **Main-owned (via IPC):** games, profile, parental settings, usage, PIN. Renderer caches via hooks.
