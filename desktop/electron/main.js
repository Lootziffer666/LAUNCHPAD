// electron/main.js — main process.
//
// Opens ONE locked-down window, loads the renderer, and answers the allow-listed
// lp:* IPC channels (games via gameRegistry, PIN/settings/usage via parental).
//
// Security guardrails are non-negotiable (handoff/SCOPE-GUARD.md §4): contextIsolation
// + sandbox on, nodeIntegration off, no new windows, no off-app nav, and in prod no
// reload/devtools/close accelerators and no application menu. Soft cage (maximized) by
// default; hard cage (kiosk) via LP_KIOSK=1 for deployment.

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = !app.isPackaged;
const DEV_URL = process.env.LP_DEV_URL || 'http://localhost:5173';
const HARD_KIOSK = process.env.LP_KIOSK === '1';

// Usage ticker knobs (env-overridable so CI can exercise the time-limit fast).
const USAGE_TICK_MS = parseInt(process.env.LP_USAGE_TICK_MS, 10) || 60000;
const USAGE_TICK_MIN = parseInt(process.env.LP_USAGE_TICK_MIN, 10) || 1;

let win;
let registry;
let parental;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0a1538',
    show: false,
    kiosk: HARD_KIOSK, // hard cage for deployment (LP_KIOSK=1)
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
    if (!HARD_KIOSK) win.maximize(); // soft cage: full-screen-ish single window
    console.log('[launchpad] window ready-to-show');
  });

  if (isDev) {
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // ── shell lockdown: no popups, no navigating away from our own app ──
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => {
    const allowed = url.startsWith(DEV_URL) || url.startsWith('file://');
    if (!allowed) e.preventDefault();
  });

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

// Headless verification hook (dev/CI only): LP_SHOT screenshots to a path, LP_DRIVE
// runs a renderer JS snippet first (and its return value is logged). Never runs
// in normal use. app.exit(0) sidesteps an xvfb graceful-shutdown crash.
function maybeCaptureForVerification() {
  const shotPath = process.env.LP_SHOT;
  const drive = process.env.LP_DRIVE;
  if (!shotPath && !drive) return;
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  win.webContents.once('did-finish-load', async () => {
    try {
      await sleep(900); // let layout/paint settle
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

// Accrue foreground time; when the daily limit is reached, tell the renderer to
// lock back to a safe LAUNCHPAD screen. (A future pass can scope this to the
// child shell / active use only.)
function startUsageTicker() {
  setInterval(() => {
    parental.addUsage(USAGE_TICK_MIN);
    if (parental.timeLeft() <= 0) emitTimeLimit();
  }, USAGE_TICK_MS);
}

// ── IPC: one allow-listed channel→handler map. ipcMain.handle answers ONLY
// these channels; any other invoke rejects (scope-guard §4). Every id arg is
// resolved in main — renderer paths are never trusted.
function registerIpc() {
  registry = require('./services/gameRegistry');
  parental = require('./services/parental');

  const handlers = {
    // games — child list is age-filtered server-side; the parent manager gets all.
    'lp:games:list': () => registry.listGames().filter(parental.ageAllows),
    'lp:games:list-all': () => registry.listGames(),
    'lp:games:get': (_e, id) => registry.getGame(id),
    'lp:games:install': (_e, id) => registry.install(id),
    'lp:games:favorite': (_e, id, v) => registry.setFavorite(id, v),
    'lp:games:cover': (_e, id, source) => registry.setCover(id, source),
    'lp:games:upsert': (_e, patch) => registry.upsert(patch),
    'lp:games:remove': (_e, id) => registry.remove(id),
    'lp:games:reset': () => registry.reset(),
    // Launch gate is enforced now; the real OS spawn lands in M3 (needs Windows).
    'lp:games:launch': (_e, id) => {
      const gate = parental.canLaunch(registry.getGame(id));
      if (!gate.ok) return gate;
      return { ok: false, reason: 'error', message: 'Spielstart kommt in M3.' };
    },

    // shell / parental
    'lp:pin:verify': (_e, pin) => parental.verifyPin(pin),
    'lp:pin:set': (_e, oldP, newP) => parental.setPin(oldP, newP),
    'lp:parental:get': () => parental.getSettings(),
    'lp:parental:set': (_e, patch) => parental.setSettings(patch),
    'lp:usage:today': () => parental.getUsageToday(),
  };
  for (const [channel, fn] of Object.entries(handlers)) ipcMain.handle(channel, fn);
}

app.whenReady().then(() => {
  if (!isDev) Menu.setApplicationMenu(null); // no menu-bar reload/devtools/quit in prod
  registerIpc();
  startUsageTicker();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
