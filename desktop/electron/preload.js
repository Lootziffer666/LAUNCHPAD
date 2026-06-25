// electron/preload.js — the CHILD bridge between renderer and Node.
// Exposes a frozen, allow-listed window.launchpad. No nodeIntegration anywhere.
//
// Two-app split (handoff/WINDOWS-PLAN-ADOPTION.md): the child shell gets the
// child surface ONLY — list/launch/install/favorite plus the PIN gate and the
// one door to the parent curator window. Everything parental (upsert, remove,
// covers, settings) lives in preload-curator.js, and main additionally
// enforces those channels per-sender, so this bridge is defense-in-depth,
// not the only line.

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

// main → renderer event subscription helper (returns an unsubscribe fn)
function on(channel, cb) {
  const listener = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('launchpad', {
  // games — child view (approved-only + age-filtered + surfacing-sorted in main)
  listGames: () => invoke('lp:games:list'),
  getGame: (id) => invoke('lp:games:get', id),
  launchGame: (id) => invoke('lp:games:launch', id),
  installGame: (id) => invoke('lp:games:install', id),
  setFavorite: (id, v) => invoke('lp:games:favorite', id, v),

  // shell / gate
  shellStatus: () => invoke('lp:shell:status'), // { lock, timeLeftMin, windDown, grace }
  shellUnlock: (pin) => invoke('lp:shell:unlock', pin), // parent override; PIN re-verified in main
  requestGrace: () => invoke('lp:shell:grace'), // kid "Noch kurz" buffer — no PIN
  verifyPin: (pin) => invoke('lp:pin:verify', pin),
  pinStatus: () => invoke('lp:pin:status'),
  recoverPin: (code, newPin) => invoke('lp:pin:recover', code, newPin),
  openCurator: (pin) => invoke('lp:curator:open', pin), // PIN re-verified in main

  // session control
  killSession: () => invoke('lp:session:kill'),

  // winget package management
  wingetCheck: () => invoke('lp:winget:check'),
  wingetStatus: (id) => invoke('lp:winget:status', id),
  wingetInstall: (id) => invoke('lp:winget:install', id),

  // shell utilities — open system folders and URLs
  openFolder: (pathKey) => invoke('lp:shell:open-folder', pathKey),
  openUrl: (url) => invoke('lp:shell:open-url', url),

  // events
  onGameClosed: (cb) => on('lp:event:game-closed', cb),
  onLockChanged: (cb) => on('lp:event:lock', cb), // payload: 'bedtime'|'timeup'|null
  onTimeWarn: (cb) => on('lp:event:timewarn', cb), // payload: { enabled, warnAt, persistFromMin, minutesLeft }
  onGamesChanged: (cb) => on('lp:event:games-changed', cb),
  onWingetProgress: (cb) => on('lp:event:winget-progress', cb),
});
