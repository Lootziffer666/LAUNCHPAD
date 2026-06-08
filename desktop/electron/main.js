// electron/main.js — main process (M0 scaffold).
//
// Responsibilities now: open ONE locked-down window and load the renderer.
// The allow-listed lp:* IPC handlers + services (gameRegistry / launcher / parental)
// land in M2 — see handoff/IPC-CONTRACT.md and the marker below.
//
// Security guardrails here are non-negotiable from day one (handoff/SCOPE-GUARD.md §4):
// contextIsolation + sandbox on, nodeIntegration off, no new windows, no off-app nav.

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = !app.isPackaged;
const DEV_URL = process.env.LP_DEV_URL || 'http://localhost:5173';
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0a1538',
    show: false,
    // kiosk: !isDev,        // ← hard cage for deployment (opt-in, wired in M4 / ARCHITECTURE.md)
    // fullscreen: !isDev,
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

  // IPC handlers are registered once in app.whenReady() (registerIpc), not here.

  maybeCaptureForVerification();
}

// Headless verification hook (dev/CI only): when LP_SHOT is set, screenshot to
// that path and quit. LP_DRIVE optionally holds a JS snippet (run in the
// renderer) to click into a shell/overlay first, so each surface can be proven
// in one run. Never runs in normal use.
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
      app.exit(0); // immediate, clean exit for CI (avoids xvfb graceful-shutdown crash)
    }
  });
}

// ── IPC: one allow-listed channel→handler map. ipcMain.handle answers ONLY
// these channels; any other invoke rejects with "no handler" (scope-guard §4).
// Every id arg is resolved against the registry in main — renderer paths are
// never trusted. Required here in whenReady so electron-store sees userData.
function registerIpc() {
  const registry = require('./services/gameRegistry');
  const handlers = {
    'lp:games:list': () => registry.listGames(),
    'lp:games:get': (_e, id) => registry.getGame(id),
    'lp:games:install': (_e, id) => registry.install(id),
    'lp:games:favorite': (_e, id, v) => registry.setFavorite(id, v),
    'lp:games:cover': (_e, id, source) => registry.setCover(id, source),
    'lp:games:upsert': (_e, patch) => registry.upsert(patch),
    'lp:games:remove': (_e, id) => registry.remove(id),
    'lp:games:reset': () => registry.reset(),
    // M3 wires real launching (steam:// / uri / exe / uwp) + guardrails.
    'lp:games:launch': () => ({ ok: false, reason: 'error', message: 'Spielstart kommt in M3.' }),
  };
  for (const [channel, fn] of Object.entries(handlers)) ipcMain.handle(channel, fn);
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
