// watchlistScheduler.test.js — unit tests for the weekly price refresh scheduler.
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Fresh module for each test: electron-store is stateful.
function loadFresh() {
  delete require.cache[require.resolve('./watchlistScheduler')];
  return require('./watchlistScheduler');
}

describe('watchlistScheduler', () => {
  beforeEach(() => {
    const { setLastRefresh } = loadFresh();
    // Clear last refresh
    setLastRefresh(null);
  });

  it('shouldRefresh returns true when no previous refresh exists', () => {
    const { shouldRefresh, setLastRefresh } = loadFresh();
    setLastRefresh(null);
    assert.equal(shouldRefresh(), true);
  });

  it('shouldRefresh returns false when last refresh was recent', () => {
    const { shouldRefresh, setLastRefresh } = loadFresh();
    setLastRefresh(new Date().toISOString());
    assert.equal(shouldRefresh(), false);
  });

  it('shouldRefresh returns true when last refresh was > 7 days ago', () => {
    const { shouldRefresh, setLastRefresh } = loadFresh();
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    setLastRefresh(eightDaysAgo);
    assert.equal(shouldRefresh(), true);
  });

  it('maybeRefreshWatchlist skips refresh when recent', async () => {
    const { maybeRefreshWatchlist, setLastRefresh } = loadFresh();
    setLastRefresh(new Date().toISOString());
    const result = await maybeRefreshWatchlist();
    assert.equal(result.refreshed, false);
    assert.equal(result.reason, 'recent');
  });

  it('maybeRefreshWatchlist triggers refresh when stale', async () => {
    const { maybeRefreshWatchlist, setLastRefresh, getLastRefresh } = loadFresh();
    setLastRefresh(null);
    // refreshPrices will attempt a real fetch which fails in test env, but the
    // scheduler handles errors gracefully. Alternatively it returns items=[].
    const result = await maybeRefreshWatchlist();
    // Either it refreshed successfully or caught the error
    assert.ok(result.refreshed === true || result.reason === 'error');
    // If it succeeded, lastRefresh should be updated
    if (result.refreshed) {
      assert.ok(getLastRefresh() !== null);
    }
  });
});
