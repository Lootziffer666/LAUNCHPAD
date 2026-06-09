# SCOPE-GUARD — LAUNCHPAD Desktop

> The boundary contract for building LAUNCHPAD Desktop out of this handoff.
> Read **after** `README.md`. If a change would violate anything here, stop and confirm first.
>
> Status: draft for confirmation · 2026-06-08 · lives in the LAUNCHPAD repo under `desktop/`.

---

## 0. Mission (one line)

Turn the clickable prototype in `desktop/` into a **kid-safe Windows desktop shell** (Electron +
React + Vite): a calm child home (LAUNCHPAD) that boots first, with a **PIN-gated** parent
desktop one tap away — warm and welcoming, **not** a lockbox.

---

## 1. Placement & repo boundaries

- **Lives in `desktop/`** of the LAUNCHPAD repo. The clickable prototype is the **design source
  of truth**; `desktop/handoff/` is the spec.
- **Do NOT touch the Android app.** `app/`, `companion/`, Gradle, detekt/lint baselines and the
  FossifyOrg CI are a separate product. Desktop work must never modify them or break their build.
- The Android CI (detekt/lint/tests) scans Kotlin under `app/` — it does not see `desktop/`. Keep
  it that way (no shared tooling, no root-level config that reaches into `app/`).
- Build artifacts (`desktop/node_modules`, `desktop/dist`, `desktop/.vite`, installers) are
  git-ignored — never commit them.

---

## 2. In scope (what we build — ordered, from ROADMAP.md)

| # | Milestone | Done when |
|---|---|---|
| M0 | Scaffold: Vite+React+Electron from `handoff/electron/*` | empty window opens via `npm run dev` |
| M1 | Port `desktop/js|css` → `src/*` (ES imports, drop in-browser Babel) | both shells + Play + Detail render natively on seed data |
| M2 | Data layer over IPC: `electron-store` + `gameRegistry` re-back `useGames` | favorite/install/cover edits persist across restarts |
| M3 | Game launching (steam:// / uri / exe / uwp / internal) + guardrails | "Starten" launches a real Steam/Minecraft entry |
| M4 | Shell hardening: hashed PIN + first-run setup, parental settings/usage, age filter, time-limit lock, window lockdown, soft/hard kiosk | a child cannot escape the shell |
| M5 | Cover art (SteamGridDB in main) + polish (icon, installer art) | covers fetch + cache; fallbacks intact |
| M6 | Package: electron-builder → Windows installer; smoke-test on clean Win VM | `.exe` installs and runs both shells |

Each milestone is shippable/testable on its own and committed separately.

---

## 3. Out of scope / non-goals (do NOT build these unasked)

- ❌ **Cloning Microsoft's branded visuals/logos.** The "Windows desktop" is our **original**
  curated surface (taskbar/start/tray we own) — not the real Explorer desktop, not MS trademarks.
- ❌ **A general web browser.** Web/Scratch-online/videos are *embedded, allow-listed webviews* at
  most — and that's deferred (see Decision 3). The shell must never become a browser escape hatch.
- ❌ **Arbitrary code execution.** The renderer never passes a raw path to `spawn`; main only
  launches `launch` targets resolved from the trusted registry by id.
- ❌ **Cloud/accounts/telemetry/analytics.** Local-first (electron-store on disk). No phone-home.
- ❌ **Multi-device sync, online store, in-app purchases, ads.**
- ❌ **Re-implementing the Android launcher's features** (Krypto-Cash, Zusagen, Doge, Wochenplan).
  Desktop parental controls = PIN + age-rating + daily-limit/bedtime only (DATA-MODEL.md), nothing more.
- ❌ **Over-engineering / "Fort Knox."** Same principle as the Android side: protections are real but
  the child experience stays warm and calm. No scary lockdown/tamper/security language in kid-facing UI.
- ❌ Bundling SteamGridDB cover images (licensing) — fetch-on-demand only (Decision 5).

---

## 4. Non-negotiable guardrails (security & safety)

Electron process model (ARCHITECTURE.md) — **all required, verify each PR:**
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `devTools` only in dev.
- Renderer reaches the OS **only** through the frozen, allow-listed `window.launchpad` (preload).
- **Single IPC channel map** in `main.js`; reject any channel not in the map.
- **Validate every IPC argument in main** (ids must exist in registry; never trust renderer paths).
- `setWindowOpenHandler → deny`; `will-navigate → preventDefault` for non-app URLs.
- Launch guardrails, in order: exists in registry → `installed` → passes age-rating + approvals →
  under daily limit / not in bedtime → only then resolve `launch` and start.

Child-safety:
- PIN is **hashed** (scrypt/argon2) in main; the prototype's `1234` is a demo placeholder, replaced at
  first-run setup. `verifyPin` compares hashes; never store/log the raw PIN.
- **Age rating filters `listGames()` server-side** (main), not just hidden in the renderer.
- Time limit / bedtime → `onTimeLimitReached` locks back to a safe LAUNCHPAD screen.
- Returning to LAUNCHPAD from the parent desktop is **instant and ungated**; entering the parent
  desktop is **always** PIN-gated.

Tone (carry over from the Android side):
- Kid-facing copy is calm and warm ("Schulzeit läuft", "wartet bis später") — **no** warning colors,
  lockdown/tamper/"you are being monitored" language.

---

## 5. Open product decisions — recommended defaults (please confirm)

Proceeding on these defaults unless you say otherwise; none block M0–M2.

1. **Kiosk depth** → *Default:* **soft cage** (single maximized window; LAUNCHPAD is the app's home)
   through M1–M4; wire **hard cage** (`kiosk:true` + Assigned Access / shell-replace) as an opt-in in
   M4 for deployment. Renderer code is identical either way.
2. **Game sources first** → *Default:* **Steam + Minecraft + local .exe + internal** in M3. Epic / itch /
   Microsoft Store (uwp) = later, behind the same `launch.kind` switch.
3. **Online content (Web/Scratch-online/videos)** → *Default:* **deferred to post-M4.** Until then, Web
   tiles are allow-listed internal routes only; no embedded live browsing yet.
4. **Multi-profile** → *Default:* **single child (Jake) + parent/admin** for v1. Switchable kid profiles later.
5. **Cover art licensing** → *Default:* **fetch-on-demand** via SteamGridDB (API key in main/secure store,
   fetched server-side), cached under `resources/`; **never bundle** covers. URL-paste + drag-drop stay as fallbacks.

---

## 6. Working agreement

- **Order:** M0 → M6, one milestone per commit (or a few tight commits), each independently testable.
- **Verify before commit** (same discipline as the Android work): at minimum `npm run dev` boots and
  the touched feature works; `npm run build` succeeds before a "port"/packaging commit.
- **Branch:** continue on `claude/bold-tesla-jBARK`; **no PR** unless you ask.
- **Surface, don't guess:** anything ambiguous or touching a guardrail → confirm via a question first.

---

## 7. Honest environment constraints (verification limits)

This build runs on **Linux**, not Windows:
- The Vite renderer + Electron main **run and build** cross-platform here, so M0–M2 (and most of M4's
  UI/logic) are fully verifiable.
- **Windows-only paths can NOT be exercised here:** real `steam://` / `uwp` / `.exe` launches,
  `electron-builder --win` installers, and OS kiosk/Assigned Access provisioning. Those need a Windows
  box (yours or a CI Windows runner). I'll build them to spec, unit-test the pure logic, and clearly mark
  what still needs a Windows smoke-test — never claim a Windows-only path "works" from here.

---

*Sources folded in: `handoff/README.md`, `ARCHITECTURE.md`, `PROJECT-STRUCTURE.md`, `IPC-CONTRACT.md`,
`DATA-MODEL.md`, `GAME-LAUNCHING.md`, `COMPONENT-MAP.md`, `ROADMAP.md`, `electron/*`.*
