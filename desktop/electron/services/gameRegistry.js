// electron/services/gameRegistry.js — the authoritative game registry (main).
//
// Default catalogue (SEED) + user edits layered on top, persisted via
// electron-store. This is the main-side home of the prototype's GameStore model:
//   - seed games are edited via per-id overrides (gamesOverrides)
//   - parent-added games live in gamesCustom
//   - "removing" a seed game hides it via an override flag (_hidden)
// The renderer reads/writes this only through the lp:games:* IPC channels.

const { getStore } = require('./store');
const { withCurationDefaults, childVisible, childOrder } = require('./curation');

// Seed catalogue — mirrors the prototype's js/data.jsx GAMES. M3: launch kind is
// inferred from `source` (Steam/Minecraft/LAUNCHPAD); Steam demos carry an `appid`.
const SEED = [
  { id: 'minecraft', name: 'Minecraft', cat: 'Sandbox', source: 'Minecraft', installed: true, favorite: true,
    featured: true, progress: 0.0, playtime: '48 Std', stars: 5, c1: '#3b8526', c2: '#0f3d1a', emblem: 'grid',
    launch: { kind: 'uri', uri: 'minecraft://' },
    desc: 'Bau, erkunde und überlebe in einer Welt aus Blöcken. Allein oder im Kreativmodus.' },
  { id: 'galaxy-racer', name: 'Galaxy Racer', cat: 'Rennen', source: 'Steam', installed: true, favorite: true,
    appid: '400', progress: 0.3, playtime: '9 Std', stars: 4, c1: '#a855f7', c2: '#1e1b4b', emblem: 'rocket',
    desc: 'Heize durch Neon-Nebel und überhole alle auf der Sternenbahn.' },
  { id: 'pixel-pirates', name: 'Pixel Pirates', cat: 'Abenteuer', source: 'Steam', installed: true,
    progress: 0.62, playtime: '21 Std', stars: 5, c1: '#0ea5e9', c2: '#0c2f6b', emblem: 'compass',
    desc: 'Segle über die Pixel-Meere, finde Schätze und löse Inselrätsel.' },
  { id: 'robo-lab', name: 'Robo Lab', cat: 'Logik', source: 'Scratch', installed: true, favorite: true,
    progress: 0.18, playtime: '4 Std', stars: 5, c1: '#f43f5e', c2: '#5b1418', emblem: 'flask',
    desc: 'Programmiere kleine Roboter und löse knifflige Tüftel-Aufgaben.' },
  { id: 'tower-forge', name: 'Tower Forge', cat: 'Aufbau', source: 'Steam', installed: false,
    progress: 0, playtime: '—', stars: 4, c1: '#22c55e', c2: '#064e3b', emblem: 'grid',
    desc: 'Türme bauen, verteidigen, erweitern. Strategie mit Stil.' },
  { id: 'animal-island', name: 'Animal Island', cat: 'Simulation', source: 'Steam', installed: true,
    appid: '413150', progress: 0.72, playtime: '33 Std', stars: 5, c1: '#34d399', c2: '#0c4a4a', emblem: 'leaf',
    desc: 'Kümmere dich um deine Insel voller Tiere und Freunde.' },
  { id: 'math-quest', name: 'Math Quest', cat: 'Lernspiel', source: 'LAUNCHPAD', installed: true,
    progress: 0.4, playtime: '6 Std', stars: 4, c1: '#f59e0b', c2: '#7c2d12', emblem: 'calc',
    desc: 'Rechen-Duelle gegen freundliche Monster — werde zum Zahlen-Helden.' },
  { id: 'puzzle-pop', name: 'Puzzle Pop', cat: 'Puzzle', source: 'LAUNCHPAD', installed: true,
    progress: 0.95, playtime: '14 Std', stars: 3, c1: '#fb923c', c2: '#7f1d4b', emblem: 'bolt',
    desc: 'Knall dich durch hunderte farbenfrohe Level.' },
  { id: 'word-wizards', name: 'Word Wizards', cat: 'Wort', source: 'LAUNCHPAD', installed: false,
    progress: 0, playtime: '—', stars: 4, c1: '#06b6d4', c2: '#0f5e5e', emblem: 'book',
    desc: 'Zaubere mit Buchstaben und werde zum Wort-Magier.' },
];

const seedIds = new Set(SEED.map((g) => g.id));
const isSeed = (id) => seedIds.has(id);

// Default age rating per game (others default to 6). A per-id override in the
// store wins over this. Drives the age filter applied in main's lp:games:list.
const MIN_AGE = { 'galaxy-racer': 9, 'pixel-pirates': 9, 'tower-forge': 9 };
const DEFAULT_MIN_AGE = 6;

function overrides() { return getStore().get('gamesOverrides') || {}; }
function customs() { return getStore().get('gamesCustom') || []; }

function merged() {
  const ov = overrides();
  const base = SEED.map((g) => ({ minAge: MIN_AGE[g.id] ?? DEFAULT_MIN_AGE, ...g, ...(ov[g.id] || {}) }));
  return base.concat(customs().map((c) => ({ minAge: DEFAULT_MIN_AGE, ...c })))
    .map(withCurationDefaults);
}

function listGames() {
  return merged().filter((g) => !g._hidden);
}

// The child shell's slice of the registry: approved-only, featured first,
// low-prominence last. The age filter is applied on top of this in main.
function listChildGames() {
  return listGames().filter(childVisible).sort(childOrder);
}

function getGame(id) {
  return listGames().find((g) => g.id === id) || null;
}

function patch(id, p) {
  if (isSeed(id)) {
    const ov = overrides();
    ov[id] = { ...(ov[id] || {}), ...p };
    getStore().set('gamesOverrides', ov);
  } else {
    const list = customs();
    const c = list.find((g) => g.id === id);
    if (c) {
      Object.assign(c, p);
      getStore().set('gamesCustom', list);
    }
  }
}

function setFavorite(id, value) { patch(id, { favorite: !!value }); return getGame(id); }
function install(id) { patch(id, { installed: true }); return getGame(id); }

// CoverSource: null | string (back-compat) | {kind:'url'|'dataUrl'|'gridDb', ...}
function setCover(id, source) {
  let cover = null;
  if (typeof source === 'string') cover = source;
  else if (source && source.kind === 'url') cover = source.url;
  else if (source && source.kind === 'dataUrl') cover = source.data;
  // gridDb resolution to a real URL happens in M5 (searchCovers); ignore for now.
  patch(id, { cover: cover || null });
  return getGame(id);
}

// add (no/new id) or edit (existing id) — parent only.
function upsert(p) {
  const data = p || {};
  const exists = data.id && (isSeed(data.id) || customs().some((c) => c.id === data.id));
  if (exists) {
    patch(data.id, data);
    return getGame(data.id);
  }
  const id = data.id || 'custom-' + Date.now();
  const list = customs();
  list.push({
    id, name: 'Neues Spiel', cat: 'Spiel', stars: 4, progress: 0,
    c1: '#475569', c2: '#0f172a', emblem: 'gamepad', _custom: true,
    // New entries start un-approved: nothing reaches the child shell without
    // a conscious decision in the curator ("Automation proposes. Parent curates.").
    curation: 'new', surfacing: 'normal',
    ...data, id,
  });
  getStore().set('gamesCustom', list);
  return getGame(id);
}

function remove(id) {
  if (isSeed(id)) patch(id, { _hidden: true });
  else getStore().set('gamesCustom', customs().filter((g) => g.id !== id));
}

function reset() {
  getStore().set('gamesOverrides', {});
  getStore().set('gamesCustom', []);
}

module.exports = {
  listGames, listChildGames, getGame, setFavorite, install, setCover, upsert, remove, reset,
};
