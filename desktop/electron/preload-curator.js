// electron/preload-curator.js — the PARENT CURATOR bridge.
// Same security posture as the child bridge (contextIsolation + sandbox, one
// frozen allow-listed window.launchpad), but with the full curation surface:
// catalogue edits, curation states, covers, parental settings, usage. Main
// only answers these channels when the call comes from the curator window.

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

function on(channel, cb) {
  const listener = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

contextBridge.exposeInMainWorld('launchpad', {
  // catalogue — full, unfiltered (curation states, containment, tags included)
  listAllGames: () => invoke('lp:games:list-all'),
  upsertGame: (patch) => invoke('lp:games:upsert', patch),
  removeGame: (id) => invoke('lp:games:remove', id),
  resetGames: () => invoke('lp:games:reset'),
  setCover: (id, source) => invoke('lp:games:cover', id, source),

  // covers (SteamGridDB) — key resolved in main, never passed from renderer
  searchCovers: (q) => invoke('lp:covers:search', q),
  coversKeyStatus: () => invoke('lp:covers:key-status'),
  setCoversKey: (key) => invoke('lp:covers:set-key', key),

  // Steam-family tools: wishlist with target prices + deal browser (CheapShark)
  listWishlist: () => invoke('lp:wishlist:list'),
  upsertWishlist: (patch) => invoke('lp:wishlist:upsert', patch),
  removeWishlist: (id) => invoke('lp:wishlist:remove', id),
  refreshWishlistPrices: () => invoke('lp:wishlist:prices'),
  topDeals: () => invoke('lp:deals:top'),

  // parental settings / PIN / usage
  setPin: (oldP, newP) => invoke('lp:pin:set', oldP, newP),
  generateRecoveryCode: () => invoke('lp:pin:recovery-generate'),
  getParentalSettings: () => invoke('lp:parental:get'),
  setParentalSettings: (patch) => invoke('lp:parental:set', patch),
  getUsageToday: () => invoke('lp:usage:today'),

  // internet updates (electron-updater)
  updateState: () => invoke('lp:update:state'),
  checkForUpdate: () => invoke('lp:update:check'),
  installUpdate: () => invoke('lp:update:install'),

  // events
  onGamesChanged: (cb) => on('lp:event:games-changed', cb),
  onUpdate: (cb) => on('lp:event:update', cb),
});
