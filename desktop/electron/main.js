// electron/main.js — main process (M0 scaffold).
//
// Responsibilities now: open ONE locked-down window and load the renderer.
// The allow-listed lp:* IPC handlers + services (gameRegistry / launcher / parental)
// land in M2 — see handoff/IPC-CONTRACT.md and the marker below.
//
// Security guardrails here are non-negotiable from day one (handoff/SCOPE-GUARD.md §4):
// contextIsolation + sandbox on, nodeIntegration off, no new windows, no off-app nav.

const { app, BrowserWindow } = require('electron');
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

  // ── M2: register the allow-listed lp:* IPC handler map here ──
  // for (const [channel, fn] of Object.entries(handlers)) ipcMain.handle(channel, fn);

  maybeCaptureForVerification();
}

// Headless verification hook (dev/CI only): when LP_SHOT is set, screenshot the
// first paint to that path and quit. Never runs in normal use.
function maybeCaptureForVerification() {
  const shotPath = process.env.LP_SHOT;
  if (!shotPath) return;
  win.webContents.once('did-finish-load', async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 900)); // let layout/paint settle
      const image = await win.webContents.capturePage();
      fs.writeFileSync(shotPath, image.toPNG());
      console.log('[launchpad] verification shot saved -> ' + shotPath);
    } catch (err) {
      console.error('[launchpad] verification shot failed', err);
    } finally {
      app.quit();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
