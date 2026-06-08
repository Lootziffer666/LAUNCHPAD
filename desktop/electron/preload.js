// electron/preload.js — the ONLY bridge between renderer and Node.
// Exposes a frozen, allow-listed window.launchpad. No nodeIntegration anywhere.
//
// The functions are the agreed contract (handoff/IPC-CONTRACT.md). The matching
// lp:* handlers are registered in main.js starting M2; until then these resolve
// only once their handler exists — the renderer uses seed data through M1.

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

// main → renderer event subscription helper (returns an unsubscribe fn)
function on(channel, cb) {
  const listener = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('launchpad', {
  // games
  listGames: () => invoke('lp:games:list'),
  getGame: (id) => invoke('lp:games:get', id),
  launchGame: (id) => invoke('lp:games:launch', id),
  installGame: (id) => invoke('lp:games:install', id),
  setFavorite: (id, v) => invoke('lp:games:favorite', id, v),
  setCover: (id, source) => invoke('lp:games:cover', id, source),
  upsertGame: (patch) => invoke('lp:games:upsert', patch),
  removeGame: (id) => invoke('lp:games:remove', id),
  resetGames: () => invoke('lp:games:reset'),

  // covers
  searchCovers: (q) => invoke('lp:covers:search', q),

  // shell / session
  verifyPin: (pin) => invoke('lp:pin:verify', pin),
  setPin: (oldP, newP) => invoke('lp:pin:set', oldP, newP),
  getProfile: () => invoke('lp:profile:get'),

  // parental
  getParentalSettings: () => invoke('lp:parental:get'),
  setParentalSettings: (patch) => invoke('lp:parental:set', patch),
  getUsageToday: () => invoke('lp:usage:today'),

  // system (read-only chrome)
  getSystemInfo: () => invoke('lp:system:info'),

  // events
  onGameClosed: (cb) => on('lp:event:game-closed', cb),
  onTimeLimitReached: (cb) => on('lp:event:time-limit', cb),
});
