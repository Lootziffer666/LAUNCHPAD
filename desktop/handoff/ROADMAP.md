# Roadmap (ordered for a coding agent)

Each milestone is shippable/testable on its own.

## M0 — Scaffold (½ day)
- `npm create vite@latest` (React) + add Electron, `electron`, `electron-builder`, `concurrently`, `electron-store`.
- Copy `electron/main.js`, `electron/preload.js`, `package.json` scripts, `vite.config.js` from this handoff.
- Boot a window that loads the Vite dev server. ✅ when an empty window opens via `npm run dev`.

## M1 — Port the renderer (1–2 days)
- Move `js/*` → `src/*` per COMPONENT-MAP.md. Drop in-browser Babel; convert window-globals to ES imports.
- Move `css/*` → `src/styles`. App renders LAUNCHPAD + Windows desktop + Play + Detail with **seed data**.
- ✅ when the prototype runs natively (still using local seed/mock data).

## M2 — Data layer over IPC (1 day)
- Implement `gameRegistry.js` + `store.js` (electron-store). Move `data.jsx` seeds into the registry.
- Re-back `useGames`/`GameStore` on `window.launchpad.*` (IPC-CONTRACT.md). 
- ✅ when favorite/install/cover edits persist across app restarts (not localStorage).

## M3 — Game launching (1–2 days)
- Implement `launcher.js` (steam:// / uri / exe / uwp) + guardrails (GAME-LAUNCHING.md).
- Wire Detail **Starten/Installieren**; handle `LaunchResult.reason` in the existing splash/toast.
- Game Manager: add `dialog.showOpenDialog` exe picker + store `launch` target.
- ✅ when "Starten" on a real Steam/Minecraft entry launches the actual game.

## M4 — Shell hardening & parental (1–2 days)
- Hash the PIN (scrypt/argon2); first-run setup to set it; `verifyPin`/`setPin`.
- Parental panel bound to real settings + usage; age-rating filter applied in `listGames`.
- `time_limit`/bedtime → `onTimeLimitReached` locks back to LAUNCHPAD.
- Window lockdown: deny new windows, block navigation, disable devtools in prod.
- Decide & implement **soft vs hard kiosk** (ARCHITECTURE.md). ✅ when a child cannot escape the shell.

## M5 — Cover art & polish (1 day)
- SteamGridDB `searchCovers` in main (API key in env/secure store; fetch server-side to dodge CORS).
- Cache covers under `resources/`. Keep URL-paste + drag-drop fallbacks.
- App icon, installer art, auto-update (optional, electron-updater).

## M6 — Package (½ day)
- `electron-builder` → NSIS installer + (optional) MSIX for Store / Assigned Access kiosk.
- Smoke-test on a clean Windows VM. ✅ when the `.exe` installs and runs both shells.

---

### Open product decisions to confirm with the customer
1. **Kiosk depth** — app-the-parent-opens (soft) vs replaces-Explorer-for-kid-login (hard)?
2. **Game sources to support first** — Steam + Minecraft confirmed; Epic / itch / Store too?
3. **Online content** (Web, Scratch online, videos) — embedded safe webview with an allow-list?
4. **Multi-profile** — one child, or switchable kid profiles + the parent/admin?
5. **Cover art licensing** — SteamGridDB attribution/ToS for bundling vs fetch-on-demand.
