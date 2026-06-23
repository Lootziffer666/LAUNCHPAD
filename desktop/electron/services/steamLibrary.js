// electron/services/steamLibrary.js — import an owned Steam library by SteamID.
//
// Reads the parent's owned games from the Steam Web API (GetOwnedGames) and maps
// each to a catalogue entry (source Steam, launch steam://rungameid/<appid>).
// A second, throttled pass reads each title's USK age rating from the public
// store appdetails endpoint so games can be auto-approved by age — the answer
// to "I have 2000+ f2p games, don't make me approve them one by one".
//
// The network calls take an injectable fetch (like covers.js / wishlist.js) so
// the pure mapping + parsing are unit-tested without a key or a network. Keys
// (Web API key + SteamID) live in main via electron-store, never in the renderer.

const { getStore } = require('./store');

const OWNED = 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/';
const APPDETAILS = 'https://store.steampowered.com/api/appdetails';

function getCreds() {
  const s = getStore().get('steam') || {};
  return {
    apiKey: process.env.STEAM_WEB_API_KEY || s.apiKey || '',
    steamId: s.steamId || '',
  };
}

function setCreds({ apiKey, steamId } = {}) {
  const cur = getStore().get('steam') || {};
  const next = { ...cur };
  if (apiKey != null) next.apiKey = String(apiKey).trim();
  if (steamId != null) next.steamId = String(steamId).trim();
  getStore().set('steam', next);
  return credsStatus();
}

function credsStatus() {
  const { apiKey, steamId } = getCreds();
  return { hasKey: !!apiKey, hasSteamId: /^\d{17}$/.test(steamId), steamId };
}

// Pure: one owned-game record → a LAUNCHPAD catalogue entry. New imports start
// un-approved ('new') so nothing reaches the child before an age/curation
// decision. A deterministic id keeps re-imports idempotent.
function mapOwnedGame(g) {
  const appid = String((g && g.appid) != null ? g.appid : '').trim();
  return {
    id: `steam-${appid}`,
    name: (g && g.name) || `Steam-Spiel ${appid}`,
    source: 'Steam',
    appid,
    launch: { kind: 'steam', appid },
    installed: true,
    cat: 'Spiel',
    stars: 4,
    emblem: 'gamepad',
    c1: '#1b2838',
    c2: '#0e1a26',
    playtimeMin: (g && g.playtime_forever) || 0,
    curation: 'new',
    surfacing: 'normal',
    pinned: false,
  };
}

async function fetchOwnedGames(opts = {}) {
  const doFetch = opts.fetchImpl || globalThis.fetch;
  const apiKey = opts.apiKey || getCreds().apiKey;
  const steamId = opts.steamId || getCreds().steamId;
  if (!apiKey) return { ok: false, reason: 'no_key' };
  if (!/^\d{17}$/.test(String(steamId || ''))) return { ok: false, reason: 'bad_steamid' };
  const url = `${OWNED}?key=${encodeURIComponent(apiKey)}&steamid=${steamId}`
    + '&include_appinfo=1&include_played_free_games=1&format=json';
  try {
    const res = await doFetch(url);
    if (res.status === 401 || res.status === 403) return { ok: false, reason: 'unauthorized' };
    if (!res.ok) return { ok: false, reason: 'http', status: res.status };
    const json = await res.json();
    const list = (json && json.response && json.response.games) || [];
    return { ok: true, total: list.length, games: list.map(mapOwnedGame) };
  } catch (e) {
    return { ok: false, reason: 'error', message: String((e && e.message) || e) };
  }
}

// Pure: pull the USK rating (0/6/12/16/18) out of an appdetails response.
// Falls back to required_age. Returns a number or null when unknown.
function parseUsk(json, appid) {
  const node = json && json[String(appid)];
  if (!node || !node.success || !node.data) return null;
  const d = node.data;
  const usk = d.ratings && d.ratings.usk && d.ratings.usk.rating;
  if (usk != null && usk !== '') {
    const n = parseInt(usk, 10);
    if (Number.isFinite(n)) return n;
  }
  const req = parseInt(d.required_age, 10);
  return Number.isFinite(req) ? req : null;
}

async function fetchUsk(appid, opts = {}) {
  const doFetch = opts.fetchImpl || globalThis.fetch;
  try {
    const res = await doFetch(`${APPDETAILS}?appids=${appid}&l=german`);
    if (!res.ok) return null;
    const json = await res.json();
    return parseUsk(json, appid);
  } catch (e) {
    return null;
  }
}

// Pure rule: auto-approve a game when its USK rating is known and at/under the
// parent's threshold (e.g. 6 → approve USK 0 and 6, review everything above).
function shouldAutoApprove(usk, maxUsk) {
  return usk != null && maxUsk != null && Number.isFinite(usk) && usk <= maxUsk;
}

module.exports = {
  getCreds, setCreds, credsStatus,
  mapOwnedGame, fetchOwnedGames, parseUsk, fetchUsk, shouldAutoApprove,
  OWNED, APPDETAILS,
};
