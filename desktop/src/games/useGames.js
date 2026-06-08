/* ============================================================
   LAUNCHPAD — GameStore (the data seam)
   Merges base games (CometData.GAMES) with user overrides
   (cover image, title, category) persisted in localStorage.
   Covers can be a SteamGridDB URL or a dropped data-URL.

   M2: re-back this on window.launchpad.* (IPC) — the public surface
   (GameStore, useGames, gameCover) stays identical so no caller changes.
   ============================================================ */
import React from 'react';
import { CometData } from '../lib/data.js';

const GS_KEY = 'comet.games.v2';

function gsLoad() {
  try {
    return JSON.parse(localStorage.getItem(GS_KEY)) || { ov: {}, custom: [] };
  } catch (e) {
    return { ov: {}, custom: [] };
  }
}
let gsState = gsLoad();
const gsSubs = new Set();

function gsPersist() {
  try {
    localStorage.setItem(GS_KEY, JSON.stringify(gsState));
  } catch (e) {
    /* ignore */
  }
  gsSubs.forEach((f) => f());
}
function gsBase() { return CometData.GAMES || []; }
function gsIsBase(id) { return gsBase().some((g) => g.id === id); }

function gsPatch(id, p) {
  if (gsIsBase(id)) gsState.ov[id] = { ...(gsState.ov[id] || {}), ...p };
  else { const c = gsState.custom.find((g) => g.id === id); if (c) Object.assign(c, p); }
  gsPersist();
}

export const GameStore = {
  merged() {
    const list = gsBase().map((g) => ({ ...g, ...(gsState.ov[g.id] || {}) }));
    return list.concat(gsState.custom.map((c) => ({ ...c })));
  },
  setCover(id, url) { gsPatch(id, { cover: url || null }); },
  setField(id, k, v) { gsPatch(id, { [k]: v }); },
  toggleFavorite(id) { const g = this.merged().find((x) => x.id === id); gsPatch(id, { favorite: !(g && g.favorite) }); },
  install(id) { gsPatch(id, { installed: true }); },
  addGame() {
    const id = 'custom-' + Date.now();
    gsState.custom.push({ id, name: 'Neues Spiel', cat: 'Spiel', stars: 4, progress: 0,
      c1: '#475569', c2: '#0f172a', emblem: 'gamepad', _custom: true });
    gsPersist();
    return id;
  },
  remove(id) {
    if (gsIsBase(id)) { gsState.ov[id] = { ...(gsState.ov[id] || {}), _hidden: true }; }
    else { gsState.custom = gsState.custom.filter((g) => g.id !== id); }
    gsPersist();
  },
  restore(id) { if (gsState.ov[id]) { delete gsState.ov[id]._hidden; gsPersist(); } },
  reset() { gsState = { ov: {}, custom: [] }; gsPersist(); },
  visible() { return this.merged().filter((g) => !g._hidden); },
  subscribe(fn) { gsSubs.add(fn); return () => gsSubs.delete(fn); },
};

// React hook: re-render on store change, returns visible games
export function useGames() {
  const [, force] = React.useState(0);
  React.useEffect(() => GameStore.subscribe(() => force((n) => n + 1)), []);
  return GameStore.visible();
}

// background style for a cover (image overrides duotone key-art)
export function gameCover(g, ang) {
  if (g && g.cover) return { backgroundImage: `url("${g.cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { background: CometData.cover(g.c1, g.c2, ang || 145) };
}

export default GameStore;
