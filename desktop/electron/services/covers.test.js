// Tests for the SteamGridDB cover client. fetch + key are injected, so these
// run with no network and no key. Live integration is verified separately
// (an Electron drive with STEAMGRIDDB_API_KEY set).
//
// Run with: npm test

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { searchCovers, localize } = require('./covers.js');

const json = (status, body) => ({ status, json: async () => body });

function fakeFetch(routes) {
  const calls = [];
  const fn = async (url, opts) => {
    calls.push({ url, opts });
    for (const [needle, resp] of routes) if (url.includes(needle)) return resp;
    return json(404, {});
  };
  fn.calls = calls;
  return fn;
}

test('no key → no_key, nothing fetched', async () => {
  let fetched = false;
  const r = await searchCovers('minecraft', { apiKey: '', fetchImpl: async () => { fetched = true; return json(200, {}); } });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'no_key');
  assert.equal(fetched, false);
});

test('empty query → empty results, no fetch', async () => {
  const f = fakeFetch([]);
  const r = await searchCovers('   ', { apiKey: 'k', fetchImpl: f });
  assert.deepEqual(r, { ok: true, results: [], game: null });
  assert.equal(f.calls.length, 0);
});

test('happy path: resolve game → filtered grids, Bearer header on both calls', async () => {
  const f = fakeFetch([
    ['/search/autocomplete/', json(200, { data: [{ id: 42, name: 'Minecraft' }] })],
    ['/grids/game/42', json(200, { data: [
      { url: 'https://cdn/a.png', thumb: 'https://cdn/a.jpg', width: 600, height: 900, nsfw: false, author: { name: 'Lukalot' } },
      { url: 'https://cdn/bad.png', thumb: 'https://cdn/bad.jpg', nsfw: true, author: { name: 'x' } }, // nsfw → dropped
      { url: '', thumb: '', nsfw: false }, // no url → dropped
    ] })],
  ]);
  const r = await searchCovers('minecraft', { apiKey: 'secret', fetchImpl: f });
  assert.equal(r.ok, true);
  assert.deepEqual(r.game, { id: 42, name: 'Minecraft' });
  assert.equal(r.results.length, 1);
  assert.deepEqual(r.results[0], { thumb: 'https://cdn/a.jpg', url: 'https://cdn/a.png', w: 600, h: 900, author: 'Lukalot' });
  assert.equal(f.calls[0].opts.headers.Authorization, 'Bearer secret');
  assert.equal(f.calls[1].opts.headers.Authorization, 'Bearer secret');
  assert.match(f.calls[1].url, /nsfw=false/);
});

test('query is URL-encoded', async () => {
  const f = fakeFetch([
    ['/search/autocomplete/', json(200, { data: [{ id: 1, name: 'X' }] })],
    ['/grids/game/1', json(200, { data: [] })],
  ]);
  await searchCovers('super mario & co', { apiKey: 'k', fetchImpl: f });
  assert.match(f.calls[0].url, /autocomplete\/super%20mario%20%26%20co$/);
});

test('401 → unauthorized', async () => {
  const f = fakeFetch([['/search/autocomplete/', json(401, {})]]);
  const r = await searchCovers('x', { apiKey: 'bad', fetchImpl: f });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'unauthorized');
});

test('no game match → empty results', async () => {
  const f = fakeFetch([['/search/autocomplete/', json(200, { data: [] })]]);
  const r = await searchCovers('zzzz', { apiKey: 'k', fetchImpl: f });
  assert.deepEqual(r, { ok: true, results: [], game: null });
});

test('network throw → error result, not a crash', async () => {
  const r = await searchCovers('x', { apiKey: 'k', fetchImpl: async () => { throw new Error('boom'); } });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'error');
  assert.match(r.message, /boom/);
});

test('localize: http(s) image → data URI with the right mime', async () => {
  const fetchImpl = async () => ({
    ok: true,
    arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
    headers: { get: () => 'image/jpeg' },
  });
  const out = await localize('https://cdn2.steamgriddb.com/grid/x.jpg', { fetchImpl });
  assert.match(out, /^data:image\/jpeg;base64,/);
  assert.equal(out, 'data:image/jpeg;base64,' + Buffer.from([1, 2, 3, 4]).toString('base64'));
});

test('localize: data/blob/empty pass through unchanged (no fetch)', async () => {
  let fetched = false;
  const fetchImpl = async () => { fetched = true; return { ok: true }; };
  assert.equal(await localize('data:image/png;base64,AAAA', { fetchImpl }), 'data:image/png;base64,AAAA');
  assert.equal(await localize('', { fetchImpl }), '');
  assert.equal(await localize(null, { fetchImpl }), '');
  assert.equal(fetched, false);
});

test('localize: fetch failure falls back to the original url', async () => {
  const out = await localize('https://cdn/x.png', { fetchImpl: async () => { throw new Error('net'); } });
  assert.equal(out, 'https://cdn/x.png');
  const out2 = await localize('https://cdn/y.png', { fetchImpl: async () => ({ ok: false }) });
  assert.equal(out2, 'https://cdn/y.png');
});

test('localize: accepts the CoverSource shape from the renderer', async () => {
  const fetchImpl = async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([9]).buffer, headers: { get: () => 'image/png' } });
  // {kind:'url'} → downloaded to data URI
  const a = await localize({ kind: 'url', url: 'https://cdn/x.png' }, { fetchImpl });
  assert.match(a, /^data:image\/png;base64,/);
  // {kind:'dataUrl'} → passes straight through, no fetch
  let fetched = false;
  const b = await localize({ kind: 'dataUrl', data: 'data:image/png;base64,QQ' }, { fetchImpl: async () => { fetched = true; return {}; } });
  assert.equal(b, 'data:image/png;base64,QQ');
  assert.equal(fetched, false);
});
