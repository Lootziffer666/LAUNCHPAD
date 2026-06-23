// electron/services/updater.js — internet auto-update via electron-updater.
//
// Wraps electron-updater behind a tiny, crash-proof surface so the rest of the
// app never has to care whether updates are even possible here:
//   - In dev (not packaged) every call is a friendly no-op ({reason:'dev'}).
//   - If electron-updater can't load or isn't configured, we degrade quietly.
//   - Packaged builds check on launch, download in the background, and install
//     on quit (autoInstallOnAppQuit). The parent can also "check now" and
//     "install now" from the Familienzentrale.
//
// Update feed config lives in package.json build.publish (GitHub releases).
// No code-signing cert yet — electron-updater still works with unsigned NSIS;
// the only cost is the Windows SmartScreen prompt at install time.

const { app } = require('electron');

let autoUpdater = null;
let loadFailed = false;
let notify = () => {};

let state = {
  status: 'idle', // idle|checking|available|downloading|downloaded|current|error|dev
  version: null, // currently running version
  latest: null, // available/downloaded version
  progress: null, // 0..100 while downloading
  error: null,
};

function set(patch) {
  state = { ...state, ...patch };
  try { notify(state); } catch (e) { /* never let a renderer hiccup break main */ }
}

function currentVersion() {
  try { return app.getVersion(); } catch (e) { return null; }
}

function available() {
  // Updates only mean something for a packaged build with a real version.
  return !!(app && app.isPackaged) && !loadFailed;
}

function load() {
  if (autoUpdater || loadFailed) return autoUpdater;
  try {
    ({ autoUpdater } = require('electron-updater'));
    autoUpdater.autoDownload = true; // pull updates in the background
    autoUpdater.autoInstallOnAppQuit = true; // apply on next quit/restart
    autoUpdater.on('checking-for-update', () => set({ status: 'checking', error: null }));
    autoUpdater.on('update-available', (info) => set({ status: 'available', latest: info && info.version }));
    autoUpdater.on('update-not-available', () => set({ status: 'current' }));
    autoUpdater.on('download-progress', (p) => set({ status: 'downloading', progress: Math.round((p && p.percent) || 0) }));
    autoUpdater.on('update-downloaded', (info) => set({ status: 'downloaded', latest: info && info.version, progress: 100 }));
    autoUpdater.on('error', (err) => set({ status: 'error', error: String((err && err.message) || err) }));
  } catch (e) {
    loadFailed = true;
    autoUpdater = null;
  }
  return autoUpdater;
}

// Wire the channel that pushes state to the curator window. Call once from main.
function init(sender) {
  notify = typeof sender === 'function' ? sender : () => {};
  set({ version: currentVersion() });
}

// Silent check on launch (packaged only). Errors are swallowed into state.
function checkOnStartup() {
  if (!available()) { set({ status: 'dev', version: currentVersion() }); return; }
  const u = load();
  if (!u) { set({ status: 'idle' }); return; }
  u.checkForUpdates().catch((e) => set({ status: 'error', error: String((e && e.message) || e) }));
}

// Parent-triggered check. Returns a structured result (never throws).
async function check() {
  if (!available()) return { ok: false, reason: 'dev', state };
  const u = load();
  if (!u) return { ok: false, reason: 'unavailable', state };
  try {
    await u.checkForUpdates();
    return { ok: true, state };
  } catch (e) {
    set({ status: 'error', error: String((e && e.message) || e) });
    return { ok: false, reason: 'error', state };
  }
}

// Restart into the freshly downloaded update. Safe no-op unless one is ready.
function installNow() {
  if (!available() || !autoUpdater || state.status !== 'downloaded') {
    return { ok: false, reason: 'not_ready', state };
  }
  try {
    autoUpdater.quitAndInstall();
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'error', error: String((e && e.message) || e) };
  }
}

function getState() {
  if (!state.version) state.version = currentVersion();
  return state;
}

module.exports = { init, checkOnStartup, check, installNow, getState, available };
