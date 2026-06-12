// Tests for the wishlist/deals service — pure helpers + network paths with an
// injected fetch (no real network, no store: topDeals doesn't touch it).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { priceState, processDeal, topDeals } = require('./wishlist.js');

test('priceState: under / near (≤ +15%) / above / invalid', () => {
  assert.equal(priceState('19.99', 20), 'under');
  assert.equal(priceState('20.00', 20), 'under'); // inclusive
  assert.equal(priceState('22.99', 20), 'near'); // within 15%
  assert.equal(priceState('23.01', 20), 'above');
  assert.equal(priceState('10.00', 0), null); // no target set
  assert.equal(priceState('abc', 20), null);
  assert.equal(priceState('10.00', null), null);
});

test('processDeal maps the CheapShark shape and rounds savings', () => {
  const d = processDeal({
    steamAppID: '1091500', title: 'Cyberpunk 2077', salePrice: '19.99',
    normalPrice: '59.99', savings: '66.672779', steamRatingPercent: '86',
    thumb: 'https://x/y.jpg',
  });
  assert.equal(d.steamAppId, '1091500');
  assert.equal(d.savingsPercent, 67);
  assert.equal(d.isOnSale, true);
  const free = processDeal({ title: 'X', savings: '0.0' });
  assert.equal(free.isOnSale, false);
});

test('topDeals: builds the filter query and maps results', async () => {
  let calledUrl = null;
  const fetchImpl = async (url) => {
    calledUrl = url;
    return { ok: true, json: async () => [{ title: 'A', savings: '50', steamAppID: '1' }] };
  };
  const out = await topDeals({ minSavings: 50, pageSize: 10, fetchImpl });
  assert.equal(out.ok, true);
  assert.equal(out.deals.length, 1);
  assert.equal(out.deals[0].savingsPercent, 50);
  assert.match(calledUrl, /minSavings=50/);
  assert.match(calledUrl, /pageSize=10/);
  assert.match(calledUrl, /storeID=1/);
});

test('topDeals: http error and thrown fetch are reported, never thrown', async () => {
  const bad = await topDeals({ fetchImpl: async () => ({ ok: false, status: 503 }) });
  assert.equal(bad.ok, false);
  assert.equal(bad.reason, 'http_503');
  const thrown = await topDeals({ fetchImpl: async () => { throw new Error('offline'); } });
  assert.equal(thrown.ok, false);
  assert.equal(thrown.reason, 'error');
});
