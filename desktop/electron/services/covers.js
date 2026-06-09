// electron/services/covers.js — SteamGridDB cover search.
//
// searchCovers(query) finds the best-matching game (autocomplete) then returns
// its cover grids. The API key comes from STEAMGRIDDB_API_KEY (CI/testing) or
// the key the parent saved in-app (electron-store) — never hardcoded. The
// network call + parsing are injectable (apiKey, fetchImpl) so the logic is
// unit-testable without a key or a network.
//
// Kid-safety: nsfw grids are filtered out both via the request (nsfw=false) and
// defensively on the response.

const { getStore } = require('./store');

const API = 'https://www.steamgriddb.com/api/v2';

function getApiKey() {
  // env wins (so CI/tests can inject one); else the parent's saved key.
  return process.env.STEAMGRIDDB_API_KEY || (getStore().get('covers') || {}).apiKey || '';
}

function setApiKey(key) {
  const next = { ...(getStore().get('covers') || {}), apiKey: String(key || '').trim() };
  getStore().set('covers', next);
  return keyStatus();
}

function keyStatus() {
  return { hasKey: !!getApiKey(), fromEnv: !!process.env.STEAMGRIDDB_API_KEY };
}

async function searchCovers(query, opts = {}) {
  const apiKey = opts.apiKey || getApiKey();
  const doFetch = opts.fetchImpl || globalThis.fetch;
  const q = String(query || '').trim();
  if (!apiKey) return { ok: false, reason: 'no_key', results: [] };
  if (!q) return { ok: true, results: [], game: null };

  const headers = { Authorization: `Bearer ${apiKey}` };
  try {
    // 1) resolve the query to a game id
    const sRes = await doFetch(`${API}/search/autocomplete/${encodeURIComponent(q)}`, { headers });
    if (sRes.status === 401 || sRes.status === 403) return { ok: false, reason: 'unauthorized', results: [] };
    const sJson = await sRes.json();
    const games = (sJson && sJson.data) || [];
    if (!games.length) return { ok: true, results: [], game: null };
    const game = games[0];

    // 2) fetch that game's cover grids (static, non-nsfw)
    const gRes = await doFetch(`${API}/grids/game/${game.id}?types=static&nsfw=false&limit=24`, { headers });
    const gJson = await gRes.json();
    const grids = (gJson && gJson.data) || [];
    const results = grids
      .filter((x) => x && x.url && !x.nsfw)
      .slice(0, 18)
      .map((x) => ({ thumb: x.thumb || x.url, url: x.url, w: x.width, h: x.height, author: (x.author && x.author.name) || '' }));
    return { ok: true, game: { id: game.id, name: game.name }, results };
  } catch (e) {
    return { ok: false, reason: 'error', message: String((e && e.message) || e), results: [] };
  }
}

// Turn an http(s) cover URL into a self-contained data: URI by downloading it in
// main (the renderer is sandboxed and offline). Keeps covers working offline and
// rendering under a tight CSP. data:/blob:/empty pass through; on any failure we
// fall back to the original URL (img-src https: covers that case).
async function localize(source, opts = {}) {
  const doFetch = opts.fetchImpl || globalThis.fetch;
  // Accept a raw string OR the IPC CoverSource shape ({kind:'url'|'dataUrl'}).
  const s = typeof source === 'string' ? source
    : source && source.kind === 'url' ? source.url
      : source && source.kind === 'dataUrl' ? source.data
        : String(source || '');
  if (!/^https?:\/\//i.test(s)) return s;
  try {
    const res = await doFetch(s);
    if (!res.ok) return s;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = (res.headers && res.headers.get && res.headers.get('content-type')) || 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch (e) {
    return s;
  }
}

module.exports = { searchCovers, getApiKey, setApiKey, keyStatus, localize, API };
