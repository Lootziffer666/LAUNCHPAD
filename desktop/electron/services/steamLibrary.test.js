// Tests for the pure Steam-library layer (mapping + USK parsing + auto-approve
// rule). Network calls take an injected fetch so we exercise the success and
// failure shapes without a real Steam key. The live calls (real owned games +
// appdetails throttling) are smoke-tested with the parent's key at runtime.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  mapOwnedGame, fetchOwnedGames, parseUsk, shouldAutoApprove,
} = require('./steamLibrary.js');

test('mapOwnedGame → deterministic Steam catalogue entry (un-approved)', () => {
  const e = mapOwnedGame({ appid: 570, name: 'Dota 2', playtime_forever: 120 });
  assert.equal(e.id, 'steam-570');
  assert.equal(e.name, 'Dota 2');
  assert.equal(e.source, 'Steam');
  assert.deepEqual(e.launch, { kind: 'steam', appid: '570' });
  assert.equal(e.curation, 'new'); // never auto-visible before a decision
  assert.equal(e.pinned, false);
  assert.equal(e.playtimeMin, 120);
});

test('fetchOwnedGames: guards missing key and malformed SteamID', async () => {
  assert.equal((await fetchOwnedGames({ steamId: '76561198000000000' })).reason, 'no_key');
  assert.equal((await fetchOwnedGames({ apiKey: 'K', steamId: '123' })).reason, 'bad_steamid');
});

test('fetchOwnedGames: maps the API response shape', async () => {
  const fetchImpl = async () => ({
    ok: true, status: 200,
    json: async () => ({ response: { game_count: 2, games: [
      { appid: 440, name: 'Team Fortress 2', playtime_forever: 10 },
      { appid: 570, name: 'Dota 2' },
    ] } }),
  });
  const r = await fetchOwnedGames({ apiKey: 'K', steamId: '76561198000000000', fetchImpl });
  assert.equal(r.ok, true);
  assert.equal(r.total, 2);
  assert.equal(r.games[0].id, 'steam-440');
  assert.equal(r.games[1].name, 'Dota 2');
});

test('fetchOwnedGames: http + unauthorized + thrown fetch are reported, never thrown', async () => {
  assert.equal((await fetchOwnedGames({ apiKey: 'K', steamId: '7'.repeat(17), fetchImpl: async () => ({ ok: false, status: 403 }) })).reason, 'unauthorized');
  assert.equal((await fetchOwnedGames({ apiKey: 'K', steamId: '7'.repeat(17), fetchImpl: async () => ({ ok: false, status: 500 }) })).reason, 'http');
  assert.equal((await fetchOwnedGames({ apiKey: 'K', steamId: '7'.repeat(17), fetchImpl: async () => { throw new Error('net'); } })).reason, 'error');
});

test('parseUsk: reads ratings.usk.rating, falls back to required_age, else null', () => {
  assert.equal(parseUsk({ 440: { success: true, data: { ratings: { usk: { rating: '0' } } } } }, 440), 0);
  assert.equal(parseUsk({ 570: { success: true, data: { ratings: { usk: { rating: '16' } } } } }, 570), 16);
  assert.equal(parseUsk({ 10: { success: true, data: { required_age: 18 } } }, 10), 18);
  assert.equal(parseUsk({ 10: { success: true, data: {} } }, 10), null);
  assert.equal(parseUsk({ 10: { success: false } }, 10), null);
  assert.equal(parseUsk({}, 10), null);
});

test('shouldAutoApprove: only known ratings at/under the threshold', () => {
  assert.equal(shouldAutoApprove(0, 6), true);
  assert.equal(shouldAutoApprove(6, 6), true);
  assert.equal(shouldAutoApprove(12, 6), false);
  assert.equal(shouldAutoApprove(null, 6), false); // unknown → never auto-approve
  assert.equal(shouldAutoApprove(0, null), false); // feature off → never
});
