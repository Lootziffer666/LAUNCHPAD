/* ============================================================
   LAUNCHPAD — GameStore (the data seam), now backed by IPC.
   Reads/writes go through window.launchpad.* (handled in main by
   electron/services/gameRegistry.js, persisted via electron-store).
   The public surface (GameStore, useGames, gameCover) is unchanged from
   M1, so no other renderer file changes. Mutations are fire-and-forget:
   they call IPC, then refetch and notify subscribers to re-render.
   ============================================================ */
import React from 'react';
import { CometData } from '../lib/data.js';

const api = (typeof window !== 'undefined' && window.launchpad) || null;

let cache = [];
let loaded = false;
const subs = new Set();
const notify = () => subs.forEach((f) => f());

async function refresh() {
  if (!api) { loaded = true; notify(); return; }
  try {
    // child bridge → child-filtered list; curator bridge → full catalogue
    cache = await (api.listGames ? api.listGames() : api.listAllGames());
  } catch (e) {
    cache = [];
  }
  loaded = true;
  notify();
}

// Prime the cache as soon as this module loads, and refetch whenever main
// broadcasts a change — edits in the curator window show up in the child
// shell immediately (and vice versa).
refresh();
if (api && api.onGamesChanged) api.onGamesChanged(() => refresh());

// The prototype passed setCover a raw string (URL or data-URL) or null. Map it
// to the IPC CoverSource shape; keep null as "clear".
function coverSource(url) {
  if (url == null) return null;
  return String(url).startsWith('data:') ? { kind: 'dataUrl', data: url } : { kind: 'url', url };
}

export const GameStore = {
  visible() { return cache; },
  isLoaded() { return loaded; },
  async setCover(id, url) { if (!api) return; await api.setCover(id, coverSource(url)); await refresh(); },
  async setField(id, k, v) { if (!api) return; await api.upsertGame({ id, [k]: v }); await refresh(); },
  async toggleFavorite(id) {
    if (!api) return;
    const g = cache.find((x) => x.id === id);
    await api.setFavorite(id, !(g && g.favorite));
    await refresh();
  },
  async install(id) { if (!api) return; await api.installGame(id); await refresh(); },
  async addGame() {
    if (!api) return null;
    const g = await api.upsertGame({});
    await refresh();
    return g && g.id;
  },
  async remove(id) { if (!api) return; await api.removeGame(id); await refresh(); },
  async reset() { if (!api) return; await api.resetGames(); await refresh(); },
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
};

// React hook: re-render on store change, returns the current visible games.
export function useGames() {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const off = GameStore.subscribe(() => force((n) => n + 1));
    if (loaded) force((n) => n + 1); // catch a load that resolved before mount
    return off;
  }, []);
  return cache;
}

// Parent manager view: the full, unfiltered catalogue (age filter does not
// apply here). Refetches whenever the store changes.
export function useAllGames() {
  const [all, setAll] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    const load = () => {
      if (api && api.listAllGames) api.listAllGames().then((g) => alive && setAll(g)).catch(() => {});
    };
    load();
    const off = GameStore.subscribe(load);
    return () => { alive = false; off(); };
  }, []);
  return all;
}

// background style for a cover (image overrides duotone key-art)
export function gameCover(g, ang) {
  if (g && g.cover) return { backgroundImage: `url("${g.cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' };
  if (!g) return { background: '#1e293b' }; // neutral while data loads
  return { background: CometData.cover(g.c1, g.c2, ang || 145) };
}

export default GameStore;
