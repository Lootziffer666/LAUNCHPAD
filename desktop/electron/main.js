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

const isDev = !app.isPackaged;
const DEV_URL = process.env.LP_DEV_URL || 'http://localhost:5173';
const HARD_KIOSK = process.env.LP_KIOSK === '1';

// Usage ticker knobs (env-overridable so CI can exercise the time-limit fast).
const USAGE_TICK_MS = parseInt(process.env.LP_USAGE_TICK_MS, 10) || 60000;
const USAGE_TICK_MIN = parseInt(process.env.LP_USAGE_TICK_MIN, 10) || 1;

let win; // child shell window
let curatorWin = null; // parent curator window (created on demand)
let registry;
let parental;
let launcher;
let covers;

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
  if (!isDev) app.setLoginItemSettings({ openAtLogin: prefs.autostart });
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
        (mod && k === 'r') ||
        (mod && k === 'w') ||
        (mod && k === 'q') ||
        (mod && input.shift && (k === 'i' || k === 'c' || k === 'j'));
      if (blocked) e.preventDefault();
    });
  }

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

function emitTimeLimit() {
  if (win && !win.isDestroyed()) win.webContents.send('lp:event:time-limit');
}

// Any data mutation → both windows refetch, so a curator edit shows up in the
// child shell immediately (and vice versa for install/favorite).
function emitGamesChanged() {
  for (const w of [win, curatorWin]) {
    if (w && !w.isDestroyed()) w.webContents.send('lp:event:games-changed');
  }
}

// Accrue foreground time; when the daily limit is reached, tell the renderer to
// lock back to a safe LAUNCHPAD screen. (A future pass can scope this to the
// child shell / active use only.)
//
// Bedtime rides the same ticker: on every tick we check the window and emit
// transitions BOTH ways — the shell locks when bedtime starts and unlocks on
// its own in the morning. While bedtime is active the shell is locked anyway,
// so the tick does not burn the daily budget (a PC left on overnight would
// otherwise wake up with no time left).
function startUsageTicker() {
  let wasBedtime = parental.inBedtime();
  setInterval(() => {
    const bed = parental.inBedtime();
    if (bed !== wasBedtime) {
      wasBedtime = bed;
      if (win && !win.isDestroyed()) win.webContents.send('lp:event:bedtime', bed);
    }
    if (bed) return;
    parental.addUsage(USAGE_TICK_MIN);
    if (parental.timeLeft() <= 0) emitTimeLimit();
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
      const gate = parental.canLaunch(game);
      if (!gate.ok) return { ...gate, errorClass: launcher.classifyFailure(gate.reason) };
      if (process.env.LP_LAUNCH_DRYRUN === '1') return { ok: true, dryRun: true, plan: launcher.resolveLaunch(game) };
      return launcher.launchGame(game);
    },

    // shell / gate
    // Lock state for the renderer on mount — with autostart the shell can come
    // up mid-bedtime or with the budget already spent, before any tick fires.
    'lp:shell:status': () => ({ inBedtime: parental.inBedtime(), timeLeftMin: parental.timeLeft() }),
    'lp:pin:verify': (_e, pin) => parental.verifyPin(pin),
    'lp:pin:status': () => ({ pinIsDefault: !!parental.getSettings().pinIsDefault }),
    // The ONLY door from the child shell to the curator: PIN is verified in
    // main; on success the curator window opens as its own app surface.
    'lp:curator:open': (_e, pin) => {
      if (!parental.verifyPin(pin)) return { ok: false, reason: 'bad_pin' };
      createCuratorWindow();
      return { ok: true };
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
    'lp:pin:set': (_e, oldP, newP) => parental.setPin(oldP, newP),
    'lp:parental:get': () => parental.getSettings(),
    'lp:parental:set': mutating((_e, patch) => {
      const out = parental.setSettings(patch); // age rating affects the child list
      applyShellPrefs(); // kiosk/autostart take effect immediately
      return out;
    }),
    'lp:usage:today': () => parental.getUsageToday(),
  };

  for (const [channel, fn] of Object.entries(childHandlers)) ipcMain.handle(channel, fn);
  for (const [channel, fn] of Object.entries(curatorHandlers)) {
    ipcMain.handle(channel, (e, ...args) => {
      if (!isCuratorSender(e)) return { ok: false, reason: 'forbidden' };
      return fn(e, ...args);
    });
  }
}

app.whenReady().then(() => {
  if (!isDev) Menu.setApplicationMenu(null); // no menu-bar reload/devtools/quit in prod
  registerIpc();
  applyShellPrefs(); // register/refresh autostart before any window exists
  startUsageTicker();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
