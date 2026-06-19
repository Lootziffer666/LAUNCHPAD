// Tests for the bedtime window logic (pure part of parental.js) and its
// failure classification. The store-backed parts (PIN, usage) need a running
// electron app and stay out of unit scope, like the rest of the suite.
// Exception: recovery code generation is pure crypto with no store dependency.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isInBedtime, generateRecoveryCode } = require('./parental.js');
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

// ── Recovery code tests ──

test('generateRecoveryCode returns a 14-char string in XXXX-XXXX-XXXX format', () => {
  const code = generateRecoveryCode();
  assert.equal(code.length, 14);
  assert.match(code, /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
});

test('generateRecoveryCode produces unique codes', () => {
  const codes = new Set();
  for (let i = 0; i < 50; i++) codes.add(generateRecoveryCode());
  // With 12 random chars from a 32-char alphabet, collisions are essentially impossible
  assert.equal(codes.size, 50);
});

test('generateRecoveryCode never contains ambiguous chars (I, O, 0, 1)', () => {
  for (let i = 0; i < 100; i++) {
    const code = generateRecoveryCode();
    assert.equal(code.includes('I'), false);
    assert.equal(code.includes('O'), false);
    assert.equal(code.includes('0'), false);
    assert.equal(code.includes('1'), false);
  }
});

// Store-backed recovery tests: these use the real electron-store (persists to
// disk under the test process userData), which is fine for a CI/test run.
test('resetPinWithRecovery works with correct code and fails with wrong code', () => {
  const { newRecoveryCode, resetPinWithRecovery, verifyPin, setPin } = require('./parental.js');

  // Generate a recovery code (stores its hash)
  const code = newRecoveryCode();
  assert.equal(code.length, 14);

  // Wrong code fails gracefully
  const badResult = resetPinWithRecovery('AAAA-BBBB-CCCC', '9999');
  assert.equal(badResult, null);

  // Correct code resets the PIN and returns a new recovery code
  const freshCode = resetPinWithRecovery(code, '5678');
  assert.notEqual(freshCode, null);
  assert.equal(freshCode.length, 14);
  assert.notEqual(freshCode, code); // new code differs from old

  // The new PIN works
  assert.equal(verifyPin('5678'), true);
  assert.equal(verifyPin('1234'), false);
});

test('resetPinWithRecovery rejects short new PINs', () => {
  const { newRecoveryCode, resetPinWithRecovery } = require('./parental.js');
  const code = newRecoveryCode();
  const result = resetPinWithRecovery(code, '12'); // too short
  assert.equal(result, null);
});

test('recoveryStatus reports whether recovery is configured', () => {
  const { recoveryStatus } = require('./parental.js');
  const status = recoveryStatus();
  assert.equal(typeof status.configured, 'boolean');
  assert.equal(typeof status.pinIsDefault, 'boolean');
  // After the previous tests, recovery should be configured
  assert.equal(status.configured, true);
});
