# LAUNCHPAD Desktop

A kid-safe desktop shell for Windows, split into **two apps** (adopted from the original
Windows launcher plan — `handoff/WINDOWS-PLAN-ADOPTION.md`):

- **Child shell** — the calm, locked-down fullscreen home (LAUNCHPAD) that boots first.
  No shop, no management, no parent menus.
- **Familienzentrale (parent curator)** — a classic desktop window where parents curate the
  library (review inbox → approve / hide / feature / tag / containment) and manage safety
  settings. Opens only through the PIN gate; the PIN is verified in the main process.

Built as **Electron + React + Vite**. Lives in the LAUNCHPAD repo under `desktop/`, kept fully
separate from the Android app.

> Boundary contract: **`handoff/SCOPE-GUARD.md`** (read first). Full spec: **`handoff/`**.

## What lives here

| Path | What it is |
|---|---|
| `prototype.html` + `css/` + `js/` | The clickable **design prototype** (no build step). Design source of truth for the child shell. |
| `index.html` + `src/` | The **child shell** renderer. |
| `curator.html` + `src/curator/` | The **parent curator** renderer (Familienzentrale). |
| `electron/` | Main process + the two preload bridges. |

## Run

```bash
cd desktop
npm install
npm run dev      # Vite renderer + Electron, hot reload (child shell window)
npm run build    # production bundles (child + curator) → dist/
npm test         # unit tests — launch resolver, curation model, SteamGridDB client, wishlist/deals (44 cases)
```

`npm run dev` serves both entries on `http://localhost:5173` (child at `/`, curator at
`/curator.html`) and opens the child window against it. The curator window opens from inside
the child shell: **Elternbereich** tile → PIN (demo: `1234`).

## How it's wired

```
electron/main.js            two windows: locked-down child + normal curator; registers the
                            allow-listed lp:* IPC handlers (curator channels sender-enforced)
electron/preload.js         CHILD bridge → list/launch/install/favorite + PIN gate + openCurator
electron/preload-curator.js CURATOR bridge → full catalogue, curation edits, covers, settings
electron/services/          gameRegistry (catalogue + edits)  curation (approval/surfacing/
                            containment model)  parental (PIN/age/limit/usage)  launcher
                            (resolve+run+error classes)  covers (SteamGridDB)
src/                        child renderer: shells/ (Launchpad, WindowsDesktop) · play/ · apps/
src/curator/                parent renderer: CuratorApp (library + safety tabs), CurationBar
```

The renderer never touches Node or the filesystem; every privileged action goes through a named
`lp:*` channel, every game id is resolved against the registry **in main**, and parent-only
channels are answered **only for the curator window's sender** — the child bridge not exposing
them is hygiene, the sender check is the guarantee. See `handoff/IPC-CONTRACT.md`.

## The curation model (windows-plan adoption)

Approval and visibility are separate axes (`electron/services/curation.js`):

- **Status** `new → viewed/undecided → approved | forLater | hidden` — only *approved* games
  exist for the child. New games start as *new*: "Automation proposes. Parent curates. Shell
  displays."
- **Präsenz** `featured | normal | low` — how prominently an approved game surfaces in the
  child grid (featured first, low last). Comfort games aren't banned, just dosed.
- **Anlässe** — occasion tags (Winter, Ferien, mit Papa, kurze Session, …) so curation also
  preserves future good experiences, not just blocks.
- **Einzäunung** `strong/soft/weak/open/unknown` + parent warning — containment is parent
  information, not a child feature: a curated entry point is not a fenced play space
  (`handoff/CONTAINMENT_CLASSIFICATION_V1.md`).

Launching shows the child only honest phases — *Startklar machen → Spiel wird geöffnet →
(Fehler:) Das hat gerade nicht geklappt* — with retry offered only for recoverable errors
(`handoff/LAUNCH_STATE_MACHINE_V1.md`).

## Status

| Milestone | State |
|---|---|
| **M0–M6** scaffold → port → data/IPC → launching → hardening → covers → packaging | ✅ (see git history) |
| **Two-app split** — curator window, separate bridges, sender-enforced parent IPC | ✅ |
| **Curation model** — approval/surfacing/tags/containment + review inbox UI | ✅ |
| **Launch phases + error classes** in the child transition UI | ✅ |
| Ready-verification state machine, xCloud pipeline, controller glyphs, trailer overlay | 📋 spec'd (`handoff/`) |

## Steam-family tools (Wunschliste & Angebote)

Two additional Familienzentrale tabs, adopted from the VENT product line and rebuilt natively
for this app (the VENT Android app remains its own product in its own repo):

- **Wunschliste** — entries with optional Steam App-ID and target price; *Preise prüfen*
  fetches the current best Steam price per entry (CheapShark, free/no key, USD) and flags
  *Zielpreis erreicht / Fast am Ziel / Über Zielpreis*.
- **Angebote** — top Steam deals filtered to a minimum discount (30/50/70 %), wishlist hits
  highlighted.

Both pages can be switched off individually under **Eltern & Sicherheit → Seiten der
Familienzentrale**. All data stays in the parent surface — nothing of this is child-visible.

## Parental controls

Open the **Familienzentrale** (PIN-gated; default PIN **`1234`**, seeded hashed — change it
under **Eltern-PIN** before deploying). Library tab: review/approve/hide/feature/tag games, set
per-game age (6/9/12) and containment, fetch covers via SteamGridDB (own API key, stored in
main, or `STEAMGRIDDB_API_KEY`). Safety tab: age rating, daily screen-time limit, bedtime,
app approvals. When the daily limit is reached the child shell drops to a calm screen; during
bedtime the shell locks the same way (launches are refused too) and unlocks again on its own
in the morning. Both lock screens carry an **Eltern-Freigabe (PIN)** override — verified in
main; the bedtime override holds until the window ends, the time-limit override until
midnight, and a reboot re-locks. The **Gerät & Start** card toggles kiosk mode and
autostart-at-login, applied immediately.

## Kiosk / lockdown

In dev the child window is a maximized single window; packaged builds run it in real
fullscreen. For a hard cage enable **Kioskmodus** in the Familienzentrale (or set `LP_KIOSK=1`).
**Automatisch starten** registers the shell as a login item, so it comes up when the OS profile
signs in (packaged builds only). In a packaged (prod) build the child window also drops the application menu and
swallows reload / devtools / close / fullscreen accelerators. The curator window is a normal
window. For a true locked-down child PC, pair this with Windows **Assigned Access**.

### Package for Windows

```bash
npm ci
npm run dist:win    # → release/LAUNCHPAD-Setup-<version>.exe
npm run pack:win    # unpacked app (release/win-unpacked/LAUNCHPAD.exe)
```

The packaging config cross-packs from Linux (`pack:win` produces a real PE32+ binary; the NSIS
installer wrapper needs Windows/Wine). No code-signing cert — the installer is unsigned.
After installing, smoke-test the Windows-only paths: real `steam://` / `.exe` / UWP launches
and kiosk behaviour.

## Environment flags

| Flag | Effect |
|---|---|
| `LP_KIOSK=1` | hard cage (kiosk child window) |
| `LP_DEV_URL` | override the dev renderer URL (default `http://localhost:5173`) |
| `LP_USAGE_TICK_MS` / `LP_USAGE_TICK_MIN` | usage-ticker cadence / minutes per tick |
| `LP_LAUNCH_DRYRUN=1` | resolve a launch to its plan without touching the OS |
| `LP_SHOT` / `LP_SHOT_CURATOR` | headless screenshot path for child / curator window |
| `LP_DRIVE` / `LP_DRIVE_CURATOR` | renderer JS to run first in child / curator (verification) |

## Note on verification

Everything above is built and **runtime-verified on Linux** (headless via `xvfb`) and covered by
`npm test` (44 unit tests). Verified end-to-end here: both windows boot and render; a curator
edit (e.g. park a game as "Für später") removes it from the child list immediately and the child
launch gate refuses it with `not_approved` / `parent_required`; re-approving + featuring sorts it
first; `lp:curator:open` rejects a wrong PIN and opens the window on the right one; PIN
hashing/age filter/time limit behave as before. **Windows-only paths are never claimed working
from here** — real `steam://` / `uwp` / `.exe` launches, the NSIS `Setup.exe`, and OS
kiosk/Assigned Access need a Windows box.
