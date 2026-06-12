// electron/services/wishlist.js — Steam-family wishlist + deals (CheapShark).
//
// The Steam-family tools adopted from the VENT product line, rebuilt natively
// for the Familienzentrale: a wishlist with per-entry target prices and a deal
// browser. CheapShark is a free, no-auth price API (storeID 1 = Steam), so
// there is no key to manage; prices are USD and shown as-is. Entries persist
// via electron-store; the network call is injectable (fetchImpl) so the logic
// is unit-testable offline, same pattern as covers.js.

const crypto = require('node:crypto');
const { getStore } = require('./store');

const API = 'https://www.cheapshark.com/api/1.0';
const STEAM_STORE_ID = '1';

// ── store ──

function listItems() {
  return getStore().get('wishlist') || [];
}

function saveItems(items) {
  getStore().set('wishlist', items);
  return items;
}

// Upsert by id; new entries get an id + timestamp. Only known fields are
// taken from the patch — the renderer never writes arbitrary keys.
function upsertItem(patch) {
  const p = patch || {};
  const clean = {
    title: String(p.title || '').trim(),
    steamAppId: String(p.steamAppId || '').replace(/[^0-9]/g, ''),
    targetPrice: Number.isFinite(+p.targetPrice) && +p.targetPrice > 0 ? +p.targetPrice : null,
    note: String(p.note || '').slice(0, 200),
  };
  const items = listItems();
  const existing = p.id && items.find((it) => it.id === p.id);
  if (existing) {
    Object.assign(existing, clean);
    return saveItems(items);
  }
  if (!clean.title) return items; // nothing to add
  items.push({ id: crypto.randomUUID(), addedAt: new Date().toISOString(), ...clean });
  return saveItems(items);
}

function removeItem(id) {
  return saveItems(listItems().filter((it) => it.id !== id));
}

// ── pure helpers (exported for tests) ──

// Price vs. target: 'under' = target hit, 'near' = within 15%, 'above' else.
function priceState(currentUsd, targetUsd) {
  const current = parseFloat(currentUsd);
  const target = parseFloat(targetUsd);
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return null;
  if (current <= target) return 'under';
  if (current <= target * 1.15) return 'near';
  return 'above';
}

function processDeal(d) {
  const savings = parseFloat(d.savings) || 0;
  return {
    steamAppId: d.steamAppID || '',
    title: d.title || '',
    salePrice: d.salePrice || '',
    normalPrice: d.normalPrice || '',
    savingsPercent: Math.round(savings),
    steamRatingPercent: d.steamRatingPercent || '',
    thumb: d.thumb || '',
    isOnSale: savings > 0,
  };
}

// ── network ──

// Top Steam deals, already filtered to the parent's min-savings preference.
async function topDeals(opts = {}) {
  const doFetch = opts.fetchImpl || globalThis.fetch;
  const minSavings = Number.isFinite(+opts.minSavings) ? +opts.minSavings : 30;
  const pageSize = Math.min(60, +opts.pageSize || 24);
  const url = `${API}/deals?storeID=${STEAM_STORE_ID}&pageSize=${pageSize}` +
    `&lowerPrice=0.01&sortBy=Savings&desc=1&onSale=1&minSavings=${minSavings}`;
  try {
    const res = await doFetch(url);
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, deals: [] };
    const raw = await res.json();
    return { ok: true, deals: (Array.isArray(raw) ? raw : []).map(processDeal) };
  } catch (e) {
    return { ok: false, reason: 'error', message: String((e && e.message) || e), deals: [] };
  }
}

// Current best Steam price for every wishlist entry that has a steamAppId,
// annotated with the target-price state. Entries without an appid pass
// through unpriced.
async function refreshPrices(opts = {}) {
  const doFetch = opts.fetchImpl || globalThis.fetch;
  const items = listItems();
  const priced = await Promise.all(items.map(async (it) => {
    if (!it.steamAppId) return { ...it, price: null, state: null };
    try {
      const res = await doFetch(`${API}/deals?storeID=${STEAM_STORE_ID}&steamAppID=${it.steamAppId}&pageSize=1`);
      if (!res.ok) return { ...it, price: null, state: null };
      const deals = await res.json();
      const d = Array.isArray(deals) && deals[0] ? processDeal(deals[0]) : null;
      if (!d) return { ...it, price: null, state: null };
      return { ...it, price: d, state: priceState(d.salePrice, it.targetPrice) };
    } catch (e) {
      return { ...it, price: null, state: null };
    }
  }));
  return { ok: true, items: priced };
}

module.exports = {
  listItems, upsertItem, removeItem,
  priceState, processDeal, topDeals, refreshPrices, API,
};
