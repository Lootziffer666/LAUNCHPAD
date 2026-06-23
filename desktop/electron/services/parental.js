// electron/services/parental.js — PIN (hashed), parental settings, usage, gates.
//
// PIN is hashed with Node's built-in scrypt (salt + timing-safe compare); the
// raw PIN is never stored or logged. On first run the store seeds the demo PIN
// "1234" (already hashed) so the cage works out of the box — the parent changes
// it via setPin. Settings/usage persist via electron-store. getSettings never
// leaks pinHash; it exposes a boolean pinSet instead.

const crypto = require('node:crypto');
const { getStore } = require('./store');
const { childVisible } = require('./curation');

const DEFAULTS = {
  pinHash: null, // "salt:hash" (hex); null until seeded
  pinIsDefault: true, // true while still the seeded demo PIN; false once changed
  recoveryHash: null, // "salt:hash" of the parent recovery code; null until generated
  ageRating: '9', // "6" | "9" | "12" — filters visible games
  dailyLimitMin: 90,
  bedtime: { from: '20:30', to: '07:00' },
  approvals: { browser: true, videos: true, music: true, play: true, friends: false },
  kiosk: false, // hard cage: child shell runs as an unescapable kiosk window
  autostart: true, // launch the shell when the OS profile logs in (packaged builds)
  modules: { wishlist: true, deals: true }, // Familienzentrale pages, individually disableable
  dealsMinSavings: 30, // Angebote page: only show deals with at least this discount (%)
  usage: {}, // { 'YYYY-MM-DD': minutesUsed }
};

const SCRYPT_LEN = 32;

function raw() { return { ...DEFAULTS, ...(getStore().get('parental') || {}) }; }
function save(patch) {
  const next = { ...raw(), ...patch };
  getStore().set('parental', next);
  return next;
}

function hashPin(pin, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(pin), s, SCRYPT_LEN).toString('hex');
  return `${s}:${h}`;
}

// Pure constant-time compare of a "salt:hash" record against a raw value.
// Shared by PIN and recovery-code verification; no store access, so unit-testable.
function verifyHash(stored, rawValue) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const cand = crypto.scryptSync(String(rawValue), salt, SCRYPT_LEN).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(cand, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Lazily seed the demo PIN on first access so verifyPin works immediately.
function ensureSeeded() {
  if (!raw().pinHash) save({ pinHash: hashPin('1234') });
}

function verifyPin(pin) {
  ensureSeeded();
  return verifyHash(raw().pinHash, String(pin));
}

function setPin(oldPin, newPin) {
  ensureSeeded();
  if (!verifyPin(oldPin)) return false;
  if (!newPin || String(newPin).length < 4) return false;
  save({ pinHash: hashPin(newPin), pinIsDefault: false });
  return true;
}

// ── PIN recovery (forgot-PIN escape that doesn't wipe the device) ──
// A recovery code is a high-entropy string the parent records once. We store
// only its hash (same scheme as the PIN). If the PIN is forgotten, the code
// resets it — without resetting settings or needing to delete the data store.
const RECOVERY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I/L
const RECOVERY_GROUPS = 4;
const RECOVERY_GROUP_LEN = 4;

function formatRecoveryCode(raw) {
  // Normalize for comparison: uppercase, strip anything outside the alphabet.
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    .replace(/[O]/g, '0').replace(/[IL]/g, '1'); // forgiving: O→0, I/L→1 won't matter — alphabet excludes them, kept for paranoia
}

function generateRecoveryPlain() {
  const groups = [];
  for (let g = 0; g < RECOVERY_GROUPS; g++) {
    let s = '';
    for (let i = 0; i < RECOVERY_GROUP_LEN; i++) {
      s += RECOVERY_ALPHABET[crypto.randomInt(RECOVERY_ALPHABET.length)];
    }
    groups.push(s);
  }
  return groups.join('-'); // e.g. "K7HM-9FRT-2WQX-PB48"
}

// Create (or replace) the recovery code. Returns the PLAINTEXT once — the only
// time it is ever available — so the curator can show it to the parent.
function regenerateRecovery() {
  const plain = generateRecoveryPlain();
  save({ recoveryHash: hashPin(formatRecoveryCode(plain)) });
  return plain;
}

function hasRecovery() { return !!raw().recoveryHash; }

function verifyRecovery(code) {
  return verifyHash(raw().recoveryHash, formatRecoveryCode(code));
}

// Reset the PIN using the recovery code. On success a FRESH recovery code is
// issued (the used one is invalidated) and returned so the parent can record
// the new one. Returns { ok, recovery? } | { ok:false, reason }.
function resetPinWithRecovery(code, newPin) {
  if (!hasRecovery()) return { ok: false, reason: 'no_recovery' };
  if (!verifyRecovery(code)) return { ok: false, reason: 'bad_code' };
  if (!newPin || String(newPin).length < 4) return { ok: false, reason: 'bad_pin' };
  save({ pinHash: hashPin(newPin), pinIsDefault: false });
  const recovery = regenerateRecovery();
  return { ok: true, recovery };
}

// Public settings — never leak pinHash; expose pinSet instead.
function getSettings() {
  ensureSeeded();
  const { pinHash, recoveryHash, ...rest } = raw();
  return { ...rest, pinSet: !!pinHash, hasRecovery: !!recoveryHash };
}

function setSettings(patch) {
  const allowed = ['ageRating', 'dailyLimitMin', 'bedtime', 'approvals', 'kiosk', 'autostart', 'modules', 'dealsMinSavings'];
  const clean = {};
  for (const k of allowed) if (patch && k in patch) clean[k] = patch[k];
  const { pinHash, recoveryHash, ...rest } = save(clean);
  return { ...rest, pinSet: !!pinHash, hasRecovery: !!recoveryHash };
}

function todayKey() { return new Date().toISOString().slice(0, 10); }

function getUsageToday() {
  const s = raw();
  return { usedMin: (s.usage && s.usage[todayKey()]) || 0, limitMin: s.dailyLimitMin };
}

function addUsage(minutes) {
  const s = raw();
  const usage = { ...(s.usage || {}) };
  usage[todayKey()] = (usage[todayKey()] || 0) + minutes;
  save({ usage });
  return getUsageToday();
}

// ── bedtime ──
// Pure window check (exported for tests). "20:30"→"07:00" wraps midnight;
// from === to means the window is disabled.
function isInBedtime(bedtime, now = new Date()) {
  if (!bedtime || !bedtime.from || !bedtime.to || bedtime.from === bedtime.to) return false;
  const minutes = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map((n) => parseInt(n, 10));
    return (h || 0) * 60 + (m || 0);
  };
  const t = now.getHours() * 60 + now.getMinutes();
  const from = minutes(bedtime.from);
  const to = minutes(bedtime.to);
  return from < to ? t >= from && t < to : t >= from || t < to;
}

function inBedtime() { return isInBedtime(raw().bedtime); }

// ── launch gates (used by M3's launchGame) ──
function ageAllows(game) {
  const rating = parseInt(raw().ageRating, 10) || 99;
  const min = parseInt(game && game.minAge, 10) || 0;
  return min <= rating;
}

function timeLeft() {
  const u = getUsageToday();
  return Math.max(0, u.limitMin - u.usedMin);
}

// `overrides` carries the parent's PIN-verified lock overrides from main
// (ignoreBedtime / ignoreTimeLimit) — approval and age gates are never
// overridable.
function canLaunch(game, overrides = {}) {
  if (!game) return { ok: false, reason: 'not_found' };
  // Approval is the first gate: un-approved games are never child-launchable,
  // even if an id leaks through. Mirrors the approved-only child list in main.
  if (!childVisible(game)) {
    return { ok: false, reason: 'not_approved', message: 'Dieses Spiel ist noch nicht freigegeben.' };
  }
  if (!game.installed) return { ok: false, reason: 'not_installed' };
  if (!ageAllows(game)) return { ok: false, reason: 'blocked', message: 'Altersfreigabe' };
  if (!overrides.ignoreBedtime && inBedtime()) return { ok: false, reason: 'bedtime', message: 'Ruhezeit — Zeit zum Schlafen.' };
  if (!overrides.ignoreTimeLimit && timeLeft() <= 0) return { ok: false, reason: 'time_limit' };
  return { ok: true };
}

module.exports = {
  hashPin, verifyHash, verifyPin, setPin, getSettings, setSettings,
  regenerateRecovery, hasRecovery, verifyRecovery, resetPinWithRecovery,
  formatRecoveryCode, generateRecoveryPlain,
  getUsageToday, addUsage, ageAllows, timeLeft, canLaunch,
  isInBedtime, inBedtime,
};
