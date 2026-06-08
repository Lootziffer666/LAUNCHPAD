// electron/main.js — main process stub
// Wires the window, the allow-listed IPC, and game launching.
// Copy into the target project (see PROJECT-STRUCTURE.md). Stubs marked TODO.

const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('node:path');

const isDev = !app.isPackaged;
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0a1538',
    show: false,
    // kiosk: !isDev,          // ← enable for the "hard cage" deployment (ARCHITECTURE.md)
    // fullscreen: !isDev,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
    },
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL('http://localhost:5173');           // Vite dev server
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // ── lock the shell down: no new windows, no external navigation ──
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('http://localhost:5173') && !url.startsWith('file://')) e.preventDefault();
  });
}

// ── services (implement under electron/services/) ──
const registry = require('./services/gameRegistry'); // listGames, getGame, upsert, remove, setField
const launcher = require('./services/launcher');      // launchGame(game)
const parental = require('./services/parental');      // verifyPin, setPin, getSettings, setSettings, usage

// ── IPC: single allow-listed map (channel → handler) ──
const handlers = {
  'lp:games:list':        ()            => registry.listGames(),
  'lp:games:get':         (_e, id)      => registry.getGame(id),
  'lp:games:launch':      async (_e, id) => {
    const game = await registry.getGame(id);
    if (!game) return { ok: false, reason: 'not_found' };
    if (!game.installed) return { ok: false, reason: 'not_installed' };
    const gate = await parental.canLaunch(game);          // age rating, approvals, time limit
    if (!gate.ok) return gate;
    return launcher.launchGame(game);
  },
  'lp:games:install':     (_e, id)            => registry.install(id),
  'lp:games:favorite':    (_e, id, v)         => registry.setField(id, 'favorite', v),
  'lp:games:cover':       (_e, id, source)    => registry.setCover(id, source),
  'lp:games:upsert':      (_e, patch)         => registry.upsert(patch),
  'lp:games:remove':      (_e, id)            => registry.remove(id),

  'lp:covers:search':     (_e, q)             => registry.searchCovers(q), // SteamGridDB in main

  'lp:pin:verify':        (_e, pin)           => parental.verifyPin(pin),
  'lp:pin:set':           (_e, oldP, newP)    => parental.setPin(oldP, newP),
  'lp:profile:get':       ()                  => registry.getProfile(),

  'lp:parental:get':      ()                  => parental.getSettings(),
  'lp:parental:set':      (_e, patch)         => parental.setSettings(patch),
  'lp:usage:today':       ()                  => parental.getUsageToday(),

  'lp:system:info':       ()                  => ({ online: true, volume: 70 }), // TODO real values
};

app.whenReady().then(() => {
  for (const [channel, fn] of Object.entries(handlers)) ipcMain.handle(channel, fn);

  // notify renderer when a launched game process exits
  launcher.onClosed((id) => win && win.webContents.send('lp:event:game-closed', id));
  parental.onTimeLimit(() => win && win.webContents.send('lp:event:time-limit'));

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
