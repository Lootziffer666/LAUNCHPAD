// Tests for the curation model (approval vs. surfacing vs. containment).
// Pure module — runs anywhere via: npm test (node --test).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  CURATION_STATES, SURFACING_LEVELS, CONTAINMENT_LEVELS,
  withCurationDefaults, childVisible, childOrder,
} = require('./curation.js');

test('pre-curation entries default to approved/normal/unknown (back-compat)', () => {
  const g = withCurationDefaults({ id: 'x', name: 'X' });
  assert.equal(g.curation, 'approved');
  assert.equal(g.surfacing, 'normal');
  assert.equal(g.containment, 'unknown');
  assert.deepEqual(g.tags, []);
  assert.equal(g.parentWarning, null);
});

test('legacy featured flag maps to surfacing=featured (and back)', () => {
  const g = withCurationDefaults({ id: 'x', featured: true });
  assert.equal(g.surfacing, 'featured');
  assert.equal(g.featured, true);
  // explicit surfacing wins over the legacy flag and re-derives `featured`
  const h = withCurationDefaults({ id: 'y', featured: true, surfacing: 'low' });
  assert.equal(h.surfacing, 'low');
  assert.equal(h.featured, false);
});

test('invalid values are normalized, valid ones pass through', () => {
  const g = withCurationDefaults({ curation: 'banana', surfacing: 'loud', containment: 'none' });
  assert.equal(g.curation, 'approved');
  assert.equal(g.surfacing, 'normal');
  assert.equal(g.containment, 'unknown');
  for (const c of CURATION_STATES) assert.equal(withCurationDefaults({ curation: c }).curation, c);
  for (const s of SURFACING_LEVELS) assert.equal(withCurationDefaults({ surfacing: s }).surfacing, s);
  for (const c of CONTAINMENT_LEVELS) assert.equal(withCurationDefaults({ containment: c }).containment, c);
});

test('withCurationDefaults tolerates null/undefined input', () => {
  assert.equal(withCurationDefaults(null), null);
  assert.equal(withCurationDefaults(undefined), undefined);
});

test('only approved games are child-visible', () => {
  for (const c of CURATION_STATES) {
    const g = withCurationDefaults({ curation: c });
    assert.equal(childVisible(g), c === 'approved', `curation=${c}`);
  }
  assert.equal(childVisible(null), false);
});

test('blank parentWarning normalizes to null, real text survives', () => {
  assert.equal(withCurationDefaults({ parentWarning: '  ' }).parentWarning, null);
  assert.equal(
    withCurationDefaults({ parentWarning: 'Moduswechsel möglich' }).parentWarning,
    'Moduswechsel möglich',
  );
});

test('child order: featured first, low prominence last, stable in between', () => {
  const games = [
    { id: 'a', surfacing: 'low' },
    { id: 'b', surfacing: 'normal' },
    { id: 'c', surfacing: 'featured' },
    { id: 'd', surfacing: 'normal' },
  ].map(withCurationDefaults);
  const sorted = games.slice().sort(childOrder).map((g) => g.id);
  assert.deepEqual(sorted, ['c', 'b', 'd', 'a']);
});
