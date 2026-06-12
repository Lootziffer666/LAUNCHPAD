// Tests for the bedtime window logic (pure part of parental.js) and its
// failure classification. The store-backed parts (PIN, usage) need a running
// electron app and stay out of unit scope, like the rest of the suite.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isInBedtime } = require('./parental.js');
const { classifyFailure } = require('./launcher.js');

const at = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2026, 5, 12, h, m);
};

test('overnight window (20:30→07:00) wraps midnight', () => {
  const bed = { from: '20:30', to: '07:00' };
  assert.equal(isInBedtime(bed, at('20:29')), false);
  assert.equal(isInBedtime(bed, at('20:30')), true); // inclusive start
  assert.equal(isInBedtime(bed, at('23:59')), true);
  assert.equal(isInBedtime(bed, at('00:00')), true);
  assert.equal(isInBedtime(bed, at('06:59')), true);
  assert.equal(isInBedtime(bed, at('07:00')), false); // exclusive end
  assert.equal(isInBedtime(bed, at('12:00')), false);
});

test('same-day window (13:00→15:00) does not wrap', () => {
  const bed = { from: '13:00', to: '15:00' };
  assert.equal(isInBedtime(bed, at('12:59')), false);
  assert.equal(isInBedtime(bed, at('13:00')), true);
  assert.equal(isInBedtime(bed, at('14:59')), true);
  assert.equal(isInBedtime(bed, at('15:00')), false);
});

test('zero-length or missing window is disabled', () => {
  assert.equal(isInBedtime({ from: '20:00', to: '20:00' }, at('20:00')), false);
  assert.equal(isInBedtime(null, at('03:00')), false);
  assert.equal(isInBedtime({}, at('03:00')), false);
  assert.equal(isInBedtime({ from: '20:00' }, at('22:00')), false);
});

test('bedtime launch refusal classes as blocked (calm screen, no retry)', () => {
  assert.equal(classifyFailure('bedtime'), 'blocked');
});
