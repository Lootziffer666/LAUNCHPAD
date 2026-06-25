// electron/main.js — main process.
//
// TWO surfaces, one main process (adopted from the original Windows launcher
// plan: "Keine Parent-Menüs im Child Shell. Elternverwaltung gehört in eine
// klassische Desktop-GUI."):
//   child window    locked-down fullscreen-ish shell (index.html, preload.js)
//   curator window  normal desktop window for parents (curator.html,
//                   preload-curator.js), opened only after a PIN check in main
//
// Security guardrails are non-negotiable (handoff/SCOPE-GUARD.md §4):
// contextIsolation + sandbox on, nodeIntegration off, no new windows, no
// off-app nav, and in prod no reload/devtools/close accelerators and no
// application menu for the CHILD window. Parent-only IPC channels are
// enforced per-sender in main — the child bridge doesn't even expose them,
// and main rejects them from the child window regardless.

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const isDev = !app.isPackaged;
const DEV_URL = process.env.LP_DEV_URL || 'http://localhost:5173';
const HARD_KIOSK = process.env.LP_KIOSK === '1';

// Branded window/taskbar icon. On Windows the packaged .exe icon comes from
// electron-builder (build/icon.ico); this is the in-process window icon (used
// in dev and as a fallback). Resolve defensively — a missing file must never
// crash window creation.
const ICON_PATH = path.join(__dirname, '..', 'build', 'icon.png');
const WINDOW_ICON = fs.existsSync(ICON_PATH) ? ICON_PATH : undefined;

// Usage ticker knobs (env-overridable so CI can exercise the time-limit fast).
const USAGE_TICK_MS = parseInt(process.env.LP_USAGE_TICK_MS, 10) || 60000;
const USAGE_TICK_MIN = parseInt(process.env.LP_USAGE_TICK_MIN, 10) || 1;

let win; // child shell window
let curatorWin = null; // parent curator window (created on demand)
let registry;
let parental;
let launcher;
let covers;
let wishlist;
let updater;
let steamLib;
let quitting = false; // set true on a real (parent/system) quit so close-guards stand down
let uskPass = null; // { stop: bool } — active USK auto-approval run, if any

// ── lock model (bedtime / daily time limit) with parent override ──
// Overrides are in-memory on purpose: a reboot re-locks. The bedtime override
// lasts until the current window ends (next night locks again); the
// time-limit override lasts until midnight (usage keeps accruing, it just
// stops locking for today). Both are set ONLY via lp:shell:unlock, which
// verifies the parent PIN in main.
let bedtimeOverride = false;
let timeOverrideDay = null;
let lastLock; // ticker edge detection (undefined until the first evaluation)

const dayKey = () => new Date().toISOString().slice(0, 10);

function currentLock() {
  if (parental.inBedtime()) {
    if (!bedtimeOverride) return 'bedtime';
  } else {
    bedtimeOverride = false; // window over → the override resets itself
  }
  if (parental.timeLeft() <= 0 && timeOverrideDay !== dayKey()) return 'timeup';
  return null;
}

function emitLock(lock) {
  if (win && !win.isDestroyed()) win.webContents.send('lp:event:lock', lock);
}

// Gentle wind-down: push the live minutes-left so the renderer can show calm,
// steady reminders (no pressure countdown). Suppressed entirely when unlimited.
function emitTimeWarn() {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('lp:event:timewarn', parental.windDownStatus());
}

// ── registry-free autostart ──
// Instead of HKCU\…\Run (a registry value), drop a shortcut in the per-user
// Startup folder. Same effect (launch the cage at login), but lives entirely in
// the user profile — zero registry. Created/removed at runtime so the parent's
// autostart toggle still works. Best-effort + non-blocking; never crashes main.
function psQuote(s) { return `'${String(s).replace(/'/g, "''")}'`; } // single-quoted PS literal

function startupShortcutPath() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup', 'LAUNCHPAD.lnk');
}

function applyAutostart(enabled) {
  if (isDev || process.platform !== 'win32') return; // dev would register the bare electron binary
  const lnk = startupShortcutPath();
  try {
    if (enabled) {
      const { execFile } = require('node:child_process');
      const target = process.execPath; // the installed LAUNCHPAD.exe
      const script = [
        '$ws = New-Object -ComObject WScript.Shell;',
        `$s = $ws.CreateShortcut(${psQuote(lnk)});`,
        `$s.TargetPath = ${psQuote(target)};`,
        `$s.WorkingDirectory = ${psQuote(path.dirname(target))};`,
        '$s.Save()',
      ].join(' ');
      execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], (err) => {
        if (err) console.error('[launchpad] autostart shortcut create failed:', err);
      });
    } else if (fs.existsSync(lnk)) {
      fs.unlinkSync(lnk); // removing the .lnk is a plain file delete — no PowerShell needed
    }
  } catch (e) {
    console.error('[launchpad] applyAutostart failed:', e);
  }
}

// Kiosk = env override (LP_KIOSK=1) OR the parent's persisted setting; in prod
// the child shell is fullscreen even without kiosk. registerIpc() loads the
// parental service before any window exists, so prefs are always readable here.
function shellPrefs() {
  const s = parental ? parental.getSettings() : {};
  return { kiosk: HARD_KIOSK || !!s.kiosk, autostart: s.autostart !== false };
}

// Re-apply shell prefs at startup and after curator settings changes: kiosk
// cage live on the child window, autostart at OS-profile login. Login items
// are only registered for packaged builds — dev would register the bare
// electron binary.
function applyShellPrefs() {
  const prefs = shellPrefs();
  if (win && !win.isDestroyed()) {
    if (win.isKiosk() !== prefs.kiosk) win.setKiosk(prefs.kiosk);
    if (!prefs.kiosk && !isDev && !win.isFullScreen()) win.setFullScreen(true);
  }
  if (!isDev) {
    // Registry-free autostart: a shortcut in the per-user Startup folder
    // (not the HKCU\…\Run registry value). Keeps the kiosk's "boot into the
    // cage at login" behaviour with zero registry footprint.
    applyAutostart(prefs.autostart);
  }
}

// Bring the child shell to the front and re-assert its cage. Called when a
// tracked (spawned) game exits, so a closed program lands the child back on
// LAUNCHPAD instead of the bare Windows desktop.
function focusShell() {
  if (!win || win.isDestroyed()) return;
  try {
    if (win.isMinimized()) win.restore();
    if (!isDev) {
      if (shellPrefs().kiosk) win.setKiosk(true);
      else if (!win.isFullScreen()) win.setFullScreen(true);
    }
    win.show();
    if (typeof win.moveTop === 'function') win.moveTop();
    win.focus();
  } catch (e) {
    console.error('[launchpad] focusShell failed:', e);
  }
}

function lockNavigation(w) {
  w.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  w.webContents.on('will-navigate', (e, url) => {
    const allowed = url.startsWith(DEV_URL) || url.startsWith('file://');
    if (!allowed) e.preventDefault();
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0a1538',
    show: false,
    icon: WINDOW_ICON,
    kiosk: shellPrefs().kiosk, // hard cage: LP_KIOSK=1 or the parent's setting
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
    if (!shellPrefs().kiosk) {
      // prod: real fullscreen even without the kiosk cage; dev: maximized so
      // hot-reload/devtools stay usable
      if (isDev) win.maximize();
      else win.setFullScreen(true);
    }
    console.log('[launchpad] window ready-to-show');
  });

  if (isDev) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // ── shell lockdown: no popups, no navigating away from our own app ──
  lockNavigation(win);

  // In prod, swallow the keys a child could use to break out (reload, devtools,
  // close, fullscreen toggle). Left active in dev for hot-reload/devtools.
  if (!isDev) {
    win.webContents.on('before-input-event', (e, input) => {
      const k = (input.key || '').toLowerCase();
      const mod = input.control || input.meta;
      const blocked =
        k === 'f5' || k === 'f11' ||
        (input.alt && k === 'f4') ||
        (mod && k === 'r') ||
        (mod && k === 'w') ||
        (mod && k === 'q') ||
        (mod && input.shift && (k === 'i' || k === 'c' || k === 'j'));
      if (blocked) e.preventDefault();
    });
  }

  // Don't let the child window be closed from under the kid. In kiosk it is
  // hard-blocked; in a packaged non-kiosk build an accidental close relaunches
  // the shell. A real parent-initiated quit sets `quitting` first.
  win.on('close', (e) => {
    if (quitting || isDev) return;
    if (shellPrefs().kiosk) { e.preventDefault(); focusShell(); }
  });
  win.on('closed', () => {
    if (quitting || isDev) { win = null; return; }
    // Unexpected close in a packaged build → come straight back up.
    try { app.relaunch(); } catch (err) { /* ignore */ }
    app.exit(0);
  });

  maybeCaptureForVerification();
}

// The parent curator: a NORMAL desktop window — resizable, closable, no cage.
// It is only ever created here in main, after a successful PIN verification
// (lp:curator:open) or via LP_SHOT_CURATOR for headless verification.
function createCuratorWindow() {
  if (curatorWin && !curatorWin.isDestroyed()) {
    curatorWin.show();
    curatorWin.focus();
    return curatorWin;
  }
  curatorWin = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0b1430',
    show: false,
    icon: WINDOW_ICON,
    webPreferences: {
      preload: path.join(__dirname, 'preload-curator.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
    },
  });
  curatorWin.once('ready-to-show', () => curatorWin.show());
  if (isDev) {
    curatorWin.loadURL(`${DEV_URL}/curator.html`);
  } else {
    curatorWin.loadFile(path.join(__dirname, '../dist/curator.html'));
  }
  lockNavigation(curatorWin);
  curatorWin.on('closed', () => { curatorWin = null; });
  return curatorWin;
}

const isCuratorSender = (e) =>
  !!curatorWin && !curatorWin.isDestroyed() && e.sender === curatorWin.webContents;

// Headless verification hook (dev/CI only): LP_SHOT screenshots the child
// window, LP_SHOT_CURATOR opens + screenshots the curator window, LP_DRIVE /
// LP_DRIVE_CURATOR run a renderer JS snippet in the respective window first
// (curator drive runs before the child drive, so curation edits can be
// asserted from the child side). Never runs in normal use. app.exit(0)
// sidesteps an xvfb graceful-shutdown crash.
function maybeCaptureForVerification() {
  const shotPath = process.env.LP_SHOT;
  const curatorShotPath = process.env.LP_SHOT_CURATOR;
  const drive = process.env.LP_DRIVE;
  const curatorDrive = process.env.LP_DRIVE_CURATOR;
  if (!shotPath && !drive && !curatorShotPath && !curatorDrive) return;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  win.webContents.once('did-finish-load', async () => {
    try {
      await sleep(900); // let layout/paint settle
      if (curatorDrive || curatorShotPath) {
        const cw = createCuratorWindow();
        await new Promise((resolve) => cw.webContents.once('did-finish-load', resolve));
        await sleep(900);
        if (curatorDrive) {
          const result = await cw.webContents.executeJavaScript(curatorDrive, true);
          if (result !== undefined) console.log('[launchpad] curator drive result: ' + JSON.stringify(result));
          await sleep(800);
        }
        if (curatorShotPath) {
          const image = await cw.webContents.capturePage();
          fs.writeFileSync(curatorShotPath, image.toPNG());
          console.log('[launchpad] curator verification shot saved -> ' + curatorShotPath);
        }
      }
      if (drive) {
        const result = await win.webContents.executeJavaScript(drive, true);
        if (result !== undefined) console.log('[launchpad] drive result: ' + JSON.stringify(result));
        await sleep(800);
      }
      if (shotPath) {
        const image = await win.webContents.capturePage();
        fs.writeFileSync(shotPath, image.toPNG());
        console.log('[launchpad] verification shot saved -> ' + shotPath);
      }
    } catch (err) {
      console.error('[launchpad] verification step failed', err);
    } finally {
      app.exit(0);
    }
  });
}

// Any data mutation → both windows refetch, so a curator edit shows up in the
// child shell immediately (and vice versa for install/favorite).
function emitGamesChanged() {
  for (const w of [win, curatorWin]) {
    if (w && !w.isDestroyed()) w.webContents.send('lp:event:games-changed');
  }
}

// ── Steam library: USK auto-approval pass ──
// Throttled background run: read each owned Steam game's USK rating from the
// public store endpoint and auto-approve those at/under the parent threshold,
// so a 2000-title f2p library doesn't have to be reviewed by hand. Progress is
// pushed to the curator; it can be stopped. Approvals are written in batches.
function emitSteamProgress(p) {
  if (curatorWin && !curatorWin.isDestroyed()) curatorWin.webContents.send('lp:event:steam-progress', p);
}

async function runUskAutoApprove(maxUsk, opts = {}) {
  if (uskPass) return { ok: false, reason: 'busy' };
  const max = parseInt(maxUsk, 10);
  if (!Number.isFinite(max)) return { ok: false, reason: 'no_threshold' };
  uskPass = { stop: false };
  const delay = opts.delayMs != null ? opts.delayMs : 1500; // gentle on the public appdetails endpoint
  const targets = registry.listGames().filter((g) =>
    (g.source === 'Steam' || /^steam-/.test(g.id)) && g.appid
    && (g.curation === 'new' || g.minAge == null));
  let checked = 0;
  let approved = 0;
  let batch = {};
  emitSteamProgress({ phase: 'start', total: targets.length });
  for (const g of targets) {
    if (uskPass.stop) break;
    const usk = await steamLib.fetchUsk(g.appid);
    checked++;
    if (usk != null) {
      batch[g.id] = { minAge: usk };
      if (steamLib.shouldAutoApprove(usk, max)) { batch[g.id].curation = 'approved'; approved++; }
    }
    if (checked % 20 === 0) {
      registry.bulkPatch(batch); batch = {}; emitGamesChanged();
      emitSteamProgress({ phase: 'progress', checked, total: targets.length, approved });
    }
    await new Promise((r) => setTimeout(r, delay));
  }
  if (Object.keys(batch).length) { registry.bulkPatch(batch); emitGamesChanged(); }
  const stopped = uskPass.stop;
  uskPass = null;
  emitSteamProgress({ phase: 'done', checked, total: targets.length, approved, stopped });
  return { ok: true, checked, approved, stopped };
}

// Accrue foreground time and drive the lock state. (A future pass can scope
// usage to the child shell / active use only.)
//
// One ticker, one lock signal: every tick re-evaluates currentLock() —
// bedtime window, daily budget, parent overrides — and emits lp:event:lock
// on EVERY transition, both ways. So the shell locks when bedtime starts,
// unlocks on its own in the morning, and re-locks the night after an
// override. While the bedtime lock is active the tick does not burn the
// daily budget (a PC left on overnight would otherwise wake up with no
// time left).
function startUsageTicker() {
  lastLock = currentLock();
  setInterval(() => {
    if (currentLock() !== 'bedtime') parental.addUsage(USAGE_TICK_MIN);
    const lock = currentLock();
    if (lock !== lastLock) {
      lastLock = lock;
      emitLock(lock);
    }
    // Steady, calm wind-down signal (renderer decides how/whether to show it).
    if (!lock) emitTimeWarn();
  }, USAGE_TICK_MS);
}

// ── IPC: one allow-listed channel→handler map. ipcMain.handle answers ONLY
// these channels; any other invoke rejects (scope-guard §4). Every id arg is
// resolved in main — renderer paths are never trusted. Channels marked
// curator-only additionally verify the SENDER: even though the child preload
// doesn't expose them, main never relies on the bridge alone.
function registerIpc() {
  registry = require('./services/gameRegistry');
  parental = require('./services/parental');
  launcher = require('./services/launcher');
  covers = require('./services/covers');
  wishlist = require('./services/wishlist');
  updater = require('./services/updater');
  steamLib = require('./services/steamLibrary');
  const winget = require('./services/winget');

  // Push update state to the curator window whenever it changes.
  updater.init((u) => {
    if (curatorWin && !curatorWin.isDestroyed()) curatorWin.webContents.send('lp:event:update', u);
  });

  // after a successful mutation, let every window refetch
  const mutating = (fn) => async (...args) => {
    const out = await fn(...args);
    emitGamesChanged();
    return out;
  };

  const childHandlers = {
    // child shell surface: approved-only + age-filtered + surfacing-sorted in main
    'lp:games:list': () => registry.listChildGames().filter(parental.ageAllows),
    // child get is filtered like the child list — un-approved ids stay invisible
    'lp:games:get': (_e, id) => {
      const g = registry.getGame(id);
      return g && g.curation === 'approved' && parental.ageAllows(g) ? g : null;
    },
    'lp:games:install': mutating((_e, id) => registry.install(id)),
    'lp:games:favorite': mutating((_e, id, v) => registry.setFavorite(id, v)),
    // Resolve id in main, enforce the parental gate, then launch. Dry-run
    // (LP_LAUNCH_DRYRUN=1) returns the resolved plan without touching the OS,
    // so the gate + resolution can be verified headlessly. Failures carry an
    // errorClass (recoverable/blocked/parent_required/fatal) for the
    // transition UI.
    'lp:games:launch': (_e, id) => {
      const game = registry.getGame(id);
      const gate = parental.canLaunch(game, {
        ignoreBedtime: bedtimeOverride,
        ignoreTimeLimit: timeOverrideDay === dayKey(),
      });
      if (!gate.ok) return { ...gate, errorClass: launcher.classifyFailure(gate.reason) };
      if (process.env.LP_LAUNCH_DRYRUN === '1') return { ok: true, dryRun: true, plan: launcher.resolveLaunch(game) };
      return launcher.launchGame(game, {
        onExit: () => {
          focusShell();
          if (win && !win.isDestroyed()) win.webContents.send('lp:event:game-closed', id);
        },
      });
    },

    // shell / gate
    // Lock state for the renderer on mount — with autostart the shell can come
    // up mid-bedtime or with the budget already spent, before any tick fires.
    'lp:shell:status': () => ({
      lock: currentLock(),
      timeLeftMin: parental.timeLeft(),
      windDown: parental.windDownStatus(),
      grace: parental.graceStatus(),
    }),
    // Parent override for the lock overlays. PIN verified HERE in main; the
    // renderer's PinGate check is just UX. Sets the matching override and
    // reports the new lock state.
    'lp:shell:unlock': (_e, pin) => {
      if (!parental.verifyPin(pin)) return { ok: false, reason: 'bad_pin' };
      if (parental.inBedtime()) bedtimeOverride = true;
      if (parental.timeLeft() <= 0) timeOverrideDay = dayKey();
      lastLock = currentLock(); // keep the ticker's edge detection in sync
      return { ok: true, lock: lastLock };
    },
    // Kid-controlled "Noch kurz" buffer: grant a few minutes to save, no PIN.
    // Refreshes the lock state + wind-down so the overlay/banner update at once.
    'lp:shell:grace': () => {
      const r = parental.grantGrace();
      if (r.ok) {
        lastLock = currentLock();
        emitLock(lastLock);
        emitTimeWarn();
      }
      return r;
    },
    'lp:pin:verify': (_e, pin) => parental.verifyPin(pin),
    'lp:pin:status': () => ({
      pinIsDefault: !!parental.getSettings().pinIsDefault,
      hasRecovery: parental.hasRecovery(),
    }),
    // Forgot-PIN escape: reset the PIN with the recovery code (no device wipe).
    // Child-accessible on purpose — the gate lives in the child shell — but it
    // demands the high-entropy recovery code, so it is not a bypass.
    'lp:pin:recover': (_e, code, newPin) => parental.resetPinWithRecovery(code, newPin),
    // The ONLY door from the child shell to the curator: PIN is verified in
    // main; on success the curator window opens as its own app surface.
    'lp:curator:open': (_e, pin) => {
      if (!parental.verifyPin(pin)) return { ok: false, reason: 'bad_pin' };
      createCuratorWindow();
      return { ok: true };
    },

    // session control — kill the active edge-xcloud session (child "Spiel beenden")
    'lp:session:kill': () => launcher.killActiveSession(),

    // shell utilities — open safe system folders and URLs
    'lp:shell:open-folder': (_e, pathKey) => {
      const { shell } = require('electron');
      const allowed = {
        documents: path.join(os.homedir(), 'Documents'),
        downloads: path.join(os.homedir(), 'Downloads'),
        desktop: path.join(os.homedir(), 'Desktop'),
        pictures: path.join(os.homedir(), 'Pictures'),
        music: path.join(os.homedir(), 'Music'),
        videos: path.join(os.homedir(), 'Videos'),
      };
      const target = allowed[String(pathKey).toLowerCase()];
      if (!target) return { ok: false, reason: 'not_allowed' };
      shell.openPath(target);
      return { ok: true };
    },
    'lp:shell:open-url': (_e, url) => {
      const { shell } = require('electron');
      const s = String(url || '');
      if (!s.startsWith('http://') && !s.startsWith('https://')) return { ok: false, reason: 'invalid_scheme' };
      shell.openExternal(s);
      return { ok: true };
    },

    // winget package management — learning/creative app install
    'lp:winget:check': () => winget.checkWinget(),
    'lp:winget:status': (_e, id) => winget.getStatus(id),
    'lp:winget:install': (_e, id) => {
      // Start install in background; push progress events to the renderer.
      winget.install(id, {
        onProgress: (p) => {
          if (win && !win.isDestroyed()) win.webContents.send('lp:event:winget-progress', p);
        },
      }).catch((e) => console.error('[launchpad] winget install failed:', e));
      return { ok: true, started: true };
    },
  };

  const curatorHandlers = {
    // full, unfiltered catalogue + edits — parent curator only
    'lp:games:list-all': () => registry.listGames(),
    'lp:games:upsert': mutating((_e, patch) => registry.upsert(patch)),
    'lp:games:remove': mutating((_e, id) => registry.remove(id)),
    'lp:games:reset': mutating(() => registry.reset()),
    'lp:games:cover': mutating(async (_e, id, source) => registry.setCover(id, await covers.localize(source))),

    // covers (SteamGridDB) — key resolved in main, never passed from renderer
    'lp:covers:search': (_e, q) => covers.searchCovers(q),
    'lp:covers:key-status': () => covers.keyStatus(),
    'lp:covers:set-key': (_e, key) => covers.setApiKey(key),

    // parental settings / diagnostics
    // Steam-family tools (wishlist + deals) — parent surface only. The deals
    // min-savings preference is resolved from parental settings in main.
    'lp:wishlist:list': () => wishlist.listItems(),
    'lp:wishlist:upsert': (_e, patch) => wishlist.upsertItem(patch),
    'lp:wishlist:remove': (_e, id) => wishlist.removeItem(id),
    'lp:wishlist:prices': () => wishlist.refreshPrices(),
    'lp:deals:top': () => wishlist.topDeals({ minSavings: parental.getSettings().dealsMinSavings }),

    'lp:pin:set': (_e, oldP, newP) => parental.setPin(oldP, newP),
    // Generate/replace the parent recovery code; returns the plaintext ONCE so
    // the curator can show it. Curator-only (sender-enforced).
    'lp:pin:recovery-generate': () => ({ ok: true, code: parental.regenerateRecovery() }),
    'lp:parental:get': () => parental.getSettings(),
    'lp:parental:set': mutating((_e, patch) => {
      const out = parental.setSettings(patch); // age rating affects the child list
      applyShellPrefs(); // kiosk/autostart take effect immediately
      return out;
    }),
    'lp:usage:today': () => parental.getUsageToday(),

    // internet updates (electron-updater) — parent surface
    'lp:update:state': () => updater.getState(),
    'lp:update:check': () => updater.check(),
    'lp:update:install': () => updater.installNow(),

    // Steam library import + USK auto-approval — parent surface
    'lp:steam:status': () => steamLib.credsStatus(),
    'lp:steam:set-creds': (_e, creds) => steamLib.setCreds(creds),
    'lp:steam:import': mutating(async () => {
      const r = await steamLib.fetchOwnedGames();
      if (!r.ok) return r;
      const sum = registry.importGames(r.games);
      return { ok: true, ...sum };
    }),
    'lp:steam:auto-approve': (_e, maxUsk) => {
      runUskAutoApprove(maxUsk).catch((e) => console.error('[launchpad] usk pass failed', e));
      return { ok: true, started: true };
    },
    'lp:steam:auto-approve-stop': () => { if (uskPass) uskPass.stop = true; return { ok: true }; },

    // Approve EVERY not-yet-approved game at once, regardless of USK rating —
    // the parent's call always overrides the rating (USK is advice, not a gate).
    'lp:games:approve-all': mutating(() => {
      const updates = {};
      for (const g of registry.listGames()) if (g.curation !== 'approved') updates[g.id] = { curation: 'approved' };
      return { ok: true, approved: registry.bulkPatch(updates) };
    }),
  };

  for (const [channel, fn] of Object.entries(childHandlers)) ipcMain.handle(channel, fn);
  for (const [channel, fn] of Object.entries(curatorHandlers)) {
    ipcMain.handle(channel, (e, ...args) => {
      if (!isCuratorSender(e)) return { ok: false, reason: 'forbidden' };
      return fn(e, ...args);
    });
  }
}

// ── single-instance lock ──
// The child shell is the persistent background "desktop": exactly one instance,
// always present and never minimized, so when a foreground game exits the OS
// falls back to LAUNCHPAD on its own (user-directed design). A second launch
// just refocuses the existing shell instead of stacking windows.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => { focusShell(); });

  app.on('before-quit', () => { quitting = true; });

  app.whenReady().then(() => {
    if (!isDev) Menu.setApplicationMenu(null); // no menu-bar reload/devtools/quit in prod
    registerIpc();
    applyShellPrefs(); // register/refresh autostart before any window exists
    startUsageTicker();

    // Weekly watchlist price refresh (background, non-blocking)
    const { maybeRefreshWatchlist } = require('./services/watchlistScheduler');
    maybeRefreshWatchlist();

    createWindow();
    updater.checkOnStartup(); // silent internet update check (packaged builds only)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
